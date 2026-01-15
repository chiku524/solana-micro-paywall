// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  SOLANA_RPC_URL: string;
  HELIUS_API_KEY?: string;
  NEXT_PUBLIC_WEB_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  NODE_ENV?: string;
}

// Re-export types from shared types
export * from '../src/types/index';
