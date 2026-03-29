# Secrets & Environment Variables

## Workers (`workers/.dev.vars` locally, `wrangler secret` in production)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | JWT signing secret for merchant sessions and access tokens |
| `SOLANA_RPC_URL` | Yes* | Solana RPC (Helius URL with API key is typical) |
| `HELIUS_API_KEY` | No | Used when building Helius URLs / features that expect it |
| `RESEND_API_KEY` | No | Transactional email (verification, password reset, merchant sale notifications) |
| `EMAIL_FROM` | No | From address for Resend (must be verified in Resend) |
| `SENTRY_DSN` | No | Worker error reporting (if wired in worker code) |

\*Strictly required for Solana flows; EVM-only tests still benefit from a valid Worker env.

**Webhooks:** HMAC signing uses the per-merchant **`webhookSecret`** set in the dashboard (stored in D1), not a global Worker secret.

### Public `[vars]` (non-secret)

Typically set in `wrangler.toml` or dashboard:

- `NEXT_PUBLIC_WEB_URL` – allowed CORS origin for the web app
- `ENVIRONMENT` – `development` \| `staging` \| `production`
- EVM RPC URLs per chain (e.g. `ETHEREUM_RPC_URL`, `POLYGON_RPC_URL`, …) as configured in your project

**Note:** Fiat/USD spot quotes use CoinGecko’s public API by default; no API key is required for basic usage.

## Frontend (`.env.local` / Pages env)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Worker API base URL |
| `NEXT_PUBLIC_WEB_URL` | Site origin (CORS, links, embeds) |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional browser Sentry |

## Do not commit

- `workers/.dev.vars`
- `.env.local`

Add these files locally; variable names are listed in the tables above.
