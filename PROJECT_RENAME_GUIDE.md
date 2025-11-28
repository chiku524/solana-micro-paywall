# 🔄 Renaming Cloudflare Pages Project from `micropaywall-pages` to `micropaywall`

## Current Situation

- **Workflow was deploying to:** `micropaywall`
- **Actual project name in Cloudflare:** `micropaywall-pages`
- **Preview URL:** `micropaywall-pages.pages.dev`
- **Custom domain:** `micropaywall.app` ✅ (connected)

This mismatch was causing the 404 errors!

## Immediate Fix Applied ✅

I've updated the workflow to match the actual project name:
- `.github/workflows/deploy-pages.yml` → `projectName: micropaywall-pages`
- `apps/web/package.json` → `--project-name=micropaywall-pages`

This should fix the 404 issue immediately.

## If You Want to Remove `-pages` Suffix

If you want everything to be just `micropaywall` (without `-pages`), you have two options:

### Option 1: Rename the Project in Cloudflare (Recommended)

1. **Go to Cloudflare Dashboard:**
   - Navigate to: **Workers & Pages** → **Pages**
   - Find your project (currently `micropaywall-pages`)
   - Click on the project

2. **Rename the Project:**
   - Click **Settings** tab
   - Look for project name/rename option
   - Change from `micropaywall-pages` to `micropaywall`
   - Save changes

3. **Note:** The preview URL might not update immediately. Cloudflare Pages URLs are usually immutable - you may need to:
   - Wait for Cloudflare to update the URL (can take 24-48 hours)
   - Or the URL might remain as `micropaywall-pages.pages.dev` for backwards compatibility
   - Or create a new project named `micropaywall` and migrate

4. **Update Custom Domain:**
   - Make sure `micropaywall.app` is connected to the renamed project
   - Re-verify DNS records if needed

5. **Update Workflow:**
   - After renaming in Cloudflare, change the workflow back to:
     ```yaml
     projectName: micropaywall
     ```

### Option 2: Create New Project Named `micropaywall`

1. **Create New Project:**
   ```bash
   wrangler pages project create micropaywall --production-branch=main
   ```

2. **Update Workflow:**
   - Change `projectName` to `micropaywall`

3. **Connect Custom Domain:**
   - In Cloudflare Dashboard: **Pages** → `micropaywall` → **Custom domains**
   - Add: `micropaywall.app`

4. **Verify DNS:**
   - Ensure DNS CNAME points to `micropaywall.pages.dev` (or `micropaywall-pages.pages.dev` if URL doesn't change)

5. **Delete Old Project:**
   - After verifying everything works, delete `micropaywall-pages`

## Important Notes

⚠️ **Preview URLs don't always update when renaming:**
- Cloudflare Pages subdomains (`*.pages.dev`) are often tied to the original project name
- Even after renaming, the URL might remain `micropaywall-pages.pages.dev`
- **The custom domain (`micropaywall.app`) will continue to work regardless**

✅ **Custom domains are independent:**
- Your custom domain `micropaywall.app` works regardless of the project name or preview URL
- As long as it's connected to the correct project, it will work

## Recommendation

**For now, keep it as `micropaywall-pages`** since:
- ✅ Everything is working
- ✅ Custom domain `micropaywall.app` doesn't care about the project name
- ✅ Users only see the custom domain anyway
- ✅ Changing it adds complexity and potential downtime

If you really want to remove `-pages` for consistency:
- Create a new project `micropaywall`
- Connect the custom domain to it
- Update the workflow
- Test thoroughly
- Delete the old project

---

**Status:** ✅ Fixed - workflow now matches actual project name

