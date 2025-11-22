# Fix for "wrangler: not found" Error

## 🚨 Problem

The error `wrangler: not found` occurs because:
1. Wrangler is in `devDependencies` (not installed in production builds)
2. Cloudflare's build environment may not include devDependencies
3. The command needs to use `npx` to find wrangler in node_modules

## ✅ Solution

### Option 1: Use `npx` (Recommended - No Code Changes Needed)

**Update your Deploy Command in Cloudflare Dashboard to:**

```
npx wrangler deploy --env production
```

**Why**: `npx` will automatically find `wrangler` in `node_modules`, even if it's in devDependencies.

### Option 2: Move Wrangler to Dependencies (Already Fixed)

I've moved `wrangler` from `devDependencies` to `dependencies` in `package.json`. This ensures it's always installed.

**Then use Deploy Command:**
```
npx wrangler deploy --env production
```

Or just:
```
wrangler deploy --env production
```

### Option 3: Install Wrangler in Build Command

**Build Command:**
```
npm install && npm install -g wrangler
```

**Deploy Command:**
```
wrangler deploy --env production
```

## 🎯 Recommended Configuration

### Build Command:
```
cd apps/backend-workers && npm install
```

**OR** (if root directory is already set to `apps/backend-workers`):
```
npm install
```

### Deploy Command:
```
npx wrangler deploy --env production
```

## 📋 Updated Cloudflare Dashboard Settings

1. **Root Directory**: `apps/backend-workers`
2. **Build Command**: `npm install`
3. **Deploy Command**: `npx wrangler deploy --env production`

## 🔧 Why This Happens

- Cloudflare installs dependencies from the root of your repo
- If `wrangler` is only in `devDependencies`, it might not be available
- Using `npx` ensures it finds wrangler in `node_modules` regardless
- Moving to `dependencies` ensures it's always installed

## ✅ After Fix

After updating the deploy command to use `npx`, your deployment should work. The build logs should show:

```
Success: Build command completed
Executing user deploy command: npx wrangler deploy --env production
[Wrangler deployment output...]
Success: Deploy command completed
```

## 🚨 Additional Notes

1. **Root Directory**: Make sure it's set to `apps/backend-workers` so Cloudflare finds `wrangler.toml`
2. **Dependencies**: The fix I made (moving wrangler to dependencies) ensures it's always available
3. **npx**: Using `npx` is the safest approach as it works in all scenarios

