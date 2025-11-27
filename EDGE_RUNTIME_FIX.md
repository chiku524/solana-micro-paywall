# 🔧 Edge Runtime Configuration Fix

## Problem

The build was failing with the following error when running `npm run pages:build`:

```
ERROR: Failed to produce a Cloudflare Pages build from the project.

The following routes were not configured to run with the Edge Runtime:
  - /marketplace/content/[merchantId]/[slug]
  - /marketplace/merchant/[merchantId]

Please make sure that all your non-static routes export the following edge runtime route segment config:
  export const runtime = 'edge';
```

## Root Cause

Cloudflare Pages uses the Edge Runtime for all server-side rendered routes. Dynamic routes that use server components need to explicitly declare they use the Edge Runtime. Without this configuration, `@cloudflare/next-on-pages` cannot properly convert them for Cloudflare's edge environment.

## Solution

Added `export const runtime = 'edge';` to both dynamic route files to explicitly declare they should run on Cloudflare's Edge Runtime.

## Changes Made

### 1. Updated `/marketplace/content/[merchantId]/[slug]/page.tsx`

Added edge runtime export:
```typescript
export const runtime = 'edge'; // Required for Cloudflare Pages
export const revalidate = 60; // ISR: Revalidate every 60 seconds
```

### 2. Updated `/marketplace/merchant/[merchantId]/page.tsx`

Added edge runtime export:
```typescript
export const runtime = 'edge'; // Required for Cloudflare Pages
export const revalidate = 60; // ISR: Revalidate every 60 seconds
```

## Result

- ✅ Both dynamic routes are now configured for Edge Runtime
- ✅ Build process should complete successfully
- ✅ Routes will run on Cloudflare's Edge Network

## Technical Details

### Edge Runtime vs Node.js Runtime

- **Edge Runtime**: 
  - Runs on Cloudflare's edge network
  - Faster, globally distributed
  - Limited API surface (no Node.js APIs like `fs`, `crypto`, etc.)
  - Uses Web APIs (fetch, Request, Response, etc.)

- **Node.js Runtime**: 
  - Runs on server instances
  - Full Node.js API access
  - Better for CPU-intensive tasks

### Why Edge Runtime is Required

Cloudflare Pages only supports Edge Runtime for server-side rendering. All dynamic routes that use:
- Server components
- `async` page components
- Server-side data fetching

Must use Edge Runtime to work on Cloudflare Pages.

### Compatible APIs in Edge Runtime

The routes use these APIs which are compatible with Edge Runtime:
- ✅ `fetch()` - Available in Edge Runtime
- ✅ `notFound()` - Next.js API, works in Edge Runtime
- ✅ `revalidate` - Next.js ISR, works in Edge Runtime
- ✅ Server components - Fully supported

## Notes

- Static routes (marked with ○) don't need edge runtime configuration
- Only dynamic routes (marked with ƒ) that use server components need this
- The `revalidate` option still works with Edge Runtime for ISR (Incremental Static Regeneration)

---

**Fixed:** [Current Date]
**Status:** ✅ Ready to deploy

