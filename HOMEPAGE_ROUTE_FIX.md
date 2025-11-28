# 🔧 Homepage Route Handler Fix

## Problem Identified

The verification step confirmed the root cause of the 404 error:

### Broken Homepage Route Handler ❌

```
index.func → bookmarks.rsc.func  (WRONG!)
```

**What this means:**
- When someone visits `https://micropaywall.app/`, Cloudflare Pages tries to use the function route handler
- The function route handler (`index.func`) is incorrectly pointing to `bookmarks.rsc.func`
- This causes Cloudflare to try to serve the bookmarks page instead of the homepage
- Result: **404 error** because the route doesn't match

### Why This Happened

The `@cloudflare/next-on-pages` build process incorrectly generated the symlink. This is likely a bug in how it processes client-side rendered pages that are pre-rendered.

## Solution Implemented

Added a **post-build fix step** in the GitHub Actions workflow that:

1. **Detects the broken symlink:**
   - Checks if `index.func` is a symlink pointing to the wrong target

2. **Fixes it:**
   - If `index.rsc.func` exists → Fixes the symlink to point to it
   - If `index.rsc.func` doesn't exist → Removes the broken symlink
   - Since `index.html` exists in `static/`, Cloudflare will serve it directly

3. **Also fixes `dashboard.func`:**
   - Same issue exists with `dashboard.func` pointing to `bookmarks.rsc.func`
   - Applies the same fix

## Expected Behavior After Fix

### Before Fix:
```
https://micropaywall.app/ 
  → Cloudflare tries to use index.func
  → index.func points to bookmarks.rsc.func
  → Route mismatch → 404 error
```

### After Fix:
```
https://micropaywall.app/
  → If index.rsc.func exists: Uses correct function handler
  → If index.rsc.func doesn't exist: Serves static index.html
  → Homepage loads correctly ✅
```

## Files Modified

- `.github/workflows/deploy-pages.yml`
  - Added "Fix broken homepage route handler" step
  - Runs after verification, before deployment
  - Automatically fixes the broken symlink

## Testing

After the next deployment:

1. **Check the fix step output:**
   - Should show: `✅ Fixed: index.func now points to index.rsc.func`
   - Or: `✅ Removed broken symlink` (if index.rsc.func doesn't exist)

2. **Test the homepage:**
   - Visit: `https://micropaywall.app`
   - Should load the homepage correctly (no 404)

3. **Test other routes:**
   - `/dashboard` should work
   - `/marketplace` should work
   - Other routes should work

## Technical Details

### Why This Works

1. **Static file fallback:**
   - Since `index.html` exists in `.vercel/output/static/`
   - Cloudflare Pages will serve it if no function route handler exists
   - This is the correct behavior for pre-rendered client components

2. **Function route priority:**
   - If a function route handler exists, Cloudflare uses it
   - If it's broken (wrong symlink), it fails
   - Removing the broken symlink allows the static file to be served

3. **Symlink structure:**
   - `.func` files are symlinks to `.rsc.func` directories
   - The `.rsc.func` directory contains the actual route handler
   - If the symlink points to the wrong directory, routing breaks

## Next Steps

1. **Deploy the fix:**
   - Push the updated workflow
   - Wait for deployment to complete

2. **Verify the fix:**
   - Check the "Fix broken homepage route handler" step output
   - Test the homepage at `https://micropaywall.app`

3. **Monitor:**
   - If the issue persists, check if `index.rsc.func` is being generated
   - May need to investigate `@cloudflare/next-on-pages` configuration

---

**Status:** Fix implemented and ready to deploy
**Priority:** High - This fixes the 404 error
**Expected Result:** Homepage should load correctly after deployment

