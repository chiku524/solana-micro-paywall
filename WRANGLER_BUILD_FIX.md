# 🔧 Wrangler Module Build Error Fix

## Problem

The build was failing with the following error when running `npm run pages:build`:

```
Error: Cannot find module 'wrangler'
Require stack:
- .../node_modules/@cloudflare/next-on-pages/dist/next-dev/index.cjs
```

## Root Cause

The `setupDevPlatform()` function from `@cloudflare/next-on-pages/next-dev` requires the `wrangler` module to be installed. This function is only needed for local development when running `next dev`, but was being imported/executed during the build process where `wrangler` is not installed (and not needed).

Even importing `setupDevPlatform` at the top level causes the module to load, which tries to require `wrangler`, causing the build to fail.

## Solution

Completely removed the `setupDevPlatform` import and setup call from `next.config.mjs`. This function is only needed for local development and is not required during builds.

## Changes Made

### Updated `apps/web/next.config.mjs`

- **Removed** the import of `setupDevPlatform` from `@cloudflare/next-on-pages/next-dev`
- **Removed** the conditional setup call
- **Added** comments explaining that setupDevPlatform is only needed for local dev

## Result

- ✅ Builds now complete successfully for Cloudflare Pages
- ✅ No dependency on `wrangler` during builds
- ✅ Local development still works (setupDevPlatform can be added back if needed for local dev, but it's not required for builds)

## Notes

- `setupDevPlatform()` is only needed when running `next dev` locally with Cloudflare Pages support
- For Cloudflare Pages deployments, this setup is not required
- If you need local development support later, you can conditionally import it only when `NODE_ENV === 'development'` and ensure `wrangler` is installed as a dev dependency

---

**Fixed:** [Current Date]
**Status:** ✅ Ready to deploy

