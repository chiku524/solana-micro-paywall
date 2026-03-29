import type { KVNamespace } from '@cloudflare/workers-types';
import type { Env } from '../types';

/** Matches `src/lib/chains.ts` native decimals */
const NATIVE_DECIMALS: Record<string, number> = {
  solana: 9,
  ethereum: 18,
  polygon: 18,
  base: 18,
  arbitrum: 18,
  optimism: 18,
  bnb: 18,
  avalanche: 18,
};

function chainToCoingeckoId(chain: string): string {
  switch (chain) {
    case 'solana':
      return 'solana';
    case 'polygon':
      return 'matic-network';
    case 'bnb':
      return 'binancecoin';
    case 'avalanche':
      return 'avalanche-2';
    case 'ethereum':
    case 'base':
    case 'arbitrum':
    case 'optimism':
      return 'ethereum';
    default:
      return 'ethereum';
  }
}

async function fetchUsdPricePerNative(coinId: string): Promise<number> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`CoinGecko error ${res.status}`);
  }
  const json = (await res.json()) as Record<string, { usd?: number }>;
  const usd = json[coinId]?.usd;
  if (typeof usd !== 'number' || usd <= 0) {
    throw new Error('Invalid price from CoinGecko');
  }
  return usd;
}

async function getCachedUsdPrice(kv: KVNamespace | undefined, coinId: string): Promise<number> {
  const cacheKey = `price:usd:${coinId}`;
  if (kv) {
    const raw = await kv.get(cacheKey);
    if (raw) {
      const n = parseFloat(raw);
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  const price = await fetchUsdPricePerNative(coinId);
  if (kv) {
    await kv.put(cacheKey, String(price), { expirationTtl: 300 });
  }
  return price;
}

/**
 * Converts a USD target to smallest native units for the given chain using a cached spot price.
 */
export async function convertUsdToNativeSmallestUnits(
  env: Env,
  chain: string,
  usdAmount: number
): Promise<{ amountSmallest: number; usdPricePerNative: number; coinId: string }> {
  if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
    throw new Error('Invalid USD amount');
  }
  const coinId = chainToCoingeckoId(chain);
  const usdPerNative = await getCachedUsdPrice(env.CACHE, coinId);
  const nativeAmount = usdAmount / usdPerNative;
  const decimals = NATIVE_DECIMALS[chain] ?? 18;
  const amountSmallest = Math.max(1, Math.floor(nativeAmount * 10 ** decimals));
  return { amountSmallest, usdPricePerNative: usdPerNative, coinId };
}
