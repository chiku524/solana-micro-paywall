# Cloudflare Workers & Pages Migration Plan

## 🎯 Goal: Full Cloudflare Platform Deployment

Deploy both frontend and backend entirely on Cloudflare for maximum efficiency and unified platform management.

## 📊 Current Architecture Analysis

### What We Have:
- **Frontend**: Next.js 14 (✅ Compatible with Cloudflare Pages)
- **Backend**: NestJS (❌ Needs conversion to Cloudflare Workers)
- **Database**: PostgreSQL via Prisma (❌ Needs migration to Cloudflare D1)
- **Cache**: Redis via ioredis (❌ Needs migration to Cloudflare KV)
- **Queues**: BullMQ via Redis (❌ Needs migration to Cloudflare Queues)

### Migration Complexity: **Medium-High**
- **Estimated Time**: 1-2 weeks
- **Code Changes**: Significant but manageable
- **Data Migration**: Required (PostgreSQL → D1)

## 🏗️ Optimal Cloudflare Architecture

```
┌─────────────────────────────────────────────────┐
│         Cloudflare Pages (Frontend)             │
│         - Next.js 14                            │
│         - Global CDN                            │
│         - Edge Rendering                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      Cloudflare Workers (API Routes)            │
│      - REST API                                 │
│      - Authentication                           │
│      - Payment Processing                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         Cloudflare D1 (Database)                │
│         - SQLite (SQL compatible)              │
│         - Edge-replicated                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      Cloudflare KV (Cache)                     │
│      - Key-value storage                        │
│      - Edge-cached                              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      Cloudflare Queues (Background Jobs)        │
│      - Payment verification                     │
│      - Webhook delivery                         │
│      - Cleanup tasks                            │
└─────────────────────────────────────────────────┘
```

## 🔄 Migration Strategy

### Phase 1: Database Migration (PostgreSQL → D1)

**Challenge**: D1 uses SQLite, not PostgreSQL

**Solution Options**:

#### Option A: Full D1 Migration (Recommended)
- Migrate all data to D1
- Convert Prisma schema to D1-compatible SQL
- Use D1's SQL API directly (no Prisma)
- **Pros**: Fully on Cloudflare, edge-replicated
- **Cons**: SQLite limitations (no advanced PostgreSQL features)

#### Option B: Hybrid (D1 + External PostgreSQL)
- Use D1 for read-heavy, edge-cached data
- Keep PostgreSQL for write-heavy operations
- Access PostgreSQL via HTTP API from Workers
- **Pros**: Best of both worlds
- **Cons**: More complex, external dependency

**Recommendation**: Start with Option A, migrate to Option B if needed

### Phase 2: Backend Conversion (NestJS → Workers)

**Approach**: Convert NestJS modules to Cloudflare Workers

1. **Create Worker Structure**:
   ```
   apps/backend-workers/
   ├── src/
   │   ├── routes/          # API route handlers
   │   ├── services/        # Business logic
   │   ├── middleware/      # Auth, validation, etc.
   │   ├── utils/           # Helpers
   │   └── types/           # TypeScript types
   ├── wrangler.toml        # Cloudflare config
   └── package.json
   ```

2. **Convert Modules**:
   - Each NestJS module → Worker route handler
   - Services remain mostly the same (TypeScript)
   - Replace Prisma calls with D1 SQL queries
   - Replace Redis with KV operations
   - Replace BullMQ with Cloudflare Queues

### Phase 3: Frontend Updates

- Update API URLs to point to Workers
- Minimal changes needed (just endpoint URLs)

## 📋 Step-by-Step Migration Plan

### Step 1: Set Up Cloudflare D1 Database

1. **Create D1 Database**:
   ```bash
   npx wrangler d1 create solana-paywall-db
   ```

2. **Convert Prisma Schema to D1 SQL**:
   - D1 uses SQLite syntax
   - Convert all Prisma models to CREATE TABLE statements
   - Handle data types (PostgreSQL → SQLite)

3. **Create Migration Scripts**:
   - Export data from PostgreSQL
   - Transform to SQLite format
   - Import to D1

### Step 2: Create Cloudflare Workers Backend

