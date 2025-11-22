# Fix for Wrangler v4 package-lock.json Sync

## 🚨 Problem

After updating Wrangler from v3 to v4, the `package-lock.json` is out of sync. Cloudflare runs `npm ci` which requires the lock file to match `package.json` exactly.

## ✅ Solution: Regenerate package-lock.json

The lock file needs to be regenerated with Wrangler v4 dependencies. I've done this locally, but you need to commit it.

## 📋 Steps to Fix

### Option 1: Use Updated package-lock.json (Recommended)

The `package-lock.json` has been regenerated. Just commit and push:

```bash
git add apps/backend-workers/package-lock.json
git commit -m "Update package-lock.json for Wrangler v4"
git push
```

### Option 2: Use npm install in Build Command (Quick Fix)

If you can't commit right now, change Cloudflare Build Command:

**Build Command**:
```bash
npm install --ignore-scripts --no-workspaces
```

This uses `npm install` instead of `npm ci`, which is more forgiving.

## 🎯 Recommended Cloudflare Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/backend-workers` |
| **Build Command** | (Leave empty - after committing updated lock file) |
| **Deploy Command** | `npx wrangler deploy --env production` |

**OR** (if lock file not updated yet):

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/backend-workers` |
| **Build Command** | `npm install --ignore-scripts --no-workspaces` |
| **Deploy Command** | `npx wrangler deploy --env production` |

## ✅ After Fixing

Once the updated `package-lock.json` is committed and pushed:
1. Cloudflare will use `npm ci` (faster, more reliable)
2. All dependencies will match exactly
3. Deployment should succeed

