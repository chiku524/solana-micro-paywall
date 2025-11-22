/**
 * Environment types for Cloudflare Workers
 */

export interface Env {
  // D1 Database
  DB: D1Database;
  
  // KV Cache
  CACHE: KVNamespace;
  
  // Queues
  PAYMENT_QUEUE: Queue;
  WEBHOOK_QUEUE: Queue;
  
  // Environment variables
  JWT_SECRET: string;
  SOLANA_RPC_ENDPOINT: string;
  SOLANA_WS_ENDPOINT?: string;
  FRONTEND_URL: string;
  CORS_ORIGIN?: string;
  NODE_ENV?: string;
  
  // Optional: Email service
  SENDGRID_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  
  // Optional: Sentry
  SENTRY_DSN?: string;
}

