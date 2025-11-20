#!/usr/bin/env ts-node
/**
 * Setup Verification Script
 * Verifies that all optimizations are properly configured
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../apps/backend/.env') });

const prisma = new PrismaClient();

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: VerificationResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

async function verifyDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    addResult('Database Connection', 'pass', 'Connected successfully');
    
    // Check indexes
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('PaymentIntent', 'Payment', 'AccessToken', 'Content')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;
    
    if (indexes.length >= 10) {
      addResult('Database Indexes', 'pass', `Found ${indexes.length} performance indexes`);
    } else {
      addResult('Database Indexes', 'warning', `Only found ${indexes.length} indexes. Run MIGRATION_SQL.sql`);
    }
  } catch (error) {
    addResult('Database Connection', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function verifyRedis() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    addResult('Redis Configuration', 'warning', 'REDIS_URL not set - caching disabled');
    return;
  }

  try {
    const redis = new Redis(redisUrl);
    await redis.ping();
    addResult('Redis Connection', 'pass', 'Connected successfully');
    redis.disconnect();
  } catch (error) {
    addResult('Redis Connection', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function verifySolana() {
  const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl('devnet');
  
  try {
    const connection = new Connection(rpcEndpoint, 'confirmed');
    const slot = await connection.getSlot();
    addResult('Solana RPC', 'pass', `Connected (current slot: ${slot})`);
  } catch (error) {
    addResult('Solana RPC', 'fail', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function verifyEnvironment() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const optional = ['REDIS_URL', 'SOLANA_RPC_ENDPOINT'];
  
  let allRequired = true;
  required.forEach(key => {
    if (!process.env[key]) {
      addResult(`Environment: ${key}`, 'fail', 'Missing required variable');
      allRequired = false;
    } else {
      addResult(`Environment: ${key}`, 'pass', 'Set');
    }
  });
  
  optional.forEach(key => {
    if (process.env[key]) {
      addResult(`Environment: ${key}`, 'pass', 'Set');
    } else {
      addResult(`Environment: ${key}`, 'warning', 'Not set (optional)');
    }
  });
  
  // Check JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    addResult('JWT Secret Length', 'warning', 'JWT_SECRET should be at least 32 characters');
  } else if (process.env.JWT_SECRET) {
    addResult('JWT Secret Length', 'pass', 'Sufficient length');
  }
}

function verifyDependencies() {
  try {
    require('compression');
    addResult('Dependency: compression', 'pass', 'Installed');
  } catch {
    addResult('Dependency: compression', 'fail', 'Not installed - run npm install');
  }
  
  try {
    require('@nestjs/throttler');
    addResult('Dependency: @nestjs/throttler', 'pass', 'Installed');
  } catch {
    addResult('Dependency: @nestjs/throttler', 'fail', 'Not installed - run npm install');
  }
  
  try {
    require('@nestjs/bullmq');
    addResult('Dependency: @nestjs/bullmq', 'pass', 'Installed');
  } catch {
    addResult('Dependency: @nestjs/bullmq', 'fail', 'Not installed - run npm install');
  }
  
  try {
    require('qrcode');
    addResult('Dependency: qrcode', 'pass', 'Installed');
  } catch {
    addResult('Dependency: qrcode', 'warning', 'Not installed in widget-sdk');
  }
}

async function main() {
  console.log('\n🔍 Verifying Setup...\n');
  
  verifyEnvironment();
  verifyDependencies();
  await verifyDatabase();
  await verifyRedis();
  await verifySolana();
  
  console.log('\n📊 Summary:\n');
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📈 Total: ${results.length}\n`);
  
  if (failed > 0) {
    console.log('❌ Some checks failed. Please fix the issues above.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Setup complete with warnings. Review warnings above.\n');
    process.exit(0);
  } else {
    console.log('✅ All checks passed! Setup is complete.\n');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('Error during verification:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

