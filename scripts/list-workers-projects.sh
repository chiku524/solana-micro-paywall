#!/bin/bash
# Script to list all Cloudflare Workers projects and identify redundant ones

set -e

echo "🔍 Cloudflare Workers Projects Analysis"
echo "========================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed"
    echo "   Install it with: npm install -g wrangler"
    exit 1
fi

echo "1️⃣ Checking authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: Not authenticated with Cloudflare"
    echo "   Run: wrangler login"
    exit 1
fi
echo "   ✅ Authenticated"
echo ""

echo "2️⃣ Listing all Workers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
wrangler deployments list --name micropaywall-api 2>/dev/null || echo "   No deployments found for micropaywall-api"
echo ""

echo "3️⃣ Checking Workers service details..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Try to get details for different possible names
WORKERS=("micropaywall-api" "micropaywall-api-production" "micropaywall-api-staging")

for worker in "${WORKERS[@]}"; do
    echo ""
    echo "📦 Checking: $worker"
    echo "────────────────────────────────────────────────────────────────────────────"
    
    # Check if worker exists and get its details
    if wrangler deployments list --name "$worker" &>/dev/null; then
        echo "   ✅ Worker exists: $worker"
        
        # Get deployment details
        echo "   📊 Recent deployments:"
        wrangler deployments list --name "$worker" --format json 2>/dev/null | head -5 || echo "      Could not list deployments"
        
        # Check for routes
        echo "   🔗 Routes:"
        wrangler deployments list --name "$worker" 2>/dev/null | grep -i route || echo "      No routes found"
        
        # Check for custom domains
        echo "   🌐 Custom domains:"
        # This requires API access - will be in Cloudflare dashboard
        echo "      Check dashboard: Workers & Pages → $worker → Settings → Triggers"
    else
        echo "   ❌ Worker not found or no deployments: $worker"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "4️⃣ Analysis Summary:"
echo ""
echo "   Check Cloudflare Dashboard for detailed information:"
echo "   → https://dash.cloudflare.com"
echo "   → Navigate to: Workers & Pages → Workers"
echo ""
echo "   Look for:"
echo "   - Workers without production routes"
echo "   - Duplicate workers with similar names"
echo "   - Workers that are no longer used"
echo ""
echo "5️⃣ Recommended action:"
echo ""
echo "   If you find redundant workers, you can delete them with:"
echo "   → wrangler deployments list --name <worker-name>"
echo "   → Then manually delete via dashboard (safer) or CLI"
echo ""
echo "✅ Analysis complete!"

