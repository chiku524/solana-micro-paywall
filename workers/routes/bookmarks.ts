import { Hono } from 'hono';
import type { Env } from '../types';
import { getBookmark, getBookmarksByWallet, createBookmark, deleteBookmark, getContentById } from '../lib/db';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const createBookmarkSchema = z.object({
  walletAddress: z.string().min(1),
  contentId: z.string().min(1),
});

// List bookmarks for wallet (public)
app.get('/wallet/:walletAddress', async (c) => {
  const walletAddress = c.req.param('walletAddress');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const bookmarks = await getBookmarksByWallet(c.env.DB, walletAddress, limit, offset);
  
  // Fetch content for each bookmark
  const bookmarksWithContent = await Promise.all(
    bookmarks.map(async (bookmark) => {
      const content = await getContentById(c.env.DB, bookmark.contentId);
      return {
        ...bookmark,
        content: content || null,
      };
    })
  );
  
  return c.json({ bookmarks: bookmarksWithContent });
});

// Check if content is bookmarked (public)
app.get('/check', async (c) => {
  const walletAddress = c.req.query('walletAddress');
  const contentId = c.req.query('contentId');
  
  if (!walletAddress || !contentId) {
    return c.json({ error: 'Bad Request', message: 'walletAddress and contentId are required' }, 400);
  }
  
  const bookmark = await getBookmark(c.env.DB, walletAddress, contentId);
  
  return c.json({ bookmarked: !!bookmark });
});

// Create bookmark (public)
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, contentId } = createBookmarkSchema.parse(body);
    
    // Verify content exists
    const content = await getContentById(c.env.DB, contentId);
    if (!content) {
      return c.json({ error: 'Not Found', message: 'Content not found' }, 404);
    }
    
    // Check if already bookmarked
    const existing = await getBookmark(c.env.DB, walletAddress, contentId);
    if (existing) {
      return c.json(existing);
    }
    
    const bookmark = await createBookmark(c.env.DB, walletAddress, contentId);
    
  return c.json(bookmark, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// Delete bookmark (public)
app.delete('/', async (c) => {
  const walletAddress = c.req.query('walletAddress');
  const contentId = c.req.query('contentId');
  
  if (!walletAddress || !contentId) {
    return c.json({ error: 'Bad Request', message: 'walletAddress and contentId are required' }, 400);
  }
  
  await deleteBookmark(c.env.DB, walletAddress, contentId);
  
  return c.json({ message: 'Bookmark deleted successfully' });
});

export default app;
