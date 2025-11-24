# ⚡ Quick Deployment Guide

## 🎯 5-Minute Deployment

### Step 1: Setup Cloudflare Resources (One-time)

```bash
cd apps/backend-workers

# Login
wrangler login

# Create database (copy database_id to wrangler.toml)
wrangler d1 create micropaywall-db

# Create KV (copy IDs to wrangler.toml)
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview

# Create queues (already configured in wrangler.toml)
wrangler queues create payment-verification
wrangler queues create webhooks
```

### Step 2: Update wrangler.toml

Edit `apps/backend-workers/wrangler.toml`:
- Add `database_id` from Step 1
- Add KV `id` and `preview_id` from Step 1

### Step 3: Run Migration

```bash
npm run db:migrate
```

### Step 4: Set Environment Variables

In Cloudflare Dashboard → Workers → Settings → Variables:

| Variable | Value | Example |
|----------|-------|---------|
| `JWT_SECRET` | Random string | `your-secret-key-here` |
| `SOLANA_RPC_ENDPOINT` | Solana RPC URL | `https://api.mainnet-beta.solana.com` |
| `FRONTEND_URL` | Your frontend | `https://micropaywall.app` |
| `CORS_ORIGIN` | Allowed origins | `https://micropaywall.app,https://www.micropaywall.app` |

### Step 5: Deploy

**Option A: GitHub Actions (Recommended)**
1. Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets
2. Push to main branch
3. Deployment happens automatically!

**Option B: CLI**
```bash
npm run deploy:production
```

### Step 6: Connect Domain

1. Cloudflare Dashboard → Workers → Your Worker
2. Settings → Triggers → Custom Domains
3. Add: `api.micropaywall.app`
4. DNS configured automatically!

## ✅ Verify Deployment

```bash
# Health check
curl https://api.micropaywall.app/health

# Should return: {"status":"ok",...}
```

## 🎉 Done!

Your API is live at: `https://api.micropaywall.app`

## 📝 Next Steps

1. Update frontend `.env`: `NEXT_PUBLIC_API_URL=https://api.micropaywall.app`
2. Test all endpoints
3. Monitor Cloudflare Dashboard for errors

## 🆘 Troubleshooting

- **Database errors**: Run `npm run db:migrate` again
- **CORS errors**: Check `CORS_ORIGIN` environment variable
- **Auth errors**: Verify `JWT_SECRET` is set
- **Payment errors**: Check `SOLANA_RPC_ENDPOINT` is correct

See `DEPLOYMENT_READY.md` for detailed instructions.

