#!/bin/bash
# Script to consolidate Workers: migrate from micropaywall-api-production to micropaywall-api

set -e

echo "🔄 Cloudflare Workers Consolidation Script"
echo "============================================"
echo ""
echo "This will consolidate Workers deployment to use 'micropaywall-api' directly"
echo "and allow you to remove 'micropaywall-api-production'"
echo ""

# Check prerequisites
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed"
    echo "   Install it with: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: Not authenticated with Cloudflare"
    echo "   Run: wrangler login"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Check current workers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ Checking current Workers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CHECK_API=false
CHECK_PROD=false

if wrangler deployments list --name micropaywall-api &>/dev/null; then
    echo "   ✅ micropaywall-api exists"
    CHECK_API=true
    echo "   📊 Recent deployments:"
    wrangler deployments list --name micropaywall-api | head -3
else
    echo "   ❌ micropaywall-api not found or has no deployments"
fi

echo ""

if wrangler deployments list --name micropaywall-api-production &>/dev/null; then
    echo "   ⚠️  micropaywall-api-production exists (will be redundant after consolidation)"
    CHECK_PROD=true
    echo "   📊 Recent deployments:"
    wrangler deployments list --name micropaywall-api-production | head -3
else
    echo "   ℹ️  micropaywall-api-production not found (may already be removed)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ Configuration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Configuration files updated:"
echo "   - apps/backend-workers/wrangler.toml"
echo "     → Removed [env.production] section"
echo "     → Production config moved to base [vars]"
echo ""
echo "   - .github/workflows/deploy-workers.yml"
echo "     → Changed: wrangler deploy --env production"
echo "     → To:      wrangler deploy"
echo ""
echo "   - apps/backend-workers/package.json"
echo "     → deploy:production script updated"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 To complete the consolidation:"
echo ""
echo "   a) Verify micropaywall-api configuration:"
echo "      → Go to: https://dash.cloudflare.com"
echo "      → Navigate: Workers & Pages → Workers → micropaywall-api"
echo "      → Verify custom domain: api.micropaywall.app is connected"
echo "      → Check Settings → Variables for production env vars"
echo ""
echo "   b) Deploy to micropaywall-api:"
echo "      → Push these changes to GitHub"
echo "      → GitHub Actions will deploy to 'micropaywall-api'"
echo "      → Or manually: cd apps/backend-workers && npm run deploy:production"
echo ""
echo "   c) Test the deployment:"
echo "      → curl https://api.micropaywall.app/health"
echo "      → Should return 200 OK"
echo ""
echo "   d) Verify micropaywall-api is working:"
echo "      → Check Cloudflare Dashboard for latest deployment"
echo "      → Test all API endpoints"
echo ""
echo "   e) Clean up micropaywall-api-production (AFTER VERIFICATION):"
echo "      → Go to: Workers & Pages → Workers → micropaywall-api-production"
echo "      → Settings → Delete Worker"
echo "      → Or run: wrangler delete micropaywall-api-production --force"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Consolidation setup complete!"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Don't delete 'micropaywall-api-production' until you verify"
echo "     that 'micropaywall-api' is working correctly"
echo "   - Verify custom domain is connected to micropaywall-api"
echo "   - Test API endpoints after deployment"
echo ""

