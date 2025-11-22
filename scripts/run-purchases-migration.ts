import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Running Purchase/Bookmark/MerchantFollow migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../MIGRATION_PURCHASES_BOOKMARKS.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split into statements (simplified - just split on semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Add semicolon back
      
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log(`✅ [${i + 1}/${statements.length}] Statement executed successfully`);
      } catch (error: any) {
        // Check if it's a "already exists" error (which is fine for IF NOT EXISTS)
        if (error?.message?.includes('already exists') || 
            error?.message?.includes('duplicate') ||
            error?.code === '42P07' || // duplicate_table
            error?.code === '42710' || // duplicate_object
            error?.code === '42P16') { // duplicate_column
          skipCount++;
          console.log(`⚠️  [${i + 1}/${statements.length}] Skipped (already exists)`);
        } else {
          errorCount++;
          console.error(`❌ [${i + 1}/${statements.length}] Error:`, error.message);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some errors occurred. Please review them above.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

