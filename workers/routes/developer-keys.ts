import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import {
  createMerchantApiKey,
  listMerchantApiKeys,
  deleteMerchantApiKey,
} from '../lib/db';
import { generateApiKey, sha256Hex, apiKeyPrefix } from '../lib/api-key-crypto';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const createSchema = z.object({
  label: z.string().max(120).optional(),
});

app.get('/', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const keys = await listMerchantApiKeys(c.env.DB, merchantId);
  return c.json({
    keys: keys.map((k) => ({
      id: k.id,
      keyPrefix: k.keyPrefix,
      label: k.label,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    })),
  });
});

app.post('/', authMiddleware, async (c) => {
  try {
    const merchantId = c.get('merchantId');
    const body = await c.req.json().catch(() => ({}));
    const { label } = createSchema.parse(body);
    const rawKey = generateApiKey();
    const keyHash = await sha256Hex(rawKey);
    const prefix = apiKeyPrefix(rawKey);
    const id = crypto.randomUUID();
    await createMerchantApiKey(c.env.DB, {
      id,
      merchantId,
      keyPrefix: prefix,
      keyHash,
      label,
    });
    return c.json(
      {
        id,
        keyPrefix: prefix,
        label: label ?? null,
        /** Shown only once */
        secret: rawKey,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request', message: error.errors[0].message }, 400);
    }
    throw error;
  }
});

app.delete('/:id', authMiddleware, async (c) => {
  const merchantId = c.get('merchantId');
  const id = c.req.param('id');
  const removed = await deleteMerchantApiKey(c.env.DB, id, merchantId);
  if (!removed) {
    return c.json({ error: 'Not Found', message: 'API key not found' }, 404);
  }
  return c.json({ ok: true });
});

export default app;
