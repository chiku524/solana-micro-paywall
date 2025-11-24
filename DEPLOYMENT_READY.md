# 🚀 Deployment Ready Guide

## ✅ What's Complete

Your Cloudflare Workers backend is now **ready for deployment** with all critical routes implemented:

### Implemented Routes
- ✅ **Auth** - Login endpoint
- ✅ **Merchants** - CRUD, profiles, dashboard, follow/unfollow
- ✅ **Contents** - CRUD, stats
- ✅ **Discover** - Marketplace, categories, trending
- ✅ **Payments** - Create request, verify payment, status
- ✅ **Purchases** - List, check access, shareable links
- ✅ **Bookmarks** - CRUD, check status

### Infrastructure
- ✅ JWT authentication (Web Crypto API)
- ✅ Database utilities (D1)
- ✅ Solana RPC integration (fetch-based)
- ✅ Rate limiting (KV-based)
- ✅ Error handling
- ✅ CORS configuration

## 📋 Pre-Deployment Checklist

### 1. Cloudflare Resources Setup

Run these commands to set up your Cloudflare resources:

```bash
cd apps/backend-workers

# Login to Cloudflare
wrangler login

# Create D1 Database
wrangler d1 create micropaywall-db
# Copy the database_id from output and update wrangler.toml

# Create KV Namespaces
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview
# Copy the IDs and update wrangler.toml

# Create Queues
wrangler queues create payment-verification
wrangler queues create webhooks
# Update wrangler.toml with queue names
```

### 2. Update wrangler.toml

Make sure your `apps/backend-workers/wrangler.toml` has:
- ✅ D1 database binding
- ✅ KV namespace bindings
- ✅ Queue bindings
- ✅ Environment variables

### 3. Run Database Migration

```bash
cd apps/backend-workers
npm run db:migrate
```

This will create all tables in your D1 database.

### 4. Set Environment Variables

In Cloudflare Dashboard → Workers → Settings → Variables, set:
- `JWT_SECRET` - Secret for JWT tokens (generate a strong random string)
- `SOLANA_RPC_ENDPOINT` - Your Solana RPC URL (e.g., `https://api.mainnet-beta.solana.com`)
- `FRONTEND_URL` - Your frontend URL (e.g., `https://micropaywall.app`)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `NODE_ENV` - `production`

### 5. Deploy via GitHub Actions (Recommended)

1. **Get Cloudflare API Token**:
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Create Token → Use template: "Edit Cloudflare Workers"
   - Copy the token

2. **Add to GitHub Secrets**:
   - Repository → Settings → Secrets → Actions
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: (paste your token)

3. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

The GitHub Actions workflow will automatically deploy!

### 6. Deploy via CLI (Alternative)

```bash
cd apps/backend-workers
npm run deploy:production
```

## 🔗 Connect Your Domain

### Option 1: Custom Domain (Recommended)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your Worker → Settings → Triggers
3. Add Custom Domain
4. Enter your domain: `api.micropaywall.app` (or `micropaywall.app`)
5. Cloudflare will automatically configure DNS

### Option 2: Workers Subdomain

Your Worker will be available at:
`micropaywall.your-subdomain.workers.dev`

## 🧪 Testing

After deployment, test your endpoints:

```bash
# Health check
curl https://api.micropaywall.app/health

# API info
curl https://api.micropaywall.app/api

# Create merchant
curl -X POST https://api.micropaywall.app/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 📝 Update Frontend

Update your frontend `.env` or environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.micropaywall.app
```

Or if using Workers subdomain:
```env
NEXT_PUBLIC_API_URL=https://micropaywall.your-subdomain.workers.dev
```

## 🎯 Next Steps

1. ✅ Deploy Workers backend
2. ✅ Connect custom domain
3. ✅ Update frontend API URL
4. ✅ Test all endpoints
5. ⚠️ Monitor performance and errors
6. ⚠️ Gradually migrate traffic from NestJS to Workers

## 🚨 Important Notes

- **Both backends can run in parallel** - No need to shut down NestJS immediately
- **Test thoroughly** - Verify all endpoints work correctly
- **Monitor logs** - Check Cloudflare Dashboard for errors
- **Gradual migration** - Switch frontend endpoints one by one

## 📚 Documentation

- `CLOUDFLARE_SETUP.md` - Detailed setup instructions
- `WORKERS_MIGRATION_STATUS.md` - Migration progress
- `apps/backend-workers/README.md` - Workers project docs

## 🎉 You're Ready!

Your Workers backend is fully functional and ready for production deployment!

