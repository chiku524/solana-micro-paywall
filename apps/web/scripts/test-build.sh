#!/bin/bash
# Script to test Cloudflare Pages build locally before pushing to GitHub
# This helps catch build errors before they reach CI/CD

set -e

echo "🧪 Testing Cloudflare Pages build locally..."
echo ""

# Navigate to web app directory
cd "$(dirname "$0")/.."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from apps/web directory"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Set environment variables for build (matching GitHub Actions)
export SKIP_SENTRY='true'
export NEXT_PUBLIC_API_URL='https://api.micropaywall.app'
export NEXT_PUBLIC_SOLANA_RPC='https://api.devnet.solana.com'
export NEXT_PUBLIC_SOLANA_RPC_MAINNET='https://api.mainnet-beta.solana.com'
export NEXT_PUBLIC_SOLANA_NETWORK='devnet'
export NEXT_PUBLIC_WEB_URL='https://micropaywall.app'
export NEXT_CACHE='false'
export WEBPACK_CACHE='false'

echo "🔨 Running Cloudflare Pages build..."
echo ""

# Run the build
if npm run pages:build; then
  echo ""
  echo "✅ Build successful!"
  echo ""
  echo "📁 Build output location: .vercel/output"
  
  # Check if output directory exists and has expected structure
  if [ -d ".vercel/output" ]; then
    echo ""
    echo "📂 Verifying output structure..."
    
    if [ -d ".vercel/output/static" ]; then
      echo "  ✅ Static directory found"
    else
      echo "  ⚠️  Warning: Static directory not found"
    fi
    
    if [ -d ".vercel/output/functions" ]; then
      echo "  ✅ Functions directory found"
    else
      echo "  ⚠️  Warning: Functions directory not found"
    fi
    
    echo ""
    echo "📊 Build output size:"
    du -sh .vercel/output 2>/dev/null || echo "  Could not determine size"
  else
    echo "  ⚠️  Warning: Output directory not found"
  fi
  
  echo ""
  echo "✨ All checks passed! Ready to deploy."
  exit 0
else
  echo ""
  echo "❌ Build failed!"
  echo ""
  echo "Please fix the errors above before pushing to GitHub."
  exit 1
fi

