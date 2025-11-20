# Next Steps: Setup & Verification Guide

This guide will help you complete the setup and verify all optimizations are working correctly.

---

## Step 1: Run Database Migration ⚠️ REQUIRED

The database indexes are critical for performance. You must run the migration.

### Option A: Using Prisma (Recommended) ✅

**Easiest method - just run:**

```bash
cd apps/backend
npm run db:migrate:indexes
```

This will:
- ✅ Read `MIGRATION_SQL.sql`
- ✅ Execute all statements via Prisma
- ✅ Handle errors gracefully
- ✅ Verify indexes were created
- ✅ Show detailed progress

**Requirements:**
- `DATABASE_URL` must be set in `.env`
- Prisma client must be generated (`npm run db:generate`)

### Option B: Using psql (Alternative)

```bash
cd apps/backend
npm run db:migrate:psql

# Or directly:
bash scripts/run-migration-psql.sh
```

**Requirements:**
- `psql` must be installed
- `DATABASE_URL` must be set

### Option C: Supabase SQL Editor (Manual)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file: `MIGRATION_SQL.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify indexes were created (check the output)

**See `MIGRATION_GUIDE.md` for detailed instructions on all methods.**

### Verification

After running the migration, verify indexes were created:

```sql
-- Check payment intent indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'PaymentIntent' 
AND indexname LIKE 'idx_%';

-- Check payment indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'Payment' 
AND indexname LIKE 'idx_%';

-- Check access token indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'AccessToken' 
AND indexname LIKE 'idx_%';
```

---

## Step 2: Configure Redis (Optional but Recommended)

Redis is used for caching and rate limiting. The system will work without it, but performance will be better with Redis.

### Option A: Local Redis

```bash
# Install Redis (macOS)
brew install redis

# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### Option B: Cloud Redis (Recommended for Production)

- **Upstash Redis**: https://upstash.com/ (Free tier available)
- **Redis Cloud**: https://redis.com/cloud/
- **AWS ElastiCache**: For AWS deployments

### Update .env File

Add or update in your `.env` file:

```env
REDIS_URL=redis://localhost:6379
# Or for cloud Redis:
# REDIS_URL=rediss://default:password@host:port
```

### Verification

The application will log Redis connection status on startup:
- ✅ `Redis connected successfully` - Working
- ⚠️ `Redis not configured, caching disabled` - Working but without caching

---

## Step 3: Verify Environment Configuration

Check your `.env` file has all required variables:

```bash
# Required
DATABASE_URL=postgresql://...
SOLANA_RPC_ENDPOINT=https://...
JWT_SECRET=your-secret-minimum-32-chars

# Optional but recommended
REDIS_URL=redis://localhost:6379
```

Run the verification script:

```bash
npm run verify:setup
```

---

## Step 4: Generate Prisma Client

After database migration, regenerate Prisma client:

```bash
cd apps/backend
npm run db:generate
```

---

## Step 5: Start the Application

### Development Mode

```bash
# From project root
npm run dev

# Or individually:
npm run dev:backend      # Backend on port 3000
npm run dev:dashboard    # Dashboard on port 3001
npm run dev:marketplace  # Marketplace on port 3002
```

### Check Startup Logs

Look for these success messages:

```
✅ Redis connected successfully (if Redis is configured)
✅ Backend API listening on 0.0.0.0:3000
✅ Solana RPC connected to ...
```

---

## Step 6: Test the Optimizations

### 6.1 Test Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45,
  "checks": {
    "database": { "status": "ok" },
    "solana": { "status": "ok", "slot": 12345678 }
  }
}
```

### 6.2 Test Response Compression

```bash
curl -H "Accept-Encoding: gzip" -v http://localhost:3000/api/health 2>&1 | grep -i "content-encoding"
```

Should show: `content-encoding: gzip`

### 6.3 Test Rate Limiting

```bash
# Make 101 requests quickly (limit is 100/minute)
for i in {1..101}; do
  curl http://localhost:3000/api/health
done
```

The 101st request should return `429 Too Many Requests`.

### 6.4 Test Caching

```bash
# First request (cache miss)
time curl http://localhost:3000/api/contents

# Second request (cache hit - should be faster)
time curl http://localhost:3000/api/contents
```

### 6.5 Test QR Code Generation

1. Create a payment request via API
2. Use the widget SDK to generate QR code
3. Verify QR code is scannable

### 6.6 Test Request ID

```bash
curl -v http://localhost:3000/api/health 2>&1 | grep -i "x-request-id"
```

Should show: `X-Request-Id: <uuid>`

---

## Step 7: Monitor Performance

### Check Database Query Performance

```bash
# Connect to database
psql $DATABASE_URL

# Check slow queries (if enabled)
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Check Cache Hit Rate

If using Redis:

```bash
redis-cli INFO stats | grep keyspace
```

### Monitor API Response Times

Check logs for request timing or use monitoring tools.

---

## Step 8: Test Background Jobs

### Verify Cleanup Jobs

1. Create some expired payment intents (manually or wait)
2. Check logs after 1 hour - should see cleanup messages
3. Verify expired intents were marked as 'expired'

### Test Payment Verification Job

Jobs will run automatically when payment verification is queued.

---

## Step 9: Test Webhooks (Optional)

1. Configure webhook URL in merchant `configJson`:
```json
{
  "webhookUrl": "https://your-server.com/webhooks"
}
```

2. Make a test payment
3. Verify webhook is received with correct signature

---

## Troubleshooting

### Redis Connection Issues

**Error**: `Redis connection error`

**Solutions**:
- Check Redis is running: `redis-cli ping` (should return `PONG`)
- Verify `REDIS_URL` in `.env`
- Check firewall/network settings
- Application will continue without Redis (caching disabled)

### Database Index Issues

**Error**: Index creation fails

**Solutions**:
- Check you have proper database permissions
- Verify table names match (case-sensitive in PostgreSQL)
- Run migration in smaller chunks if needed

### Rate Limiting Not Working

**Solutions**:
- Verify `@nestjs/throttler` is installed
- Check `RateLimitModule` is imported in `AppModule`
- Verify Redis is configured (if using Redis storage)

### Compression Not Working

**Solutions**:
- Verify `compression` package is installed
- Check middleware order in `main.ts`
- Test with `Accept-Encoding: gzip` header

---

## Verification Checklist

- [ ] Database migration executed successfully
- [ ] All indexes created (verify with SQL queries)
- [ ] Redis configured (optional but recommended)
- [ ] Prisma client regenerated
- [ ] Application starts without errors
- [ ] Health check returns `ok` status
- [ ] Response compression working
- [ ] Rate limiting active
- [ ] Request IDs present in responses
- [ ] Caching working (if Redis configured)
- [ ] QR code generation working
- [ ] Background jobs running

---

## Performance Benchmarks

After setup, you should see:

- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Cache Hit Rate**: > 70% (if Redis configured)
- **Payment Verification**: < 5 seconds end-to-end

---

## Next: Production Deployment

Once verified locally:

1. Set up production environment variables
2. Configure production Redis
3. Set up monitoring (Prometheus, Grafana, etc.)
4. Configure CI/CD pipeline
5. Set up error tracking (Sentry)
6. Enable API documentation (Swagger)

---

*Need help? Check the troubleshooting section or review the implementation logs.*

