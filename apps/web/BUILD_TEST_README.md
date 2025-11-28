# 🧪 Build Testing Guide

## Overview

This guide explains how to test your Cloudflare Pages build locally before pushing to GitHub. This helps catch build errors early and avoids failed deployments.

## Quick Start

Run the build test script:

```bash
cd apps/web
npm run test:build
```

Or from the project root:

```bash
cd apps/web && npm run test:build
```

## What the Script Does

The `test:build` script:

1. ✅ Installs dependencies if needed
2. ✅ Sets environment variables (matching GitHub Actions)
3. ✅ Runs the full Cloudflare Pages build process
4. ✅ Verifies the output structure
5. ✅ Reports build success or failure

## When to Run

Run the build test before:
- 🚀 Pushing to main branch
- 🔄 Creating a pull request
- 📦 Making changes to dependencies
- 🔧 Updating Next.js configuration
- 📝 Modifying build scripts

## Expected Output

On success, you'll see:
```
✅ Build successful!
📁 Build output location: .vercel/output
📂 Verifying output structure...
  ✅ Static directory found
  ✅ Functions directory found
✨ All checks passed! Ready to deploy.
```

On failure, you'll see error messages that need to be fixed before pushing.

## Troubleshooting

### Build Fails with Module Not Found Errors

If you see errors about missing Node.js modules (like `crypto`, `stream`), check:
- That problematic wallet adapters are excluded (see `next.config.mjs`)
- That webpack fallbacks are configured correctly

### Build Succeeds But Output Missing

If the build completes but `.vercel/output` is missing:
- Check for errors in the build output
- Verify `@cloudflare/next-on-pages` ran successfully
- Look for warnings about missing dependencies

## Manual Testing

If you want to run individual steps:

```bash
# Just build Next.js
npm run build

# Build for Cloudflare Pages
npm run pages:build

# Test deployment (requires wrangler configured)
npm run pages:deploy
```

## GitHub Actions Integration

The build test runs automatically in GitHub Actions, but testing locally first:
- ⚡ Faster feedback (no waiting for CI)
- 💰 Saves CI/CD minutes
- 🐛 Easier debugging (full error output)

---

**Remember:** Always test locally before pushing to avoid breaking deployments!

