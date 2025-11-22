#!/usr/bin/env ts-node
/**
 * Script to run SQL file using Prisma
 * Usage: ts-node scripts/run-sql-file.ts <sql-file-path>
 */

import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function runSqlFile(filePath: string) {
  try {
    console.log(`📖 Reading SQL file: ${filePath}`);
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log('🔄 Executing SQL...\n');
    
    // Split SQL by semicolons and execute each statement
    // Note: Prisma's $executeRaw doesn't support multiple statements well,
    // so we'll use $executeRawUnsafe for the entire file
    const result = await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ SQL executed successfully!');
    console.log(`📊 Result: ${result}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get file path from command line arguments
const sqlFile = process.argv[2] || 'MERCHANT_PAYMENTS_ACCESS_SCHEMA_FIXED.sql';

if (!sqlFile) {
  console.error('❌ Please provide a SQL file path');
  console.log('Usage: ts-node scripts/run-sql-file.ts <sql-file-path>');
  process.exit(1);
}

runSqlFile(sqlFile)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });

