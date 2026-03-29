# Deployment Guide

Micro Paywall uses **Cloudflare Workers** (API) and **Cloudflare Pages** (static Next export). This matches `wrangler.toml` and GitHub Actions.

## Prerequisites

- Cloudflare account
- Wrangler logged in: `npx wrangler login`
- D1 database + KV namespaces created; IDs in `wrangler.toml` (or your fork)

## 1. D1 migrations (production)

Apply to the **remote** database before or right after deploying Workers:

```bash
cd workers
npx wrangler d1 migrations apply micropaywall-db --remote
npx wrangler d1 migrations list micropaywall-db --remote
```

Use the `database_name` from `wrangler.toml` (`micropaywall-db`). If the remote DB already has schema but an empty `d1_migrations` table, you may need a one-off `d1 execute --remote --file=...` and manual migration rows — document any such repair for your environment.

## 2. Secrets

Set Worker secrets (see [secrets.md](secrets.md)):

```bash
cd workers
npx wrangler secret put JWT_SECRET
npx wrangler secret put SOLANA_RPC_URL
# … other secrets as needed
```

Public URLs can be set via `wrangler.toml` `[vars]` or dashboard.

## 3. Deploy Workers (API)

From repo root:

```bash
npm run worker:deploy
# or: cd workers && npx wrangler deploy
```

## 4. Deploy frontend (Pages)

Build exports to `out/`:

```bash
npm run build
```

Deploy `out/` to Cloudflare Pages (dashboard or `wrangler pages deploy out --project-name=micropaywall`).

Set Pages environment variables:

- `NEXT_PUBLIC_API_URL` – production Worker URL
- `NEXT_PUBLIC_WEB_URL` – production site URL

## 5. Custom domains

- Worker: custom domain / route in Cloudflare dashboard
- Pages: attach custom domain to the Pages project

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main`: Worker deploy + Pages deploy. Ensure GitHub secrets match [secrets.md](secrets.md) and Cloudflare API token permissions.

## Post-deploy checks

- `GET /health` on Worker
- Create merchant + login
- Create content + payment intent + verify flow on target chain
- Optional: webhook delivery and `GET /api/merchants/me/webhook-deliveries` with merchant JWT
