/**
 * Contents routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne, execute } from '../utils/db';
import { authMiddleware } from '../middleware/auth';

function generateId(): string {
  return crypto.randomUUID();
}

export function contentsRoutes(app: Hono<{ Bindings: Env }>) {
  // Create content (protected)
  app.post('/contents', authMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      const merchant = c.get('merchant');

      if (body.merchantId !== merchant.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot create content for another merchant' }, 403);
      }

      const {
        merchantId,
        slug,
        priceLamports,
        currency = 'SOL',
        durationSecs,
        metadata,
        title,
        description,
        thumbnailUrl,
        category,
        tags,
        visibility = 'private',
        canonicalUrl,
        previewText,
      } = body;

      // Verify merchant exists
      const merchantCheck = await queryOne(c.env.DB, 'SELECT id, status FROM Merchant WHERE id = ?', [merchantId]);
      if (!merchantCheck) {
        return c.json({ error: 'Not Found', message: 'Merchant not found' }, 404);
      }

      // Check if slug exists
      const existing = await queryOne(
        c.env.DB,
        'SELECT id FROM Content WHERE merchantId = ? AND slug = ?',
        [merchantId, slug]
      );

      if (existing) {
        return c.json({ error: 'Conflict', message: `Content with slug '${slug}' already exists` }, 409);
      }

      const contentId = generateId();
      const tagsJson = tags ? JSON.stringify(tags) : null;
      const metadataJson = metadata ? JSON.stringify(metadata) : null;

      await execute(
        c.env.DB,
        `INSERT INTO Content (id, merchantId, slug, priceLamports, currency, durationSecs, metadata, title, description, thumbnailUrl, category, tags, visibility, canonicalUrl, previewText, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [contentId, merchantId, slug, priceLamports, currency, durationSecs || null, metadataJson, title || null, description || null, thumbnailUrl || null, category || null, tagsJson, visibility, canonicalUrl || null, previewText || null]
      );

      const content = await queryOne(c.env.DB, 'SELECT * FROM Content WHERE id = ?', [contentId]);
      return c.json(content);
    } catch (error: any) {
      console.error('Create content error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // List contents (public)
  app.get('/contents', async (c) => {
    try {
      const merchantId = c.req.query('merchantId');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const search = c.req.query('search');
      const category = c.req.query('category');
      const visibility = c.req.query('visibility');
      const skip = (page - 1) * limit;

      let where = '1=1';
      const params: any[] = [];

      if (merchantId) {
        where += ' AND merchantId = ?';
        params.push(merchantId);
      }
      if (search) {
        where += ' AND (title LIKE ? OR description LIKE ? OR slug LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (category) {
        where += ' AND category = ?';
        params.push(category);
      }
      if (visibility) {
        where += ' AND visibility = ?';
        params.push(visibility);
      }

      const contents = await query(
        c.env.DB,
        `SELECT * FROM Content WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [...params, limit, skip]
      );

      const totalResult = await queryOne<{ count: number }>(
        c.env.DB,
        `SELECT COUNT(*) as count FROM Content WHERE ${where}`,
        params
      );
      const total = totalResult?.count || 0;

      return c.json({
        data: contents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('List contents error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get content (public)
  app.get('/contents/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const content = await queryOne(c.env.DB, 'SELECT * FROM Content WHERE id = ?', [id]);

      if (!content) {
        return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
      }

      return c.json(content);
    } catch (error: any) {
      console.error('Get content error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Get content stats
  app.get('/contents/:id/stats', async (c) => {
    try {
      const id = c.req.param('id');

      const [purchasesCount, paymentsCount] = await Promise.all([
        queryOne<{ count: number }>(c.env.DB, 'SELECT COUNT(*) as count FROM Purchase WHERE contentId = ?', [id]),
        queryOne<{ count: number }>(c.env.DB, 'SELECT COUNT(*) as count FROM Payment WHERE contentId = ?', [id]),
      ]);

      const content = await queryOne(c.env.DB, 'SELECT viewCount, purchaseCount FROM Content WHERE id = ?', [id]);

      return c.json({
        contentId: id,
        viewCount: content?.viewCount || 0,
        purchaseCount: purchasesCount?.count || 0,
        paymentCount: paymentsCount?.count || 0,
      });
    } catch (error: any) {
      console.error('Get content stats error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Update content (protected)
  app.put('/contents/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const merchant = c.get('merchant');
      const body = await c.req.json();

      // Verify ownership
      const content = await queryOne<{ merchantId: string }>(c.env.DB, 'SELECT merchantId FROM Content WHERE id = ?', [id]);
      if (!content) {
        return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
      }
      if (content.merchantId !== merchant.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot update content owned by another merchant' }, 403);
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (body.title !== undefined) {
        updates.push('title = ?');
        params.push(body.title);
      }
      if (body.description !== undefined) {
        updates.push('description = ?');
        params.push(body.description);
      }
      if (body.thumbnailUrl !== undefined) {
        updates.push('thumbnailUrl = ?');
        params.push(body.thumbnailUrl);
      }
      if (body.category !== undefined) {
        updates.push('category = ?');
        params.push(body.category);
      }
      if (body.tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(body.tags));
      }
      if (body.visibility !== undefined) {
        updates.push('visibility = ?');
        params.push(body.visibility);
      }
      if (body.priceLamports !== undefined) {
        updates.push('priceLamports = ?');
        params.push(body.priceLamports);
      }
      if (body.durationSecs !== undefined) {
        updates.push('durationSecs = ?');
        params.push(body.durationSecs);
      }

      if (updates.length === 0) {
        return c.json({ error: 'Bad Request', message: 'No fields to update' }, 400);
      }

      updates.push('updatedAt = datetime(\'now\')');
      params.push(id);

      await execute(c.env.DB, `UPDATE Content SET ${updates.join(', ')} WHERE id = ?`, params);

      const updated = await queryOne(c.env.DB, 'SELECT * FROM Content WHERE id = ?', [id]);
      return c.json(updated);
    } catch (error: any) {
      console.error('Update content error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Delete content (protected)
  app.delete('/contents/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const merchant = c.get('merchant');

      // Verify ownership
      const content = await queryOne<{ merchantId: string }>(c.env.DB, 'SELECT merchantId FROM Content WHERE id = ?', [id]);
      if (!content) {
        return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
      }
      if (content.merchantId !== merchant.merchantId) {
        return c.json({ error: 'Unauthorized', message: 'Cannot delete content owned by another merchant' }, 403);
      }

      await execute(c.env.DB, 'DELETE FROM Content WHERE id = ?', [id]);
      return c.json({ message: 'Content deleted successfully' });
    } catch (error: any) {
      console.error('Delete content error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

