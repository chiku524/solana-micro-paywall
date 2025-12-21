import { Hono } from 'hono';
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
} from '../lib/db';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const createContentSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  tags: z.string().max(500).optional(),
  thumbnailUrl: z.string().url().optional(),
  priceLamports: z.number().int().min(0),
  currency: z.string().default('SOL'),
  durationSeconds: z.number().int().positive().nullable().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  previewText: z.string().max(1000).optional(),
  canonicalUrl: z.string().url().optional(),
});

const updateContentSchema = createContentSchema.partial();

// List merchant's content (protected)
app.get('/', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const contents = await listContentByMerchant(c.env.DB, merchantId, limit, offset);
  
  return c.json({ contents });
});

// Get content by ID (public, but increments view count)
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const content = await getContentById(c.env.DB, id);
  
  if (!content) {
    return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
  }
  
  // Increment view count
  await incrementContentViewCount(c.env.DB, id);
  
  return c.json(content);
});

// Get content by merchant ID and slug (public)
app.get('/merchant/:merchantId/:slug', async (c) => {
  const merchantId = c.req.param('merchantId');
  const slug = c.req.param('slug');
  const content = await getContentBySlug(c.env.DB, merchantId, slug);
  
  if (!content) {
    return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
  }
  
  // Increment view count
  if (content.id) {
    await incrementContentViewCount(c.env.DB, content.id);
  }
  
  return c.json(content);
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
      ...data,
    });
    
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
  
  return c.json({ message: 'Content deleted successfully' });
});

export default app;
