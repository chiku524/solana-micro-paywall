/**
 * Cleanup Script Using Wrangler Authentication
 * 
 * This script uses wrangler's authentication to make API calls
 * No need for separate API token - uses wrangler's OAuth token
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ACCOUNT_ID = '10374f367672f4d19db430601db0926b';
const OLD_PAGES_PROJECT = 'micropaywall';
const OLD_WORKER_PROJECT = 'micropaywall-api';

// Get wrangler's OAuth token from its config
function getWranglerToken(): string | null {
  try {
    const configPath = path.join(os.homedir(), '.wrangler', 'config', 'default.toml');
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf-8');
      const match = config.match(/oauth_token\s*=\s*"([^"]+)"/);
      if (match) {
        return match[1];
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

async function apiRequest(method: string, endpoint: string, token: string): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function deleteAllDeployments(projectName: string, token: string): Promise<void> {
  console.log(`\n📦 Fetching deployments for project: ${projectName}`);
  
  try {
    const response = await apiRequest('GET', `/pages/projects/${projectName}/deployments`, token);
    const deployments = response.result || [];
    
    console.log(`   Found ${deployments.length} deployments`);

    if (deployments.length === 0) {
      console.log(`   ✅ No deployments to delete`);
      return;
    }

    // Delete deployments
    for (const deployment of deployments) {
      try {
        console.log(`   Deleting deployment ${deployment.short_id}...`);
        await apiRequest('DELETE', `/pages/projects/${projectName}/deployments/${deployment.id}`, token);
        console.log(`   ✅ Deleted deployment ${deployment.short_id}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      } catch (error: any) {
        console.error(`   ❌ Failed to delete deployment ${deployment.short_id}:`, error.message);
      }
    }

    console.log(`   ✅ Finished deleting deployments for ${projectName}`);
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.log(`   ℹ️  Project ${projectName} doesn't exist or has no deployments`);
    } else {
      console.error(`   ❌ Error:`, error.message);
    }
  }
}

async function deletePagesProject(projectName: string, token: string): Promise<boolean> {
  console.log(`\n🗑️  Deleting Pages project: ${projectName}`);
  
  try {
    await apiRequest('DELETE', `/pages/projects/${projectName}`, token);
    console.log(`   ✅ Successfully deleted Pages project: ${projectName}`);
    return true;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      console.log(`   ℹ️  Project ${projectName} doesn't exist (already deleted?)`);
      return true;
    }
    console.error(`   ❌ Failed to delete Pages project:`, error.message);
    return false;
  }
}

async function deleteWorker(workerName: string): Promise<boolean> {
  console.log(`\n🗑️  Deleting Worker: ${workerName}`);
  
  try {
    execSync(`wrangler delete ${workerName} --yes`, { stdio: 'inherit' });
    console.log(`   ✅ Successfully deleted Worker: ${workerName}`);
    return true;
  } catch (error: any) {
    if (error.message?.includes('not found') || error.status === 1) {
      console.log(`   ℹ️  Worker ${workerName} doesn't exist (already deleted?)`);
      return true;
    }
    console.error(`   ❌ Failed to delete Worker:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧹 Cloudflare Projects Cleanup Using Wrangler Auth');
  console.log('==================================================\n');

  // Try to get wrangler token
  let token = getWranglerToken();
  
  if (!token) {
    console.log('⚠️  Could not find wrangler OAuth token.');
    console.log('   Falling back to wrangler CLI commands...\n');
    
    // Use wrangler CLI for Worker deletion
    await deleteWorker(OLD_WORKER_PROJECT);
    
    console.log('\n📝 For Pages project cleanup, you have two options:');
    console.log('   1. Use Cloudflare Dashboard to delete the Pages project');
    console.log('   2. Get an API token and run:');
    console.log('      export CLOUDFLARE_API_TOKEN="your-token"');
    console.log('      export CLOUDFLARE_ACCOUNT_ID="10374f367672f4d19db430601db0926b"');
    console.log('      npx ts-node scripts/cleanup-cloudflare-projects.ts');
    return;
  }

  console.log('✅ Found wrangler authentication token\n');

  try {
    // Step 1: Delete all deployments from old Pages project
    console.log('📋 Step 1: Deleting deployments from old Pages project');
    await deleteAllDeployments(OLD_PAGES_PROJECT, token);

    // Step 2: Delete old Pages project
    console.log('\n📋 Step 2: Deleting old Pages project');
    await deletePagesProject(OLD_PAGES_PROJECT, token);

    // Step 3: Delete old Worker project
    console.log('\n📋 Step 3: Deleting old Worker project');
    await deleteWorker(OLD_WORKER_PROJECT);

    console.log('\n✅ Cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify cleanup in Cloudflare Dashboard');
    console.log('   2. Push to main branch to trigger new deployment workflow');
    console.log('   3. The converged project will be created automatically');
    console.log('   4. Verify __NEXT_DATA__ injection is working');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

main();

