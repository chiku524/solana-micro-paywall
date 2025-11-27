#!/bin/bash
# Script to configure custom domains for Cloudflare Workers and Pages
# Domain: micropaywall.app

set -e

echo "🌐 Configuring custom domains for micropaywall.app"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if domain is in Cloudflare
echo "Step 1: Checking if domain is added to Cloudflare..."
if wrangler zones list | grep -qi "micropaywall.app"; then
    echo -e "${GREEN}✅ Domain is already in Cloudflare${NC}"
    ZONE_ID=$(wrangler zones list | grep -i "micropaywall.app" | awk '{print $1}')
    echo "Zone ID: $ZONE_ID"
else
    echo -e "${YELLOW}⚠️  Domain is NOT in Cloudflare zones${NC}"
    echo ""
    echo "You need to add the domain to Cloudflare first:"
    echo "1. Go to: https://dash.cloudflare.com/"
    echo "2. Click 'Add a Site' or 'Add Site'"
    echo "3. Enter: micropaywall.app"
    echo "4. Choose a plan (Free plan works)"
    echo "5. Follow the DNS configuration instructions"
    echo ""
    echo "After adding the domain, run this script again."
    exit 1
fi

echo ""
echo "Step 2: Checking Workers configuration..."
cd apps/backend-workers

# Check if worker exists
WORKER_NAME="micropaywall-api-production"
if wrangler deployments list --env production | grep -q "$WORKER_NAME"; then
    echo -e "${GREEN}✅ Worker is deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Worker not found. Deploying...${NC}"
    wrangler deploy --env production
fi

echo ""
echo "Step 3: Configuring custom domain for Workers API..."

# Note: Custom domains for Workers need to be configured via dashboard or API
# CLI doesn't have direct support for custom domain binding
echo -e "${YELLOW}ℹ️  Custom domains for Workers need to be configured via Cloudflare Dashboard:${NC}"
echo ""
echo "1. Go to: https://dash.cloudflare.com/"
echo "2. Navigate to: Workers & Pages → micropaywall-api → Settings → Triggers"
echo "3. Under 'Custom Domains', click 'Add Custom Domain'"
echo "4. Enter: api.micropaywall.app"
echo "5. Cloudflare will automatically configure DNS"
echo ""

# Step 4: Configure Pages custom domain
echo "Step 4: Configuring custom domain for Pages..."
echo -e "${YELLOW}ℹ️  Custom domains for Pages need to be configured via Cloudflare Dashboard:${NC}"
echo ""
echo "1. Go to: https://dash.cloudflare.com/"
echo "2. Navigate to: Workers & Pages → Pages → micropaywall"
echo "3. Click 'Custom domains' tab"
echo "4. Click 'Set up a custom domain'"
echo "5. Enter: micropaywall.app"
echo "6. Cloudflare will automatically configure DNS"
echo ""

# Step 5: Verify DNS records
echo "Step 5: Verifying DNS records..."
echo ""
echo "After configuring custom domains, verify these DNS records exist:"
echo ""
echo "For Workers API (api.micropaywall.app):"
echo "  - Type: CNAME"
echo "  - Name: api"
echo "  - Target: micropaywall-api-production.<account>.workers.dev"
echo ""
echo "For Pages (micropaywall.app):"
echo "  - Type: CNAME"
echo "  - Name: @"
echo "  - Target: micropaywall.pages.dev"
echo ""
echo "Or Cloudflare will auto-configure these when you add custom domains."
echo ""

echo -e "${GREEN}✅ Domain configuration guide completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Add domain to Cloudflare (if not done)"
echo "2. Configure custom domains via Dashboard (instructions above)"
echo "3. Wait for DNS propagation (usually 1-5 minutes)"
echo "4. Test your endpoints:"
echo "   - API: https://api.micropaywall.app/health"
echo "   - Frontend: https://micropaywall.app"

