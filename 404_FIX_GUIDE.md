# 🔧 Cloudflare Pages 404 Fix Guide

## Problem

The website `micropaywall.app` returns a 404 error even though:
- ✅ GitHub Actions shows successful deployment
- ✅ Cloudflare Pages shows active deployment
- ✅ Domain is configured correctly

## Root Cause Analysis

When deploying Next.js to Cloudflare Pages using `@cloudflare/next-on-pages`, the build generates:
- `.vercel/output/static/` - Static files (HTML, CSS, JS)
- `.vercel/output/functions/` - Edge functions for routing

**The 404 error typically occurs when:**
1. The functions directory is not being deployed correctly
2. Cloudflare Pages project is configured with wrong build output directory
3. The catch-all route handler is missing or not recognized

## Solution Steps

### Step 1: Verify Build Output Structure

Check the latest GitHub Actions deployment logs for the "Verify build output structure" step. You should see:
- ✅ Found .vercel/output directory
- ✅ Found static directory
- ✅ Found functions directory (needed for routing)
- ✅ Found catch-all route handler ([[path]])

If any of these are missing, the build is incomplete.

### Step 2: Check Cloudflare Pages Dashboard

**Note:** Since you're using Direct Upload (GitHub Actions), there is **NO "Build & deployments" tab**. This is normal and expected.

Instead, check:

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **Pages** → **micropaywall**
3. Click **Deployments** tab:
   - Check latest deployment status (should be "Active")
   - Click on the deployment to see file count and any errors
4. Click **Settings** tab:
   - Verify project name is `micropaywall`
   - Check production branch is `main`
5. Click **Custom domains** tab:
   - Verify `micropaywall.app` is listed and active

### Step 3: Verify Deployment Structure

After deployment, check the deployment logs in Cloudflare Pages dashboard:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the build logs for any errors
4. Verify the deployment shows:
   - Static files count
   - Functions count

### Step 4: Test the Deployment

1. **Test Pages subdomain:**
   ```bash
   curl -I https://micropaywall.pages.dev
   ```
   - If this works → Custom domain routing issue
   - If this also 404s → Deployment structure issue

2. **Test custom domain:**
   ```bash
   curl -I https://micropaywall.app
   ```

### Step 5: Common Fixes

#### Fix 1: Re-deploy with Correct Structure

The deployment workflow has been updated to:
- ✅ Verify functions directory exists
- ✅ Verify index.html exists
- ✅ Verify catch-all route handler exists
- ✅ Show detailed structure before deployment

Simply push a new commit or manually trigger the workflow.

#### Fix 2: Check Cloudflare Pages Project Settings

If the project was created in the dashboard:
1. Go to **Settings** → **Builds & deployments**
2. Ensure **Build command** is empty
3. Ensure **Build output directory** is empty
4. The project should be in "GitHub Actions" deployment mode

#### Fix 3: Verify Functions Directory

The functions directory should contain:
- `[[path]].js` or `[[path]]/` directory (catch-all route handler)
- Other route-specific functions

If missing, the `@cloudflare/next-on-pages` build might have failed silently.

## Verification Checklist

After deployment, verify:

- [ ] GitHub Actions deployment completed successfully
- [ ] Build logs show functions directory exists
- [ ] Build logs show catch-all route handler exists
- [ ] Cloudflare Pages dashboard shows active deployment
- [ ] Pages subdomain (`micropaywall.pages.dev`) works
- [ ] Custom domain (`micropaywall.app`) works
- [ ] Homepage loads correctly
- [ ] Navigation to other routes works

## Expected Build Output Structure

```
.vercel/output/
├── static/              # Static files
│   ├── index.html      # Homepage (REQUIRED)
│   ├── _next/          # Next.js assets
│   └── ...
├── functions/          # Edge functions (REQUIRED)
│   ├── [[path]].js     # Catch-all route handler (REQUIRED)
│   └── ...
└── config.json         # Configuration (REQUIRED)
```

## If Still Not Working

1. **Check deployment logs** in Cloudflare Pages dashboard for errors
2. **Verify domain DNS** is pointing to Cloudflare Pages
3. **Check SSL certificate** status in Cloudflare dashboard
4. **Try accessing** `https://micropaywall.pages.dev` directly
5. **Clear browser cache** and try again
6. **Check Cloudflare Workers** - ensure no conflicting routes

## Next Steps

1. Push the updated workflow to trigger a new deployment
2. Monitor the GitHub Actions logs for the verification steps
3. Check Cloudflare Pages dashboard for the new deployment
4. Test both subdomain and custom domain
5. If still 404, check the Cloudflare Pages project settings

---

**Last Updated:** Based on latest deployment workflow improvements
**Status:** Ready to test with updated verification steps

