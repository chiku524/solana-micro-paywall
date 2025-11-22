# Fix for Cloudflare Workers Build Errors

## 🚨 Problems Identified

1. **BigInt Literals Error**: `widget-sdk` target is ES2019, but dependencies use BigInt literals (`0n`) which require ES2020+
2. **JSX Error**: `widget-sdk` has React components but JSX is not configured
3. **Unnecessary Builds**: Cloudflare is trying to build all workspaces, but Workers only needs its own dependencies

## ✅ Solutions Applied

### 1. Fixed widget-sdk TypeScript Configuration

Updated `packages/widget-sdk/tsconfig.json`:
- Changed `target` from `ES2019` to `ES2020` (supports BigInt literals)
- Added `jsx: "react-jsx"` for React component support
- Added `lib` array with ES2020 and DOM types

### 2. Fixed widget-sdk Build Command

Updated `packages/widget-sdk/package.json`:
- Added `--target es2020` to tsup command
- Added `--jsx react-jsx` to tsup command

### 3. Updated Cloudflare Build Command

**Important**: The build command should only install dependencies, not build packages.

## 🎯 Updated Cloudflare Dashboard Settings

### For Workers Backend:

**Root Directory**: `apps/backend-workers`

**Build Command**: 
```bash
npm install --ignore-scripts
```

**OR** (if you want to skip workspace builds entirely):
```bash
cd apps/backend-workers && npm install --no-workspaces
```

**Deploy Command**: 
```bash
npx wrangler deploy --env production
```

## 📋 Why This Works

1. **`--ignore-scripts`**: Prevents npm from running build scripts in other packages
2. **`--no-workspaces`**: Installs only local dependencies, not workspace packages
3. **ES2020 Target**: Supports BigInt literals used by Solana dependencies
4. **JSX Configuration**: Allows TypeScript to process React components

## 🔧 Alternative: Skip Widget SDK Build

If you want to completely avoid building widget-sdk during Workers deployment:

**Build Command**:
```bash
cd apps/backend-workers && npm install --no-workspaces --ignore-scripts
```

This will:
- ✅ Only install dependencies in `apps/backend-workers`
- ✅ Skip workspace package builds
- ✅ Skip all npm scripts (including widget-sdk build)

## 🚀 Recommended Configuration

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/backend-workers` |
| **Build Command** | `npm install --ignore-scripts` |
| **Deploy Command** | `npx wrangler deploy --env production` |

## ✅ Verification

After updating, the build should:
1. ✅ Install dependencies without errors
2. ✅ Skip building widget-sdk and other packages
3. ✅ Successfully deploy Workers

## 📝 Notes

- The widget-sdk fixes are for future builds (when you actually need to build it)
- Workers deployment doesn't need widget-sdk built
- Using `--ignore-scripts` prevents unnecessary builds during deployment

