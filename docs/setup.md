# Local Development Setup

## Prerequisites

- Node.js 18+
- npm
- Cloudflare account (for production deploy)
- Wrangler CLI (`npm install -g wrangler` or use `npx wrangler`)

## Install

```bash
git clone https://github.com/chiku524/micropaywall.git
cd micropaywall
npm install
```

## Cloudflare resources

Create (or reuse) in the Cloudflare dashboard:

1. **D1 database** – create in the Cloudflare dashboard; copy **`database_id`** into `wrangler.toml` under `[[env.*.d1_databases]]` (binding `DB`).
2. **KV namespace** – bound as **`CACHE`** in `wrangler.toml` (rate limits, discover cache, fiat quote cache, payment idempotency).

The D1 **database name** in Wrangler is `micropaywall-db` (see `wrangler.toml` `database_name`). Older docs may say `solana-paywall-db`; use what matches your `wrangler.toml`.

## Local configuration

### Workers (`.dev.vars`)

Create `workers/.dev.vars` (not committed) with key/value lines. See [secrets.md](secrets.md) for each variable. Minimum for a working API: `JWT_SECRET`, `SOLANA_RPC_URL`, and (for email features) `RESEND_API_KEY` / `EMAIL_FROM`.

### Frontend (`.env.local`)

Create `.env.local` in the repo root with at least:

- `NEXT_PUBLIC_API_URL` – local Worker, e.g. `http://localhost:8787`
- `NEXT_PUBLIC_WEB_URL` – frontend origin, e.g. `http://localhost:3000`

## D1 migrations

Migrations live in `workers/migrations/` (`0001` … `0007`). **`0005`** includes `CREATE TABLE IF NOT EXISTS content` so a clean local apply survives legacy **`0002`** naming quirks; **`0006`** adds webhooks, API keys, analytics, USD fields; **`0007`** is a no-op placeholder for ordering.

### Apply locally (default)

```bash
npm run db:migrate
```

This runs `wrangler d1 migrations apply micropaywall-db` **without** `--remote` (local D1).

### Apply to production D1

```bash
cd workers && npx wrangler d1 migrations apply micropaywall-db --remote
```

If production was created manually or `d1_migrations` is out of sync, you may need to run specific SQL files with `wrangler d1 execute ... --remote --file=...` and reconcile `d1_migrations` — see [architecture.md](architecture.md).

### List pending

```bash
cd workers && npx wrangler d1 migrations list micropaywall-db
cd workers && npx wrangler d1 migrations list micropaywall-db --remote
```

## Run locally

**Terminal 1 – API**

```bash
npm run worker:dev
```

**Terminal 2 – Frontend**

```bash
npm run dev
```

- API: `http://localhost:8787`
- App: `http://localhost:3000`
- Health: `GET http://localhost:8787/health`

## Create a merchant (quick test)

```bash
curl -X POST http://localhost:8787/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword","name":"Test Merchant"}'
```

Use returned `merchantId` in dashboard links and JWT from `POST /api/auth/login`.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `no such table: content` after migrate | Re-run migrations on a fresh local DB, or apply `0005`+`0006` SQL; see architecture doc |
| CORS errors | Ensure `NEXT_PUBLIC_API_URL` matches the Worker origin; Worker allows `NEXT_PUBLIC_WEB_URL` |
| Wallet / chain errors | Set `SOLANA_RPC_URL` (and optional `HELIUS_API_KEY`); EVM needs correct chain RPC in env where verified |
| Fiat quote unavailable | CoinGecko is used without a secret; check network; amounts fall back to on-chain minimums |

## Optional: Sentry

Configure `SENTRY_DSN` and related vars in `.dev.vars` / secrets for Worker and frontend as needed.
