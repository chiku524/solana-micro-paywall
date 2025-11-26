# 📄 Pages Project Setup

## Current Status

You should have **2 projects** in Cloudflare:

1. **`micropaywall-api`** (Workers) ✅ - Already exists
2. **`micropaywall`** (Pages) ⚠️ - Needs to be created

## Why You Need Both

- **Workers** (`micropaywall-api`): Your backend API
  - Handles API requests
  - Runs at: `https://api.micropaywall.app`
  
- **Pages** (`micropaywall`): Your frontend
  - Serves your Next.js app
  - Will run at: `https://micropaywall.app`

## Creating the Pages Project

The GitHub Actions workflow will automatically create the project if it doesn't exist, but you can also create it manually:

### Option 1: Let GitHub Actions Create It (Recommended)

Just push to main and the workflow will create it automatically when it runs.

### Option 2: Create Manually via CLI

```bash
wrangler pages project create micropaywall --production-branch=main
```

### Option 3: Create via Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **Create application**
3. Select: **Pages** → **Direct Upload** (since we're using GitHub Actions)
4. Project name: `micropaywall`
5. Click: **Create project**

## Verifying the Project

After creation, verify it exists:

```bash
wrangler pages project list
```

You should see `micropaywall` in the list.

## Next Steps

Once the project exists:
1. The GitHub Actions workflow will deploy to it automatically
2. Your frontend will be available at: `https://micropaywall.pages.dev`
3. You can then connect a custom domain: `micropaywall.app`

