#!/bin/bash
# Database Migration Runner using psql
# Alternative method if Prisma method doesn't work

MIGRATION_FILE="${1:-MIGRATION_SQL.sql}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it:"
    echo "  export DATABASE_URL=postgresql://user:password@host:port/database"
    exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "🔄 Running database migration via psql..."
echo "📝 File: $MIGRATION_FILE"
echo ""

# Run the migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying indexes..."
    psql "$DATABASE_URL" -c "
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename IN ('PaymentIntent', 'Payment', 'AccessToken', 'Content')
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname;
    "
else
    echo ""
    echo "❌ Migration failed. Check the errors above."
    exit 1
fi


