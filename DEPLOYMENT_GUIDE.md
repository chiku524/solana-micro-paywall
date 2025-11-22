# Deployment Guide - Cloudflare & Alternatives

## 🔍 Cloudflare Compatibility Analysis

### Frontend (Next.js) - ✅ **Compatible with Cloudflare Pages**

**Status**: ✅ Can deploy to Cloudflare Pages

**Compatibility**:
- Cloudflare Pages supports Next.js 14
- SSR and ISR work with Cloudflare Functions
- Static generation works perfectly
- Edge rendering supported

**Considerations**:
- Some Next.js features may need Cloudflare Functions
- API routes need to be converted to Cloudflare Functions
- ISR works but with Cloudflare's edge caching

### Backend (NestJS) - ❌ **NOT Compatible with Cloudflare Workers**

**Status**: ❌ Requires full Node.js runtime

**Why Not Compatible**:
1. **Runtime**: Cloudflare Workers use V8 isolates, not full Node.js
2. **Database**: Prisma requires direct PostgreSQL connections (Workers can't do this)
3. **Redis**: ioredis needs direct Redis connections (Workers can't do this)
4. **BullMQ**: Requires Redis connection and long-running processes
5. **Dependencies**: Many NestJS dependencies require Node.js APIs
6. **File System**: No file system access in Workers
7. **Execution Time**: Workers have CPU time limits

**What Would Need to Change**:
- Replace Prisma with HTTP-based database access (Cloudflare D1 or HTTP API)
- Replace Redis with Cloudflare KV or Durable Objects
- Replace BullMQ with Cloudflare Queues
- Rewrite all NestJS code to work in Workers runtime
- Remove all Node.js-specific dependencies

## 🚀 Recommended Deployment Strategy

### Option 1: Hybrid Approach (Recommended) ⭐

**Frontend**: Cloudflare Pages  
**Backend**: Separate Node.js hosting

**Why This Works Best**:
- ✅ Frontend gets Cloudflare's global CDN
- ✅ Backend keeps all existing functionality
- ✅ No code changes needed
- ✅ Best performance and reliability

**Backend Hosting Options**:

1. **Railway** (Recommended)
   - ✅ Easy PostgreSQL integration
   - ✅ Redis support
   - ✅ Automatic deployments
   - ✅ Free tier available
   - ✅ Simple setup

2. **Render**
   - ✅ PostgreSQL included
   - ✅ Redis support
   - ✅ Free tier
   - ✅ Auto-deploy from Git

3. **Fly.io**
   - ✅ Global edge deployment
   - ✅ PostgreSQL support
   - ✅ Redis support
   - ✅ Great for global apps

4. **DigitalOcean App Platform**
   - ✅ Managed PostgreSQL
   - ✅ Redis support
   - ✅ Simple pricing

### Option 2: Full Cloudflare (Requires Refactoring)

If you want to use Cloudflare Workers, you'd need to:

1. **Replace Database Layer**:
   - Use Cloudflare D1 (SQLite) instead of PostgreSQL
   - Or use HTTP API to external PostgreSQL
   - Rewrite all Prisma queries

2. **Replace Redis**:
   - Use Cloudflare KV for caching
   - Use Cloudflare Durable Objects for state
   - Use Cloudflare Queues instead of BullMQ

3. **Refactor Backend**:
   - Convert NestJS to Cloudflare Workers format
   - Remove all Node.js dependencies
   - Rewrite to use Cloudflare APIs

**Effort**: 2-3 weeks of refactoring

### Option 3: Cloudflare for DNS/CDN Only

- Use Cloudflare for DNS and CDN
- Deploy both frontend and backend elsewhere
- Still get Cloudflare's benefits (DDoS protection, CDN, etc.)

## 📋 Step-by-Step Deployment (Option 1: Hybrid)

### Part 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Configure Backend Service**
   - Add service: "Deploy from GitHub"
   - Root directory: `apps/backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

4. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide `DATABASE_URL`

5. **Add Redis** (Optional but recommended)
   - Click "New" → "Database" → "Redis"
   - Railway will provide `REDIS_URL`

6. **Configure Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   JWT_SECRET=your-production-jwt-secret
   API_PORT=3000
   CORS_ORIGIN=https://your-domain.com
   EMAIL_ENABLED=true
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your-key
   EMAIL_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://your-domain.com
   ```

7. **Deploy**
   - Railway will auto-deploy on push
   - Get your backend URL: `https://your-app.railway.app`

### Part 2: Deploy Frontend to Cloudflare Pages

1. **Prepare for Deployment**
   ```bash
   # Update API URL in frontend
   # Create .env.production
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   ```

2. **Deploy to Cloudflare Pages**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect your GitHub repository
   - Configure:
     - **Framework preset**: Next.js
     - **Build command**: `cd apps/web && npm install && npm run build`
     - **Build output directory**: `apps/web/.next`
     - **Root directory**: `/apps/web`

3. **Environment Variables** (in Cloudflare Pages)
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com
   ```

4. **Custom Domain**
   - Add your domain in Cloudflare Pages
   - Update DNS records as instructed
   - SSL will be automatic

### Part 3: Configure Cloudflare DNS

1. **Add DNS Records**
   - A record for root domain → Cloudflare Pages IP
   - CNAME for www → Cloudflare Pages
   - CNAME for api → Railway backend (or use subdomain)

2. **Enable Cloudflare Features**
   - ✅ Always Use HTTPS
   - ✅ Auto Minify
   - ✅ Brotli Compression
   - ✅ DDoS Protection

## 🔧 Alternative: Full Railway Deployment

If you prefer everything in one place:

### Deploy Both to Railway

1. **Backend Service** (as above)

2. **Frontend Service**
   - Add new service
   - Root directory: `apps/web`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Port: 3001

3. **Configure Railway**
   - Use Railway's built-in domain
   - Or add custom domain
   - Configure environment variables

## 📝 Pre-Deployment Checklist

### Backend

- [ ] Run all database migrations
- [ ] Update Prisma client: `npm run db:generate`
- [ ] Set production environment variables
- [ ] Configure CORS for frontend domain
- [ ] Set up email service (SendGrid)
- [ ] Configure webhook URLs
- [ ] Test all endpoints

### Frontend

- [ ] Update API URL to production backend
- [ ] Set production Solana RPC endpoints
- [ ] Configure network toggle defaults
- [ ] Test all features
- [ ] Optimize images
- [ ] Check build output

### Database

- [ ] Run all migrations in production database
- [ ] Verify indexes are created
- [ ] Test database connections
- [ ] Set up backups

### Security

- [ ] Use strong JWT secrets
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable HTTPS everywhere
- [ ] Configure webhook secrets

## 🎯 Quick Start: Railway + Cloudflare Pages

### 1. Backend on Railway (5 minutes)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to Railway.app
# 3. New Project → Deploy from GitHub
# 4. Select your repo
# 5. Add PostgreSQL database
# 6. Add environment variables
# 7. Deploy!
```

### 2. Frontend on Cloudflare Pages (5 minutes)

```bash
# 1. Go to Cloudflare Dashboard → Pages
# 2. Create project → Connect GitHub
# 3. Configure:
#    - Framework: Next.js
#    - Root: /apps/web
#    - Build: cd apps/web && npm install && npm run build
# 4. Add environment variables
# 5. Deploy!
```

### 3. Connect Domain (2 minutes)

```bash
# 1. Add domain in Cloudflare Pages
# 2. Update DNS records
# 3. Wait for SSL (automatic)
# 4. Done!
```

## 💰 Cost Estimate

### Railway (Backend)
- **Free Tier**: $5/month credit
- **Hobby**: $5/month + usage
- **Pro**: $20/month + usage
- PostgreSQL: Included
- Redis: $5/month

### Cloudflare Pages (Frontend)
- **Free Tier**: Unlimited requests
- **Pro**: $20/month (if needed)
- **Bandwidth**: Included

### Total Estimated Cost
- **Minimum**: ~$10-15/month
- **Recommended**: ~$25-30/month

## 🚨 Important Notes

1. **Database Migrations**: Run all SQL migrations in production database before deploying
2. **Environment Variables**: Never commit `.env` files
3. **CORS**: Update CORS_ORIGIN to your production domain
4. **API URL**: Update NEXT_PUBLIC_API_URL in frontend
5. **SSL**: Both Railway and Cloudflare provide free SSL
6. **Monitoring**: Set up Sentry for error tracking
7. **Backups**: Configure database backups

## 🔄 Deployment Workflow

### Development
```bash
npm run dev  # Local development
```

### Staging
```bash
# Deploy to staging environment
# Test all features
```

### Production
```bash
# Merge to main branch
# Auto-deploy triggers
# Monitor deployment
# Verify functionality
```

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🎯 Recommendation

**Use Railway for Backend + Cloudflare Pages for Frontend**

This gives you:
- ✅ Best of both worlds
- ✅ No code changes needed
- ✅ Global CDN for frontend
- ✅ Reliable backend hosting
- ✅ Easy scaling
- ✅ Cost-effective

