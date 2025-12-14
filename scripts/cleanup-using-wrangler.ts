/**
 * Cleanup Script Using Wrangler
 * 
 * This script uses wrangler commands to clean up projects
 * It uses wrangler's authentication, so no API token needed
 */

import { execSync } from 'child_process';

const OLD_PAGES_PROJECT = 'micropaywall';
const OLD_WORKER_PROJECT = 'micropaywall-api';

function runCommand(command: string, description: string): boolean {
  try {
    console.log(`\n${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error: any) {
    if (error.status === 0) {
      // Command succeeded but might have printed warnings
      return true;
    }
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧹 Cloudflare Projects Cleanup Using Wrangler');
  console.log('==============================================\n');

  // Note: Wrangler doesn't have direct commands to delete Pages projects or deployments
  // We'll need to use the API for that, but we can check if projects exist first
  
  console.log('⚠️  Note: Wrangler CLI doesn\'t have direct commands to delete Pages projects.');
  console.log('   We\'ll need to use the Cloudflare API for full cleanup.');
  console.log('   However, we can check project status first.\n');

  // Check if Pages project exists
  console.log('📋 Checking Pages project status...');
  try {
    execSync(`wrangler pages project list`, { stdio: 'pipe' });
    console.log('   ℹ️  Pages project exists. Use API to delete deployments and project.');
  } catch (error) {
    console.log('   ℹ️  Could not list Pages projects (this is normal if using API).');
  }

  // Check if Worker exists
  console.log('\n📋 Checking Worker project status...');
  try {
    execSync(`wrangler deployments list --name ${OLD_WORKER_PROJECT}`, { stdio: 'pipe' });
    console.log(`   ℹ️  Worker ${OLD_WORKER_PROJECT} exists.`);
    console.log('   ⚠️  To delete the Worker, use: wrangler delete <worker-name>');
    console.log('   ⚠️  Or use the Cloudflare Dashboard.');
  } catch (error) {
    console.log(`   ℹ️  Worker ${OLD_WORKER_PROJECT} may not exist or is not accessible.`);
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Run the API-based cleanup script with your API token:');
  console.log('      export CLOUDFLARE_API_TOKEN="your-token"');
  console.log('      export CLOUDFLARE_ACCOUNT_ID="10374f367672f4d19db430601db0926b"');
  console.log('      npx ts-node scripts/cleanup-cloudflare-projects.ts');
  console.log('');
  console.log('   2. Or use the interactive script:');
  console.log('      bash scripts/run-cleanup-interactive.sh');
  console.log('');
  console.log('   3. Or manually delete via Cloudflare Dashboard:');
  console.log('      - Go to Workers & Pages → Delete projects');
  console.log('      - Go to Workers → Delete workers');
}

main();

