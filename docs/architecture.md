# Architecture & Multi-Chain Integration

This document describes how the application is structured, how D1 evolves, and how to extend chains or APIs.

## High-Level Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS. **Static export** (`out/`) for Cloudflare Pages.
- **Backend**: Cloudflare Workers + Hono. **D1** (SQLite), **KV** (binding **`CACHE`** in `wrangler.toml`).
- **Payments**: Create payment intent → user signs on-chain → verifier confirms → purchase + access JWT. Optional **USD quote** at intent time (`workers/lib/fiat-quote.ts`, CoinGecko + KV cache).

## D1 Migrations (0001–0007)

| Migration | Role |
|-----------|------|
| `0001_initial_schema.sql` | Core tables: merchants, content, payment_intents, purchases, bookmarks, … |
| `0002_drop_old_schema.sql` | Legacy cleanup (SQLite identifier quirks; follow-up migrations repair `content` if needed) |
| `0003_add_password_hash.sql` | Password hashes for merchants |
| `0004_add_security_features.sql` | Security-related columns |
| `0005_add_chain_support.sql` | `chain` on content/payment/purchase; **`CREATE TABLE IF NOT EXISTS content`** + indexes so fresh applies stay consistent |
| `0006_platform_enhancements.sql` | Merchant webhook URL, refund/support copy, support email; content `target_price_usd`, preview/related; payment idempotency; `merchant_api_keys`, `webhook_deliveries`, `analytics_events` |
| `0007_repair_content_table.sql` | No-op (`SELECT 1`) — repair folded into `0005`; keeps migration order if `0007` was already pending |

Apply locally: `npm run db:migrate`. Production: `wrangler d1 migrations apply micropaywall-db --remote` from `workers/`. If remote schema exists but `d1_migrations` is empty, reconcile manually (run SQL + insert migration names) before relying on automated apply.

## Worker Subsystems (concise)

| Area | Location | Notes |
|------|----------|--------|
| Payments + verify | `workers/routes/payments.ts` | `Idempotency-Key`, optional `X-Api-Key`, fiat from `target_price_usd` |
| Merchants + webhook log | `workers/routes/merchants.ts` | `GET /me/webhook-deliveries`, profile fields |
| Developer API keys | `workers/routes/developer-keys.ts` | CRUD under `/api/developer-keys` (merchant JWT) |
| Fiat quote API | `workers/routes/prices.ts` | `GET /api/prices/quote?usd=&chain=` |
| Analytics | `workers/routes/analytics.ts` | `POST /api/analytics/events`, `GET /api/analytics/funnel`, `GET /api/analytics/stats`, … |
| Discover | `workers/routes/discover.ts` | List endpoints cached in KV |
| Purchase webhooks + email | `workers/lib/purchase-webhook.ts`, `workers/lib/email.ts` | HMAC-SHA256 over JSON body with merchant `webhookSecret`; payload `type: purchase.confirmed`; optional sale email |
| API key storage | `workers/lib/api-key-crypto.ts` | SHA-256 hash of full key at rest; prefix shown for identification |
| Request ID | `workers/middleware/request-logging.ts` | `X-Request-Id` on responses; logs slow/error requests |

## Multi-Chain Design

The app supports **8 blockchain networks**:

- **Solana** (L1) – SOL  
- **Ethereum** – ETH  
- **Polygon** – MATIC  
- **Base** – ETH  
- **Arbitrum** – ETH  
- **Optimism** – ETH  
- **BNB Chain** – BNB  
- **Avalanche** – AVAX  

### 1. Shared types (`src/types/index.ts`)

- **`SupportedChain`**: Extend when adding a chain.
- **`chain`** on Content, PaymentIntent, Purchase: defaults `'solana'`.
- Amounts in **smallest units** (`priceLamports` / `amountLamports` naming retained for SQLite compatibility).

### 2. Frontend (`src/lib/chains.ts`, wallets)

- **`CHAIN_CONFIGS`**, **`getExplorerTxUrl`**, **`formatAmount`**.

### 3. Backend verifiers (`workers/lib/verifiers/`)

- **`solana-verifier.ts`**, **`evm-verifier.ts`**, **`getVerifier(chain)`** in `index.ts`.

### 4. Payment UI

- **`src/components/payment-widget-enhanced.tsx`**: Solana Pay URL or EVM transfer deep link; receipt modal after success.

### 5. Embeds

- **`public/micropaywall-embed.js`**: Vanilla iframe loader.  
- **`packages/micropaywall-embed-react`**: npm package **`micropaywall-embed-react`**.

## Adding a New Blockchain

1. Extend `SupportedChain` and `CHAIN_CONFIGS`.  
2. Add verifier (or extend EVM if another EVM-compatible chain).  
3. Register in `workers/lib/verifiers/index.ts`.  
4. Add `EVM_CHAIN_IDS` entry in `payments.ts` if EVM.  
5. Wire wallet + RPC in frontend and env.

## API Surface (Worker)

Mounted in `workers/index.ts`:

- `/api/merchants`, `/api/auth`, `/api/security`, `/api/contents`, `/api/payments`, `/api/purchases`, `/api/discover`, `/api/bookmarks`, `/api/analytics`, `/api/prices`, `/api/developer-keys`  
- `GET /health` – DB + KV probe  

There is **no** `/api/recommendations` route; discovery is under `/api/discover`.

## Frontend Routes (representative)

- `/`, `/dashboard/*`, `/marketplace`, `/marketplace/discover`, `/marketplace/content/[merchantId]/[slug]` (full description + `?wallet=` for unlock when owned), `/marketplace/merchant/[merchantId]`, `/library`, `/bookmarks`, `/docs`  

**Static export:** dynamic segments such as `/marketplace/merchant/[merchantId]` may require `generateStaticParams` (or similar) for a fully static build; verify with `npm run build` in your branch.

## Recommendations (still useful)

- **Testing**: Unit tests for verifiers; integration test create → verify → purchase.  
- **Resilience**: RPC retries/circuit breaker beyond current rate limits.  
- **Docs**: Keep [application-specification.md](application-specification.md) aligned with routes and request headers.

## File Reference

| Purpose | Location |
|--------|----------|
| Chain type & entities | `src/types/index.ts` |
| Chain config / explorers | `src/lib/chains.ts` |
| Verifiers | `workers/lib/verifiers/*` |
| Payments | `workers/routes/payments.ts` |
| DB helpers | `workers/lib/db.ts` |
