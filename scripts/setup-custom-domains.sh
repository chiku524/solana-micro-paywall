#!/bin/bash
# Automated script to configure custom domains using Cloudflare API
# Requires: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_TOKEN="${CLOUDFLARE_API_TOKEN}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
WORKER_NAME="micropaywall-api-production"
PAGES_PROJECT="micropaywall"
ZONE_NAME="micropaywall.app"
API_DOMAIN="api.micropaywall.app"

echo -e "${BLUE}🌐 Cloudflare Custom Domain Configuration${NC}"
echo ""

# Check for required environment variables
if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN environment variable is not set${NC}"
    echo ""
    echo "Please set it:"
    echo "  export CLOUDFLARE_API_TOKEN='your-api-token'"
    exit 1
fi

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set${NC}"
    echo ""
    echo "Please set it:"
    echo "  export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
    exit 1
fi

echo -e "${GREEN}✅ API credentials found${NC}"
echo ""

# Step 1: Get Zone ID
echo "Step 1: Getting Zone ID for $ZONE_NAME..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    echo -e "${RED}❌ Error: Zone not found for $ZONE_NAME${NC}"
    echo ""
    echo "Please add the domain to Cloudflare first:"
    echo "1. Go to: https://dash.cloudflare.com/add-site"
    echo "2. Enter: $ZONE_NAME"
    echo "3. Follow the setup instructions"
    exit 1
fi

echo -e "${GREEN}✅ Zone ID: $ZONE_ID${NC}"
echo ""

# Step 2: Configure Workers Custom Domain
echo "Step 2: Configuring Workers custom domain ($API_DOMAIN)..."
echo ""
echo -e "${YELLOW}⚠️  Note: Workers custom domains need to be configured via Dashboard${NC}"
echo ""
echo "To configure $API_DOMAIN:"
echo "1. Go to: https://dash.cloudflare.com/$ACCOUNT_ID/workers/services/view/$WORKER_NAME"
echo "2. Click: Settings → Triggers"
echo "3. Scroll to: Custom Domains"
echo "4. Click: Add Custom Domain"
echo "5. Enter: $API_DOMAIN"
echo ""

# Step 3: Configure Pages Custom Domain
echo "Step 3: Configuring Pages custom domain ($ZONE_NAME)..."
echo ""
echo -e "${YELLOW}⚠️  Note: Pages custom domains need to be configured via Dashboard${NC}"
echo ""
echo "To configure $ZONE_NAME:"
echo "1. Go to: https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PAGES_PROJECT"
echo "2. Click: Custom domains tab"
echo "3. Click: Set up a custom domain"
echo "4. Enter: $ZONE_NAME"
echo ""

echo -e "${GREEN}✅ Configuration guide complete!${NC}"
echo ""
echo "After configuring via Dashboard:"
echo "1. Wait 5-10 minutes for DNS propagation"
echo "2. Wait 5-15 minutes for SSL certificate provisioning"
echo "3. Test your endpoints:"
echo "   - API: curl https://$API_DOMAIN/health"
echo "   - Frontend: curl -I https://$ZONE_NAME"

