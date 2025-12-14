# Workers + Pages Convergence Migration Instructions

## Overview

This migration combines the separate Cloudflare Pages and Workers projects into a single converged project. This will fix the `__NEXT_DATA__` injection issue and provide better control over HTML output.

## What Has Been Created

1. **Root `wrangler.toml`**: Unified configuration for the converged project
2. **`apps/web/functions/_middleware.ts`**: Worker middleware that injects `__NEXT_DATA__` into HTML responses
3. **`.github/workflows/deploy-converged.yml`**: New deployment workflow for the converged project

## Migration Steps

### Step 1: Remove Custom Domains (You're doing this)

Remove custom domains from the existing Cloudflare Pages project to avoid conflicts.

### Step 2: Delete Old Deployments (Optional but Recommended)

1. Go to Cloudflare Dashboard → Pages → micropaywall project
2. Delete old deployments to clean up
3. This is optional but helps keep things clean

### Step 3: Update GitHub Secrets (If Needed)

The new workflow uses the same secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOLANA_RPC`
- `NEXT_PUBLIC_SOLANA_RPC_MAINNET`
- `NEXT_PUBLIC_SOLANA_NETWORK`
- `NEXT_PUBLIC_WEB_URL`

### Step 4: Test the Build Locally (Optional)

```bash
cd apps/web
npm run build:converged
```

This will:
1. Build the Next.js app
2. Run `@cloudflare/next-on-pages` to generate functions
3. Create `.vercel/output` directory

### Step 5: Deploy

The new workflow (`.github/workflows/deploy-converged.yml`) will:
1. Build the Next.js app
2. Run `@cloudflare/next-on-pages`
3. Deploy to Cloudflare Pages with the middleware

### Step 6: Verify

After deployment, check:
1. `__NEXT_DATA__` script tag is present in HTML
2. Pages load correctly
3. Console logs show `[Middleware] Successfully injected __NEXT_DATA__` (if it was missing)

## How It Works

1. **Pages serves the HTML**: Next.js builds the app, `@cloudflare/next-on-pages` generates functions
2. **Middleware intercepts**: `functions/_middleware.ts` runs before Pages serves content
3. **HTML injection**: If `__NEXT_DATA__` is missing, the middleware injects it
4. **Response modified**: The modified HTML is returned with security headers

## Key Differences from Old Setup

- **Unified project**: Single `wrangler.toml` at root
- **Middleware injection**: `__NEXT_DATA__` is injected at the Worker level, not in React
- **Better control**: Can modify HTML before it's served
- **Security headers**: Added automatically

## Troubleshooting

### If `__NEXT_DATA__` is still missing:

1. Check that `functions/_middleware.ts` is in the correct location
2. Verify the middleware is running (check console logs)
3. Ensure the HTML response is being modified (check Network tab)

### If pages don't load:

1. Check Cloudflare Pages deployment logs
2. Verify the build output directory is correct
3. Check that `@cloudflare/next-on-pages` ran successfully

### If API routes don't work:

The API routes are still handled by the separate `apps/backend-workers` project. They should continue to work as before. If you want to integrate them into the converged project, that's a separate step.

## Next Steps After Migration

1. **Test thoroughly**: Verify all pages load correctly
2. **Monitor logs**: Check Cloudflare dashboard for any errors
3. **Remove old workflow**: Once confirmed working, you can disable `.github/workflows/deploy-pages.yml`
4. **Update documentation**: Update any deployment docs

## Rollback Plan

If something goes wrong:
1. Re-enable the old workflow (`.github/workflows/deploy-pages.yml`)
2. Re-add custom domains to the old Pages project
3. The old setup will continue to work

