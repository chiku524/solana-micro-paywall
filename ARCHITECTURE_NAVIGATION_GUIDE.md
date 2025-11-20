# Architecture & Navigation Guide

## Current Architecture

You have **3 separate applications**:

1. **Backend API** (Port 3000) - NestJS REST API
2. **Dashboard** (Port 3001) - Next.js app for **Merchants**
3. **Marketplace** (Port 3002) - Next.js app for **Buyers/Public**

---

## Why Separate Apps?

### ✅ **Advantages** (Current Approach)

1. **Different User Bases**
   - Dashboard: Merchants (authenticated, admin tools)
   - Marketplace: Buyers (public, consumer-facing)

2. **Independent Deployment**
   - Deploy dashboard and marketplace separately
   - Update one without affecting the other
   - Different release cycles

3. **Scalability**
   - Scale marketplace (high traffic) independently
   - Scale dashboard (lower traffic) separately
   - Different caching strategies

4. **Security Isolation**
   - Dashboard has admin/merchant features
   - Marketplace is public-facing
   - Different authentication requirements

5. **Code Organization**
   - Clear separation of concerns
   - Easier to maintain
   - Different teams can work on each

### ⚠️ **Challenges**

1. **Navigation Between Apps**
   - Currently no built-in navigation
   - Users need to manually switch URLs
   - No shared navigation/header

2. **Shared Components**
   - Some UI components might be duplicated
   - Shared styling/theming needs coordination

3. **Production Deployment**
   - Need to deploy 2 separate Next.js apps
   - Need to configure routing/proxying
   - More complex infrastructure

---

## Navigation Options

### Option 1: Add Navigation Links (Recommended) ⭐

**Add links in both apps to navigate between them:**

#### In Dashboard (Port 3001):
- Add "View Marketplace" link in header/navbar
- Links to `http://localhost:3002` (or production marketplace URL)

#### In Marketplace (Port 3002):
- Add "Merchant Dashboard" link (for authenticated merchants)
- Links to `http://localhost:3001` (or production dashboard URL)

**Pros:**
- ✅ Simple to implement
- ✅ Maintains separation
- ✅ Works in production
- ✅ No architectural changes

**Cons:**
- ⚠️ Full page navigation (not seamless)
- ⚠️ Need to manage URLs in environment variables

---

### Option 2: Unified Single App (Alternative)

**Combine both into one Next.js app with routes:**

```
/app/dashboard/*     → Merchant dashboard
/app/marketplace/*   → Public marketplace
/app/*               → Landing page
```

**Pros:**
- ✅ Single deployment
- ✅ Shared navigation
- ✅ Seamless navigation
- ✅ Shared components/theming

**Cons:**
- ⚠️ Requires refactoring
- ⚠️ Larger bundle size
- ⚠️ More complex routing
- ⚠️ Can't scale independently

---

### Option 3: Subdomain Routing (Production)

**Use subdomains in production:**

```
dashboard.yourdomain.com  → Dashboard app
marketplace.yourdomain.com → Marketplace app
api.yourdomain.com         → Backend API
```

**Pros:**
- ✅ Clean URLs
- ✅ Independent scaling
- ✅ Separate deployments
- ✅ Better for CDN/caching

**Cons:**
- ⚠️ Requires DNS configuration
- ⚠️ SSL certificates for each subdomain

---

## Production Deployment Strategies

### Strategy 1: Separate Deployments (Current Architecture) ⭐

**Recommended for your use case**

#### Setup:
- **Backend**: Deploy to Railway, Render, or AWS
- **Dashboard**: Deploy to Vercel (or similar)
- **Marketplace**: Deploy to Vercel (or similar)

#### Configuration:
```env
# Dashboard .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MARKETPLACE_URL=https://marketplace.yourdomain.com

# Marketplace .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
```

#### Pros:
- ✅ Independent scaling
- ✅ Separate deployments
- ✅ Different caching strategies
- ✅ Easy to maintain

#### Cons:
- ⚠️ Need to manage 3 deployments
- ⚠️ Need to configure CORS properly

---

### Strategy 2: Reverse Proxy (Single Domain)

**Use Nginx/Traefik to route to different apps:**

```
yourdomain.com/dashboard/*  → Dashboard app (Port 3001)
yourdomain.com/marketplace/* → Marketplace app (Port 3002)
yourdomain.com/api/*         → Backend API (Port 3000)
```

#### Nginx Configuration Example:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:3000;
    }

    location /dashboard {
        proxy_pass http://localhost:3001;
    }

    location /marketplace {
        proxy_pass http://localhost:3002;
    }
}
```

#### Pros:
- ✅ Single domain
- ✅ Easier SSL management
- ✅ Unified navigation possible

#### Cons:
- ⚠️ More complex setup
- ⚠️ Need reverse proxy server
- ⚠️ Routing configuration needed

---

### Strategy 3: Vercel Monorepo (Easiest)

**Deploy both Next.js apps from monorepo:**

Vercel automatically detects and deploys:
- `apps/dashboard` → `dashboard.yourdomain.com`
- `apps/marketplace` → `marketplace.yourdomain.com`

#### Setup:
1. Connect GitHub repo to Vercel
2. Configure root directory for each app
3. Set environment variables
4. Deploy!

#### Pros:
- ✅ Very easy setup
- ✅ Automatic deployments
- ✅ Built-in CDN
- ✅ Free tier available

#### Cons:
- ⚠️ Backend needs separate deployment
- ⚠️ Need to configure API URLs

---

## Recommended Approach

### For Development (Current):
✅ **Keep separate apps** - Works great for development

### For Production:
✅ **Option 1: Separate Deployments with Navigation Links**

1. **Deploy Backend** to Railway/Render/AWS
2. **Deploy Dashboard** to Vercel
3. **Deploy Marketplace** to Vercel
4. **Add navigation links** between apps
5. **Use environment variables** for URLs

---

## Implementation: Add Navigation

I can help you add navigation links between the apps. Here's what we'd do:

### Dashboard → Marketplace Link
Add to dashboard navbar:
```tsx
<a href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3002'}>
  View Marketplace
</a>
```

### Marketplace → Dashboard Link
Add to marketplace header (for merchants):
```tsx
{isMerchant && (
  <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001'}>
    Merchant Dashboard
  </a>
)}
```

---

## Production Checklist

- [ ] Set up environment variables for URLs
- [ ] Configure CORS on backend
- [ ] Deploy backend API
- [ ] Deploy dashboard app
- [ ] Deploy marketplace app
- [ ] Add navigation links
- [ ] Configure SSL certificates
- [ ] Set up monitoring
- [ ] Configure CDN (optional)

---

## Summary

**Current Architecture**: ✅ **Good for your use case**

- Separate apps = Better separation of concerns
- Independent deployment = Better scalability
- Different user bases = Makes sense to separate

**What to Add**:
- Navigation links between apps
- Environment variables for URLs
- Proper CORS configuration

**Production**: 
- Deploy separately (Vercel for frontends, Railway/Render for backend)
- Use subdomains or separate domains
- Add navigation links

Would you like me to:
1. Add navigation links between the apps?
2. Set up environment variables for production URLs?
3. Create a unified single app instead?

Let me know your preference! 🚀

