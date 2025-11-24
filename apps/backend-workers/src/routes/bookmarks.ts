/**
 * Bookmarks routes
 */

import { Hono } from 'hono';
import { Env } from '../types/env';
import { query, queryOne, execute } from '../utils/db';

function generateId(): string {
  return crypto.randomUUID();
}

export function bookmarksRoutes(app: Hono<{ Bindings: Env }>) {
  // Get bookmarks (public)
  app.get('/bookmarks', async (c) => {
    try {
      const walletAddress = c.req.query('walletAddress');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const skip = (page - 1) * limit;

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress query parameter is required' }, 400);
      }

      const bookmarks = await query(
        c.env.DB,
        `SELECT Bookmark.*, Content.id as content_id, Content.slug, Content.title, Content.description, Content.thumbnailUrl, Content.category, Content.priceLamports, Content.currency,
                Merchant.id as merchant_id, Merchant.email as merchant_email
         FROM Bookmark
         INNER JOIN Content ON Bookmark.contentId = Content.id
         INNER JOIN Merchant ON Content.merchantId = Merchant.id
         WHERE Bookmark.walletAddress = ?
         ORDER BY Bookmark.createdAt DESC
         LIMIT ? OFFSET ?`,
        [walletAddress, limit, skip]
      );

      const totalResult = await queryOne<{ count: number }>(
        c.env.DB,
        'SELECT COUNT(*) as count FROM Bookmark WHERE walletAddress = ?',
        [walletAddress]
      );
      const total = totalResult?.count || 0;

      const formattedBookmarks = bookmarks.map((b: any) => ({
        id: b.id,
        walletAddress: b.walletAddress,
        createdAt: b.createdAt,
        content: {
          id: b.content_id,
          slug: b.slug,
          title: b.title,
          description: b.description,
          thumbnailUrl: b.thumbnailUrl,
          category: b.category,
          priceLamports: b.priceLamports.toString(),
          currency: b.currency,
        },
        merchant: {
          id: b.merchant_id,
          email: b.merchant_email,
        },
      }));

      return c.json({
        bookmarks: formattedBookmarks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      console.error('Get bookmarks error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Add bookmark (public)
  app.post('/bookmarks', async (c) => {
    try {
      const body = await c.req.json();
      const { walletAddress, contentId } = body;

      if (!walletAddress || !contentId) {
        return c.json({ error: 'Bad Request', message: 'walletAddress and contentId are required' }, 400);
      }

      // Check if already bookmarked
      const existing = await queryOne(
        c.env.DB,
        'SELECT id FROM Bookmark WHERE walletAddress = ? AND contentId = ?',
        [walletAddress, contentId]
      );

      if (existing) {
        return c.json({ message: 'Already bookmarked', isBookmarked: true });
      }

      const bookmarkId = generateId();
      await execute(
        c.env.DB,
        'INSERT INTO Bookmark (id, walletAddress, contentId, createdAt) VALUES (?, ?, ?, datetime(\'now\'))',
        [bookmarkId, walletAddress, contentId]
      );

      return c.json({ message: 'Bookmark added successfully', isBookmarked: true });
    } catch (error: any) {
      console.error('Add bookmark error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Remove bookmark (public)
  app.delete('/bookmarks/:contentId', async (c) => {
    try {
      const contentId = c.req.param('contentId');
      const walletAddress = c.req.query('walletAddress');

      if (!walletAddress) {
        return c.json({ error: 'Bad Request', message: 'walletAddress query parameter is required' }, 400);
      }

      await execute(
        c.env.DB,
        'DELETE FROM Bookmark WHERE walletAddress = ? AND contentId = ?',
        [walletAddress, contentId]
      );

      return c.json({ message: 'Bookmark removed successfully', isBookmarked: false });
    } catch (error: any) {
      console.error('Remove bookmark error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });

  // Check if bookmarked (public)
  app.get('/bookmarks/check', async (c) => {
    try {
      const walletAddress = c.req.query('walletAddress');
      const contentId = c.req.query('contentId');

      if (!walletAddress || !contentId) {
        return c.json({ error: 'Bad Request', message: 'walletAddress and contentId are required' }, 400);
      }

      const bookmark = await queryOne(
        c.env.DB,
        'SELECT id FROM Bookmark WHERE walletAddress = ? AND contentId = ?',
        [walletAddress, contentId]
      );

      return c.json({ isBookmarked: !!bookmark });
    } catch (error: any) {
      console.error('Check bookmark error:', error);
      return c.json({ error: 'Internal Server Error', message: error.message }, 500);
    }
  });
}

