# GitHub Actions Setup for Cloudflare Workers

## 🎯 Quick Setup (5 minutes)

### 1. Get Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Click **Continue to summary** → **Create Token**
5. **Copy the token** (you won't see it again!)

### 2. Add to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. **Name**: `CLOUDFLARE_API_TOKEN`
5. **Secret**: (paste your token)
6. Click **Add secret**

### 3. Push to Main

```bash
git add .github/workflows/deploy-workers.yml
git commit -m "Add GitHub Actions deployment"
git push origin main
```

The workflow will automatically:
- ✅ Install dependencies
- ✅ Deploy to Cloudflare Workers
- ✅ Run on every push to main

## ✅ That's It!

Your Workers will now deploy automatically via GitHub Actions instead of Cloudflare Dashboard.

## 🔍 Verify Deployment

1. Go to **Actions** tab in GitHub
2. You should see "Deploy Cloudflare Workers" workflow
3. Click on it to see deployment logs
4. Check Cloudflare Dashboard → Workers to see your deployed Worker

## 🎉 Benefits

- ✅ No lock file issues
- ✅ Full control over build process
- ✅ Automatic deployments
- ✅ Better error messages
- ✅ Industry standard approach

