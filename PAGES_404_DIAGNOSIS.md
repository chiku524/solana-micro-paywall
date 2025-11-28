# 🔍 Cloudflare Pages 404 Diagnosis Guide

## Issue

The site is deployed successfully but still shows 404 when accessing `micropaywall.app`.

## Possible Causes

### 1. Custom Domain Not Connected to Pages Project

**Check:**
- Go to: https://dash.cloudflare.com
- Navigate to: **Workers & Pages** → **Pages** → **micropaywall** → **Custom domains** tab
- Verify `micropaywall.app` is listed and shows **Active** status

**Fix:**
- If domain is not listed, click **"Set up a custom domain"**
- Enter: `micropaywall.app`
- Wait for SSL certificate provisioning (5-15 minutes)

### 2. DNS Configuration Issue

**Check DNS records:**
- Go to: https://dash.cloudflare.com → **DNS** → **Records**
- Verify there's a CNAME record:
  - **Name**: `@` or `micropaywall.app`
  - **Target**: `micropaywall.pages.dev`
  - **Proxy status**: Proxied (orange cloud)

**Test DNS:**
```bash
dig micropaywall.app
# Should show CNAME to micropaywall.pages.dev
```

### 3. Test Pages Subdomain

First, test if the Pages deployment works on the default subdomain:

```bash
curl -I https://micropaywall.pages.dev
```

- If this works but `micropaywall.app` doesn't → **Domain connection issue**
- If this also 404s → **Deployment issue**

### 4. Deployment Verification

Check the deployment logs in GitHub Actions:
1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Open the latest **"Deploy to Cloudflare Pages"** workflow run
4. Check if deployment was successful
5. Verify the output shows both `static` and `functions` directories

### 5. Routing Configuration

For Next.js on Cloudflare Pages with `@cloudflare/next-on-pages`, routing should be automatic. However, verify:

- The build output contains `.vercel/output/functions/` directory
- There's a catch-all route handler like `[[path]].js` in the functions directory

## Diagnostic Commands

### Run the Diagnostic Script

```bash
bash scripts/diagnose-404.sh
```

This will check:
- DNS resolution
- HTTP response codes
- Response headers
- Compare Pages subdomain vs custom domain

### Manual Checks

```bash
# Test custom domain
curl -I https://micropaywall.app

# Test Pages subdomain
curl -I https://micropaywall.pages.dev

# Check DNS
dig micropaywall.app +short
```

## Quick Fixes

### Fix 1: Verify Domain Connection

1. Open Cloudflare Dashboard
2. Go to: **Workers & Pages** → **Pages** → **micropaywall**
3. Click **"Custom domains"** tab
4. If `micropaywall.app` is not listed:
   - Click **"Set up a custom domain"**
   - Enter: `micropaywall.app`
   - Click **"Continue"**
   - Wait 5-15 minutes for SSL

### Fix 2: Check Deployment Status

1. In Cloudflare Dashboard: **Workers & Pages** → **Pages** → **micropaywall**
2. Check the **Deployments** tab
3. Verify the latest deployment is **Active**
4. Check if there are any build errors

### Fix 3: Verify Build Output

Check that the deployment includes:
- `static/` directory (static files)
- `functions/` directory (edge functions for routing)

This should be verified by the GitHub Actions workflow output.

## Expected Behavior

After proper configuration:
- ✅ `https://micropaywall.pages.dev` → Should work (default subdomain)
- ✅ `https://micropaywall.app` → Should work (custom domain)
- ✅ `https://micropaywall.app/dashboard` → Should route correctly
- ✅ `https://micropaywall.app/marketplace` → Should route correctly

## Next Steps

1. **Run diagnostic script**: `bash scripts/diagnose-404.sh`
2. **Check Cloudflare dashboard** for domain connection status
3. **Verify deployment** in GitHub Actions logs
4. **Test Pages subdomain** to isolate the issue

---

**Last Updated:** [Current Date]

