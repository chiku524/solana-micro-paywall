# 🔍 Direct Upload Project Troubleshooting Guide

## Understanding Your Setup

You're using **Direct Upload** deployment method (via GitHub Actions), which means:
- ✅ **No "Build & deployments" tab** - This is normal and expected
- ✅ Build happens in GitHub Actions, not Cloudflare
- ✅ Pre-built files are uploaded to Cloudflare Pages
- ✅ Cloudflare just serves the files you upload

## What You CAN Check in Cloudflare Dashboard

For Direct Upload projects, you can check:

### 1. **Deployments Tab** (Most Important)
1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **Pages** → **micropaywall**
3. Click: **Deployments** tab
4. Check the latest deployment:
   - **Status**: Should be "Active" (green)
   - **Deployment details**: Click on the deployment to see:
     - File count
     - Build logs (if any)
     - Any errors or warnings

### 2. **Settings Tab**
1. Click: **Settings** tab
2. Check:
   - **Project name**: Should be `micropaywall`
   - **Production branch**: Should be `main` (or whatever branch you deploy from)
   - **Custom domains**: Verify `micropaywall.app` is listed and active

### 3. **Custom Domains Tab**
1. Click: **Custom domains** tab
2. Verify:
   - `micropaywall.app` is listed
   - Status is "Active"
   - SSL certificate is valid

## The Real Issue: Deployment Structure

Since you're using Direct Upload, the problem is likely in **what's being deployed**, not Cloudflare settings.

### What to Check in GitHub Actions Logs

Go to your GitHub repository → **Actions** tab → Latest "Deploy to Cloudflare Pages" run

Look for these steps:

1. **"Verify build output structure"** step:
   - Should show: `✅ Found functions directory (needed for routing)`
   - Should show: `✅ Found catch-all route handler ([[path]])`
   - Should show: `✅ Found index.html`

2. **"Verify critical files for routing"** step:
   - Should show: `✅ Found index.html`
   - Should show: `✅ Found functions directory`
   - Should show: `✅ Found catch-all route handler`

3. **"List deployment structure before deploy"** step:
   - Shows what files are actually being deployed
   - Check if `functions/` directory is listed
   - Check if `static/index.html` exists

### Expected Deployment Structure

The deployment should include:
```
.vercel/output/
├── static/
│   ├── index.html          ← REQUIRED for homepage
│   ├── _next/
│   └── ...
├── functions/
│   ├── [[path]].js         ← REQUIRED for routing
│   └── ...
└── config.json             ← REQUIRED for configuration
```

## Common Issues and Fixes

### Issue 1: Functions Directory Missing

**Symptoms:**
- 404 on all routes (including homepage sometimes)
- GitHub Actions shows: `❌ ERROR: functions directory not found!`

**Fix:**
- Check if `@cloudflare/next-on-pages` is running correctly
- Verify the build step completes without errors
- Check package.json has the correct build script

### Issue 2: Index.html Missing

**Symptoms:**
- 404 on homepage
- Other routes might work (if functions are present)

**Fix:**
- Verify Next.js build completes successfully
- Check if `static/index.html` is generated
- Ensure no build errors in the "Build Next.js app" step

### Issue 3: Wrong Project Name

**Symptoms:**
- Deployment succeeds but site doesn't update
- Old content still showing

**Fix:**
- Verify project name in workflow matches Cloudflare project name
- Check: `.github/workflows/deploy-pages.yml` → `projectName: micropaywall`
- Verify in Cloudflare dashboard that project name is `micropaywall`

## Diagnostic Steps

### Step 1: Check Latest Deployment in Cloudflare

1. Go to Cloudflare Dashboard → Pages → micropaywall → **Deployments**
2. Click on the latest deployment
3. Check:
   - **Status**: Active?
   - **File count**: How many files?
   - **Deployment logs**: Any errors?

### Step 2: Check GitHub Actions Logs

1. Go to GitHub → Actions → Latest "Deploy to Cloudflare Pages" run
2. Expand "Verify build output structure" step
3. Look for:
   - ✅ or ❌ indicators
   - File counts
   - Directory listings

### Step 3: Test Pages Subdomain

```bash
curl -I https://micropaywall.pages.dev
```

- If this works → Custom domain issue
- If this also 404s → Deployment structure issue

### Step 4: Check Deployment Files

In GitHub Actions logs, look at "List deployment structure before deploy" step:
- Should show `functions/` directory
- Should show `static/` directory
- Should show `config.json`

## What to Share for Further Diagnosis

If the issue persists, please share:

1. **GitHub Actions logs** from the latest deployment:
   - Output from "Verify build output structure"
   - Output from "Verify critical files for routing"
   - Output from "List deployment structure before deploy"

2. **Cloudflare Dashboard**:
   - Screenshot of Deployments tab showing latest deployment
   - File count from the deployment details

3. **Test results**:
   - Response from `curl -I https://micropaywall.pages.dev`
   - Response from `curl -I https://micropaywall.app`

## Next Steps

1. **Check the latest GitHub Actions deployment logs** - This will show exactly what's being deployed
2. **Verify the deployment structure** - Make sure functions directory is included
3. **Test the Pages subdomain** - This helps isolate if it's a domain or deployment issue
4. **Share the logs** - If still not working, the logs will show what's missing

---

**Key Point:** With Direct Upload, all configuration is in your GitHub Actions workflow. Cloudflare just serves what you upload. The issue is almost certainly in what's being deployed, not Cloudflare settings.

