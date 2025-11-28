# 🔍 404 Troubleshooting Guide for micropaywall.app

## Current Issue

The site deploys successfully but shows 404 when accessing `micropaywall.app`.

## Most Likely Cause: Custom Domain Not Connected

Based on the deployment logs showing successful builds, the most likely issue is that the **custom domain is not properly connected** to the Pages project in Cloudflare dashboard.

## Immediate Action Items

### Step 1: Verify Custom Domain Connection ⚠️ CRITICAL

**Check in Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **Pages** → **micropaywall**
3. Click the **"Custom domains"** tab
4. Check if `micropaywall.app` is listed

**If domain is NOT listed:**
- Click **"Set up a custom domain"**
- Enter: `micropaywall.app`
- Click **"Continue"**
- Wait 5-15 minutes for SSL certificate provisioning

**If domain IS listed but shows "Pending" or error:**
- Check the error message
- Verify DNS records are correct
- Wait a few minutes for SSL provisioning

### Step 2: Test Pages Subdomain First

Before testing the custom domain, verify the Pages deployment works:

```bash
curl -I https://micropaywall.pages.dev
```

- ✅ **If this works** → Custom domain connection issue
- ❌ **If this also 404s** → Deployment/routing issue

### Step 3: Check Deployment Status

In Cloudflare Dashboard:
1. Go to **Workers & Pages** → **Pages** → **micropaywall**
2. Click **"Deployments"** tab
3. Verify the latest deployment shows:
   - Status: **Active** (green checkmark)
   - Build: **Success**
   - No error messages

### Step 4: Verify Build Output Structure

Check the GitHub Actions logs for the deployment step:
- Look for: **"Verify build output structure"** step
- Should show:
  - ✅ Found static directory
  - ✅ Found functions directory (needed for routing)

If functions directory is missing, that's the issue!

## Diagnostic Checklist

Run through this checklist:

- [ ] Custom domain `micropaywall.app` is listed in Pages project
- [ ] Custom domain shows "Active" status (not "Pending")
- [ ] `https://micropaywall.pages.dev` works (Pages subdomain)
- [ ] Latest deployment shows "Active" status
- [ ] Build logs show both `static/` and `functions/` directories
- [ ] DNS record exists: `micropaywall.app` → `micropaywall.pages.dev`
- [ ] DNS record is proxied (orange cloud icon)

## Quick Tests

### Test 1: DNS Resolution
```bash
dig micropaywall.app +short
# Should return a CNAME or A record
```

### Test 2: Pages Subdomain
```bash
curl -I https://micropaywall.pages.dev
# Should return 200 OK if deployment works
```

### Test 3: Custom Domain
```bash
curl -I https://micropaywall.app
# Check status code:
# - 200 = Working
# - 404 = Domain not connected or routing issue
# - 403 = Domain connected but SSL/routing issue
```

### Test 4: Check Response Headers
```bash
curl -v https://micropaywall.app 2>&1 | head -20
```

Look for:
- `cf-ray` header → Cloudflare is serving the request
- `x-served-by` or similar → Should show Pages

## Common Issues & Solutions

### Issue 1: Domain Not Connected
**Symptom:** 404 on custom domain, but Pages subdomain works

**Solution:**
1. Connect custom domain in Cloudflare dashboard
2. Wait for SSL certificate provisioning (5-15 min)

### Issue 2: DNS Not Pointing to Pages
**Symptom:** Domain resolves but doesn't reach Pages

**Solution:**
1. Check DNS records in Cloudflare
2. Ensure CNAME points to `micropaywall.pages.dev`
3. Ensure DNS is proxied (orange cloud)

### Issue 3: Functions Directory Missing
**Symptom:** Build succeeds but routing doesn't work

**Solution:**
- Check GitHub Actions build logs
- Verify `functions/` directory exists in `.vercel/output`
- Re-run deployment if missing

### Issue 4: Routing Configuration Missing
**Symptom:** Homepage works but routes 404

**Solution:**
- `@cloudflare/next-on-pages` should handle this automatically
- Verify build includes `functions/[[path]].js` (catch-all route)
- Check deployment includes entire `.vercel/output` directory

## Expected vs Actual

### Expected Behavior ✅
- `https://micropaywall.pages.dev` → Works
- `https://micropaywall.app` → Works (same content)
- Both serve the Next.js app correctly

### Current Behavior ❌
- `https://micropaywall.app` → 404

This indicates: **Custom domain likely not connected** or **DNS misconfiguration**

## Next Steps

1. **IMMEDIATE:** Check custom domain in Cloudflare dashboard
2. Test Pages subdomain to isolate the issue
3. Verify deployment status and build logs
4. Check DNS configuration

## Dashboard Links

- **Pages Project:** https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/pages/view/micropaywall
- **Custom Domains:** https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/pages/view/micropaywall/domains
- **Deployments:** https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/pages/view/micropaywall/deployments
- **DNS Records:** https://dash.cloudflare.com/10374f367672f4d19db430601db0926b/dns/records?zone=micropaywall.app

---

**Most likely fix:** Connect the custom domain in Cloudflare Pages dashboard!