1. **Initialize Workers Project**:
   ```bash
   npm create cloudflare@latest backend-workers
   ```

2. **Set Up Project Structure**:
   - Create route handlers for each API endpoint
   - Port business logic from NestJS services
   - Set up middleware (auth, validation)

3. **Configure D1 Binding**:
   ```toml
   # wrangler.toml
   [[d1_databases]]
   binding = "DB"
   database_name = "solana-paywall-db"
   database_id = "your-database-id"
   ```

### Step 3: Migrate Services

For each NestJS service, create equivalent Worker handlers:

**Example: Payments Service**

**Before (NestJS)**:
```typescript
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}
  
  async createPaymentIntent(data) {
    return this.prisma.paymentIntent.create({ data });
  }
}
```

**After (Workers)**:
```typescript
export async function createPaymentIntent(request: Request, env: Env) {
  const data = await request.json();
  const result = await env.DB.prepare(
    'INSERT INTO PaymentIntent (...) VALUES (...) RETURNING *'
  ).bind(...).first();
  return Response.json(result);
}
```

### Step 4: Replace Redis with KV

**Before (Redis)**:
```typescript
await this.cache.set('key', 'value', 'EX', 3600);
const value = await this.cache.get('key');
```

**After (KV)**:
```typescript
await env.CACHE.put('key', 'value', { expirationTtl: 3600 });
const value = await env.CACHE.get('key');
```

### Step 5: Replace BullMQ with Queues

**Before (BullMQ)**:
```typescript
await this.queue.add('verify-payment', { paymentId });
```

**After (Cloudflare Queues)**:
```typescript
await env.PAYMENT_QUEUE.send({ paymentId });
```

### Step 6: Deploy

1. **Deploy Workers**:
   ```bash
   npx wrangler deploy
   ```

2. **Deploy Pages**:
   - Connect GitHub repo
   - Configure build settings
   - Deploy

## 🛠️ Implementation Details

### Database Schema Conversion

**Prisma Schema** → **D1 SQL**

Key differences:
- PostgreSQL `BIGINT` → SQLite `INTEGER`
- PostgreSQL `JSON` → SQLite `TEXT` (store as JSON string)
- PostgreSQL arrays → SQLite `TEXT` (comma-separated or JSON)
- PostgreSQL `TIMESTAMP` → SQLite `TEXT` (ISO 8601)

**Example Conversion**:

```sql
-- Prisma/PostgreSQL
model PaymentIntent {
  id          String   @id @default(cuid())
  amount      BigInt
  metadata    Json?
  createdAt   DateTime @default(now())
}

-- D1/SQLite
CREATE TABLE PaymentIntent (
  id TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  metadata TEXT,  -- Store as JSON string
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### API Route Structure

**Workers Routing** (using Hono or native):

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Route to handlers
    if (url.pathname.startsWith('/api/payments')) {
      return handlePayments(request, env);
    }
    if (url.pathname.startsWith('/api/merchants')) {
      return handleMerchants(request, env);
    }
    // ... etc
  }
};
```

### Authentication

**JWT Verification** (same logic, different context):

```typescript
export async function verifyJWT(request: Request, env: Env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  // Use Web Crypto API (available in Workers)
  const payload = await verifyJWTToken(token, env.JWT_SECRET);
  return payload;
}
```

### Background Jobs

**Cloudflare Queues** (replaces BullMQ):

```typescript
// Send to queue
await env.PAYMENT_QUEUE.send({
  paymentId: '...',
  timestamp: Date.now()
});

// Queue consumer (separate worker)
export default {
  async queue(batch: MessageBatch, env: Env) {
    for (const message of batch.messages) {
      await processPayment(message.body);
      message.ack();
    }
  }
};
```

## 📦 Project Structure After Migration

```
solana-micro-paywall/
├── apps/
│   ├── web/                    # Next.js (Cloudflare Pages)
│   └── backend-workers/         # Cloudflare Workers (NEW)
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── services/       # Business logic
│       │   ├── middleware/     # Auth, validation
│       │   └── utils/          # Helpers
│       ├── wrangler.toml       # Cloudflare config
│       └── package.json
├── packages/
│   └── widget-sdk/             # Unchanged
└── migrations/
    ├── d1-schema.sql           # D1 database schema
    └── data-migration/         # PostgreSQL → D1 scripts
```

