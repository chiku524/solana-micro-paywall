#!/usr/bin/env ts-node
/**
 * Script to run SQL file using pg (PostgreSQL client)
 * Usage: ts-node scripts/run-sql-file-pg.ts <sql-file-path>
 */

import { readFileSync } from 'fs';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function runSqlFile(filePath: string) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse DATABASE_URL
  const url = new URL(databaseUrl);
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1), // Remove leading '/'
    user: url.username,
    password: url.password,
    ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log(`📖 Reading SQL file: ${filePath}`);
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log('🔄 Executing SQL...\n');
    
    // Listen for notices (RAISE NOTICE messages)
    client.on('notice', (msg: any) => {
      console.log(`ℹ️  ${msg.message}`);
    });
    
    // Execute the entire SQL file as a single query
    // This handles DO blocks, multiple statements, etc.
    const result = await client.query(sql);
    
    console.log('\n✅ SQL executed successfully!');
    
    if (result.command) {
      console.log(`📊 Command: ${result.command}, Rows affected: ${result.rowCount || 0}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Error executing SQL:');
    console.error('  Message:', error.message);
    if (error.position) {
      console.error('  Position:', error.position);
    }
    if (error.code) {
      console.error('  Code:', error.code);
    }
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

// Get file path from command line arguments
const sqlFile = process.argv[2] || join(__dirname, '..', 'MERCHANT_PAYMENTS_ACCESS_SCHEMA_FIXED.sql');

if (!sqlFile) {
  console.error('❌ Please provide a SQL file path');
  console.log('Usage: ts-node scripts/run-sql-file-pg.ts <sql-file-path>');
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

