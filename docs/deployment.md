# Deployment Guide

## Overview

The app uses **two Cloudflare projects**:

1. **Pages** (`micropaywall`) – Frontend (Next.js static site from `out/`)
2. **Workers** (`micropaywall-api`) – Backend API

**Custom domains (typical setup):**

- Frontend: `micropaywall.app`
- API: `api.micropaywall.app`

## Prerequisites

- Cloudflare account with Workers and Pages enabled
- D1 database and KV namespace created (see [setup.md](setup.md))
- Secrets configured (see [secrets.md](secrets.md))

## Deploy via GitHub Actions

Pushing to `main` triggers automatic deployment for both Workers and Pages.

**Required GitHub secrets** (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` – Custom API token with permissions below
- `CLOUDFLARE_ACCOUNT_ID` – From Cloudflare dashboard (Overview → Account ID)

**API token permissions:** Create a token from **Edit Cloudflare Workers**, then add:

- Account → **D1** → Edit  
- Account → **Workers KV Storage** → Edit  
- Account → **Cloudflare Pages** → Edit  
- User → **User Details** → Read  

Set **Account Resources** to Include → your account. Store the token in `CLOUDFLARE_API_TOKEN`.

## Manual deploy

1. **Build frontend**
   ```bash
   npm run build
   ```

2. **Deploy Worker**
   ```bash
   npx wrangler deploy --env production
   ```

3. **Deploy Pages**
   ```bash
   npx wrangler pages deploy out --project-name=micropaywall
   ```

## Custom domains

- **Pages:** Cloudflare Dashboard → Workers & Pages → `micropaywall` → Custom domains → add `micropaywall.app`.
- **Workers:** Workers & Pages → `micropaywall-api` → Triggers → Add route/custom domain → `api.micropaywall.app`.

DNS is usually configured automatically when you add the domain in Cloudflare.

## Troubleshooting

### Authentication error [code: 10000]

The Cloudflare API token is missing or lacks permissions.

1. Confirm `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set in GitHub Actions secrets.
2. Recreate the token with the permissions listed above and update the secret.
3. Re-run the failed workflow.

### Database / CORS / payment issues

- **Database:** Check database ID in `wrangler.toml` and that migrations have been run (`npm run db:migrate`).
- **CORS:** Set `NEXT_PUBLIC_WEB_URL` in Worker vars/secrets to your frontend URL; check `workers/middleware/cors.ts`.
- **Payment verification:** Ensure `SOLANA_RPC_URL` (and optional `HELIUS_API_KEY`) are set and the RPC is reachable.
- **Frontend not loading:** Ensure `npm run build` produces the `out/` directory and static export is enabled in `next.config.js`.
