# Cloudflare Migration - Quick Start Guide

## 🎯 Goal

Migrate your Solana Micro-Paywall to run entirely on Cloudflare (Workers + Pages + D1 + KV + Queues).

## ⚡ Quick Decision Matrix

| Factor | Full Cloudflare | Hybrid (Railway + Pages) |
|--------|----------------|-------------------------|
| **Platform** | ✅ Single platform | ⚠️ Two platforms |
| **Cost** | ✅ Free tier available | ⚠️ ~$10-15/month |
| **Migration Time** | ⚠️ 1-2 weeks | ✅ No migration |
| **Code Changes** | ⚠️ Significant | ✅ None |
| **Database** | ⚠️ SQLite (D1) | ✅ PostgreSQL |
| **Performance** | ✅ Edge-replicated | ✅ Good |
| **Complexity** | ⚠️ Medium-High | ✅ Low |

## 🚀 Recommended Approach: Phased Migration

### Phase 1: Proof of Concept (1-2 days)
1. Create D1 database
2. Migrate one simple module (e.g., health check)
3. Test end-to-end
4. Verify it works

### Phase 2: Core Modules (3-5 days)
1. Migrate authentication
2. Migrate payments
3. Migrate merchants
4. Migrate contents

### Phase 3: Remaining Features (3-5 days)
1. Migrate all other modules
2. Set up queues
3. Set up KV caching
4. Full testing

### Phase 4: Deployment (1 day)
1. Deploy Workers
2. Deploy Pages
3. Configure domain
4. Go live!

**Total Time**: ~1-2 weeks

## 📋 Step 1: Create Cloudflare Resources

### 1.1 Create D1 Database

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create solana-paywall-db
```

Save the output - you'll need the `database_id`.

### 1.2 Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview  # For development
```

### 1.3 Create Queues

```bash
# Create queues
wrangler queues create payment-verification
wrangler queues create webhooks
```

## 📋 Step 2: Initialize Workers Project

```bash
# Create new directory
mkdir apps/backend-workers
cd apps/backend-workers

# Initialize npm project
npm init -y

# Install dependencies
npm install hono @cloudflare/workers-types
npm install -D @types/node typescript wrangler
```

### Create `wrangler.toml`:

```toml
name = "solana-paywall-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "solana-paywall-db"
database_id = "YOUR_DATABASE_ID"  # From step 1.1

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # From step 1.2
preview_id = "YOUR_PREVIEW_KV_ID"

[[queues.producers]]
queue = "payment-verification"
binding = "PAYMENT_QUEUE"

[[queues.producers]]
queue = "webhooks"
binding = "WEBHOOK_QUEUE"

[env.production.vars]
JWT_SECRET = "your-jwt-secret"
SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"
FRONTEND_URL = "https://yourdomain.com"
CORS_ORIGIN = "https://yourdomain.com"
```

## 📋 Step 3: Run Database Migration

```bash
# Apply D1 schema
wrangler d1 execute solana-paywall-db --file=../../migrations/d1-schema.sql

# Verify tables created
wrangler d1 execute solana-paywall-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## 📋 Step 4: Create First Route (Proof of Concept)

Create `apps/backend-workers/src/index.ts`:

```typescript
import { Hono } from 'hono';

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get('/health', async (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected' // Test DB connection
  });
});

export default {
  fetch: app.fetch,
};
```

### Test Locally:

```bash
# Start local dev server
wrangler dev

# Test health endpoint
curl http://localhost:8787/health
```

## 📋 Step 5: Migrate One Module (Example: Merchants)

### Create `apps/backend-workers/src/routes/merchants.ts`:

```typescript
import { Hono } from 'hono';
import { getMerchant, getMerchantProfile } from '../services/merchants.service';

export function merchantsRoutes() {
  const app = new Hono();
  
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const merchant = await getMerchant(c.env.DB, id);
    if (!merchant) {
      return c.json({ error: 'Not found' }, 404);
    }
    return c.json(merchant);
  });
  
  app.get('/:id/profile', async (c) => {
    const id = c.req.param('id');
    const profile = await getMerchantProfile(c.env.DB, c.env.CACHE, id);
    return c.json(profile);
  });
  
  return app;
}
```

### Create `apps/backend-workers/src/services/merchants.service.ts`:

```typescript
import { Env } from '../types/env';

export async function getMerchant(db: D1Database, id: string) {
  const result = await db.prepare(
    'SELECT * FROM Merchant WHERE id = ?'
  ).bind(id).first();
  
  return result;
}

export async function getMerchantProfile(
  db: D1Database,
  cache: KVNamespace,
  id: string
) {
  // Check cache first
  const cacheKey = `merchant:profile:${id}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const merchant = await getMerchant(db, id);
  if (!merchant) {
    return null;
  }
  
  // Get stats
  const [contentCount, salesCount, followerCount] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM Content WHERE merchantId = ?')
      .bind(id).first(),
    db.prepare('SELECT COUNT(*) as count FROM Payment WHERE merchantId = ? AND status = ?')
      .bind(id, 'confirmed').first(),
    db.prepare('SELECT COUNT(*) as count FROM MerchantFollow WHERE merchantId = ?')
      .bind(id).first(),
  ]);
  
  const profile = {
    ...merchant,
    stats: {
      contentCount: contentCount?.count || 0,
      salesCount: salesCount?.count || 0,
      followerCount: followerCount?.count || 0,
    },
  };
  
  // Cache for 5 minutes
  await cache.put(cacheKey, JSON.stringify(profile), {
    expirationTtl: 300,
  });
  
  return profile;
}
```

## 📋 Step 6: Deploy

```bash
# Deploy to Cloudflare
wrangler deploy

# Your API will be available at:
# https://solana-paywall-api.your-subdomain.workers.dev
```

## 📋 Step 7: Update Frontend

Update `apps/web/lib/api-client.ts`:

```typescript
// Change API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://solana-paywall-api.your-subdomain.workers.dev';
```

## 🎯 Next Steps

1. **Continue migrating modules** one by one
2. **Test thoroughly** after each migration
3. **Deploy incrementally** (can run both backends in parallel)
4. **Switch DNS** when ready

## 💡 Pro Tips

1. **Start Small**: Migrate health check first, then one module
2. **Test Locally**: Use `wrangler dev` for local testing
3. **Use TypeScript**: Strong typing helps catch errors
4. **Cache Aggressively**: KV is fast, use it for frequently accessed data
5. **Monitor**: Use Cloudflare Analytics to track performance

## 🚨 Common Issues

### Issue: D1 Query Errors
**Solution**: Check SQL syntax (SQLite, not PostgreSQL)

### Issue: KV Not Working
**Solution**: Verify namespace binding in `wrangler.toml`

### Issue: Queue Not Processing
**Solution**: Check queue consumer is set up correctly

### Issue: CORS Errors
**Solution**: Update `CORS_ORIGIN` in environment variables

## 📚 Resources

- [Full Migration Plan](./CLOUDFLARE_MIGRATION_PLAN.md)
- [D1 Schema](./migrations/d1-schema.sql)
- [Workers Example](./apps/backend-workers/src/index.ts.example)

## 🤔 Ready to Start?

If you want to proceed with the migration:

1. ✅ Review the migration plan
2. ✅ Create Cloudflare resources
3. ✅ Set up Workers project
4. ✅ Migrate one module (proof of concept)
5. ✅ Continue with full migration

**Or**, if you prefer the hybrid approach:
- Use Cloudflare Pages for frontend
- Keep backend on Railway
- Still get Cloudflare benefits for frontend

Let me know which approach you'd like to take!

