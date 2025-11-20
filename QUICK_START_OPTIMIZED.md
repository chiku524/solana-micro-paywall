# Quick Start Guide - Optimized Setup

This is a quick reference guide for getting started with the optimized micro-paywall platform.

---

## 🚀 Quick Setup (5 minutes)

### 1. Run Database Migration

**IMPORTANT**: This must be done first!

**Easiest way - via terminal:**

```bash
cd apps/backend
npm run db:migrate:indexes
```

This will run the migration automatically via Prisma!

**Alternative methods:**
- `npm run db:migrate:psql` - Using psql
- Manual via Supabase SQL Editor (see `MIGRATION_GUIDE.md`)

**Verify indexes were created:**

```bash
cd apps/backend
npm run check:indexes
```

### 2. Generate Prisma Client

```bash
cd apps/backend
npm run db:generate
```

### 3. Configure Redis (Optional)

Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
```

Or use cloud Redis (Upstash, Redis Cloud, etc.)

### 4. Verify Setup

```bash
cd apps/backend
npm run verify:setup
```

### 5. Start the Application

```bash
# From project root
npm run dev

# Or individually
npm run dev:backend
```

---

## ✅ Verification Checklist

Run these quick tests:

### Health Check
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "checks": {
    "database": { "status": "ok" },
    "solana": { "status": "ok" }
  }
}
```

### Test Optimizations

**Linux/macOS:**
```bash
./scripts/test-optimizations.sh
```

**Windows:**
```powershell
.\scripts\test-optimizations.ps1
```

**Or manually:**
```bash
# Test compression
curl -H "Accept-Encoding: gzip" -v http://localhost:3000/api/health

# Test request ID
curl -v http://localhost:3000/api/health | grep -i "x-request-id"
```

---

## 📋 Common Commands

```bash
# Verify setup
npm run verify:setup

# Check database indexes
npm run check:indexes

# Start development
npm run dev

# Generate Prisma client
npm run db:generate

# View database (Prisma Studio)
npm run db:studio
```

---

## 🔧 Troubleshooting

### Redis Not Working?
- Check Redis is running: `redis-cli ping`
- Verify `REDIS_URL` in `.env`
- App will work without Redis (caching disabled)

### Database Errors?
- Run migration: `MIGRATION_SQL.sql` in Supabase
- Regenerate Prisma: `npm run db:generate`
- Check `DATABASE_URL` in `.env`

### Rate Limiting Not Working?
- Verify `@nestjs/throttler` is installed
- Check Redis is configured (optional but recommended)

---

## 📚 Next Steps

1. ✅ Run database migration
2. ✅ Configure Redis (optional)
3. ✅ Verify setup
4. ✅ Test optimizations
5. 📖 Read full guide: `NEXT_STEPS_GUIDE.md`
6. 🚀 Start building!

---

*For detailed information, see `NEXT_STEPS_GUIDE.md`*

