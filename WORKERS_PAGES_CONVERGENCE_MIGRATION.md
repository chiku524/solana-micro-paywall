# Workers + Pages Convergence Migration Plan

## Overview

This migration combines the separate Cloudflare Pages and Workers projects into a single converged project. This will:
- Fix the `__NEXT_DATA__` injection issue
- Provide unified routing
- Better control over HTML output
- Resolve RSC streaming issues

## Current Structure

- **Backend Workers**: `apps/backend-workers/` - API routes
- **Web App**: `apps/web/` - Next.js app deployed to Pages

## New Converged Structure

- **Root `wrangler.toml`**: Unified configuration
- **Worker Entry Point**: `functions/_middleware.ts` - Handles routing and HTML injection
- **Pages Output**: `apps/web/.vercel/output` - Next.js build output
- **API Routes**: Integrated into the same Worker

## Migration Steps

1. ✅ Create unified `wrangler.toml` at root
2. ✅ Create Worker middleware for HTML injection
3. ✅ Update Next.js config for convergence
4. ✅ Update deployment workflow
5. ⏳ Test and deploy

## Benefits

- **Unified Routing**: Single routing layer
- **HTML Control**: Can inject `__NEXT_DATA__` properly
- **Better Debugging**: Unified logging
- **Performance**: Shared resources (D1, KV)

