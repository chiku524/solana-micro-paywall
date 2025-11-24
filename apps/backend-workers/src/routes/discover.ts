/**
 * Discover/Marketplace routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne } from '../utils/db';

export function discoverRoutes(app: Hono<{ Bindings: Env }>) {
  // Discover contents (public)
  app.get('/discover/contents', async (c) => {
    try {
      const category = c.req.query('category');
      const tags = c.req.query('tags')?.split(',') || [];
      const search = c.req.query('search');
      const minPrice = c.req.query('minPrice');
      const maxPrice = c.req.query('maxPrice');
      const currency = c.req.query('currency');
      const sort = c.req.query('sort') || 'newest';
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const skip = (page - 1) * limit;

      let where = "visibility = 'public'";
      const params: any[] = [];

      // Join with Merchant to filter by active merchants
      let join = 'INNER JOIN Merchant ON Content.merchantId = Merchant.id';
      where += " AND Merchant.status = 'active'";

      if (category) {
        where += ' AND Content.category = ?';
        params.push(category);
      }

      if (search) {
        where += ' AND (Content.title LIKE ? OR Content.description LIKE ? OR Content.slug LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (minPrice) {
        where += ' AND Content.priceLamports >= ?';
        params.push(parseInt(minPrice));
      }
      if (maxPrice) {
        where += ' AND Content.priceLamports <= ?';
        params.push(parseInt(maxPrice));
      }
      if (currency) {
        where += ' AND Content.currency = ?';
        params.push(currency);
      }

      // Tags filtering (simplified - check if tags JSON contains the tag)
      if (tags.length > 0 && tags[0]) {
        // SQLite JSON handling
        for (const tag of tags) {
          where += ' AND Content.tags LIKE ?';
          params.push(`%"${tag}"%`);
        }
      }

      // Order by
      let orderBy = 'Content.createdAt DESC';
      switch (sort) {
        case 'popular':
          orderBy = 'Content.purchaseCount DESC';
          break;
        case 'price_asc':
          orderBy = 'Content.priceLamports ASC';
          break;
        case 'price_desc':
          orderBy = 'Content.priceLamports DESC';
          break;
        default:
          orderBy = 'Content.createdAt DESC';
      }

      const contents = await query(
        c.env.DB,
        `SELECT Content.*, Merchant.id as merchant_id, Merchant.email as merchant_email, Merchant.payoutAddress as merchant_payoutAddress
         FROM Content ${join}
         WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      );

      const totalResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Content ${join} WHERE ${where}`,
        params
      );
      const total = totalResult?.count || 0;

      // Format response
      const formattedContents = contents.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        category: c.category,
        tags: c.tags ? JSON.parse(c.tags) : [],
        priceLamports: c.priceLamports.toString(),
        currency: c.currency,
        durationSecs: c.durationSecs,
        visibility: c.visibility,
        previewText: c.previewText,
        canonicalUrl: c.canonicalUrl,
        viewCount: c.viewCount,
        purchaseCount: c.purchaseCount,
        createdAt: c.createdAt,
        merchant: {
          id: c.merchant_id,
          email: c.merchant_email,
          payoutAddress: c.merchant_payoutAddress,
        },
      }));

      return c.json({
        contents: formattedContents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      console.error('Discover contents error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get content details (public)
  app.get('/discover/contents/:id', async (c) => {
    try {
      const id = c.req.param('id');

      const content = await queryOne(
        c.env.DB,
        `SELECT Content.*, Merchant.id as merchant_id, Merchant.email as merchant_email, Merchant.payoutAddress as merchant_payoutAddress
         FROM Content
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE Content.id = ? AND Content.visibility = 'public' AND Merchant.status = 'active'`,
        [id]
      );

      if (!content) {
        return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
      }

      // Increment view count
      await c.env.DB.prepare('UPDATE Content SET viewCount = viewCount + 1 WHERE id = ?').bind(id).run();

      const formatted = {
        id: content.id,
        slug: content.slug,
        title: content.title,
        description: content.description,
        thumbnailUrl: content.thumbnailUrl,
        category: content.category,
        tags: content.tags ? JSON.parse(content.tags) : [],
        priceLamports: content.priceLamports.toString(),
        currency: content.currency,
        durationSecs: content.durationSecs,
        visibility: content.visibility,
        previewText: content.previewText,
        canonicalUrl: content.canonicalUrl,
        viewCount: (content.viewCount || 0) + 1,
        purchaseCount: content.purchaseCount || 0,
        createdAt: content.createdAt,
        merchant: {
          id: content.merchant_id,
          email: content.merchant_email,
          payoutAddress: content.merchant_payoutAddress,
        },
      };

      return c.json(formatted);
    } catch (error: any) {
      console.error('Get content details error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get merchant contents (public)
  app.get('/discover/merchants/:merchantId/contents', async (c) => {
    try {
      const merchantId = c.req.param('merchantId');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const skip = (page - 1) * limit;

      const contents = await query(
        c.env.DB,
        `SELECT * FROM Content
         WHERE merchantId = ? AND visibility = 'public'
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`,
        [merchantId, limit, skip]
      );

      const totalResult = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM Content WHERE merchantId = ? AND visibility = ?',
        [merchantId, 'public']
      );
      const total = totalResult?.count || 0;

      const formattedContents = contents.map((c: any) => ({
        ...c,
        priceLamports: c.priceLamports.toString(),
        tags: c.tags ? JSON.parse(c.tags) : [],
      }));

      return c.json({
        contents: formattedContents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      console.error('Get merchant contents error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get categories (public)
  app.get('/discover/categories', async (c) => {
    try {
      const categories = await query<{ category: string; count: number }>(
        c.env.DB,
        `SELECT category, COUNT(*) as count
         FROM Content
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE Content.visibility = 'public' AND Merchant.status = 'active' AND category IS NOT NULL
         GROUP BY category
         ORDER BY count DESC`
      );

      return c.json(categories);
    } catch (error: any) {
      console.error('Get categories error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get trending (public)
  app.get('/discover/trending', async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '10');

      const contents = await query(
        c.env.DB,
        `SELECT Content.*, Merchant.id as merchant_id, Merchant.email as merchant_email
         FROM Content
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE Content.visibility = 'public' AND Merchant.status = 'active'
         ORDER BY Content.purchaseCount DESC, Content.viewCount DESC
         LIMIT ?`,
        [limit]
      );

      const formattedContents = contents.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        category: c.category,
        tags: c.tags ? JSON.parse(c.tags) : [],
        priceLamports: c.priceLamports.toString(),
        currency: c.currency,
        durationSecs: c.durationSecs,
        visibility: c.visibility,
        previewText: c.previewText,
        canonicalUrl: c.canonicalUrl,
        viewCount: c.viewCount,
        purchaseCount: c.purchaseCount,
        createdAt: c.createdAt,
        merchant: {
          id: c.merchant_id,
          email: c.merchant_email,
        },
      }));

      return c.json(formattedContents);
    } catch (error: any) {
      console.error('Get trending error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

