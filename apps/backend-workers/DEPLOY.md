# Deployment Guide for micropaywall.app

## 🚀 Quick Deploy

### Prerequisites

1. **Cloudflare account** with `micropaywall.app` domain added
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Dependencies** installed: `npm install`

### One-Time Setup

```bash
# 1. Login to Cloudflare
wrangler login

# 2. Create D1 database
wrangler d1 create micropaywall-db
# Copy database_id and update wrangler.toml

# 3. Create KV namespace
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview
# Copy IDs and update wrangler.toml

# 4. Create queues
wrangler queues create payment-verification
wrangler queues create webhooks

# 5. Run database migration
npm run db:migrate
```

### Deploy

```bash
# Deploy to production
npm run deploy:production

# Or directly
wrangler deploy --env production
```

## 📋 Build & Deploy Commands

### For Cloudflare Dashboard:

**Build Command**: 
```
(Leave empty - Workers are built automatically)
```

**Deploy Command**: 
```
(Leave empty - Deployment is automatic)
```

**Note**: If using the dashboard, you don't need build/deploy commands. Cloudflare handles everything automatically when you connect your GitHub repo.

### For Wrangler CLI:

**Build**: Not needed (automatic)

**Deploy**: 
```bash
wrangler deploy --env production
```

## 🌐 Domain Configuration

After deployment, configure custom domain:

```bash
# Add custom domain
wrangler routes add api.micropaywall.app/* --zone-name micropaywall.app
```

Or in Dashboard:
1. Workers → `micropaywall` → Settings → Triggers
2. Add Custom Domain: `api.micropaywall.app`

## ✅ Verify Deployment

```bash
# Test health endpoint
curl https://api.micropaywall.app/api/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "version": "1.0.0",
#   "services": {
#     "database": "connected",
#     "cache": "connected"
#   }
# }
```

## 🔧 Environment Variables

Set in Cloudflare Dashboard → Workers → `micropaywall` → Settings → Variables:

```bash
NODE_ENV=production
JWT_SECRET=your-secret-key
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
FRONTEND_URL=https://micropaywall.app
CORS_ORIGIN=https://micropaywall.app,https://www.micropaywall.app
```

## 📝 Project Details

- **Project Name**: `micropaywall`
- **Domain**: `api.micropaywall.app`
- **Entry Point**: `src/index.ts`
- **Framework**: Hono (no build needed)

