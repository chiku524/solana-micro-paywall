#!/bin/bash
# Script to verify deployments and provide configuration links

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying Cloudflare Deployments${NC}"
echo ""

cd "$(dirname "$0")/../apps/backend-workers"

# Get Account ID
ACCOUNT_ID=$(npx wrangler whoami 2>&1 | grep "Account ID" | awk '{print $3}' | head -1)

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${YELLOW}⚠️  Could not get Account ID${NC}"
    ACCOUNT_ID="[YOUR-ACCOUNT-ID]"
fi

echo -e "${GREEN}Account ID: $ACCOUNT_ID${NC}"
echo ""

# Check Workers deployment
echo "1. Checking Workers deployment..."
if npx wrangler deployments list --env production 2>&1 | grep -q "Created"; then
    echo -e "${GREEN}✅ Workers are deployed${NC}"
    echo "   Workers Dashboard: https://dash.cloudflare.com/$ACCOUNT_ID/workers/services/view/micropaywall-api-production"
else
    echo -e "${YELLOW}⚠️  Workers deployment not found${NC}"
fi

echo ""

# Check Pages project
echo "2. Checking Pages project..."
if npx wrangler pages project list 2>&1 | grep -qi "micropaywall"; then
    echo -e "${GREEN}✅ Pages project exists${NC}"
    echo "   Pages Dashboard: https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/micropaywall"
else
    echo -e "${YELLOW}⚠️  Pages project not found${NC}"
fi

echo ""
echo -e "${BLUE}📋 Quick Configuration Links:${NC}"
echo ""
echo "Workers Custom Domain (api.micropaywall.app):"
echo "  https://dash.cloudflare.com/$ACCOUNT_ID/workers/services/view/micropaywall-api-production/settings/triggers"
echo ""
echo "Pages Custom Domain (micropaywall.app):"
echo "  https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/micropaywall/domains"
echo ""
echo "DNS Records:"
echo "  https://dash.cloudflare.com/$ACCOUNT_ID/dns/records"
echo ""

