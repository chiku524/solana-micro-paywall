# Cleanup and Migration Guide

## Quick Start

This guide will help you:
1. Clean up old Cloudflare Pages and Workers projects
2. Set up the new converged Workers + Pages project
3. Test the migration step by step

## Prerequisites

Before running the cleanup scripts, make sure you have:

1. **Removed custom domains** from the old Pages project (you mentioned you're doing this)
2. **Cloudflare API credentials**:
   - `CLOUDFLARE_API_TOKEN`: Get from [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID`: Get from [Cloudflare Dashboard → Right sidebar](https://dash.cloudflare.com/)

## Step 1: Run Cleanup Script

### Option A: TypeScript Version (Recommended)

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

# Run the cleanup script
npx ts-node scripts/cleanup-cloudflare-projects.ts
```

### Option B: Shell Version

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

# Run the cleanup script
bash scripts/cleanup-cloudflare-projects.sh
```

### What the Script Does

1. ✅ Deletes all deployments from old Pages project (`micropaywall`)
2. ✅ Deletes the old Pages project
3. ✅ Deletes the old Worker project (`micropaywall-api`)
4. ✅ Prepares for the converged project (will be created on first deployment)

## Step 2: Verify Cleanup

After running the script, verify in Cloudflare Dashboard:

1. Go to [Workers & Pages](https://dash.cloudflare.com/pages)
2. Confirm old `micropaywall` Pages project is deleted
3. Go to [Workers](https://dash.cloudflare.com/workers)
4. Confirm old `micropaywall-api` Worker is deleted

## Step 3: Deploy Converged Project

The converged project will be created automatically on the first deployment. To trigger it:

1. **Push to main branch** (if you haven't already):
   ```bash
   git push origin main
   ```

2. **Or manually trigger the workflow**:
   - Go to GitHub → Actions → "Deploy Converged Workers + Pages"
   - Click "Run workflow"

## Step 4: Verify Deployment

After deployment completes:

1. **Check Cloudflare Dashboard**:
   - Go to [Workers & Pages](https://dash.cloudflare.com/pages)
   - You should see a new `micropaywall` project
   - Check that deployment succeeded

2. **Test the Website**:
   - Visit `https://micropaywall.app` (or your custom domain)
   - Open browser DevTools → Console
   - Check for `[Middleware] Successfully injected __NEXT_DATA__` log
   - Verify pages load correctly

3. **Check HTML Source**:
   - View page source (Ctrl+U or Cmd+U)
   - Search for `__NEXT_DATA__`
   - Should find: `<script id="__NEXT_DATA__" type="application/json" data-nextjs-data="">`

## Step 5: Test Step by Step

### Test 1: Landing Page
- ✅ Should load normally (this was already working)
- ✅ Check console for `__NEXT_DATA__` presence

### Test 2: Dashboard Page
- ✅ Navigate to `/dashboard`
- ✅ Should see dashboard content (not just background)
- ✅ Check console for:
  - `[Middleware] Successfully injected __NEXT_DATA__` (if it was missing)
  - `[DashboardPage] Server component rendering`
  - `[DashboardPageClient] Client component rendering`
  - `[Dashboard] Component mounting`

### Test 3: Other Pages
- ✅ Test `/marketplace`
- ✅ Test `/docs`
- ✅ All should load content correctly

## Troubleshooting

### Script Fails with "Missing environment variables"
- Make sure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set
- Check they're correct in Cloudflare dashboard

### Script Fails with "Rate limit exceeded"
- Wait a few minutes and try again
- The script includes delays, but Cloudflare has rate limits

### Deployment Fails
- Check GitHub Actions logs
- Verify `wrangler.toml` is correct
- Check that `functions/_middleware.ts` is in the right location

### Pages Still Don't Load
- Check browser console for errors
- Verify `__NEXT_DATA__` is in HTML source
- Check Cloudflare Pages deployment logs
- Verify middleware is running (check for logs)

## Rollback Plan

If something goes wrong:

1. **Re-enable old workflow**:
   - Rename `.github/workflows/deploy-pages.yml.disabled` to `.github/workflows/deploy-pages.yml`
   - Or create a new workflow based on the old one

2. **Recreate old projects**:
   - Create new Pages project in Cloudflare dashboard
   - Create new Worker project
   - Re-add custom domains

3. **Redeploy**:
   - Push to trigger old workflow
   - Old setup will work as before

## Next Steps After Successful Migration

1. ✅ Remove old workflow file (`.github/workflows/deploy-pages.yml`)
2. ✅ Update documentation
3. ✅ Remove cleanup scripts (optional, keep for reference)
4. ✅ Celebrate! 🎉

## Support

If you encounter issues:
1. Check the logs (browser console, Cloudflare dashboard, GitHub Actions)
2. Review `MIGRATION_INSTRUCTIONS.md` for detailed technical info
3. Check `ROOT_CAUSE_ANALYSIS.md` for background on the issue

