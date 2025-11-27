# 🌐 Domain Configuration Guide

This guide will help you configure custom domains for your Cloudflare Workers and Pages deployments.

## Prerequisites

1. ✅ Domain registered: `micropaywall.app`
2. ✅ Workers deployed: `micropaywall-api`
3. ✅ Pages deployed: `micropaywall`
4. ⚠️ Cloudflare API Token with required permissions

## Step 1: Add Domain to Cloudflare

If your domain is not already in Cloudflare:

### Via Dashboard (Recommended)
1. Go to: https://dash.cloudflare.com/
2. Click **"Add a Site"** or **"Add Site"**
3. Enter: `micropaywall.app`
4. Choose a plan (Free plan works fine)
5. Follow the DNS setup instructions
6. Update your domain's nameservers at your domain registrar

### Via CLI (if domain is managed elsewhere)
You'll need to add it via the dashboard first. Cloudflare requires DNS management for custom domains.

## Step 2: Configure Workers Custom Domain (api.micropaywall.app)

### Option A: Via Dashboard
1. Go to: https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages** → **micropaywall-api**
3. Click **Settings** → **Triggers**
4. Scroll to **"Custom Domains"**
5. Click **"Add Custom Domain"**
6. Enter: `api.micropaywall.app`
7. Click **"Add Custom Domain"**
8. Cloudflare will automatically configure DNS and SSL

### Option B: Via API (Automated)
Use the script provided: `scripts/setup-custom-domains.sh`

## Step 3: Configure Pages Custom Domain (micropaywall.app)

### Via Dashboard
1. Go to: https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages** → **Pages** → **micropaywall**
3. Click **"Custom domains"** tab
4. Click **"Set up a custom domain"**
5. Enter: `micropaywall.app`
6. Click **"Continue"**
7. Cloudflare will automatically configure DNS and SSL

### Via CLI
Unfortunately, Pages custom domains cannot be configured via CLI. Use the dashboard method above.

## Step 4: Verify Configuration

After configuring, verify everything works:

```bash
# Test API endpoint
curl https://api.micropaywall.app/health

# Test Frontend
curl -I https://micropaywall.app
```

## Expected DNS Records

Cloudflare will automatically create these records:

### For Workers API (api.micropaywall.app):
- **Type**: CNAME or AAAA
- **Name**: `api`
- **Target**: Automatically set by Cloudflare

### For Pages (micropaywall.app):
- **Type**: CNAME
- **Name**: `@` or `micropaywall.app`
- **Target**: `micropaywall.pages.dev`

## Troubleshooting

### Domain not showing in Cloudflare
- Ensure you've added the domain to Cloudflare
- Verify nameservers are correctly configured
- Wait 5-10 minutes for DNS propagation

### SSL Certificate Issues
- Cloudflare automatically provisions SSL certificates
- Wait 5-15 minutes for certificate issuance
- Check SSL/TLS settings in Cloudflare dashboard

### Custom Domain Not Working
- Verify DNS records are correct
- Check SSL certificate status
- Ensure the domain is active in Cloudflare
- Verify Workers/Pages deployments are successful

## Quick Reference

### Dashboard URLs
- **Workers**: https://dash.cloudflare.com/[account-id]/workers/services/view/micropaywall-api
- **Pages**: https://dash.cloudflare.com/[account-id]/pages/view/micropaywall
- **DNS**: https://dash.cloudflare.com/[account-id]/dns/records?zone=micropaywall.app

### Test Endpoints
- **API Health**: `https://api.micropaywall.app/health`
- **Frontend**: `https://micropaywall.app`
- **Workers Dev URL**: Check in Workers dashboard
- **Pages Dev URL**: `https://micropaywall.pages.dev`

