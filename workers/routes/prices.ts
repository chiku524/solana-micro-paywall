import { Hono } from 'hono';
import type { Env } from '../types';
import { convertUsdToNativeSmallestUnits } from '../lib/fiat-quote';
import { checkRateLimit, getRateLimitKey } from '../lib/rate-limit';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

const querySchema = z.object({
  usd: z.coerce.number().positive(),
  chain: z.enum(['solana', 'ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'bnb', 'avalanche']),
});

app.get('/quote', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const rateLimit = await checkRateLimit(c.env.CACHE, getRateLimitKey(ip, 'price-quote'), {
    limit: 30,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return c.json({ error: 'Too Many Requests', message: 'Rate limit exceeded' }, 429);
  }

  const parsed = querySchema.safeParse({
    usd: c.req.query('usd'),
    chain: c.req.query('chain'),
  });
  if (!parsed.success) {
    return c.json({ error: 'Bad Request', message: 'usd (positive number) and chain are required' }, 400);
  }

  try {
    const { amountSmallest, usdPricePerNative, coinId } = await convertUsdToNativeSmallestUnits(
      c.env,
      parsed.data.chain,
      parsed.data.usd
    );
    return c.json({
      chain: parsed.data.chain,
      usd: parsed.data.usd,
      amountSmallest,
      usdPricePerNative,
      coinId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Quote failed';
    return c.json({ error: 'Bad Gateway', message }, 502);
  }
});

export default app;
