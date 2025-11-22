#!/usr/bin/env ts-node
/**
 * Script to verify database schema
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '..', '.env') });

async function verifySchema() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const url = new URL(databaseUrl);
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
    ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check tables
    const tables = ['Merchant', 'Content', 'PaymentIntent', 'Payment', 'AccessToken'];
    console.log('📋 Checking tables:');
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    // Check foreign keys
    console.log('\n🔗 Checking foreign keys:');
    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('PaymentIntent', 'Payment', 'AccessToken')
      ORDER BY tc.table_name, kcu.column_name;
    `);
    
    fkResult.rows.forEach((row: any) => {
      console.log(`  ✅ ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Check indexes
    console.log('\n📊 Checking indexes:');
    const indexResult = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE tablename IN ('PaymentIntent', 'Payment', 'AccessToken')
      ORDER BY tablename, indexname;
    `);
    
    let currentTable = '';
    indexResult.rows.forEach((row: any) => {
      if (row.tablename !== currentTable) {
        currentTable = row.tablename;
        console.log(`  ${currentTable}:`);
      }
      console.log(`    ✅ ${row.indexname}`);
    });

    console.log('\n✨ Schema verification complete!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

verifySchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

