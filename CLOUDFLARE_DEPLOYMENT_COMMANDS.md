# Cloudflare Deployment Commands

## 🎯 For Your Domain: `micropaywall.app`

### Project Name: `micropaywall`

## 📋 Build & Deploy Commands

### Cloudflare Workers (Backend API)

**Important**: Cloudflare Workers don't require a separate build step - Wrangler handles bundling automatically.

#### If using Cloudflare Dashboard:

**Build Command**: 
```
(Leave empty or use: npm install)
```
*Note: Workers are built automatically by Cloudflare, no build step needed*

**Deploy Command**: 
```
(Leave empty - deployment is automatic)
```
*Note: If deploying via dashboard, it's automatic. Use CLI for manual control*

#### If using Wrangler CLI (Recommended):

**Build Command**: 
```
(Not needed - Wrangler handles it automatically)
```

**Deploy Command**: 
```bash
npm run deploy:production
```

Or directly:
```bash
wrangler deploy --env production
```

### Cloudflare Pages (Frontend)

**Build Command**: 
```bash
cd apps/web && npm install && npm run build
```

**Build Output Directory**: 
```
apps/web/.next
```

**Root Directory**: 
```
apps/web
```

**Deploy Command**: 
```
(Automatic - Cloudflare Pages handles deployment)
```

## 🚀 Complete Setup Instructions

### Step 1: Backend Workers Setup

#### Option A: Using Cloudflare Dashboard

1. Go to **Workers & Pages** → **Create** → **Create Worker**
2. **Project Name**: `micropaywall`
3. **Build Command**: (Leave empty)
4. **Deploy Command**: (Leave empty)
5. Connect your GitHub repository
6. **Root Directory**: `apps/backend-workers`
7. **Entry Point**: `src/index.ts`

#### Option B: Using Wrangler CLI (Recommended)

```bash
cd apps/backend-workers

# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create micropaywall-db
# Copy the database_id and add to wrangler.toml

# Create KV namespace
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview
# Copy the IDs and add to wrangler.toml

# Create queues
wrangler queues create payment-verification
wrangler queues create webhooks

# Run database migration
npm run db:migrate

# Deploy
npm run deploy:production
```

### Step 2: Configure Custom Domain

After deploying, add custom domain:

```bash
# Add custom domain route
wrangler routes add api.micropaywall.app/* --zone-name micropaywall.app
```

Or in Cloudflare Dashboard:
1. Go to Workers → `micropaywall` → Settings → Triggers
2. Add Custom Domain: `api.micropaywall.app`
3. Cloudflare will automatically configure DNS

### Step 3: Frontend Pages Setup

1. Go to **Workers & Pages** → **Create** → **Create Application** → **Pages**
2. **Project Name**: `micropaywall-frontend`
3. Connect your GitHub repository
4. **Framework Preset**: `Next.js`
5. **Root Directory**: `apps/web`
6. **Build Command**: `cd apps/web && npm install && npm run build`
7. **Build Output Directory**: `apps/web/.next`
8. **Node Version**: `20`

### Step 4: Configure Frontend Domain

1. Go to Pages → `micropaywall-frontend` → Custom Domains
2. Add `micropaywall.app`
3. Cloudflare will configure DNS automatically
4. SSL certificate will be provisioned (2-5 minutes)

## 📝 Environment Variables

### Backend Workers (in Cloudflare Dashboard or wrangler.toml)

```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
FRONTEND_URL=https://micropaywall.app
CORS_ORIGIN=https://micropaywall.app,https://www.micropaywall.app
```

### Frontend Pages (in Cloudflare Dashboard)

```bash
NEXT_PUBLIC_API_URL=https://api.micropaywall.app
NEXT_PUBLIC_FRONTEND_URL=https://micropaywall.app
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## 🎯 Quick Reference

### Backend Workers
- **Project Name**: `micropaywall`
- **Build Command**: (Not needed)
- **Deploy Command**: `wrangler deploy --env production`
- **Domain**: `api.micropaywall.app`

### Frontend Pages
- **Project Name**: `micropaywall-frontend`
- **Build Command**: `cd apps/web && npm install && npm run build`
- **Build Output**: `apps/web/.next`
- **Root Directory**: `apps/web`
- **Domain**: `micropaywall.app`

## ✅ Verification

After deployment:

1. **Test Backend**: 
   ```bash
   curl https://api.micropaywall.app/api/health
   ```

2. **Test Frontend**: 
   Visit `https://micropaywall.app`

3. **Check SSL**: 
   Both domains should have automatic SSL certificates

## 🚨 Important Notes

1. **Workers don't need build**: Wrangler handles TypeScript compilation and bundling automatically
2. **Pages need build**: Next.js requires a build step before deployment
3. **Domain setup**: Add domains in Cloudflare Dashboard after initial deployment
4. **Environment variables**: Set in Cloudflare Dashboard → Workers/Pages → Settings → Variables

## 📚 Next Steps

1. ✅ Deploy Workers backend
2. ✅ Deploy Pages frontend
3. ✅ Configure custom domains
4. ✅ Set environment variables
5. ✅ Test everything
6. ✅ Continue migrating modules

