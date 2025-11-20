import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Solana RPC Configuration
  SOLANA_RPC_ENDPOINT: z.string().url().optional(),
  SOLANA_WS_ENDPOINT: z.string().url().optional(),
  SOLANA_RPC_ENDPOINT_FALLBACK: z.string().url().optional(),

  // JWT Secrets (for access tokens)
  JWT_SECRET: z.string().min(32).optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),

  // Platform Configuration
  PLATFORM_WALLET_ADDRESS: z.string().optional(), // Platform wallet for refunds/operations
  PLATFORM_PRIVATE_KEY: z.string().optional(), // Should be in Secrets Manager in production

  // API Configuration
  API_PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),

  // Frontend Configuration
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SOLANA_RPC: z.string().url().optional(),
  NEXT_PUBLIC_SOLANA_NETWORK: z.enum(['devnet', 'mainnet-beta', 'testnet']).default('devnet'),

  // Security
  WEBHOOK_SECRET: z.string().min(32).optional(),
  RATE_LIMIT_REDIS_URL: z.string().url().optional(),

  // Optional: Stripe Integration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

