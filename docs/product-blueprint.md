# Solana Micro-Paywall – Product Blueprint

## Vision

Deliver a Solana-native micro-paywall / pay-per-use platform that lets publishers, creators, and API providers monetize with on-chain payments in seconds. The product issues instant access tokens after confirmed payments, exposes an embeddable widget SDK, and provides a merchant dashboard for analytics, refunds, and configuration.

## User Roles

- **Publisher / Merchant** – creates paywalls, configures pricing, monitors revenue, requests payouts or refunds.
- **End User / Payer** – connects a wallet (Phantom, Solflare, etc.) or uses an optional Stripe fallback to unlock content and APIs.
- **Admin / Platform Operator** – monitors system health, manages merchant onboarding, handles compliance, and oversees payouts.
- **Relayer / Worker** – background service for reconciliation, batched refunds, and maintenance tasks.

## Core Responsibilities

1. **Payment initiation and verification**
   - Generate Solana Pay requests (QR/deep link) including amount, memo, merchant address, and nonce.
   - Provide wallet adapter integrations for Phantom, Solflare, and others.
   - Verify on-chain transactions server-side, ensuring finality, memo/nonce consistency, destination, and amount.
   - Issue access tokens after successful verification.

2. **Embeddable SDK / Widget**
   - Drop-in JS widget for pay button, QR modal, inline checkout.
   - Configurable price, duration (one-time vs. timed access), free preview, and branding.
   - Client SDK functions (`requestPayment`, `pollPaymentStatus`, `redeemAccessToken`).

3. **Access control**
   - Short-lived signed JWTs or opaque tokens (1–24 h) to gate content or APIs.
   - Middleware snippets for Node/Next.js and static site adapters.
   - Option to issue API keys bound to a paid access token.

4. **Merchant dashboard**
   - Merchant onboarding (email, KYC placeholder for MVP).
   - Views for recent payments, revenue metrics, refunds, ledger export.
   - Widget configuration UI and optional refund triggers.

5. **Reconciliation & ledger**
   - Persist confirmed transaction signatures, payer wallet, memo, amount, content ID, timestamp.
   - Background reconciliation to resolve pending vs. confirmed states.
   - Exportable ledger (CSV) and accounting-ready fields.

6. **Fallback payment rails (optional MVP sprint)**
   - Stripe integration matching Solana flow.
   - Unified ledger representation across on-chain and off-chain receipts.

## Architecture Overview

- **Mono-repo** (pnpm/npm workspaces) with `apps` and `packages`.
- **Backend API** (`apps/backend`) – Node/TypeScript service (NestJS or Express) handling payment requests, verification, token issuance, dashboard APIs, webhooks.
- **Dashboard** (`apps/dashboard`) – Next.js app for merchants (Vercel deployment target).
- **Widget SDK** (`packages/widget-sdk`) – Vanilla JS + TypeScript bundle (esbuild/Vite) distributed via npm and script tag.
- **Shared utilities** (`packages/shared`) – Shared types, validation schemas, RPC helpers.
- **Config package** (`packages/config`) – Centralized env loading, secrets schema (zod).
- **Workers** – background jobs (BullMQ or serverless cron) for reconciliation, refunds, and token expiration.
- **Infrastructure**
  - Database: Postgres (Supabase) for ledger, merchants, tokens.
  - Cache: Redis (Upstash) for payment polling, rate limits.
  - RPC providers: QuickNode primary, Helius/GenesysGo fallback with connection pooling.
  - Storage/CDN: AWS S3 + CloudFront for assets.
  - Monitoring: Sentry (frontend/back), Datadog or OpenTelemetry traces.

## Data Model (Initial)

- `merchants` – id, email, status, payout_address, webhook_secret, config_json, created_at.
- `contents` – id, merchant_id, slug, price_lamports, currency, duration_secs, metadata.
- `payment_intents` – id, merchant_id, content_id, memo, amount, currency, payer_wallet?, status, created_at.
- `payments` – id, intent_id, tx_signature, payer_wallet, amount, currency, confirmed_at, access_token_id.
- `access_tokens` – id, merchant_id, content_id, token_jti, expires_at, redeemed_at.
- `refund_requests` – id, payment_id, type (on-chain/off-chain), status, reason, processed_at.
- `stripe_receipts` – optional for fallback path.
- `dashboard_events` – analytics instrumentation.
- `ledger_events` – immutable audit log of state transitions.

## API Surface (MVP)

- `POST /create-payment-request` – `{ merchantId, contentId, price, currency, duration } → { paymentRequest }`
- `POST /verify-payment` – `{ txSignature, merchantId, contentId } → { status, accessToken }`
- `GET /payment-status?tx=...` – `{ pending | confirmed | failed }`
- `POST /redeem-token` – `{ token } → { accessGranted }`
- `GET /merchant/dashboard` – Authenticated metrics & recent payments.
- `POST /refund` – `{ paymentId } → { refundStatus }`

## Security & Anti-Abuse

- Server-side transaction verification using RPC, rejecting unverifiable client claims.
- Unique nonces and memo patterns binding each payment to content or request.
- HMAC-protected webhooks, idempotency keys, and replay protection.
- Rate limits per IP, wallet, merchant for payment requests and token redemption.
- CAPTCHA or challenge for suspicious traffic/free previews.
- Secrets stored in managed solutions (AWS Secrets Manager, Google Secret Manager).
- Manual/off-chain refunds for MVP with audit trail; document risk strategy.

## Reliability & Scaling

- Payment verification queue (BullMQ or cloud task) for resilience to RPC downtime.
- Batch RPC calls and subscribe to WebSocket slots for near real-time updates.
- Stateless token issuance (JWT RS256 with rotation) to minimize DB lookups.
- Reconciliation microservice validating ledger vs. on-chain receipts periodically.
- Observability: structured logs with correlation IDs, metrics for success rate, latency, error budget.

## Metrics & KPIs

- Payment success rate (% verified vs. initiated).
- Time-to-access (wallet approval → token issuance).
- Average payment value, MRR, and active publishers.
- Refund/dispute rate (Stripe fallback).
- System errors per 1k requests (Sentry/Datadog).

## Roadmap (6–8 Week MVP)

1. **Week 0–1** – Repo scaffolding, infra bootstrap, schema migrations, Solana RPC client skeleton, Supabase integration.
2. **Week 2** – Payment intent creation endpoint, widget prototype (QR + wallet detection), Redis polling cache.
3. **Week 3** – Verification worker (signature polling/finality), ledger persistence, JWT issuer, token redemption API.
4. **Week 4** – Dashboard skeleton, merchant auth (Supabase), payments overview, widget config UI.
5. **Week 5** – Refund flow (manual), analytics summary, optional Stripe fallback integration, docs quickstart draft.
6. **Week 6** – Security hardening (rate limits, HMAC, logging), monitoring, QA readiness.
7. **Week 7–8** – End-to-end QA, load testing, SDK packaging, example apps (Next.js, static HTML), marketing site stub.

## Next Steps

- Finalize technology choices (NestJS vs. Express, Storybook vs. Ladle, queue provider).
- Define database schema migrations and Supabase project setup.
- Implement `/create-payment-request` stub and integrate with widget demo.
- Draft Quickstart docs and sample integration repos.
- Schedule monitoring/alerting setup and on-call runbooks.

