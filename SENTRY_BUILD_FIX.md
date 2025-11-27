# 🔧 Sentry Build Error Fix

## Problem

The build was failing with the following error when running `npm run pages:build`:

```
Error: Cannot find module 'next/constants'
Require stack:
- .../node_modules/@sentry/nextjs/build/cjs/common/utils/isBuild.js
```

## Root Cause

Sentry's `@sentry/nextjs` package tries to import `next/constants` immediately when it's imported in `next.config.mjs`. During the Cloudflare Pages build process, when `@cloudflare/next-on-pages` processes the Next.js config, Next.js modules aren't fully available yet, causing the module resolution to fail.

## Solution

Skip Sentry configuration entirely during Cloudflare Pages builds by:

1. **Setting an environment variable** (`SKIP_SENTRY=true`) in the GitHub Actions workflow
2. **Not importing Sentry** in `next.config.mjs` when this flag is set
3. **Exporting the base config** without Sentry wrapping for Cloudflare builds

## Changes Made

### 1. Updated `apps/web/next.config.mjs`

- Removed the top-level Sentry import
- Added a check for `SKIP_SENTRY` environment variable
- Skip Sentry wrapping when the flag is set

### 2. Updated `.github/workflows/deploy-pages.yml`

- Added `SKIP_SENTRY: 'true'` to the build environment variables

## Result

- ✅ Builds now complete successfully for Cloudflare Pages
- ✅ Sentry is disabled during Cloudflare builds (avoiding module errors)
- ✅ Sentry can still be used for local development or other deployment targets

## Notes

- Sentry configuration files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) remain in the codebase but won't be used during Cloudflare builds
- If you need Sentry for Cloudflare Pages in the future, you'll need to find an alternative approach that doesn't require importing Next.js modules during config evaluation
- Local development will continue to work with Sentry if `NEXT_PUBLIC_SENTRY_DSN` is set and `SKIP_SENTRY` is not set

---

**Fixed:** [Current Date]
**Status:** ✅ Ready to deploy

