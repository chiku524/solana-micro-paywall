import { Hono } from 'hono';
import type { Env } from '../types';
import type { Content } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Discover content with filtering and sorting
app.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '12');
  const category = c.req.query('category');
  const tags = c.req.query('tags');
  const sort = c.req.query('sort') || 'newest';
  const search = c.req.query('search');
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM content WHERE visibility = ?';
  const params: any[] = ['public'];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (tags) {
    const tagList = tags.split(',').map(t => t.trim());
    query += ' AND (';
    query += tagList.map(() => 'tags LIKE ?').join(' OR ');
    query += ')';
    tagList.forEach(tag => params.push(`%${tag}%`));
  }
  
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }
  
  // Sorting
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
  
  // Optimize: Only get count if we need it (not on first page or if we have results)
  let total = 0;
  if (page === 1 || c.req.query('includeTotal') === 'true') {
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    total = (countResult as any)?.count || 0;
  }
  
  // Get paginated results (limit to reasonable max)
  const safeLimit = Math.min(limit, 100); // Max 100 items per page
  const safeOffset = Math.max(0, offset);
  query += ' LIMIT ? OFFSET ?';
  params.push(safeLimit, safeOffset);
  
  const results = await c.env.DB.prepare(query).bind(...params).all();
  
  // Convert rows to Content objects
  const contents: Content[] = results.results.map((row: any) => ({
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
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
  }));
  
  return c.json({
    content: contents,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  });
});

// Get trending content (top 6 by purchase count)
app.get('/trending', async (c) => {
  const limit = parseInt(c.req.query('limit') || '6');
  
  const results = await c.env.DB.prepare(
    'SELECT * FROM content WHERE visibility = ? ORDER BY purchase_count DESC, created_at DESC LIMIT ?'
  )
    .bind('public', limit)
    .all();
  
  const contents: Content[] = results.results.map((row: any) => ({
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
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
  }));
  
  return c.json({ content: contents });
});

// Get recent content (latest 12)
app.get('/recent', async (c) => {
  const limit = parseInt(c.req.query('limit') || '12');
  
  const results = await c.env.DB.prepare(
    'SELECT * FROM content WHERE visibility = ? ORDER BY created_at DESC LIMIT ?'
  )
    .bind('public', limit)
    .all();
  
  const contents: Content[] = results.results.map((row: any) => ({
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
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
  }));
  
  return c.json({ content: contents });
});

// Get categories with counts
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

// Get public content by merchant ID (must be after static routes like /categories)
app.get('/merchant/:merchantId', async (c) => {
  const merchantId = c.req.param('merchantId');
  const limit = Math.min(parseInt(c.req.query('limit') || '24'), 100);
  const offset = (Math.max(1, parseInt(c.req.query('page') || '1')) - 1) * limit;

  const results = await c.env.DB.prepare(
    'SELECT * FROM content WHERE visibility = ? AND merchant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind('public', merchantId, limit, offset)
    .all();

  const contents: Content[] = results.results.map((row: any) => ({
    id: row.id,
    merchantId: row.merchant_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
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
  }));

  return c.json({ content: contents });
});

export default app;
