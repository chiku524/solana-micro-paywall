# 🖥️ Terminal-Only Setup Guide

This guide shows you how to set up everything via terminal, including connecting your domain `micropaywall.app`.

## Prerequisites

1. **Cloudflare account** (you have this ✅)
2. **Domain `micropaywall.app`** (you have this ✅)
3. **Node.js and npm** installed

## Quick Setup (Automated Script)

### For Linux/Mac:

```bash
cd apps/backend-workers
chmod +x setup-cloudflare.sh
./setup-cloudflare.sh
```

### For Windows (PowerShell):

```powershell
cd apps/backend-workers
.\setup-cloudflare.ps1
```

The script will:
- ✅ Login to Cloudflare
- ✅ Create D1 database
- ✅ Create KV namespaces
- ✅ Create queues
- ✅ Run database migration
- ✅ Update wrangler.toml automatically

## Manual Setup (Step-by-Step)

If you prefer to run commands manually:

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate.

### Step 3: Create D1 Database

```bash
cd apps/backend-workers
wrangler d1 create micropaywall-db
```

**Copy the `database_id` from the output** and update `wrangler.toml`:
```toml
database_id = "your-database-id-here"
```

### Step 4: Create KV Namespaces

```bash
# Production KV
wrangler kv:namespace create CACHE

# Preview KV (for development)
wrangler kv:namespace create CACHE --preview
```

**Copy the IDs** and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id-here"
preview_id = "your-preview-kv-id-here"
```

### Step 5: Create Queues

```bash
wrangler queues create payment-verification
wrangler queues create webhooks
```

These are already configured in `wrangler.toml`, so no manual update needed.

### Step 6: Run Database Migration

```bash
wrangler d1 execute micropaywall-db --file=../../migrations/d1-schema.sql
```

### Step 7: Add Domain to Cloudflare

Since you own `micropaywall.app`, you need to add it to Cloudflare:

```bash
# Option 1: Use Cloudflare Dashboard (recommended)
# Go to: https://dash.cloudflare.com/
# Click "Add Site" → Enter "micropaywall.app"
# Follow DNS setup instructions

# Option 2: Use Wrangler (if domain is already in Cloudflare)
# This requires the domain to already be in your Cloudflare account
```

**Important**: If your domain is not yet in Cloudflare:
1. Go to https://dash.cloudflare.com/
2. Click "Add Site"
3. Enter `micropaywall.app`
4. Follow the DNS setup (update nameservers at your registrar)

### Step 8: Set Environment Variables

You can set environment variables via terminal using Wrangler:

```bash
# Set JWT_SECRET (generate a random string first)
JWT_SECRET=$(openssl rand -hex 32)  # Linux/Mac
# Or on Windows PowerShell: $JWT_SECRET = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})

wrangler secret put JWT_SECRET
# Paste your JWT_SECRET when prompted

wrangler secret put SOLANA_RPC_ENDPOINT
# Enter: https://api.mainnet-beta.solana.com (or your RPC URL)

wrangler secret put FRONTEND_URL
# Enter: https://micropaywall.app

wrangler secret put CORS_ORIGIN
# Enter: https://micropaywall.app,https://www.micropaywall.app
```

**Note**: For production environment, use:
```bash
wrangler secret put JWT_SECRET --env production
wrangler secret put SOLANA_RPC_ENDPOINT --env production
# etc.
```

### Step 9: Connect Domain to Worker

After your domain is in Cloudflare, connect it to your Worker:

```bash
# Option 1: Via Dashboard (recommended)
# 1. Go to Workers & Pages → micropaywall
# 2. Settings → Triggers → Custom Domains
# 3. Add: api.micropaywall.app

# Option 2: Via wrangler.toml (already configured)
# The routes are already set in wrangler.toml:
# [env.production.routes]
# pattern = "api.micropaywall.app/*"
# zone_name = "micropaywall.app"
```

### Step 10: Deploy

```bash
# Deploy to production
npm run deploy:production

# Or deploy to staging first
npm run deploy:staging
```

### Step 11: Verify Deployment

```bash
# Test health endpoint
curl https://api.micropaywall.app/health

# Or if using Workers subdomain
curl https://micropaywall.your-subdomain.workers.dev/health
```

## Troubleshooting

### Domain Not Found
If you get "zone not found" errors:
1. Make sure domain is added to Cloudflare
2. Wait a few minutes for DNS propagation
3. Verify domain is active in Cloudflare Dashboard

### Database Errors
```bash
# Re-run migration
wrangler d1 execute micropaywall-db --file=../../migrations/d1-schema.sql

# Check database
wrangler d1 execute micropaywall-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Environment Variables Not Working
- Use `wrangler secret put` for sensitive values
- Use `vars` in `wrangler.toml` for non-sensitive values
- Make sure you're using `--env production` for production secrets

## Next Steps

1. ✅ Deploy Workers backend
2. ✅ Connect domain
3. ✅ Update frontend `.env` with API URL
4. ✅ Test all endpoints
5. ✅ Monitor Cloudflare Dashboard

## Quick Reference

```bash
# Login
wrangler login

# Create resources
wrangler d1 create micropaywall-db
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview
wrangler queues create payment-verification
wrangler queues create webhooks

# Migrate database
wrangler d1 execute micropaywall-db --file=../../migrations/d1-schema.sql

# Set secrets
wrangler secret put JWT_SECRET --env production
wrangler secret put SOLANA_RPC_ENDPOINT --env production
wrangler secret put FRONTEND_URL --env production
wrangler secret put CORS_ORIGIN --env production

# Deploy
npm run deploy:production
```

Your API will be available at: `https://api.micropaywall.app` 🎉

