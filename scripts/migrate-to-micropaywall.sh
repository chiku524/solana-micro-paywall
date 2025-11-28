#!/bin/bash
# Complete migration script: Pages project rename + Workers cleanup
# This automates the migration from 'micropaywall-pages' to 'micropaywall'

set -e

echo "🚀 Complete Cloudflare Migration Script"
echo "========================================"
echo ""
echo "This script will:"
echo "  1. Create new Pages project: micropaywall"
echo "  2. List and identify redundant Workers"
echo "  3. Update configuration files"
echo "  4. Provide cleanup instructions"
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

# Step 1: Create new Pages project
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ Creating new Pages project: micropaywall"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if wrangler pages project list | grep -q "^micropaywall$"; then
    echo "⚠️  Project 'micropaywall' already exists"
    read -p "   Delete and recreate? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   🗑️  Deleting existing project..."
        wrangler pages project delete micropaywall --force 2>/dev/null || true
        sleep 2
    else
        echo "   ❌ Skipping project creation"
        SKIP_PROJECT_CREATION=true
    fi
fi

if [ -z "$SKIP_PROJECT_CREATION" ]; then
    echo "   Creating new Pages project..."
    wrangler pages project create micropaywall --production-branch=main
    echo "   ✅ Project 'micropaywall' created"
    echo "   📍 Preview URL will be: https://micropaywall.pages.dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ Listing Workers projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

WORKERS=("micropaywall-api" "micropaywall-api-production" "micropaywall-api-staging")
PRODUCTION_WORKER="micropaywall-api-production"

echo "Checking Workers:"
echo ""

for worker in "${WORKERS[@]}"; do
    if wrangler deployments list --name "$worker" &>/dev/null; then
        if [ "$worker" = "$PRODUCTION_WORKER" ]; then
            echo "   ✅ $worker (PRODUCTION - KEEP)"
        else
            echo "   ⚠️  $worker (may be redundant)"
        fi
    else
        echo "   ❌ $worker (not found or no deployments)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ Configuration Files Update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update workflow file
WORKFLOW_FILE=".github/workflows/deploy-pages.yml"
if grep -q "projectName: micropaywall-pages" "$WORKFLOW_FILE"; then
    echo "   📝 Updating GitHub Actions workflow..."
    sed -i.bak 's/projectName: micropaywall-pages/projectName: micropaywall/g' "$WORKFLOW_FILE"
    rm -f "${WORKFLOW_FILE}.bak"
    echo "   ✅ Updated: $WORKFLOW_FILE"
else
    echo "   ℹ️  Workflow already uses 'micropaywall' or different format"
fi

# Update package.json
PACKAGE_JSON="apps/web/package.json"
if grep -q "micropaywall-pages" "$PACKAGE_JSON"; then
    echo "   📝 Updating package.json..."
    sed -i.bak 's/--project-name=micropaywall-pages/--project-name=micropaywall/g' "$PACKAGE_JSON"
    rm -f "${PACKAGE_JSON}.bak"
    echo "   ✅ Updated: $PACKAGE_JSON"
else
    echo "   ℹ️  package.json already uses 'micropaywall'"
fi

# Update wrangler.toml
WRANGLER_TOML="apps/web/wrangler.toml"
if grep -q "name = \"micropaywall-pages\"" "$WRANGLER_TOML" 2>/dev/null; then
    echo "   📝 Updating wrangler.toml..."
    sed -i.bak 's/name = "micropaywall-pages"/name = "micropaywall"/g' "$WRANGLER_TOML"
    rm -f "${WRANGLER_TOML}.bak"
    echo "   ✅ Updated: $WRANGLER_TOML"
else
    echo "   ℹ️  wrangler.toml already uses 'micropaywall'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣ Next Steps (Manual)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   📋 Complete the migration:"
echo ""
echo "   a) Connect Custom Domain to New Pages Project:"
echo "      → Go to: https://dash.cloudflare.com"
echo "      → Navigate: Workers & Pages → Pages → micropaywall"
echo "      → Click: Custom domains tab"
echo "      → Add: micropaywall.app"
echo "      → Wait 5-15 minutes for SSL certificate"
echo ""
echo "   b) Verify DNS Record:"
echo "      → Check DNS: micropaywall.app → micropaywall.pages.dev"
echo "      → Should already be configured correctly"
echo ""
echo "   c) Deploy to New Project:"
echo "      → Push these changes to GitHub"
echo "      → GitHub Actions will deploy to 'micropaywall'"
echo "      → Or manually trigger: git push origin main"
echo ""
echo "   d) Test New Deployment:"
echo "      → Preview: https://micropaywall.pages.dev"
echo "      → Custom: https://micropaywall.app"
echo ""
echo "   e) Clean Up Old Project (AFTER VERIFICATION):"
echo "      → Verify new project works correctly"
echo "      → Then delete: wrangler pages project delete micropaywall-pages --force"
echo ""
echo "   f) Clean Up Redundant Workers:"
echo "      → Run: bash scripts/cleanup-workers.sh"
echo "      → Or check dashboard: Workers & Pages → Workers"
echo "      → Delete workers without production routes"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Migration script completed!"
echo ""
echo "📝 Summary of changes:"
echo "   ✅ Created/verified: micropaywall Pages project"
echo "   ✅ Updated: .github/workflows/deploy-pages.yml"
echo "   ✅ Updated: apps/web/package.json"
echo "   ✅ Updated: apps/web/wrangler.toml"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Don't delete 'micropaywall-pages' until new project is verified"
echo "   - Connect custom domain before deleting old project"
echo "   - Test thoroughly before cleanup"

