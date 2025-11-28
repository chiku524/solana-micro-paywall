#!/bin/bash
# Script to clean up redundant Cloudflare Workers projects
# This is a SAFE script that shows what would be deleted before actually deleting

set -e

echo "🧹 Cloudflare Workers Cleanup Script"
echo "====================================="
echo ""
echo "⚠️  WARNING: This script will help you identify and remove redundant workers"
echo "   It will NOT delete anything automatically - you must confirm each deletion"
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

echo "2️⃣ Finding all Workers projects..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# The expected production worker
PRODUCTION_WORKER="micropaywall-api-production"

# List all workers (we'll check via deployments)
echo "   Checking for workers with 'micropaywall' in the name..."
echo ""

WORKERS=("micropaywall-api" "micropaywall-api-production" "micropaywall-api-staging")

REDUNDANT_WORKERS=()

for worker in "${WORKERS[@]}"; do
    echo "📦 Checking: $worker"
    
    # Check if worker has deployments
    HAS_DEPLOYMENTS=false
    HAS_ROUTES=false
    
    if wrangler deployments list --name "$worker" &>/dev/null; then
        HAS_DEPLOYMENTS=true
        echo "   ✅ Has deployments"
        
        # Check if it's the production worker
        if [ "$worker" = "$PRODUCTION_WORKER" ]; then
            echo "   ✅ This is the PRODUCTION worker - DO NOT DELETE"
        else
            echo "   ⚠️  Potential redundant worker"
            REDUNDANT_WORKERS+=("$worker")
        fi
    else
        echo "   ❌ No deployments found"
        REDUNDANT_WORKERS+=("$worker")
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#REDUNDANT_WORKERS[@]} -eq 0 ]; then
    echo "✅ No redundant workers found!"
    echo ""
    echo "   Expected setup:"
    echo "   - micropaywall-api-production (with production routes)"
    echo ""
    exit 0
fi

echo "3️⃣ Redundant Workers Identified:"
echo ""
for worker in "${REDUNDANT_WORKERS[@]}"; do
    echo "   - $worker"
done
echo ""

echo "4️⃣ Manual Cleanup Instructions:"
echo ""
echo "   For each redundant worker above:"
echo ""
echo "   Option A: Delete via Cloudflare Dashboard (RECOMMENDED)"
echo "   ────────────────────────────────────────────────────────"
echo "   1. Go to: https://dash.cloudflare.com"
echo "   2. Navigate to: Workers & Pages → Workers"
echo "   3. Find the worker: <worker-name>"
echo "   4. Click on it → Settings → Delete Worker"
echo "   5. Confirm deletion"
echo ""
echo "   Option B: Delete via CLI (use with caution)"
echo "   ────────────────────────────────────────────"
echo "   For each worker, run:"
for worker in "${REDUNDANT_WORKERS[@]}"; do
    echo "   → wrangler delete $worker --force"
done
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Verify the worker has no production routes before deleting"
echo "   - Check custom domains and ensure they point to micropaywall-api-production"
echo "   - Make a backup/note of any important configurations"
echo ""

read -p "5️⃣ Show detailed info for each redundant worker? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    for worker in "${REDUNDANT_WORKERS[@]}"; do
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📦 Worker: $worker"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Recent deployments:"
        wrangler deployments list --name "$worker" 2>/dev/null | head -10 || echo "   (no deployments found)"
        echo ""
    done
fi

echo ""
echo "✅ Cleanup analysis complete!"
echo ""
echo "💡 Recommended order:"
echo "   1. Ensure micropaywall-api-production is working correctly"
echo "   2. Verify custom domain (api.micropaywall.app) points to production worker"
echo "   3. Delete redundant workers one at a time"
echo "   4. Test after each deletion"

