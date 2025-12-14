#!/bin/bash

# Cloudflare Projects Cleanup Script (Shell version)
# 
# This script deletes old deployments and projects, then sets up the converged project
# 
# Usage:
#   bash scripts/cleanup-cloudflare-projects.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}❌ CLOUDFLARE_API_TOKEN is not set${NC}"
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo -e "${RED}❌ CLOUDFLARE_ACCOUNT_ID is not set${NC}"
  exit 1
fi

API_BASE="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}"
OLD_PAGES_PROJECT="micropaywall"
OLD_WORKER_PROJECT="micropaywall-api"

echo -e "${BLUE}🧹 Cloudflare Projects Cleanup Script${NC}"
echo "====================================="
echo ""

# Function to make API requests
api_request() {
  local method=$1
  local endpoint=$2
  local body=$3
  
  if [ -n "$body" ]; then
    curl -s -X "$method" \
      "${API_BASE}${endpoint}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -X "$method" \
      "${API_BASE}${endpoint}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

# Function to delete all deployments
delete_all_deployments() {
  local project_name=$1
  echo -e "${BLUE}📦 Fetching deployments for project: ${project_name}${NC}"
  
  local deployments=$(api_request "GET" "/pages/projects/${project_name}/deployments" | jq -r '.result[]?.id // empty')
  
  if [ -z "$deployments" ]; then
    echo -e "${GREEN}   ✅ No deployments to delete${NC}"
    return
  fi
  
  local count=$(echo "$deployments" | wc -l)
  echo -e "   Found ${count} deployments"
  
  echo "$deployments" | while read -r deployment_id; do
    if [ -n "$deployment_id" ]; then
      echo -e "   Deleting deployment ${deployment_id}..."
      local response=$(api_request "DELETE" "/pages/projects/${project_name}/deployments/${deployment_id}")
      if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Deleted deployment ${deployment_id}${NC}"
      else
        echo -e "${RED}   ❌ Failed to delete deployment ${deployment_id}${NC}"
      fi
      sleep 0.5  # Small delay to avoid rate limiting
    fi
  done
  
  echo -e "${GREEN}   ✅ Finished deleting deployments for ${project_name}${NC}"
}

# Step 1: Delete all deployments from old Pages project
echo -e "${BLUE}📋 Step 1: Deleting deployments from old Pages project${NC}"
delete_all_deployments "$OLD_PAGES_PROJECT"

# Step 2: Delete old Pages project
echo ""
echo -e "${BLUE}📋 Step 2: Deleting old Pages project${NC}"
echo -e "${YELLOW}   Attempting to delete Pages project: ${OLD_PAGES_PROJECT}${NC}"
response=$(api_request "DELETE" "/pages/projects/${OLD_PAGES_PROJECT}")
if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}   ✅ Successfully deleted Pages project: ${OLD_PAGES_PROJECT}${NC}"
elif echo "$response" | jq -e '.errors[0].code == 10007' > /dev/null 2>&1; then
  echo -e "${YELLOW}   ℹ️  Project ${OLD_PAGES_PROJECT} doesn't exist (already deleted?)${NC}"
else
  echo -e "${RED}   ❌ Failed to delete Pages project${NC}"
  echo "$response" | jq '.'
fi

# Step 3: Delete old Worker project
echo ""
echo -e "${BLUE}📋 Step 3: Deleting old Worker project${NC}"
echo -e "${YELLOW}   Attempting to delete Worker: ${OLD_WORKER_PROJECT}${NC}"
response=$(api_request "DELETE" "/workers/scripts/${OLD_WORKER_PROJECT}")
if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}   ✅ Successfully deleted Worker: ${OLD_WORKER_PROJECT}${NC}"
elif echo "$response" | jq -e '.errors[0].code == 10007' > /dev/null 2>&1; then
  echo -e "${YELLOW}   ℹ️  Worker ${OLD_WORKER_PROJECT} doesn't exist (already deleted?)${NC}"
else
  echo -e "${RED}   ❌ Failed to delete Worker${NC}"
  echo "$response" | jq '.'
fi

# Step 4: Create converged project (will be created on first deployment)
echo ""
echo -e "${BLUE}📋 Step 4: Setting up converged project${NC}"
echo -e "${GREEN}   ✅ Project will be created automatically on first deployment${NC}"
echo -e "${GREEN}   ✅ Make sure to use the new workflow: .github/workflows/deploy-converged.yml${NC}"

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. Make sure custom domains are removed from old projects"
echo "   2. Push to main branch to trigger new deployment workflow"
echo "   3. The converged project will be created automatically"
echo "   4. Verify __NEXT_DATA__ injection is working"

