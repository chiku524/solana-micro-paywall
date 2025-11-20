#!/usr/bin/env ts-node
/**
 * Database Migration Runner
 * Runs MIGRATION_SQL.sql via Prisma
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Running database migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../MIGRATION_SQL.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Remove comments and split into statements
    // Handle multi-line statements properly
    const lines = sql.split('\n');
    let currentStatement = '';
    const statements: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and full-line comments
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }
      
      // Remove inline comments
      const withoutComments = trimmed.split('--')[0].trim();
      if (!withoutComments) continue;
      
      currentStatement += withoutComments + ' ';
      
      // If line ends with semicolon, it's the end of a statement
      if (trimmed.endsWith(';')) {
        const statement = currentStatement.trim();
        if (statement.length > 0 && statement !== ';') {
          statements.push(statement);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement (without semicolon)
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.length === 0) {
        continue;
      }

      try {
        // Use Prisma's $executeRawUnsafe for DDL statements
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        // Extract statement type for logging
        const statementType = statement.split(/\s+/)[0].toUpperCase();
        const tableName = statement.match(/ON\s+"?(\w+)"?/i)?.[1] || 
                         statement.match(/TABLE\s+"?(\w+)"?/i)?.[1] || 
                         'unknown';
        console.log(`✅ [${i + 1}/${statements.length}] ${statementType} on ${tableName} - Success`);
      } catch (error: any) {
        // Check if it's a "already exists" error (which is fine for IF NOT EXISTS)
        if (error?.message?.includes('already exists') || 
            error?.message?.includes('duplicate') ||
            error?.code === '42P07' || // duplicate_table
            error?.code === '42710' || // duplicate_object
            error?.code === '42P16') { // duplicate_column
          skipCount++;
          const statementType = statement.split(/\s+/)[0].toUpperCase();
          console.log(`⚠️  [${i + 1}/${statements.length}] ${statementType} - Skipped (already exists)`);
        } else {
          errorCount++;
          const statementType = statement.split(/\s+/)[0].toUpperCase();
          console.error(`❌ [${i + 1}/${statements.length}] ${statementType} - Error:`, error.message);
          // Show first 100 chars of statement for debugging
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. Check the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

    // Verify indexes were created
    console.log('\n🔍 Verifying indexes...');
    try {
      const indexes = await prisma.$queryRaw<Array<{ indexname: string; tablename: string }>>`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename IN ('PaymentIntent', 'Payment', 'AccessToken', 'Content')
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `;

      if (indexes.length > 0) {
        console.log(`✅ Found ${indexes.length} performance indexes:`);
        indexes.forEach(idx => {
          console.log(`   - ${idx.indexname} on ${idx.tablename}`);
        });
      } else {
        console.log('⚠️  No performance indexes found. Migration may have failed.');
      }
    } catch (error) {
      console.log('⚠️  Could not verify indexes:', error instanceof Error ? error.message : 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

