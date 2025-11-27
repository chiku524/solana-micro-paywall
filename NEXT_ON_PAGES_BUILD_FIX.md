# 🔧 @cloudflare/next-on-pages Command Not Found Fix

## Problem

The build was failing with the following error when running `npm run pages:build`:

```
sh: 1: @cloudflare/next-on-pages: not found
npm error Lifecycle script `pages:build` failed with error
```

## Root Cause

The `@cloudflare/next-on-pages` command was being invoked directly without `npx`. When a package is installed as a dev dependency, its binary isn't automatically available in the PATH. It needs to be run via `npx` (which looks in `node_modules/.bin`) or by using the full path to the binary.

## Solution

Updated the build scripts to use `npx` to run `@cloudflare/next-on-pages`. The `npx` command automatically resolves binaries from `node_modules/.bin` and installed packages.

## Changes Made

### Updated `apps/web/package.json`

Changed the build scripts from:
```json
"pages:build": "next build && @cloudflare/next-on-pages"
"build:cloudflare": "next build && @cloudflare/next-on-pages"
```

To:
```json
"pages:build": "next build && npx @cloudflare/next-on-pages"
"build:cloudflare": "next build && npx @cloudflare/next-on-pages"
```

## Result

- ✅ The `@cloudflare/next-on-pages` command will now be found and executed correctly
- ✅ Build process should complete successfully
- ✅ Output will be generated in `.vercel/output` directory as expected

## Technical Details

### Why `npx`?

- `npx` is a package runner that comes with npm
- It automatically looks for binaries in:
  - `node_modules/.bin/` (local packages)
  - Globally installed packages
  - Downloads and runs packages if not found
- It's the recommended way to run package binaries in npm scripts

### Alternative Solutions

If `npx` doesn't work in your environment, you could also:
1. Use the full path: `node_modules/.bin/@cloudflare/next-on-pages`
2. Install the package globally (not recommended)
3. Use `npm exec @cloudflare/next-on-pages` (similar to npx)

---

**Fixed:** [Current Date]
**Status:** ✅ Ready to deploy

