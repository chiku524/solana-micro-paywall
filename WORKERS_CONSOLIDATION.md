# 🔄 Workers Consolidation: micropaywall-api-production → micropaywall-api

## Current Situation

- **micropaywall-api**: Has custom domain configured ✅
- **micropaywall-api-production**: Redundant, needs to be removed ❌

## Problem

The current setup deploys with `--env production`, which creates a separate worker named `micropaywall-api-production`. Since you want to use `micropaywall-api` directly as production, we need to:

1. ✅ Move production config to base worker
2. ✅ Deploy directly to `micropaywall-api` (no environment suffix)
3. ✅ Remove `micropaywall-api-production`

## Solution

### Step 1: Update wrangler.toml

Merge production environment into base configuration:

```toml
name = "micropaywall-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Production environment variables (moved from [env.production])
[vars]
NODE_ENV = "production"
FRONTEND_URL = "https://micropaywall.app"
CORS_ORIGIN = "https://micropaywall.app,https://www.micropaywall.app"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "micropaywall-db"
database_id = "9fb849f1-b895-4670-baca-cdec2767f8c4"

# KV Namespace for caching
[[kv_namespaces]]
binding = "CACHE"
id = "7b095fcc4cb74cc787c1e7a20bf895a0"
preview_id = "0ab7737d5e184851a1127d4ecc4b1102"
```

### Step 2: Update Deployment Workflow

Change from:
```yaml
run: npx wrangler deploy --env production
```

To:
```yaml
run: npx wrangler deploy
```

### Step 3: Verify Custom Domain

Ensure `api.micropaywall.app` is connected to `micropaywall-api` in Cloudflare Dashboard.

### Step 4: Deploy to micropaywall-api

This will deploy directly to `micropaywall-api` (your production worker with custom domain).

### Step 5: Clean Up

After verifying everything works, delete `micropaywall-api-production`.

## Benefits

- ✅ Simpler configuration (no environment suffixes)
- ✅ Uses existing worker with custom domain
- ✅ Removes redundancy
- ✅ Easier to manage (single worker)

## Important Notes

⚠️ **Before consolidating:**
- Verify `micropaywall-api` has all necessary configurations
- Check that custom domain is working
- Ensure production environment variables are set
- Test the deployment

✅ **After consolidating:**
- `micropaywall-api` will be your production worker
- Custom domain stays connected
- No more `-production` suffix

