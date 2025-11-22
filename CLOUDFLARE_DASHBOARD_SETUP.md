# Cloudflare Dashboard Worker Setup

## 🎯 For Worker Project: `micropaywall`

When setting up your Worker in the Cloudflare Dashboard, use these commands:

### **Build Command** (Optional):
```
npm install
```

**OR** leave it empty (Cloudflare will handle dependency installation automatically)

**Why**: Cloudflare Workers don't need a traditional build step - Wrangler handles TypeScript compilation and bundling automatically. The `npm install` just ensures dependencies are available.

### **Deploy Command** (Required):
```
npx wrangler deploy --env production
```

**OR** if you want to deploy to default environment:
```
npx wrangler deploy
```

**Why use `npx`?**: Ensures wrangler is found in node_modules, even if it's in devDependencies.

## 📋 Complete Configuration

### If Using GitHub Integration:

1. **Project Name**: `micropaywall`
2. **Root Directory**: `apps/backend-workers`
3. **Build Command**: `npm install --ignore-scripts` (prevents building other packages)
4. **Deploy Command**: `npx wrangler deploy --env production`
5. **Framework Preset**: None (or "None" - Workers don't use a framework preset)

### Alternative (Simpler):

If Cloudflare auto-detects your `wrangler.toml`, you can use:

**Build Command**: (Leave empty)

**Deploy Command**: 
```
npx wrangler deploy
```

## 🔧 Important Notes

1. **Workers Auto-Build**: Cloudflare Workers are automatically built by Wrangler - no separate build step needed
2. **TypeScript**: TypeScript files are automatically compiled
3. **Dependencies**: `npm install` ensures dependencies are available, but Cloudflare may handle this automatically
4. **Environment**: Use `--env production` to deploy to production environment (defined in `wrangler.toml`)

## ✅ Recommended Setup

**Build Command**: 
```
npm install --ignore-scripts
```

**Deploy Command**: 
```
npx wrangler deploy --env production
```

**Note**: `--ignore-scripts` prevents building widget-sdk and other workspace packages that aren't needed for Workers.

This ensures:
- ✅ Dependencies are installed
- ✅ Deploys to production environment
- ✅ Uses production environment variables from `wrangler.toml`

## 🚨 If You Get Errors

### Error: "wrangler not found"
**Solution**: Make sure Wrangler is installed. Cloudflare Dashboard should handle this, but if not:
- Add to build command: `npm install -g wrangler && npm install && wrangler deploy --env production`

### Error: "Cannot find wrangler.toml"
**Solution**: Make sure **Root Directory** is set to `apps/backend-workers`

### Error: "Database not found"
**Solution**: Make sure you've created the D1 database and added the `database_id` to `wrangler.toml`

## 📝 Quick Reference

| Setting | Value |
|---------|-------|
| **Project Name** | `micropaywall` |
| **Root Directory** | `apps/backend-workers` |
| **Build Command** | `npm install --ignore-scripts` |
| **Deploy Command** | `npx wrangler deploy --env production` |
| **Framework** | None |

## 🎯 After Setup

Once configured, Cloudflare will:
1. Install dependencies (if build command includes `npm install`)
2. Run `wrangler deploy` to deploy your Worker
3. Make it available at: `micropaywall.your-subdomain.workers.dev`
4. You can then add custom domain: `api.micropaywall.app`

