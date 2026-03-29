# Enhancements & Recommendations

## Platform capabilities (current)

These are implemented end-to-end (API + UI where applicable):

- **Multi-chain** – Eight chains; per-content `chain`; Solana Pay + EVM transfer flow; shared EVM verifier (viem).  
- **USD-quoted pricing** – Optional `target_price_usd` on content; checkout uses cached spot conversion (`workers/lib/fiat-quote.ts`); `GET /api/prices/quote` for tooling.  
- **Payment intents** – `Idempotency-Key` header deduplicates create-request; optional `X-Api-Key` for higher rate limits (merchant API keys in dashboard + `GET|POST|DELETE /api/developer-keys`).  
- **Webhooks** – Merchant-configurable URL; HMAC-signed payloads; delivery rows; `GET /api/merchants/me/webhook-deliveries`.  
- **Email** – Resend: verification, password reset, optional merchant “sale” notification (`RESEND_API_KEY`, `EMAIL_FROM`).  
- **Merchant policy copy** – Refund/support text and support email stored on merchant; surfaced on content/checkout where configured.  
- **Analytics** – `POST /api/analytics/events` (`content_impression`, `pay_click`, `purchase_verified`); merchant `GET /api/analytics/funnel` (30-day rollups); existing stats/export under `/api/analytics/*`.  
- **Discovery cache** – KV-backed caching for discover/list endpoints.  
- **Observability** – `X-Request-Id` on responses; structured logs for slow/error requests.  
- **Marketplace UX** – EN/ES locale provider; related content; truncated public body with unlock via `?wallet=` when the viewer has purchased.  
- **Checkout UX** – Payment widget + receipt modal; memo/amount aligned with server intent.  
- **Embeds** – `public/micropaywall-embed.js`; npm package **`micropaywall-embed-react`** ([package README](../packages/micropaywall-embed-react/README.md)).  
- **Library / nav** – Purchases, bookmarks, recently viewed on `/library`; primary nav uses **My Library** (wallet/session) rather than duplicating a second Library link.  
- **Security** – 2FA/password recovery, rate limits, security headers middleware, JWT auth for merchant routes.

## Frontend & UX polish (already in tree)

- Image optimization patterns, skeletons, SWR, toasts, error boundaries, debounced search, share buttons, `EmptyState` variants, lazy animated background, modal a11y, `prefers-reduced-motion`, Web Vitals, client analytics helper (`src/lib/analytics.ts`).

## Future recommendations

- **Automated tests** – Verifier units; full payment E2E (Playwright) per chain smoke.  
- **RPC hardening** – Backoff + circuit breaker in verifiers; optional multiple RPC fallbacks per chain.  
- **API contract** – OpenAPI or generated client; keep [application-specification.md](application-specification.md) updated on every route change.  
- **Static export completeness** – `generateStaticParams` (or ISR strategy) for any dynamic marketplace routes that fail `next build` export.  
- **Optional** – CAPTCHA on sensitive public POSTs; audit log table for admin actions; service worker / offline hints.

See [architecture.md](architecture.md) for migrations, KV usage, and file map.
