# 🔄 Complete Migration Guide: micropaywall-pages → micropaywall

## Overview

This guide helps you:
1. **Migrate Pages project** from `micropaywall-pages` to `micropaywall` (cleaner preview URL)
2. **Clean up redundant Workers** projects
3. **Update all configurations** automatically

## Quick Start

### Automated Migration (Recommended)

Run the complete migration script:

```bash
bash scripts/migrate-to-micropaywall.sh
```

This script will:
- ✅ Create new Pages project: `micropaywall`
- ✅ Update all configuration files
- ✅ List redundant Workers
- ✅ Provide cleanup instructions

### Manual Steps (After Running Script)

1. **Connect Custom Domain:**
   - Go to: https://dash.cloudflare.com
   - Navigate: **Workers & Pages** → **Pages** → **micropaywall**
   - Click: **Custom domains** tab
   - Add: `micropaywall.app`
   - Wait 5-15 minutes for SSL

2. **Deploy to New Project:**
   ```bash
   git add .
   git commit -m "Migrate Pages project to micropaywall"
   git push origin main
   ```

3. **Verify New Deployment:**
   - Test: https://micropaywall.pages.dev
   - Test: https://micropaywall.app

4. **Clean Up (After Verification):**
   - Delete old project: `wrangler pages project delete micropaywall-pages --force`
   - Clean up Workers: `bash scripts/cleanup-workers.sh`

## Step-by-Step Process

### Phase 1: Create New Pages Project

```bash
# Option A: Use automated script
bash scripts/migrate-pages-project.sh

# Option B: Manual creation
wrangler pages project create micropaywall --production-branch=main
```

**Result:** New project `micropaywall` with preview URL: `https://micropaywall.pages.dev`

### Phase 2: Update Configuration Files

The migration script automatically updates:
- ✅ `.github/workflows/deploy-pages.yml` → `projectName: micropaywall`
- ✅ `apps/web/package.json` → `--project-name=micropaywall`
- ✅ `apps/web/wrangler.toml` → `name = "micropaywall"`

### Phase 3: Connect Custom Domain

1. **In Cloudflare Dashboard:**
   - Navigate to: **Workers & Pages** → **Pages** → **micropaywall**
   - Click: **Custom domains** tab
   - Click: **Set up a custom domain**
   - Enter: `micropaywall.app`
   - Click: **Continue**
   - Wait for SSL certificate (5-15 minutes)

2. **Verify DNS:**
   - DNS CNAME should point: `micropaywall.app` → `micropaywall.pages.dev`
   - This is usually already configured

### Phase 4: Deploy to New Project

```bash
# Push changes to trigger GitHub Actions
git add .
git commit -m "Migrate Pages project from micropaywall-pages to micropaywall"
git push origin main
```

Or manually trigger in GitHub Actions dashboard.

### Phase 5: Verify Deployment

Test both URLs:
- ✅ Preview: https://micropaywall.pages.dev
- ✅ Custom: https://micropaywall.app

Both should serve the same content.

### Phase 6: Clean Up Old Project

**⚠️ Only after verifying new project works:**

```bash
# Delete old Pages project
wrangler pages project delete micropaywall-pages --force
```

### Phase 7: Clean Up Redundant Workers

```bash
# List all Workers
bash scripts/list-workers-projects.sh

# Get cleanup recommendations
bash scripts/cleanup-workers.sh
```

**Expected Setup:**
- ✅ `micropaywall-api-production` - Production Worker (KEEP)
- ❌ `micropaywall-api` - Remove if redundant
- ❌ `micropaywall-api-staging` - Remove if not needed

**Delete via Dashboard (Safer):**
1. Go to: https://dash.cloudflare.com
2. Navigate: **Workers & Pages** → **Workers**
3. Find redundant worker
4. Click: **Settings** → **Delete Worker**

## Scripts Available

| Script | Purpose |
|--------|---------|
| `scripts/migrate-to-micropaywall.sh` | Complete automated migration |
| `scripts/migrate-pages-project.sh` | Pages project migration only |
| `scripts/list-workers-projects.sh` | List all Workers projects |
| `scripts/cleanup-workers.sh` | Identify and help delete redundant Workers |

## Configuration Changes

### Files Updated Automatically

1. **`.github/workflows/deploy-pages.yml`**
   ```yaml
   # Before
   projectName: micropaywall-pages
   
   # After
   projectName: micropaywall
   ```

2. **`apps/web/package.json`**
   ```json
   // Before
   "pages:deploy": "... --project-name=micropaywall-pages"
   
   // After
   "pages:deploy": "... --project-name=micropaywall"
   ```

3. **`apps/web/wrangler.toml`**
   ```toml
   # Before
   name = "micropaywall-pages"
   
   # After
   name = "micropaywall"
   ```

## Verification Checklist

After migration, verify:

- [ ] New Pages project `micropaywall` exists
- [ ] Preview URL works: `https://micropaywall.pages.dev`
- [ ] Custom domain connected: `micropaywall.app`
- [ ] SSL certificate active for custom domain
- [ ] GitHub Actions deploys to new project
- [ ] Both URLs serve content correctly
- [ ] Old project `micropaywall-pages` deleted (after verification)
- [ ] Redundant Workers cleaned up
- [ ] Production Worker `micropaywall-api-production` still works

## Troubleshooting

### Issue: Custom Domain Not Working

**Solution:**
- Verify DNS CNAME: `micropaywall.app` → `micropaywall.pages.dev`
- Check custom domain is connected in dashboard
- Wait 5-15 minutes for SSL certificate provisioning
- Clear DNS cache: `nslookup micropaywall.app`

### Issue: Old Project Still Active

**Solution:**
- Don't delete old project until new one is verified
- Both can coexist temporarily
- Custom domain can only point to one project

### Issue: Workers Not Found

**Solution:**
- Workers might not have deployments yet
- Check Cloudflare Dashboard manually
- Only delete if confirmed redundant

## Expected Timeline

1. **Script execution:** ~1 minute
2. **Custom domain connection:** 5-15 minutes (SSL provisioning)
3. **GitHub Actions deployment:** 3-5 minutes
4. **DNS propagation:** Usually instant (same Cloudflare zone)
5. **Verification:** Immediate after deployment

**Total:** ~10-20 minutes (mostly waiting for SSL)

## Rollback Plan

If something goes wrong:

1. **Revert configuration files:**
   ```bash
   git checkout HEAD -- .github/workflows/deploy-pages.yml
   git checkout HEAD -- apps/web/package.json
   git checkout HEAD -- apps/web/wrangler.toml
   ```

2. **Redeploy to old project:**
   - Change `projectName` back to `micropaywall-pages`
   - Push changes

3. **Reconnect custom domain:**
   - Disconnect from new project
   - Reconnect to `micropaywall-pages`

## Success Criteria

✅ Migration is successful when:
- Preview URL: `https://micropaywall.pages.dev` works
- Custom domain: `https://micropaywall.app` works
- No downtime during migration
- All configurations updated
- Old project cleaned up
- Redundant Workers removed

---

**Ready to migrate?** Run: `bash scripts/migrate-to-micropaywall.sh`

