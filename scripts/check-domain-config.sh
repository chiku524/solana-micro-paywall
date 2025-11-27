#!/bin/bash
# Quick script to check domain configuration status

set -e

echo "🔍 Checking domain configuration for micropaywall.app"
echo ""

cd "$(dirname "$0")/.."

# Check if domain is in Cloudflare
echo "1. Checking if domain is in Cloudflare zones..."
if cd apps/backend-workers && npx wrangler zones list 2>&1 | grep -qi "micropaywall.app"; then
    echo "   ✅ Domain is in Cloudflare"
    ZONE_INFO=$(cd apps/backend-workers && npx wrangler zones list 2>&1 | grep -i "micropaywall.app")
    echo "   $ZONE_INFO"
else
    echo "   ❌ Domain is NOT in Cloudflare zones"
    echo "   → Add it at: https://dash.cloudflare.com/add-site"
fi

echo ""
echo "2. Checking Workers deployment..."
cd apps/backend-workers
if npx wrangler deployments list --env production 2>&1 | grep -q "Created"; then
    echo "   ✅ Workers are deployed"
    echo "   Latest deployment:"
    npx wrangler deployments list --env production 2>&1 | head -3
else
    echo "   ❌ No deployments found"
fi

echo ""
echo "3. Checking Pages project..."
if npx wrangler pages project list 2>&1 | grep -qi "micropaywall"; then
    echo "   ✅ Pages project exists"
    npx wrangler pages project list 2>&1 | grep -i "micropaywall"
else
    echo "   ❌ Pages project not found"
fi

echo ""
echo "4. Testing endpoints..."
echo "   Testing API endpoint..."
if curl -s -f "https://micropaywall-api-production.nico.chikuji@gmail.com-s-account.workers.dev/health" > /dev/null 2>&1; then
    echo "   ✅ Workers endpoint is accessible"
else
    echo "   ⚠️  Workers endpoint test failed (this is OK if domain not configured)"
fi

echo ""
echo "✅ Configuration check complete!"
echo ""
echo "Next steps if domain is not configured:"
echo "1. Run: ./scripts/configure-domains.sh"
echo "2. Or follow the manual steps in DEPLOYMENT.md"

