# Database Migrations Guide

## Overview

Due to Supabase connection pooler limitations with DDL operations, we use a hybrid approach:
- **Manual SQL** for schema changes (run in Supabase SQL Editor)
- **Prisma Client** for application queries (works perfectly with pooler)

## Migration Workflow

### When You Change the Prisma Schema

1. **Update `schema.prisma`** with your changes

2. **Generate the migration SQL**:
   ```bash
   cd apps/backend
   npx prisma migrate dev --create-only --name your_migration_name
   ```
   This creates a migration file in `prisma/migrations/` but doesn't run it.

3. **Copy the SQL from the migration file**:
   - Open the generated migration file in `prisma/migrations/[timestamp]_your_migration_name/migration.sql`
   - Copy the SQL content

4. **Run in Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/[your-project]/editor
   - Paste and run the SQL
   - Verify it executed successfully

5. **Mark migration as applied** (optional):
   ```bash
   npx prisma migrate resolve --applied [timestamp]_your_migration_name
   ```

6. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

### Alternative: Use `prisma db push` (Development Only)

For quick development iterations, you can use:
```bash
npm run db:push
```

**Note**: This requires a direct database connection (not pooler). You may need to temporarily use the direct connection URL from Supabase.

### For Production

1. Create migration SQL manually or use `prisma migrate dev --create-only`
2. Review the SQL carefully
3. Run in Supabase SQL Editor
4. Deploy application code

## Current Setup

- ✅ Initial schema created via `manual-setup.sql`
- ✅ Prisma Client generated and working
- ✅ Application uses connection pooler (fast, efficient)

## Tips

- Always test migrations in a development/staging environment first
- Review generated SQL before running in production
- Keep migration files in version control for reference
- Use `prisma studio` to inspect database: `npm run db:studio`

