# Cloudflare Setup & Deployment Guide

## 🚀 Quick Start

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
# Or use locally: cd apps/backend-workers && npm install
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create D1 Database
```bash
wrangler d1 create micropaywall-db
```
Copy the `database_id` from output and update `apps/backend-workers/wrangler.toml`.

### 4. Create KV Namespace
```bash
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview
```
Update `wrangler.toml` with the IDs.

### 5. Create Queues
```bash
wrangler queues create payment-verification
wrangler queues create webhooks
```
Update `wrangler.toml` with queue names.

### 6. Run Database Migration
```bash
cd apps/backend-workers
npm run db:migrate
```

### 7. Deploy via GitHub Actions (Recommended)

1. Get Cloudflare API Token: https://dash.cloudflare.com/profile/api-tokens
   - Create Token → Use template: "Edit Cloudflare Workers"
2. Add to GitHub Secrets:
   - Repository → Settings → Secrets → Actions
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: (paste token)
3. Push to main branch - deployment happens automatically!

### 8. Deploy via CLI (Alternative)
```bash
cd apps/backend-workers
npm run deploy:production
```

## 📋 Environment Variables

Set in Cloudflare Dashboard → Workers → Settings → Variables:
- `JWT_SECRET`: Secret for JWT tokens
- `SOLANA_RPC_ENDPOINT`: Solana RPC URL
- `FRONTEND_URL`: Your frontend URL
- `CORS_ORIGIN`: Allowed CORS origins (comma-separated)

## 🔧 Configuration

All configuration is in `apps/backend-workers/wrangler.toml`.

## 📚 Full Documentation

See `SETUP_CLOUDFLARE_RESOURCES.md` for detailed setup instructions.

