# Root Cause Analysis: Missing __NEXT_DATA__ on Cloudflare Pages

## Problem Summary

**Symptom**: Dashboard and other pages (except landing page) show only animated background, no content loads.

**Root Cause**: `__NEXT_DATA__` script tag is missing from HTML output for edge runtime pages.

## Technical Details

### What is __NEXT_DATA__?

`__NEXT_DATA__` is a critical script tag that Next.js injects into HTML pages. It contains:
- Page routing information
- Initial props and server-side data
- Build ID and other metadata
- Route configuration

Without it, Next.js cannot:
- Initialize the router
- Hydrate React Server Components (RSC)
- Process RSC streaming payloads

### Why Landing Page Works

The landing page (`/`) is **statically generated**:
- No `export const dynamic = 'force-dynamic'`
- No `export const runtime = 'edge'`
- Next.js pre-renders it at build time
- Static pages don't require `__NEXT_DATA__` in the same way

### Why Other Pages Fail

Dashboard, marketplace, and docs pages are **dynamic with edge runtime**:
- `export const dynamic = 'force-dynamic'` (forces dynamic rendering)
- `export const runtime = 'edge'` (required by Cloudflare Pages)
- Next.js tries to stream RSC payload
- But `__NEXT_DATA__` is not injected by `@cloudflare/next-on-pages`

### Evidence from Logs

1. **RSC Streaming Markers Present**: `<!--$--><!--/$-->`
   - Indicates Next.js is trying to stream server components
   - But without `__NEXT_DATA__`, client can't process the stream

2. **Children Prop Exists**: `Children: {$$typeof: Symbol(react.transitional.element)...}`
   - React element is being passed correctly
   - But container is empty: `Container HTML: <!--$--><!--/$-->`

3. **Missing __NEXT_DATA__**: `[LayoutDebugger] CRITICAL: __NEXT_DATA__ not found!`
   - Next.js cannot initialize without it
   - RSC stream cannot be hydrated

## Why @cloudflare/next-on-pages Fails

`@cloudflare/next-on-pages` has limitations with Next.js App Router:
1. **Deprecated**: The package itself is deprecated and recommends OpenNext adapter
2. **RSC Streaming**: Doesn't properly handle React Server Components streaming
3. **__NEXT_DATA__ Injection**: Doesn't inject `__NEXT_DATA__` for edge runtime pages
4. **Edge Runtime**: Limited support for Next.js App Router features on edge

## Solutions

### 1. Temporary Workaround (Current)

**NextDataInjector Component**:
- Injects minimal `__NEXT_DATA__` if missing
- Allows Next.js to at least initialize
- May not fully fix RSC hydration, but helps

**Status**: ✅ Implemented

### 2. Workers + Pages Convergence (Recommended)

**Benefits**:
- Unified routing and HTML handling
- Can inject/modify HTML at the edge
- Better control over `__NEXT_DATA__` injection
- More predictable behavior

**Status**: ⏳ Pending (recommended next step)

### 3. Migrate to OpenNext Adapter

**Benefits**:
- Official replacement for `@cloudflare/next-on-pages`
- Better Next.js App Router support
- Proper `__NEXT_DATA__` handling

**Status**: ⏳ Not started (alternative to convergence)

## Next Steps

1. **Test NextDataInjector workaround**:
   - Deploy and check if `__NEXT_DATA__` is created
   - Verify if pages start rendering
   - Check console for initialization logs

2. **If workaround doesn't fully fix**:
   - Proceed with Workers + Pages convergence migration
   - This will give us proper control over HTML output
   - Can ensure `__NEXT_DATA__` is always present

3. **Long-term**:
   - Consider migrating to OpenNext adapter
   - Or wait for better Next.js App Router support on Cloudflare

## Conclusion

The root cause is a fundamental incompatibility between `@cloudflare/next-on-pages` and Next.js App Router's RSC streaming for edge runtime pages. The workaround may help, but the proper solution is migrating to Workers + Pages convergence or OpenNext adapter.

