# Cloudflare Resources Setup Guide

## 🎯 Step-by-Step Setup

Follow these steps to set up all Cloudflare resources needed for the migration.

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

Or use locally:
```bash
cd apps/backend-workers
npm install
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

## Step 3: Create D1 Database

```bash
wrangler d1 create micropaywall-db
```

**Output will look like:**
```
✅ Successfully created DB 'micropaywall-db'!

[[d1_databases]]
binding = "DB"
database_name = "micropaywall-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Action**: Copy the `database_id` and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "solana-paywall-db"
database_id = "your-database-id-here"  # Paste here
```

## Step 4: Create KV Namespaces

```bash
# Production namespace
wrangler kv:namespace create "CACHE"

# Preview namespace (for local development)
wrangler kv:namespace create "CACHE" --preview
```

**Output will look like:**
```
✅ Successfully created namespace "CACHE"

Add to your configuration file in your kv_namespaces array:
{ binding = "CACHE", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**Action**: Copy both IDs and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-production-id-here"
preview_id = "your-preview-id-here"
```

## Step 5: Create Queues

```bash
# Payment verification queue
wrangler queues create payment-verification

# Webhooks queue
wrangler queues create webhooks
```

**Note**: Queues don't need IDs in `wrangler.toml` - they're automatically configured.

## Step 6: Run Database Migration

```bash
cd apps/backend-workers
npm run db:migrate
```

Or manually:
```bash
wrangler d1 execute micropaywall-db --file=../../migrations/d1-schema.sql
```

## Step 7: Verify Setup

```bash
# Test database connection
wrangler d1 execute micropaywall-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Should show all tables:
# Merchant, Content, PaymentIntent, Payment, AccessToken, etc.
```

## Step 8: Set Environment Variables

Update `wrangler.toml` with your environment variables:

```toml
[env.production.vars]
JWT_SECRET = "your-super-secret-jwt-key-minimum-32-characters"
SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"
FRONTEND_URL = "https://yourdomain.com"  # Or use .pages.dev for now
CORS_ORIGIN = "https://yourdomain.com"     # Or "*" for development
```

## Step 9: Test Locally

```bash
cd apps/backend-workers
npm install
npm run dev
```

Visit: `http://localhost:8787/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

## ✅ Checklist

- [ ] Wrangler CLI installed
- [ ] Logged in to Cloudflare
- [ ] D1 database created
- [ ] KV namespaces created
- [ ] Queues created
- [ ] Database migration run
- [ ] Environment variables set
- [ ] Local test successful

## 🚨 Troubleshooting

### Issue: "Database not found"
**Solution**: Make sure `database_id` is correct in `wrangler.toml`

### Issue: "KV namespace not found"
**Solution**: Verify `id` and `preview_id` are correct in `wrangler.toml`

### Issue: "Queue not found"
**Solution**: Queues are created automatically, just make sure names match

### Issue: Migration fails
**Solution**: Check SQL syntax (must be SQLite-compatible)

## 📝 Next Steps

Once setup is complete:
1. ✅ Test health endpoint
2. ✅ Begin migrating modules
3. ✅ Deploy to staging
4. ✅ Deploy to production

Ready to continue? Let me know when you've completed the setup!

