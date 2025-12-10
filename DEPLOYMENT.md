# 🚀 Deployment Guide

Complete guide for deploying Solana Micro-Paywall to Cloudflare Workers & Pages.

## 📋 Prerequisites

- Cloudflare account
- Domain: `micropaywall.app` (registered)
- GitHub repository connected
- Node.js 20+ installed locally (Node.js 20 LTS recommended)

## 🔐 Step 1: Setup Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click: "Create Token" → Use template: "Edit Cloudflare Workers"
3. Ensure it includes:
   - Cloudflare Workers → Edit
   - Cloudflare Pages → Edit
   - Account Settings → Read
4. Copy the token (you'll only see it once!)

## 🔑 Step 2: Add GitHub Secrets

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your API token from Step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | `10374f367672f4d19db430601db0926b` |

## 🗄️ Step 3: Setup Cloudflare Resources (One-time)

### 3.1 Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 3.2 Create Resources

```bash
cd apps/backend-workers

# Create D1 Database
wrangler d1 create micropaywall-db
# Copy the database_id from output

# Create KV Namespaces
wrangler kv namespace create CACHE
wrangler kv namespace create CACHE --preview
# Copy both id and preview_id from outputs
```

### 3.3 Update wrangler.toml

Edit `apps/backend-workers/wrangler.toml` and add the IDs from Step 3.2.

### 3.4 Run Database Migration

```bash
cd apps/backend-workers
npm run db:migrate
```

## 🔐 Step 4: Set Environment Variables

### Workers (via Dashboard or wrangler secret)

Go to: **Workers & Pages** → **micropaywall-api** → **Settings** → **Variables**

Or use CLI:
```bash
echo "your-jwt-secret" | wrangler secret put JWT_SECRET --env production
echo "https://api.mainnet-beta.solana.com" | wrangler secret put SOLANA_RPC_ENDPOINT --env production
```

Required variables:
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `SOLANA_RPC_ENDPOINT` - `https://api.mainnet-beta.solana.com`
- `FRONTEND_URL` - `https://micropaywall.app` (already in wrangler.toml)
- `CORS_ORIGIN` - `https://micropaywall.app,https://www.micropaywall.app` (already in wrangler.toml)

### Pages (via Dashboard)

Go to: **Workers & Pages** → **Pages** → **micropaywall** → **Settings** → **Environment Variables**

Add:
- `NEXT_PUBLIC_API_URL` = `https://api.micropaywall.app`
- `NEXT_PUBLIC_WEB_URL` = `https://micropaywall.app`
- `NEXT_PUBLIC_SOLANA_RPC` = `https://api.devnet.solana.com`
- `NEXT_PUBLIC_SOLANA_RPC_MAINNET` = `https://api.mainnet-beta.solana.com`
- `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet`

## 🚀 Step 5: Deploy

### Automatic Deployment (Recommended)

Just push to main branch:

```bash
git add .
git commit -m "Deploy to Cloudflare"
git push origin main
```

GitHub Actions will automatically:
- Deploy Workers to `micropaywall-api`
- Deploy Pages to `micropaywall`

### Manual Deployment

**Workers:**
```bash
cd apps/backend-workers
npm run deploy:production
```

**Pages:**
Deployments happen automatically via GitHub Actions when you push.

## 🌐 Step 6: Connect Custom Domains

### Workers (API)

Already configured in `wrangler.toml`:
- `api.micropaywall.app` → Automatically configured

### Pages (Frontend)

1. Go to: **Workers & Pages** → **Pages** → **micropaywall**
2. Click: **Custom domains** → **Set up a custom domain**
3. Enter: `micropaywall.app`
4. Cloudflare will configure DNS automatically

## ✅ Step 7: Verify Deployment

### Test API

```bash
curl https://api.micropaywall.app/health
# Should return: {"status":"ok",...}
```

### Test Frontend

Visit: `https://micropaywall.pages.dev` (or `https://micropaywall.app` after domain setup)

## 🐛 Troubleshooting

### Workflow Fails

- **Check:** GitHub secrets are set correctly
- **Verify:** API token has correct permissions
- **Check:** Build logs in GitHub Actions

### API Not Working

- **Verify:** Environment variables are set
- **Check:** Database migration completed
- **Test:** Health endpoint responds

### Frontend Not Loading

- **Check:** Environment variables in Pages dashboard
- **Verify:** `NEXT_PUBLIC_API_URL` is correct
- **Check:** Browser console for errors

## 📚 Additional Resources

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

---

**Your app is live at:**
- API: `https://api.micropaywall.app`
- Frontend: `https://micropaywall.app` (after domain setup)

