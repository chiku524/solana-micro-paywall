# Fix for npm ci / package-lock.json Sync Error

## 🚨 Problem

Cloudflare is running `npm ci` (clean install) which requires `package-lock.json` to be in sync with `package.json`. The error occurs because:

1. `apps/backend-workers` is a new workspace that's not in the root `package-lock.json`
2. Cloudflare runs `npm clean-install` automatically, which uses `npm ci`
3. `npm ci` fails when lock file is out of sync

## ✅ Solutions

### Option 1: Update Root package-lock.json (Recommended)

Run this locally to update the lock file:

```bash
# From project root
npm install

# This will update package-lock.json to include apps/backend-workers
# Commit the updated package-lock.json
git add package-lock.json
git commit -m "Update package-lock.json for backend-workers workspace"
git push
```

### Option 2: Use npm install in Build Command

Change Cloudflare Dashboard Build Command to use `npm install` instead of letting Cloudflare use `npm ci`:

**Build Command**:
```bash
npm install --ignore-scripts
```

This will:
- ✅ Install dependencies even if lock file is slightly out of sync
- ✅ Update lock file during build (if needed)
- ✅ Skip building other packages

### Option 3: Generate Lock File in Backend Workers

Create a separate `package-lock.json` in `apps/backend-workers`:

```bash
cd apps/backend-workers
npm install --package-lock-only
```

Then update Cloudflare Build Command:
```bash
cd apps/backend-workers && npm install --ignore-scripts
```

## 🎯 Recommended Fix (Immediate)

**Update Cloudflare Dashboard Build Command to:**

```bash
npm install --ignore-scripts
```

This bypasses the `npm ci` requirement and will work immediately.

## 📋 Complete Updated Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/backend-workers` |
| **Build Command** | `npm install --ignore-scripts` |
| **Deploy Command** | `npx wrangler deploy --env production` |

## 🔧 Long-term Fix

After deployment works, update the root `package-lock.json`:

```bash
# From project root
npm install
git add package-lock.json
git commit -m "Sync package-lock.json with new backend-workers workspace"
git push
```

This ensures future deployments use `npm ci` (faster, more reliable).

## ✅ Why This Works

- `npm install` is more forgiving than `npm ci`
- `--ignore-scripts` prevents building widget-sdk
- Works even if lock file is slightly out of sync
- Can be updated later for better performance

