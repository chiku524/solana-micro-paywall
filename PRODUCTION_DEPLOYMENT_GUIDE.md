# Production Deployment Guide

## Current Architecture

You have **3 separate applications** that work together:

1. **Backend API** (NestJS) - Port 3000
2. **Dashboard** (Next.js) - Port 3001 - For Merchants
3. **Marketplace** (Next.js) - Port 3002 - For Buyers

---

## ✅ Is This Architecture Good for Production?

**YES!** This is actually a **great architecture** for production. Here's why:

### Advantages:
1. ✅ **Independent Scaling** - Scale marketplace (high traffic) separately from dashboard
2. ✅ **Independent Deployment** - Update one app without affecting others
3. ✅ **Security Isolation** - Dashboard (admin) separate from marketplace (public)
4. ✅ **Team Separation** - Different teams can work on each app
5. ✅ **Different Caching** - Optimize each app independently

### Production Deployment Options:

---

## Option 1: Separate Deployments (Recommended) ⭐

### Backend API
**Platforms**: Railway, Render, AWS, DigitalOcean

**Deploy to**: `api.yourdomain.com` or `backend.yourdomain.com`

**Environment Variables**:
```env
DATABASE_URL=your_production_db_url
REDIS_URL=your_production_redis_url
SOLANA_RPC_ENDPOINT=your_production_rpc
JWT_SECRET=your_production_secret
```

### Dashboard (Next.js)
**Platform**: Vercel (Recommended)

**Deploy to**: `dashboard.yourdomain.com`

**Environment Variables**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MARKETPLACE_URL=https://marketplace.yourdomain.com
NEXT_PUBLIC_SOLANA_RPC=your_production_rpc
```

### Marketplace (Next.js)
**Platform**: Vercel (Recommended)

**Deploy to**: `marketplace.yourdomain.com` or `yourdomain.com`

**Environment Variables**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
NEXT_PUBLIC_SOLANA_RPC=your_production_rpc
```

**Pros:**
- ✅ Easy to set up (Vercel auto-detects Next.js)
- ✅ Automatic deployments from Git
- ✅ Built-in CDN
- ✅ Free tier available
- ✅ Independent scaling

---

## Option 2: Single Domain with Reverse Proxy

**Use Nginx/Traefik to route:**

```
yourdomain.com/api/*         → Backend (Port 3000)
yourdomain.com/dashboard/*   → Dashboard (Port 3001)
yourdomain.com/*             → Marketplace (Port 3002)
```

**Pros:**
- ✅ Single domain
- ✅ Easier SSL management
- ✅ Unified navigation

**Cons:**
- ⚠️ More complex setup
- ⚠️ Need reverse proxy server
- ⚠️ Routing configuration

---

## Option 3: Vercel Monorepo (Easiest)

**Deploy both Next.js apps from monorepo:**

1. Connect GitHub repo to Vercel
2. Configure:
   - `apps/dashboard` → `dashboard.yourdomain.com`
   - `apps/marketplace` → `marketplace.yourdomain.com`
3. Set environment variables
4. Deploy!

**Backend**: Deploy separately to Railway/Render

**Pros:**
- ✅ Very easy
- ✅ Automatic deployments
- ✅ Built-in CDN
- ✅ Free tier

---

## Navigation Between Apps

### ✅ Already Implemented!

I've added navigation links:

**Marketplace → Dashboard:**
- "For Merchants" link in header
- Points to dashboard URL

**Dashboard → Marketplace:**
- "View Marketplace" link in navbar
- Points to marketplace URL

**Configuration:**
- Uses `NEXT_PUBLIC_DASHBOARD_URL` and `NEXT_PUBLIC_MARKETPLACE_URL`
- Falls back to localhost for development
- Update for production URLs

---

## Production Checklist

### 1. Environment Variables

**Backend (.env)**:
```env
NODE_ENV=production
DATABASE_URL=your_production_db
REDIS_URL=your_production_redis
SOLANA_RPC_ENDPOINT=your_production_rpc
JWT_SECRET=your_secure_secret
WEBHOOK_SECRET=your_webhook_secret
```

**Dashboard (.env.local)**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MARKETPLACE_URL=https://marketplace.yourdomain.com
NEXT_PUBLIC_SOLANA_RPC=your_production_rpc
```

**Marketplace (.env.local)**:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
NEXT_PUBLIC_SOLANA_RPC=your_production_rpc
```

### 2. CORS Configuration

**Backend** (`apps/backend/src/main.ts`):
```typescript
app.enableCors({
  origin: [
    'https://dashboard.yourdomain.com',
    'https://marketplace.yourdomain.com',
  ],
  credentials: true,
});
```

### 3. SSL Certificates

- ✅ Vercel: Automatic SSL
- ✅ Railway/Render: Automatic SSL
- ✅ Custom domains: Use Let's Encrypt or Cloudflare

### 4. Database

- ✅ Supabase: Already configured
- ✅ Use production database URL
- ✅ Enable connection pooling

### 5. Redis

- ✅ Upstash: Already configured
- ✅ Use production Redis URL
- ✅ Monitor usage (free tier limits)

---

## Deployment Steps

### Step 1: Deploy Backend

**Railway** (Recommended):
1. Connect GitHub repo
2. Select `apps/backend` directory
3. Set environment variables
4. Deploy!

**Or Render**:
1. New Web Service
2. Connect repo
3. Root directory: `apps/backend`
4. Build: `npm install && npm run build`
5. Start: `npm run start:prod`

### Step 2: Deploy Dashboard

**Vercel**:
1. Import GitHub repo
2. Root directory: `apps/dashboard`
3. Framework: Next.js (auto-detected)
4. Set environment variables
5. Deploy!

### Step 3: Deploy Marketplace

**Vercel**:
1. Import GitHub repo (or add to existing project)
2. Root directory: `apps/marketplace`
3. Framework: Next.js (auto-detected)
4. Set environment variables
5. Deploy!

### Step 4: Configure Domains

1. Add custom domains in Vercel
2. Update DNS records
3. SSL certificates auto-configured

---

## Recommended Production Setup

### URLs:
```
api.yourdomain.com          → Backend API
dashboard.yourdomain.com     → Dashboard
marketplace.yourdomain.com   → Marketplace
```

### Or:
```
yourdomain.com/api/*         → Backend API
yourdomain.com/dashboard/*   → Dashboard
yourdomain.com/*             → Marketplace
```

---

## Navigation in Production

The navigation links I added will automatically work:

**Marketplace**:
- "For Merchants" → `https://dashboard.yourdomain.com`

**Dashboard**:
- "View Marketplace" → `https://marketplace.yourdomain.com`

Just update the environment variables with your production URLs!

---

## Summary

### ✅ Current Architecture is Production-Ready!

**Separate apps = Better for production:**
- Independent scaling
- Independent deployment
- Better security
- Easier maintenance

**Navigation:**
- ✅ Already implemented
- ✅ Uses environment variables
- ✅ Works in development and production

**Deployment:**
- Backend → Railway/Render
- Dashboard → Vercel
- Marketplace → Vercel
- Update environment variables
- Done! 🚀

---

## Next Steps

1. ✅ **Navigation is already added** - Test it locally!
2. **For Production:**
   - Deploy backend to Railway/Render
   - Deploy dashboard to Vercel
   - Deploy marketplace to Vercel
   - Update environment variables with production URLs
   - Configure custom domains

**Your architecture is solid for production!** 🎉

