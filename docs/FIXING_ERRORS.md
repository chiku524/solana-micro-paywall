# Fixing Compilation Errors

## Issues Found

1. **Prisma Client Not Generated** - The new models (Purchase, Bookmark, MerchantFollow) aren't in the Prisma client yet
2. **Duplicate Import** - RecommendationsSection imported twice in marketplace page
3. **Type Errors** - Missing type annotations in some services

## Solutions

### 1. Fix Duplicate Import (Already Fixed)
✅ Removed duplicate `RecommendationsSection` import from `apps/web/app/marketplace/page.tsx`

### 2. Generate Prisma Client

**IMPORTANT**: You need to **stop the dev server** first because Prisma files are locked while it's running.

```bash
# Stop the dev server (Ctrl+C)

# Then generate Prisma client
cd apps/backend
npm run db:generate
```

If you still get file lock errors:
1. Make sure all Node processes are stopped
2. Close any IDEs that might have the files open
3. Try again

### 3. Run Database Migration

Since you're using Supabase, the recommended approach is to run the migration in Supabase SQL Editor:

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy the contents of `MIGRATION_PURCHASES_BOOKMARKS.sql`
4. Paste and run it

**OR** if you have DATABASE_URL set and want to use the script:

```bash
# Make sure DATABASE_URL is in apps/backend/.env
cd apps/backend
npx ts-node --project ../../scripts/tsconfig.json ../../scripts/run-purchases-migration.ts
```

### 4. Type Errors Fixed

✅ Added type annotations to:
- `bookmarks.service.ts` - Added `(b: any)` type
- `merchants-follow.service.ts` - Added `(f: any)` type and fixed cache return type
- `purchases.service.ts` - Added `(p: any)` type
- `recommendations.service.ts` - Added `(purchase: any)` and `(p: any)` types

## After Fixing

Once Prisma client is generated and migration is run:

1. **Restart dev server**: `npm run dev`
2. All TypeScript errors should be resolved
3. The new features will work:
   - Purchases API
   - Bookmarks API
   - Recommendations API
   - Merchant Following API

## Verification

After migration, verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Purchase', 'Bookmark', 'MerchantFollow');
```

