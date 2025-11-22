# Fix for package-lock.json Sync Error

## 🚨 Problem

Cloudflare runs `npm ci` (clean install) which requires `package-lock.json` to match `package.json`. The error shows:

- `apps/backend-workers` workspace is not in the root `package-lock.json`
- Missing packages: hono, wrangler, @cloudflare/workers-types, etc.

## ✅ Solution: Update Root package-lock.json

Run this locally to fix the lock file:

```bash
# From project root
npm install

# This will update package-lock.json to include apps/backend-workers
# Commit and push
git add package-lock.json
git commit -m "Update package-lock.json for backend-workers workspace"
git push
```

## 🎯 Alternative: Use npm install in Build Command

If you can't update the lock file right now, change Cloudflare Build Command:

**Build Command**:
```bash
npm install --ignore-scripts
```

This uses `npm install` instead of `npm ci`, which is more forgiving.

## 📋 Correct Cloudflare Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/backend-workers` (NOT `/aps/backend-workers`) |
| **Build Command** | `npm install --ignore-scripts` |
| **Deploy Command** | `npx wrangler deploy --env production` |

## ⚠️ Note About Path

Make sure the Root Directory is:
- ✅ `apps/backend-workers` (correct)
- ❌ `/aps/backend-workers` (typo - missing 'p')

