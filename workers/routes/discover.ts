import { Hono } from 'hono';
import type { Env } from '../types';
import type { Content } from '../types';
import { getCache, setCache, cacheKeys } from '../lib/cache';

const app = new Hono<{ Bindings: Env }>();

function mapDiscoverRow(row: any): Content {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    displayPriceUsd: row.display_price_usd != null ? row.display_price_usd : undefined,
    targetPriceUsd: row.target_price_usd != null ? row.target_price_usd : undefined,
    relatedContentIds: row.related_content_ids || undefined,
    freePreviewCharLimit: row.free_preview_char_limit != null ? row.free_preview_char_limit : undefined,
    category: row.category,
    tags: row.tags,
    thumbnailUrl: row.thumbnail_url,
    priceLamports: row.price_lamports,
    currency: row.currency,
    durationSeconds: row.duration_seconds,
    visibility: row.visibility,
    previewText: row.preview_text,
    canonicalUrl: row.canonical_url,
    viewCount: row.view_count,
    purchaseCount: row.purchase_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chain: row.chain || 'solana',
  };
}

// Discover content with filtering and sorting
app.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '12');
  const category = c.req.query('category');
  const tags = c.req.query('tags');
  const sort = c.req.query('sort') || 'newest';
  const search = c.req.query('search');
  const offset = (page - 1) * limit;

  const cacheSig = JSON.stringify({
    page,
    limit,
    category: category || null,
    tags: tags || null,
    sort,
    search: search || null,
    includeTotal: c.req.query('includeTotal') === 'true',
  });
  const cacheKey = cacheKeys.discover(cacheSig);
  const cached = await getCache(c.env.CACHE, cacheKey);
  if (cached) {
    return c.json(cached);
  }

  let query = 'SELECT * FROM content WHERE visibility = ?';
  const params: unknown[] = ['public'];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim());
    query += ' AND (';
    query += tagList.map(() => 'tags LIKE ?').join(' OR ');
    query += ')';
    tagList.forEach((tag) => params.push(`%${tag}%`));
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  switch (sort) {
    case 'oldest':
      query += ' ORDER BY created_at ASC';
      break;
    case 'price-low':
      query += ' ORDER BY price_lamports ASC';
      break;
    case 'price-high':
      query += ' ORDER BY price_lamports DESC';
      break;
    case 'trending':
      query += ' ORDER BY purchase_count DESC, created_at DESC';
      break;
    case 'newest':
    default:
      query += ' ORDER BY created_at DESC';
      break;
  }

  let total = 0;
  if (page === 1 || c.req.query('includeTotal') === 'true') {
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    total = (countResult as { count?: number })?.count || 0;
  }

  const safeLimit = Math.min(limit, 100);
  const safeOffset = Math.max(0, offset);
  query += ' LIMIT ? OFFSET ?';
  params.push(safeLimit, safeOffset);

  const results = await c.env.DB.prepare(query).bind(...params).all();

  const contents: Content[] = results.results.map((row: unknown) => mapDiscoverRow(row));

  const payload = {
    content: contents,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };

  await setCache(c.env.CACHE, cacheKey, payload, { ttl: 60 });
  return c.json(payload);
});

app.get('/trending', async (c) => {
  const limit = parseInt(c.req.query('limit') || '6');
  const cacheKey = cacheKeys.discover(`trending:${limit}`);
  const cached = await getCache(c.env.CACHE, cacheKey);
  if (cached) {
    return c.json(cached);
  }

  const results = await c.env.DB.prepare(
    'SELECT * FROM content WHERE visibility = ? ORDER BY purchase_count DESC, created_at DESC LIMIT ?'
  )
    .bind('public', limit)
    .all();

  const contents: Content[] = results.results.map((row: unknown) => mapDiscoverRow(row));
  const payload = { content: contents };
  await setCache(c.env.CACHE, cacheKey, payload, { ttl: 120 });
  return c.json(payload);
});

app.get('/recent', async (c) => {
  const limit = parseInt(c.req.query('limit') || '12');
  const cacheKey = cacheKeys.discover(`recent:${limit}`);
  const cached = await getCache(c.env.CACHE, cacheKey);
  if (cached) {
    return c.json(cached);
  }

  const results = await c.env.DB.prepare(
    'SELECT * FROM content WHERE visibility = ? ORDER BY created_at DESC LIMIT ?'
  )
    .bind('public', limit)
    .all();

  const contents: Content[] = results.results.map((row: unknown) => mapDiscoverRow(row));
  const payload = { content: contents };
  await setCache(c.env.CACHE, cacheKey, payload, { ttl: 120 });
  return c.json(payload);
});

app.get('/categories', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT category, COUNT(*) as count FROM content WHERE visibility = ? AND category IS NOT NULL GROUP BY category ORDER BY count DESC'
  )
    .bind('public')
    .all();

  const categories = results.results.map((row: any) => ({
    name: row.category,
    count: row.count,
  }));

  return c.json({ categories });
});

app.get('/merchant/:merchantId', async (c) => {
  const merchantId = c.req.param('merchantId');
  const limit = Math.min(parseInt(c.req.query('limit') || '24'), 100);
  const offset = (Math.max(1, parseInt(c.req.query('page') || '1')) - 1) * limit;

  const cacheKey = cacheKeys.discover(`merchant:${merchantId}:${limit}:${offset}`);
  const cached = await getCache(c.env.CACHE, cacheKey);
  if (cached) {
    return c.json(cached);
  }

  const results = await c.env.DB.prepare(
    'SELECT * FROM content WHERE visibility = ? AND merchant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind('public', merchantId, limit, offset)
    .all();

  const contents: Content[] = results.results.map((row: unknown) => mapDiscoverRow(row));
  const payload = { content: contents };
  await setCache(c.env.CACHE, cacheKey, payload, { ttl: 60 });
  return c.json(payload);
});

export default app;
