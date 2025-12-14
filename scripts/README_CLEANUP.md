# Cloudflare Projects Cleanup Scripts

## Overview

These scripts help clean up old Cloudflare Pages and Workers projects before setting up the converged Workers + Pages project.

## Prerequisites

1. **Environment Variables**:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-api-token"
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
   ```

2. **Dependencies** (for TypeScript version):
   - `ts-node`: `npm install -g ts-node`
   - `dotenv`: Already in devDependencies

3. **Dependencies** (for Shell version):
   - `jq`: JSON processor (install via package manager)
   - `curl`: Usually pre-installed

## Usage

### Option 1: TypeScript Version (Recommended)

```bash
# Make sure environment variables are set
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Run the script
npx ts-node scripts/cleanup-cloudflare-projects.ts
```

### Option 2: Shell Version

```bash
# Make sure environment variables are set
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Run the script
bash scripts/cleanup-cloudflare-projects.sh
```

## What the Script Does

1. **Deletes all deployments** from the old Pages project (`micropaywall`)
2. **Deletes the old Pages project** (`micropaywall`)
3. **Deletes the old Worker project** (`micropaywall-api`)
4. **Sets up the converged project** (will be created automatically on first deployment)

## Important Notes

⚠️ **This script is destructive!** It will:
- Delete all deployments from the old Pages project
- Delete the old Pages project
- Delete the old Worker project

Make sure you:
- ✅ Have removed custom domains from old projects
- ✅ Have backed up any important data
- ✅ Are ready to deploy the new converged project

## Troubleshooting

### "Missing required environment variables"
- Make sure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set
- You can find these in your Cloudflare dashboard

### "Failed to delete project"
- The project might already be deleted
- Check the Cloudflare dashboard manually
- Some projects might have dependencies that need to be removed first

### "Rate limit exceeded"
- The script includes delays between API calls
- If you still hit rate limits, wait a few minutes and try again

## After Running the Script

1. **Verify cleanup**: Check Cloudflare dashboard to confirm old projects are deleted
2. **Deploy new project**: Push to main branch to trigger the new deployment workflow
3. **Verify deployment**: Check that the new converged project is created
4. **Test __NEXT_DATA__**: Verify that `__NEXT_DATA__` is being injected correctly

