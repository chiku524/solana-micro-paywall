# Database Migration Guide

You have **three options** to run the database migration. Choose the one that works best for you!

---

## Option 1: Using Prisma (Recommended) ✅

This is the easiest method and works with your existing Prisma setup.

### Run Migration:
```bash
cd apps/backend
npm run db:migrate:indexes
```

**What it does:**
- Reads `MIGRATION_SQL.sql`
- Executes all SQL statements via Prisma
- Handles errors gracefully (skips if already exists)
- Verifies indexes were created
- Shows detailed progress

**Requirements:**
- `DATABASE_URL` must be set in `.env`
- Prisma client must be generated (`npm run db:generate`)

---

## Option 2: Using psql (Alternative)

If Prisma method doesn't work, use psql directly.

### Run Migration:
```bash
# Make sure DATABASE_URL is set
export DATABASE_URL="your-database-url"

# Run migration
cd apps/backend
npm run db:migrate:psql

# Or directly:
bash scripts/run-migration-psql.sh
```

**What it does:**
- Uses `psql` to connect to your database
- Runs the SQL file directly
- Verifies indexes after completion

**Requirements:**
- `psql` must be installed
- `DATABASE_URL` must be set

**Install psql:**
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt-get install postgresql-client`
- **Windows**: Install PostgreSQL (includes psql)

---

## Option 3: Supabase SQL Editor (Manual)

If terminal methods don't work, use Supabase's web interface.

### Steps:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Open `MIGRATION_SQL.sql` from your project
5. Copy all contents
6. Paste into SQL Editor
7. Click **Run** or press `Ctrl+Enter`

**When to use:**
- Terminal methods fail
- You prefer visual interface
- You want to review SQL before running

---

## Which Method Should I Use?

### Use **Option 1 (Prisma)** if:
- ✅ You have Prisma set up (you do!)
- ✅ You want automated verification
- ✅ You want detailed progress output

### Use **Option 2 (psql)** if:
- ✅ Prisma method fails
- ✅ You have `psql` installed
- ✅ You prefer direct SQL execution

### Use **Option 3 (Supabase UI)** if:
- ✅ Terminal methods don't work
- ✅ You want to review SQL first
- ✅ You prefer visual interface

---

## Verification

After running the migration, verify it worked:

```bash
cd apps/backend
npm run check:indexes
```

Or use the full verification:

```bash
npm run verify:setup
```

You should see indexes like:
- `idx_payment_intent_memo`
- `idx_payment_intent_status_expires`
- `idx_payment_tx_signature`
- `idx_access_token_expires`
- etc.

---

## Troubleshooting

### "DATABASE_URL not set"
```bash
# Check your .env file has:
DATABASE_URL=postgresql://user:password@host:port/database
```

### "Prisma client not found"
```bash
cd apps/backend
npm run db:generate
```

### "psql: command not found"
Install PostgreSQL client (see Option 2 requirements above)

### "Connection refused"
- Check your database is running
- Verify `DATABASE_URL` is correct
- Check firewall/network settings

### "Permission denied"
- Verify database user has CREATE INDEX permission
- Check Supabase project settings

---

## Migration Contents

The migration (`MIGRATION_SQL.sql`) includes:

1. **Content discovery fields** (if not already added)
2. **Performance indexes**:
   - Payment Intent indexes (memo, status, expiresAt)
   - Payment indexes (txSignature, payerWallet)
   - Access Token indexes (expiresAt, merchantId)
   - Content discovery indexes (visibility, category, tags, search)
   - Analytics indexes

All indexes use `IF NOT EXISTS`, so it's safe to run multiple times.

---

## Quick Start

**Fastest method:**
```bash
cd apps/backend
npm run db:migrate:indexes
```

That's it! The script will handle everything.

---

*Choose the method that works best for your setup!*


