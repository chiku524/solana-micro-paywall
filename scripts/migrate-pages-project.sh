#!/bin/bash
# Script to migrate Cloudflare Pages project from 'micropaywall-pages' to 'micropaywall'
# This will create a new project with the desired preview URL: micropaywall.pages.dev

set -e

echo "🔄 Cloudflare Pages Project Migration Script"
echo "=============================================="
echo ""
echo "This script will:"
echo "  1. List current Pages projects"
echo "  2. Create new project: micropaywall"
echo "  3. Connect custom domain: micropaywall.app"
echo "  4. Provide instructions for cleanup"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REply =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed"
    echo "   Install it with: npm install -g wrangler"
    exit 1
fi

echo ""
echo "1️⃣ Checking authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: Not authenticated with Cloudflare"
    echo "   Run: wrangler login"
    exit 1
fi
echo "   ✅ Authenticated"

echo ""
echo "2️⃣ Listing current Pages projects..."
wrangler pages project list
echo ""

echo "3️⃣ Checking if 'micropaywall' project already exists..."
if wrangler pages project list | grep -q "micropaywall$"; then
    echo "   ⚠️  Project 'micropaywall' already exists"
    read -p "   Delete and recreate? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   🗑️  Deleting existing 'micropaywall' project..."
        wrangler pages project delete micropaywall --force || echo "   ⚠️  Could not delete (may not exist or has dependencies)"
    else
        echo "   ❌ Migration cancelled - project already exists"
        exit 1
    fi
fi

echo ""
echo "4️⃣ Creating new Pages project: micropaywall..."
wrangler pages project create micropaywall --production-branch=main
echo "   ✅ Project created"

echo ""
echo "5️⃣ Next steps (manual):"
echo ""
echo "   📋 To complete the migration:"
echo ""
echo "   a) Update GitHub Actions workflow:"
echo "      - File: .github/workflows/deploy-pages.yml"
echo "      - Change: projectName: micropaywall-pages"
echo "      - To:     projectName: micropaywall"
echo ""
echo "   b) Update package.json deploy script:"
echo "      - File: apps/web/package.json"
echo "      - Change: --project-name=micropaywall-pages"
echo "      - To:     --project-name=micropaywall"
echo ""
echo "   c) Connect custom domain in Cloudflare Dashboard:"
echo "      - Go to: Workers & Pages → Pages → micropaywall → Custom domains"
echo "      - Add: micropaywall.app"
echo "      - Wait for SSL certificate provisioning (5-15 minutes)"
echo ""
echo "   d) Verify DNS record points to new project:"
echo "      - DNS CNAME: micropaywall.app → micropaywall.pages.dev"
echo "      - Should already be configured, but verify"
echo ""
echo "   e) Test the new project:"
echo "      - Preview URL: https://micropaywall.pages.dev"
echo "      - Custom domain: https://micropaywall.app"
echo ""
echo "   f) After verifying everything works, delete old project:"
echo "      - Run: wrangler pages project delete micropaywall-pages --force"
echo ""
echo "✅ Migration script completed!"
echo ""
echo "⚠️  IMPORTANT: Don't delete 'micropaywall-pages' until you verify"
echo "   the new project works correctly with the custom domain!"