## ⚠️ Important Considerations

### 1. SQLite Limitations

- **No Foreign Key Constraints**: Need to enforce in application code
- **Limited JSON Support**: Store as TEXT, parse in code
- **No Full-Text Search**: Need alternative (KV search or external)
- **Transaction Limitations**: Different from PostgreSQL

### 2. Cold Starts

- Workers have minimal cold start (~0ms)
- D1 queries are fast but edge-replicated
- KV is instant (edge-cached)

### 3. Data Migration

- Export PostgreSQL data
- Transform to SQLite format
- Import to D1
- Verify data integrity

### 4. Testing Strategy

- Test each module conversion
- Verify API endpoints
- Test data migration
- Load testing

## 🚀 Quick Start: Begin Migration

### Option 1: Gradual Migration (Recommended)

1. **Keep existing backend running**
2. **Create Workers alongside NestJS**
3. **Migrate endpoints one by one**
4. **Switch frontend to Workers gradually**
5. **Decommission NestJS when complete**

### Option 2: Big Bang Migration

1. **Complete all migration work**
2. **Test thoroughly**
3. **Deploy everything at once**
4. **Switch DNS**

**Recommendation**: Option 1 (gradual) is safer

## 📊 Migration Checklist

### Database
- [ ] Create D1 database
- [ ] Convert Prisma schema to D1 SQL
- [ ] Create migration scripts
- [ ] Test data migration
- [ ] Verify data integrity

### Backend
- [ ] Set up Workers project
- [ ] Convert authentication
- [ ] Convert payments module
- [ ] Convert merchants module
- [ ] Convert contents module
- [ ] Convert all other modules
- [ ] Replace Redis with KV
- [ ] Replace BullMQ with Queues
- [ ] Test all endpoints

### Frontend
- [ ] Update API URLs
- [ ] Test all features
- [ ] Deploy to Pages

### Deployment
- [ ] Deploy Workers
- [ ] Deploy Pages
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Verify everything works

## 💰 Cost Comparison

### Current (Railway + Cloudflare Pages)
- Railway: ~$10-15/month
- Cloudflare Pages: Free
- **Total**: ~$10-15/month

### After Migration (Full Cloudflare)
- Cloudflare Workers: Free (100k requests/day)
- Cloudflare Pages: Free
- Cloudflare D1: Free (5GB storage, 5M reads/day)
- Cloudflare KV: Free (100k reads/day)
- Cloudflare Queues: Free (1M messages/month)
- **Total**: $0/month (within free tier)

**Note**: If you exceed free tiers, costs are still very reasonable.

## 🎯 Next Steps

1. **Review this plan** - Understand the scope
2. **Create D1 database** - Start with database
3. **Convert schema** - Prisma → D1 SQL
4. **Set up Workers project** - Initialize structure
5. **Migrate one module** - Start small (e.g., health check)
6. **Test thoroughly** - Verify it works
7. **Continue migration** - Module by module
8. **Deploy** - Go live!

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Cloudflare Queues Docs](https://developers.cloudflare.com/queues/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

## 🤔 Decision Point

**Should we proceed with full Cloudflare migration?**

**Pros**:
- ✅ Single platform
- ✅ Global edge deployment
- ✅ Cost-effective (likely free)
- ✅ Fast (edge-replicated)
- ✅ Unified management

**Cons**:
- ⚠️ Requires code refactoring (1-2 weeks)
- ⚠️ SQLite limitations vs PostgreSQL
- ⚠️ Learning curve for Workers
- ⚠️ Data migration needed

**Alternative**: Hybrid approach
- Frontend: Cloudflare Pages ✅
- Backend: Keep on Railway (Node.js)
- Still get Cloudflare benefits for frontend
- Less migration work

**My Recommendation**: If you want full Cloudflare, the migration is doable and worth it. The code changes are significant but straightforward. The main challenge is the database migration (PostgreSQL → D1).

Would you like me to:
1. **Start the migration** - Begin converting code to Workers?
2. **Create a proof of concept** - Migrate one module first?
3. **Provide more details** - Answer specific questions?

