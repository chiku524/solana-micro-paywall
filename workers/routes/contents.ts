import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import {
  getContentById,
  getContentBySlug,
  listContentByMerchant,
  createContent,
  updateContent,
  deleteContent,
  incrementContentViewCount,
  walletHasValidPurchaseForContent,
} from '../lib/db';
import { getCache, setCache, deleteCache, cacheKeys } from '../lib/cache';
import { z } from 'zod';
import type { Content } from '../types';

const app = new Hono<{ Bindings: Env }>();

const createContentSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  displayPriceUsd: z.number().positive().optional(),
  targetPriceUsd: z.number().positive().optional(),
  relatedContentIds: z.string().max(2000).optional(),
  freePreviewCharLimit: z.number().int().min(0).max(50000).optional(),
  category: z.string().max(100).optional(),
  tags: z.string().max(500).optional(),
  thumbnailUrl: z.string().url().optional(),
  priceLamports: z.number().int().min(0),
  currency: z.string().default('SOL'),
  durationSeconds: z.number().int().positive().nullable().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  previewText: z.string().max(1000).optional(),
  canonicalUrl: z.string().url().optional(),
  chain: z.enum(['solana', 'ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'bnb', 'avalanche']).optional(),
});

const updateContentSchema = createContentSchema.partial();

async function applyFreePreviewMask(
  db: D1Database,
  content: Content,
  wallet?: string | null
): Promise<Content> {
  const limit = content.freePreviewCharLimit;
  if (!limit || limit <= 0 || !content.description) {
    return content;
  }
  const unlocked =
    wallet && wallet.length > 0
      ? await walletHasValidPurchaseForContent(db, wallet, content.id)
      : false;
  if (unlocked || content.description.length <= limit) {
    return content;
  }
  return {
    ...content,
    description: `${content.description.slice(0, limit)}…`,
    descriptionTruncated: true,
  };
}

// List merchant's content (protected)
app.get('/', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 100); // Max 100
  const offset = Math.max(0, parseInt(c.req.query('offset') || '0'));
  const page = Math.floor(offset / limit) + 1;
  
  // Try cache first
  const cacheKey = cacheKeys.contentList(merchantId, page, limit);
  const cached = await getCache<{ contents: any[] }>(c.env.CACHE, cacheKey);
  
  if (cached) {
    return c.json(cached);
  }
  
  const contents = await listContentByMerchant(c.env.DB, merchantId, limit, offset);
  
  // Cache for 5 minutes
  await setCache(c.env.CACHE, cacheKey, { contents }, { ttl: 300 });
  
  return c.json({ contents });
});

// Get content by ID (public, but increments view count)
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const wallet = c.req.query('wallet')?.trim() || null;
  const cacheKey = cacheKeys.content(id);

  let content = await getCache<Content>(c.env.CACHE, cacheKey);
  if (!content) {
    content = (await getContentById(c.env.DB, id)) as Content | null;
    if (!content) {
      return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
    }
    await setCache(c.env.CACHE, cacheKey, content, { ttl: 600 });
  }

  incrementContentViewCount(c.env.DB, id).catch(console.error);

  const masked = await applyFreePreviewMask(c.env.DB, content, wallet);
  return c.json(masked);
});

// Get content by merchant ID and slug (public)
app.get('/merchant/:merchantId/:slug', async (c) => {
  const merchantId = c.req.param('merchantId');
  const slug = c.req.param('slug');
  const wallet = c.req.query('wallet')?.trim() || null;
  const content = await getContentBySlug(c.env.DB, merchantId, slug);

  if (!content) {
    return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
  }

  if (content.id) {
    await incrementContentViewCount(c.env.DB, content.id);
  }

  const masked = await applyFreePreviewMask(c.env.DB, content, wallet);
  return c.json(masked);
});

// Create content (protected)
app.post('/', authMiddleware, async (c) => {
  try {
    const merchantId = c.get('merchantId');
    const body = await c.req.json();
    const data = createContentSchema.parse(body);
    
    // Check if slug already exists for this merchant
    const existing = await getContentBySlug(c.env.DB, merchantId, data.slug);
    if (existing) {
      return c.json({ error: 'Conflict', message: 'Content with this slug already exists' }, 409);
    }
    
    const contentId = crypto.randomUUID();
    const content = await createContent(c.env.DB, {
      id: contentId,
      merchantId,
      slug: data.slug,
      title: data.title,
      description: data.description,
      displayPriceUsd: data.displayPriceUsd,
      targetPriceUsd: data.targetPriceUsd,
      relatedContentIds: data.relatedContentIds,
      freePreviewCharLimit: data.freePreviewCharLimit,
      category: data.category,
      tags: data.tags,
      thumbnailUrl: data.thumbnailUrl,
      priceLamports: data.priceLamports,
      currency: data.currency,
      durationSeconds: data.durationSeconds ?? undefined,
      visibility: data.visibility,
      previewText: data.previewText,
      canonicalUrl: data.canonicalUrl,
      chain: data.chain,
    });
    
    // Invalidate cache
    await deleteCache(c.env.CACHE, cacheKeys.contentList(merchantId, 1, 100));
    
    return c.json(content, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Update content (protected)
app.put('/:id', authMiddleware, async (c) => {
  try {
    const merchantId = c.get('merchantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const updates = updateContentSchema.parse(body);
    
    // Verify content belongs to merchant
    const existing = await getContentById(c.env.DB, id);
    if (!existing) {
      return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
    }
    
    if (existing.merchantId !== merchantId) {
      return c.json({ error: 'Forbidden', message: 'Content does not belong to merchant' }, 403);
    }
    
    // If slug is being updated, check for conflicts
    if (updates.slug && updates.slug !== existing.slug) {
      const slugExists = await getContentBySlug(c.env.DB, merchantId, updates.slug);
      if (slugExists && slugExists.id !== id) {
        return c.json({ error: 'Conflict', message: 'Content with this slug already exists' }, 409);
      }
    }
    
    const content = await updateContent(c.env.DB, id, updates);
    
    // Invalidate caches
    await deleteCache(c.env.CACHE, cacheKeys.content(id));
    await deleteCache(c.env.CACHE, cacheKeys.contentList(merchantId, 1, 100));
    
    return c.json(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Delete content (protected)
app.delete('/:id', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const id = c.req.param('id');
  
  // Verify content belongs to merchant
  const existing = await getContentById(c.env.DB, id);
  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
  }
  
  if (existing.merchantId !== merchantId) {
    return c.json({ error: 'Forbidden', message: 'Content does not belong to merchant' }, 403);
  }
  
  await deleteContent(c.env.DB, id);
  
  // Invalidate caches
  await deleteCache(c.env.CACHE, cacheKeys.content(id));
  await deleteCache(c.env.CACHE, cacheKeys.contentList(merchantId, 1, 100));
  
  return c.json({ message: 'Content deleted successfully' });
});

export default app;
