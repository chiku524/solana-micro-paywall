# 🔧 Cloudflare Pages 404 Fix

## Problem

The website was showing a 404 error after Cloudflare configuration because the deployment was only including static files without the routing functions needed for Next.js.

## Root Cause

When using `@cloudflare/next-on-pages`, the build process generates output in `.vercel/output` which contains:
- `static/` - Static files (HTML, CSS, JS, images)
- `functions/` - Edge functions for server-side rendering and routing

The previous configuration was deploying only `.vercel/output/static`, which meant:
- ❌ Static files were deployed
- ❌ Routing functions were missing
- ❌ Next.js routing couldn't work → **All routes returned 404**

## Fixes Applied

### 1. Updated Deployment Directory
**File:** `.github/workflows/deploy-pages.yml`

Changed the deployment directory from:
```yaml
directory: apps/web/.vercel/output/static  # ❌ Only static files
```

To:
```yaml
directory: apps/web/.vercel/output  # ✅ Includes both static and functions
```

### 2. Updated Wrangler Configuration
**File:** `apps/web/wrangler.toml`

Changed the output directory from:
```toml
pages_build_output_dir = ".next"  # ❌ Wrong directory
```

To:
```toml
pages_build_output_dir = ".vercel/output"  # ✅ Correct output directory
```

### 3. Updated Package.json Script
**File:** `apps/web/package.json`

Updated the deploy script to use the correct directory:
```json
"pages:deploy": "npm run pages:build && wrangler pages deploy .vercel/output --project-name=micropaywall"
```

### 4. Added Build Verification
**File:** `.github/workflows/deploy-pages.yml`

Added a verification step to check that both `static` and `functions` directories exist after the build, which will help catch this issue early if it happens again.

## How It Works Now

1. **Build Process:**
   ```
   npm run pages:build
   ├── next build          # Creates .next directory
   └── @cloudflare/next-on-pages   # Converts to .vercel/output
       ├── static/         # Static assets
       └── functions/      # Edge functions for routing
   ```

2. **Deployment:**
   - Deploys entire `.vercel/output` directory
   - Cloudflare Pages automatically detects both static and functions
   - Routing works correctly ✅

## Testing

After deployment, verify:
1. ✅ Homepage loads: `https://micropaywall.app`
2. ✅ Routes work: Try `/dashboard`, `/marketplace`, etc.
3. ✅ No 404 errors on navigation

## Next Steps

1. **Commit and push** these changes:
   ```bash
   git add .
   git commit -m "Fix Cloudflare Pages 404 - deploy entire .vercel/output directory"
   git push origin main
   ```

2. **Monitor the deployment** in GitHub Actions

3. **Verify the fix** by visiting your site after deployment completes

## Technical Details

### Why `.vercel/output` instead of `.vercel/output/static`?

Cloudflare Pages needs to see the complete Next.js output structure:
- The `static/` directory contains pre-rendered static files
- The `functions/` directory contains edge runtime functions that:
  - Handle server-side rendering (SSR)
  - Handle dynamic routes
  - Process API routes
  - Handle middleware

When only `static/` is deployed, Cloudflare Pages treats it as a static site with no routing logic, causing all routes except the homepage to 404.

### Build Output Structure

After `@cloudflare/next-on-pages` runs:
```
.vercel/output/
├── static/              # Static files (HTML, CSS, JS, images)
│   ├── _next/
│   ├── index.html
│   └── ...
├── functions/           # Edge functions
│   ├── [[path]].js     # Catch-all route handler
│   └── ...
└── config.json         # Configuration
```

Both directories must be present for Next.js routing to work on Cloudflare Pages.

---

**Fixed:** [Current Date]
**Status:** ✅ Ready to deploy

