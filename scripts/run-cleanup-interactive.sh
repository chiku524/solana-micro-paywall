#!/bin/bash

# Interactive Cleanup Script
# Prompts for Cloudflare credentials and runs cleanup

set -e

echo "🔐 Cloudflare API Credentials Required"
echo "======================================"
echo ""
echo "You can find these in your Cloudflare Dashboard:"
echo "  - API Token: https://dash.cloudflare.com/profile/api-tokens"
echo "  - Account ID: https://dash.cloudflare.com/ (right sidebar)"
echo ""
echo "Or use the Account ID from DEPLOYMENT.md: 10374f367672f4d19db430601db0926b"
echo ""

read -sp "Enter CLOUDFLARE_API_TOKEN: " API_TOKEN
echo ""
read -p "Enter CLOUDFLARE_ACCOUNT_ID (or press Enter for default): " ACCOUNT_ID

if [ -z "$ACCOUNT_ID" ]; then
  ACCOUNT_ID="10374f367672f4d19db430601db0926b"
  echo "Using default Account ID: $ACCOUNT_ID"
fi

if [ -z "$API_TOKEN" ] || [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Both credentials are required"
  exit 1
fi

echo ""
echo "🚀 Running cleanup script..."
echo ""

export CLOUDFLARE_API_TOKEN="$API_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"

# Run the cleanup script
if command -v npx &> /dev/null; then
  npx ts-node scripts/cleanup-cloudflare-projects.ts
else
  bash scripts/cleanup-cloudflare-projects.sh
fi

