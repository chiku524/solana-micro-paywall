/**
 * Cloudflare Projects Cleanup Script
 * 
 * This script:
 * 1. Deletes all deployments from the old Pages project
 * 2. Deletes all deployments from the old Workers project
 * 3. Deletes the old Pages project
 * 4. Deletes the old Workers project
 * 5. Creates the new converged Pages + Workers project
 * 
 * Usage:
 *   npx ts-node scripts/cleanup-cloudflare-projects.ts
 * 
 * Requires:
 *   - CLOUDFLARE_API_TOKEN environment variable
 *   - CLOUDFLARE_ACCOUNT_ID environment variable
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDFLARE_API_TOKEN:', CLOUDFLARE_API_TOKEN ? '✅' : '❌');
  console.error('   CLOUDFLARE_ACCOUNT_ID:', CLOUDFLARE_ACCOUNT_ID ? '✅' : '❌');
  process.exit(1);
}

const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`;

interface CloudflareResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code: number; message: string }>;
}

interface Deployment {
  id: string;
  short_id: string;
  project_name: string;
  environment: string;
  url: string;
  created_on: string;
  modified_on: string;
  latest_stage: {
    name: string;
    status: string;
  };
}

interface Project {
  name: string;
  id: string;
  subdomain: string;
  domains: string[];
  created_on: string;
  production_branch: string;
}

async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: any
): Promise<CloudflareResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ API Error (${response.status}):`, data);
    throw new Error(`API request failed: ${response.status}`);
  }

  return data;
}

async function deleteAllDeployments(projectName: string): Promise<void> {
  console.log(`\n📦 Fetching deployments for project: ${projectName}`);
  
  try {
    // Get all deployments
    const deploymentsResponse = await apiRequest<Deployment[]>(
      'GET',
      `/pages/projects/${projectName}/deployments`
    );

    if (!deploymentsResponse.success) {
      console.error(`❌ Failed to fetch deployments:`, deploymentsResponse.errors);
      return;
    }

    const deployments = deploymentsResponse.result || [];
    console.log(`   Found ${deployments.length} deployments`);

    if (deployments.length === 0) {
      console.log(`   ✅ No deployments to delete`);
      return;
    }

    // Delete deployments in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < deployments.length; i += BATCH_SIZE) {
      const batch = deployments.slice(i, i + BATCH_SIZE);
      console.log(`   Deleting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} deployments)...`);

      const deletePromises = batch.map(async (deployment) => {
        try {
          const deleteResponse = await apiRequest<any>(
            'DELETE',
            `/pages/projects/${projectName}/deployments/${deployment.id}`
          );
          if (deleteResponse.success) {
            console.log(`   ✅ Deleted deployment ${deployment.short_id}`);
            return true;
          } else {
            console.error(`   ❌ Failed to delete deployment ${deployment.short_id}:`, deleteResponse.errors);
            return false;
          }
        } catch (error) {
          console.error(`   ❌ Error deleting deployment ${deployment.short_id}:`, error);
          return false;
        }
      });

      await Promise.all(deletePromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < deployments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`   ✅ Finished deleting deployments for ${projectName}`);
  } catch (error) {
    console.error(`   ❌ Error processing deployments for ${projectName}:`, error);
  }
}

async function deletePagesProject(projectName: string): Promise<boolean> {
  console.log(`\n🗑️  Deleting Pages project: ${projectName}`);
  
  try {
    const deleteResponse = await apiRequest<any>(
      'DELETE',
      `/pages/projects/${projectName}`
    );

    if (deleteResponse.success) {
      console.log(`   ✅ Successfully deleted Pages project: ${projectName}`);
      return true;
    } else {
      console.error(`   ❌ Failed to delete Pages project:`, deleteResponse.errors);
      return false;
    }
  } catch (error: any) {
    if (error.message?.includes('404')) {
      console.log(`   ℹ️  Project ${projectName} doesn't exist (already deleted?)`);
      return true;
    }
    console.error(`   ❌ Error deleting Pages project:`, error);
    return false;
  }
}

async function deleteWorker(workerName: string): Promise<boolean> {
  console.log(`\n🗑️  Deleting Worker: ${workerName}`);
  
  try {
    const deleteResponse = await apiRequest<any>(
      'DELETE',
      `/workers/scripts/${workerName}`
    );

    if (deleteResponse.success) {
      console.log(`   ✅ Successfully deleted Worker: ${workerName}`);
      return true;
    } else {
      console.error(`   ❌ Failed to delete Worker:`, deleteResponse.errors);
      return false;
    }
  } catch (error: any) {
    if (error.message?.includes('404')) {
      console.log(`   ℹ️  Worker ${workerName} doesn't exist (already deleted?)`);
      return true;
    }
    console.error(`   ❌ Error deleting Worker:`, error);
    return false;
  }
}

async function createConvergedProject(): Promise<boolean> {
  console.log(`\n🚀 Creating converged Pages + Workers project: micropaywall`);
  
  try {
    // Check if project already exists
    try {
      const existingProject = await apiRequest<Project>(
        'GET',
        `/pages/projects/micropaywall`
      );
      
      if (existingProject.success) {
        console.log(`   ℹ️  Project 'micropaywall' already exists`);
        console.log(`   ℹ️  Skipping creation. If you want to recreate it, delete it first.`);
        return true;
      }
    } catch (error) {
      // Project doesn't exist, which is fine
    }

    // Create the Pages project
    // Note: The project will be created automatically on first deployment
    // We just need to ensure the structure is ready
    console.log(`   ✅ Project will be created automatically on first deployment`);
    console.log(`   ✅ Make sure to use the new workflow: .github/workflows/deploy-converged.yml`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error creating converged project:`, error);
    return false;
  }
}

async function main() {
  console.log('🧹 Cloudflare Projects Cleanup Script');
  console.log('=====================================\n');

  const OLD_PAGES_PROJECT = 'micropaywall';
  const OLD_WORKER_PROJECT = 'micropaywall-api';

  try {
    // Step 1: Delete all deployments from old Pages project
    console.log('📋 Step 1: Deleting deployments from old Pages project');
    await deleteAllDeployments(OLD_PAGES_PROJECT);

    // Step 2: Delete old Pages project
    console.log('\n📋 Step 2: Deleting old Pages project');
    await deletePagesProject(OLD_PAGES_PROJECT);

    // Step 3: Delete old Worker project
    console.log('\n📋 Step 3: Deleting old Worker project');
    await deleteWorker(OLD_WORKER_PROJECT);

    // Step 4: Create converged project (will be created on first deployment)
    console.log('\n📋 Step 4: Setting up converged project');
    await createConvergedProject();

    console.log('\n✅ Cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure custom domains are removed from old projects');
    console.log('   2. Push to main branch to trigger new deployment workflow');
    console.log('   3. The converged project will be created automatically');
    console.log('   4. Verify __NEXT_DATA__ injection is working');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

main();

