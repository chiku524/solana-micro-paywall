/**
 * Interactive Cleanup Script
 * 
 * This script prompts for Cloudflare credentials and runs the cleanup
 */

import * as readline from 'readline';
import { execSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 Cloudflare API Credentials Required\n');
  console.log('You can find these in your Cloudflare Dashboard:');
  console.log('  - API Token: https://dash.cloudflare.com/profile/api-tokens');
  console.log('  - Account ID: https://dash.cloudflare.com/ (right sidebar)\n');

  const apiToken = await question('Enter CLOUDFLARE_API_TOKEN: ');
  const accountId = await question('Enter CLOUDFLARE_ACCOUNT_ID: ');

  rl.close();

  if (!apiToken || !accountId) {
    console.error('❌ Both credentials are required');
    process.exit(1);
  }

  console.log('\n🚀 Running cleanup script...\n');

  // Set environment variables and run the cleanup script
  process.env.CLOUDFLARE_API_TOKEN = apiToken;
  process.env.CLOUDFLARE_ACCOUNT_ID = accountId;

  try {
    execSync('npx ts-node scripts/cleanup-cloudflare-projects.ts', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (error) {
    console.error('\n❌ Cleanup script failed');
    process.exit(1);
  }
}

main();

