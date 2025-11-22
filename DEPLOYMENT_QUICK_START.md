# Quick Deployment Guide

## 🚀 Recommended: Railway (Backend) + Cloudflare Pages (Frontend)

### Why This Setup?

- ✅ **Frontend**: Cloudflare Pages = Global CDN, fast, free
- ✅ **Backend**: Railway = Full Node.js support, PostgreSQL, Redis
- ✅ **No Code Changes**: Everything works as-is
- ✅ **Cost Effective**: ~$10-15/month

## Step 1: Deploy Backend to Railway (10 minutes)

### 1.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your repos

### 1.2 Deploy Backend
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `solana-micro-paywall` repository
4. Railway will detect it's a Node.js project

### 1.3 Configure Service
1. Click on the service
2. Go to **Settings** → **Root Directory**
3. Set to: `apps/backend`
4. Go to **Settings** → **Build Command**
5. Set to: `npm install && npm run build`
6. Go to **Settings** → **Start Command**
7. Set to: `npm start`

### 1.4 Add PostgreSQL Database
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatically provides `DATABASE_URL`
3. Copy the connection string

### 1.5 Add Redis (Optional but Recommended)
1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Railway provides `REDIS_URL`

### 1.6 Configure Environment Variables
Go to **Variables** tab and add:

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway auto-fills this
REDIS_URL=${{Redis.REDIS_URL}}  # If you added Redis
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
JWT_SECRET=generate-a-strong-secret-here-min-32-chars
API_PORT=3000
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com
```

### 1.7 Run Database Migrations
1. Go to Railway PostgreSQL database
2. Click **"Query"** tab
3. Run migrations in order:
   - `MERCHANT_PAYMENTS_ACCESS_SCHEMA_FIXED.sql`
   - `ENHANCEMENTS_MIGRATION.sql`
   - `MIGRATION_REFERRALS_APIKEYS.sql`

### 1.8 Deploy
1. Railway auto-deploys on push to main
2. Or click **"Deploy"** button
3. Wait for deployment
4. Copy your backend URL: `https://your-app.railway.app`

## Step 2: Deploy Frontend to Cloudflare Pages (10 minutes)

### 2.1 Prepare Repository
Make sure your code is pushed to GitHub.

### 2.2 Create Cloudflare Pages Project
1. Go to Cloudflare Dashboard → **Pages**
2. Click **"Create a project"**
3. Select **"Connect to Git"**
4. Choose your repository

### 2.3 Configure Build Settings
- **Framework preset**: `Next.js`
- **Build command**: `cd apps/web && npm install && npm run build`
- **Build output directory**: `apps/web/.next`
- **Root directory**: `/apps/web`

### 2.4 Add Environment Variables
Go to **Settings** → **Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com
```

### 2.5 Deploy
1. Click **"Save and Deploy"**
2. Cloudflare will build and deploy
3. Get your Pages URL: `https://your-project.pages.dev`

## Step 3: Connect Custom Domain (5 minutes)

### 3.1 Add Domain in Cloudflare Pages
1. Go to your Pages project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain: `yourdomain.com`
4. Follow DNS setup instructions

### 3.2 Update DNS Records
In your domain's DNS settings (or Cloudflare DNS):

```
Type  Name  Value                    TTL
A     @     Cloudflare Pages IP      Auto
CNAME www   your-project.pages.dev   Auto
CNAME api  your-backend.railway.app Auto  # Optional: API subdomain
```

### 3.3 SSL Certificate
- Cloudflare automatically provisions SSL
- Wait 2-5 minutes for certificate
- Enable "Always Use HTTPS" in Cloudflare

## Step 4: Update Backend CORS

After you have your domain:

1. Go to Railway → Your Backend Service → Variables
2. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   ```
3. Redeploy backend

## Step 5: Verify Deployment

### Test Backend
```bash
curl https://your-backend.railway.app/api/health
```

### Test Frontend
```bash
# Visit your domain
https://yourdomain.com
```

### Test API Docs
```bash
https://your-backend.railway.app/api/docs
```

## 🔧 Troubleshooting

### Backend Not Starting
- Check Railway logs
- Verify environment variables
- Check database connection
- Verify Prisma client is generated

### Frontend Build Failing
- Check Cloudflare Pages build logs
- Verify environment variables
- Check Next.js version compatibility
- Verify build command

### CORS Errors
- Update `CORS_ORIGIN` in backend
- Include both `https://domain.com` and `https://www.domain.com`
- Redeploy backend after changes

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check database is accessible
- Run migrations manually if needed

## 📊 Monitoring

### Railway
- View logs in Railway dashboard
- Set up alerts for errors
- Monitor resource usage

### Cloudflare
- View analytics in Pages dashboard
- Monitor bandwidth usage
- Check build logs

### Application
- Sentry for error tracking (already configured)
- Check API health endpoint
- Monitor database performance

## 🎯 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] API endpoints work
- [ ] Database migrations complete
- [ ] Environment variables set
- [ ] CORS configured
- [ ] SSL certificates active
- [ ] Custom domain working
- [ ] Email notifications working (if configured)
- [ ] Webhooks delivering (if configured)
- [ ] Analytics tracking
- [ ] Error monitoring active

## 💡 Pro Tips

1. **Use Railway's Preview Deployments**: Test before production
2. **Cloudflare Analytics**: Monitor frontend performance
3. **Database Backups**: Configure in Railway
4. **Environment Secrets**: Use Railway's secret management
5. **Custom Domains**: Use Cloudflare's DNS for faster setup

## 🚨 Important Notes

- **Never commit `.env` files**
- **Use strong secrets in production**
- **Enable database backups**
- **Monitor error logs regularly**
- **Set up alerts for critical failures**

## 📚 Next Steps

1. Set up monitoring (Sentry, etc.)
2. Configure backups
3. Set up staging environment
4. Configure CI/CD pipelines
5. Set up error alerts

Your app is now live! 🎉

