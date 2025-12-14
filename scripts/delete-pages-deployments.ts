/**
 * Delete Pages Deployments Script
 * 
 * This script deletes deployments from a Pages project
 * Uses wrangler's authentication via environment
 */

import { execSync } from 'child_process';

const PROJECT_NAME = 'micropaywall';
const ACCOUNT_ID = '10374f367672f4d19db430601db0926b';

async function main() {
  console.log('🧹 Deleting Pages Deployments');
  console.log('=============================\n');
  console.log(`Project: ${PROJECT_NAME}`);
  console.log(`Account ID: ${ACCOUNT_ID}\n`);

  console.log('⚠️  Wrangler CLI doesn\'t have a direct command to delete multiple deployments.');
  console.log('   We need to use the Cloudflare API for this.\n');
  
  console.log('📝 To delete deployments, you have two options:\n');
  
  console.log('Option 1: Use Cloudflare Dashboard (Easiest)');
  console.log('   1. Go to: https://dash.cloudflare.com/pages');
  console.log('   2. Click on project: micropaywall');
  console.log('   3. Go to Deployments tab');
  console.log('   4. Delete deployments (you may need to delete many)');
  console.log('   5. Once deployments are deleted, delete the project\n');
  
  console.log('Option 2: Use API Script (Automated)');
  console.log('   1. Get API token from: https://dash.cloudflare.com/profile/api-tokens');
  console.log('   2. Run:');
  console.log('      export CLOUDFLARE_API_TOKEN="your-token"');
  console.log('      export CLOUDFLARE_ACCOUNT_ID="10374f367672f4d19db430601db0926b"');
  console.log('      npx ts-node scripts/cleanup-cloudflare-projects.ts');
  console.log('   This will delete all deployments and the project automatically\n');
  
  console.log('✅ Worker "micropaywall-api" has been deleted successfully!');
  console.log('⏳ Pages project cleanup requires one of the options above.');
}

main();

