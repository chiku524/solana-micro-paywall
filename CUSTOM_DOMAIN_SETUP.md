# 🌐 Custom Domain Configuration Guide

Your deployments are successful! Now let's configure custom domains.

## ✅ Current Status

- ✅ **Workers deployed**: `micropaywall-api-production`
- ✅ **Pages deployed**: `micropaywall`
- ✅ **Account ID**: `10374f367672f4d19db430601db0926b`
- ⚠️ **Domain setup needed**: `micropaywall.app`

## 🎯 Quick Links

### Workers Dashboard
https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/workers/services/view/micropaywall-api-production

### Pages Dashboard
https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/pages/view/micropaywall

### DNS Management
https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/dns/records

---

## 📋 Step-by-Step Configuration

### Step 1: Add Domain to Cloudflare (if not already added)

If `micropaywall.app` is not in your Cloudflare account:

1. Go to: https://dash.cloudflare.com/add-site
2. Enter: `micropaywall.app`
3. Choose **Free** plan (or any plan)
4. Follow the DNS setup instructions
5. Update your domain's nameservers at your registrar to point to Cloudflare's nameservers

**To find your nameservers:**
- After adding the domain, Cloudflare will show you the nameservers
- Copy them and update at your domain registrar

---

### Step 2: Configure Workers Custom Domain

**API Endpoint**: `api.micropaywall.app`

#### Via Dashboard:

1. **Open Workers Settings**:
   - Go to: https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/workers/services/view/micropaywall-api-production/settings/triggers
   - Or: Workers & Pages → `micropaywall-api-production` → Settings → Triggers

2. **Add Custom Domain**:
   - Scroll to **"Custom Domains"** section
   - Click **"Add Custom Domain"** button
   - Enter: `api.micropaywall.app`
   - Click **"Add Custom Domain"**

3. **Wait for Configuration**:
   - Cloudflare will automatically:
     - Create DNS records
     - Provision SSL certificate (5-15 minutes)
     - Activate the domain

4. **Verify**:
   ```bash
   curl https://api.micropaywall.app/health
   ```

---

### Step 3: Configure Pages Custom Domain

**Frontend**: `micropaywall.app`

#### Via Dashboard:

1. **Open Pages Project**:
   - Go to: https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/pages/view/micropaywall/domains
   - Or: Workers & Pages → Pages → `micropaywall` → Custom domains tab

2. **Add Custom Domain**:
   - Click **"Set up a custom domain"** button
   - Enter: `micropaywall.app`
   - Click **"Continue"**

3. **Select DNS Configuration**:
   - Choose **"Let Cloudflare manage DNS"** (recommended)
   - Or manually configure DNS records

4. **Wait for Configuration**:
   - Cloudflare will automatically:
     - Create/verify DNS records
     - Provision SSL certificate (5-15 minutes)
     - Activate the domain

5. **Verify**:
   ```bash
   curl -I https://micropaywall.app
   ```

---

## 🔍 Verification Commands

After configuration, test your endpoints:

```bash
# Test API health endpoint
curl https://api.micropaywall.app/health

# Test API with full response
curl -v https://api.micropaywall.app/health

# Test frontend
curl -I https://micropaywall.app

# Check SSL certificate
openssl s_client -connect api.micropaywall.app:443 -servername api.micropaywall.app < /dev/null
```

Expected API response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production"
}
```

---

## ⏱️ Timeline

- **DNS Propagation**: 1-5 minutes (usually instant if domain already in Cloudflare)
- **SSL Certificate**: 5-15 minutes (automatic)
- **Total Setup Time**: ~15-20 minutes

---

## 🐛 Troubleshooting

### Domain not found in Cloudflare
- **Solution**: Add the domain via https://dash.cloudflare.com/add-site
- Ensure nameservers are updated at your registrar

### SSL Certificate pending
- **Wait**: SSL certificates take 5-15 minutes to provision
- **Check**: SSL/TLS settings in Cloudflare dashboard
- **Verify**: DNS records are correct

### Custom domain not working
1. Verify DNS records:
   - Go to: https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/dns/records
   - Check that records exist for `api` and `@` (root domain)

2. Check SSL/TLS mode:
   - Should be set to **"Full"** or **"Full (strict)"**
   - Go to: SSL/TLS → Overview

3. Verify deployments:
   ```bash
   cd apps/backend-workers
   npx wrangler deployments list --env production
   npx wrangler pages project list
   ```

### 502/503 Errors
- Wait for DNS propagation
- Check that Workers/Pages deployments are active
- Verify custom domains are enabled in dashboard

---

## 📝 Quick Reference

### Domain Targets

- **API**: `api.micropaywall.app` → Workers (`micropaywall-api-production`)
- **Frontend**: `micropaywall.app` → Pages (`micropaywall`)
- **WWW**: `www.micropaywall.app` → Pages (optional, can be configured)

### Environment Variables

Make sure these are set correctly:

**Workers** (already in `wrangler.toml`):
- `FRONTEND_URL`: `https://micropaywall.app`
- `CORS_ORIGIN`: `https://micropaywall.app,https://www.micropaywall.app`

**Pages** (set in Pages dashboard):
- `NEXT_PUBLIC_API_URL`: `https://api.micropaywall.app`
- `NEXT_PUBLIC_WEB_URL`: `https://micropaywall.app`

---

## ✅ Checklist

- [ ] Domain `micropaywall.app` added to Cloudflare
- [ ] Nameservers updated at domain registrar
- [ ] Workers custom domain `api.micropaywall.app` configured
- [ ] Pages custom domain `micropaywall.app` configured
- [ ] SSL certificates provisioned (wait 5-15 minutes)
- [ ] API endpoint tested: `curl https://api.micropaywall.app/health`
- [ ] Frontend tested: Visit `https://micropaywall.app`

---

## 🚀 Next Steps

After domains are configured:

1. Update frontend environment variables in Pages dashboard if needed
2. Test the full application flow
3. Configure `www.micropaywall.app` if desired (optional)
4. Set up monitoring and alerts
5. Configure Cloudflare security settings (WAF, rate limiting, etc.)

---

**Need help?** Check the logs:
- Workers logs: `npx wrangler tail --env production`
- Pages logs: Available in Pages dashboard

