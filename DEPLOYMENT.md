# Deployment Guide

## Prerequisites

1. Cloudflare account with Workers and Pages enabled
2. D1 database created
3. KV namespace created (optional, for rate limiting)
4. Environment variables configured

## Setup Steps

### 1. Create Cloudflare D1 Database

```bash
wrangler d1 create solana-paywall-db
```

Copy the database ID from the output and update `wrangler.toml`.

### 2. Create KV Namespace (Optional)

```bash
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview
```

Copy the namespace IDs and update `wrangler.toml`.

### 3. Update wrangler.toml

Update the following in `wrangler.toml`:

- `database_id` for D1 database
- `id` for KV namespace
- Environment variables in `[env.production.vars]` and `[env.development.vars]`

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Set Environment Variables

Set the following secrets in Cloudflare Workers:

- `JWT_SECRET`: Secret key for JWT signing (generate a secure random string)
- `SOLANA_RPC_URL`: Solana RPC endpoint (e.g., `https://api.mainnet-beta.solana.com`)
- `HELIUS_API_KEY`: (Optional) Helius API key for enhanced RPC access
- `NEXT_PUBLIC_WEB_URL`: Your frontend URL
- `NEXT_PUBLIC_API_URL`: Your API URL (same as Workers URL)

### 6. Deploy Workers

```bash
npm run worker:deploy
```

### 7. Deploy Frontend

#### Option A: Cloudflare Pages (Recommended)

1. Build the frontend:
```bash
npm run build
```

2. Deploy via Wrangler:
```bash
wrangler pages deploy out --project-name=solana-micro-paywall
```

#### Option B: GitHub Actions

Push to your repository and GitHub Actions will automatically deploy (if configured).

### 8. Configure Custom Domains

In Cloudflare dashboard:
- Workers: Add custom domain in Workers settings
- Pages: Add custom domain in Pages settings

## Environment Variables Reference

### Required

- `JWT_SECRET`: Secret for JWT token signing
- `SOLANA_RPC_URL`: Solana RPC endpoint URL

### Optional

- `HELIUS_API_KEY`: Helius API key for enhanced RPC
- `NEXT_PUBLIC_WEB_URL`: Frontend URL (for CORS)
- `NEXT_PUBLIC_API_URL`: API URL (for frontend API calls)

## Troubleshooting

### Database Connection Issues

- Verify database ID in `wrangler.toml`
- Ensure migrations have been run
- Check database bindings in Workers dashboard

### CORS Errors

- Update `NEXT_PUBLIC_WEB_URL` in environment variables
- Check CORS middleware in `workers/middleware/cors.ts`

### Payment Verification Failing

- Verify Solana RPC endpoint is accessible
- Check HELIUS_API_KEY if using Helius
- Ensure transaction signatures are valid

### Frontend Not Loading

- Verify `out` directory exists after build
- Check Pages deployment settings
- Ensure static export is configured in `next.config.js`
