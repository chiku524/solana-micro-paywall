# Secrets and Environment Variables

Worker secrets are set via the Wrangler CLI and are encrypted in Cloudflare. They are not stored in the repo.

## Required secrets

Set these for the `micropaywall-api` Worker (e.g. `--env production`):

| Secret | Purpose | Set via |
|--------|---------|---------|
| `JWT_SECRET` | Signing JWT tokens (auth, access tokens) | `wrangler secret put JWT_SECRET --env production` |
| `SOLANA_RPC_URL` | Solana RPC endpoint for transaction verification | `wrangler secret put SOLANA_RPC_URL --env production` |

## Email (password recovery and verification)

To send password-reset and verification emails, set **one** of:

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Send via [Resend](https://resend.com); verify your domain and create an API key. Default "From" in code: `noreply@micropaywall.app` (edit `workers/lib/email.ts` if needed). |
| `SENDGRID_API_KEY` | Send via [SendGrid](https://sendgrid.com). |

Without either, production forgot-password returns 503 ("Password reset is temporarily unavailable").

## Optional

- `HELIUS_API_KEY` – Enhanced Solana RPC
- **EVM RPC URLs** – For EVM chain verification (public RPCs used as fallback):
  - `ETHEREUM_RPC_URL`, `POLYGON_RPC_URL`, `BASE_RPC_URL`, `ARBITRUM_RPC_URL`
  - `OPTIMISM_RPC_URL`, `BNB_RPC_URL`, `AVALANCHE_RPC_URL`
- `NEXT_PUBLIC_WEB_URL` – e.g. `https://micropaywall.app` (CORS; also in `wrangler.toml` for production)
- `NEXT_PUBLIC_API_URL` – e.g. `https://api.micropaywall.app`

## Bindings (wrangler.toml)

D1 (`DB`) and KV (`CACHE`) are configured in `wrangler.toml` and applied on deploy. No need to set them as secrets in the dashboard if you deploy with Wrangler.

## Commands

```bash
wrangler secret put JWT_SECRET --env production
wrangler secret put SOLANA_RPC_URL --env production
wrangler secret put RESEND_API_KEY --env production   # if using Resend
wrangler secret list --env production
```

Secrets cannot be read back after setting; rotate by putting a new value.
