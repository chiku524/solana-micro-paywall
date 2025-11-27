#!/bin/bash
# Script to clean build output before Cloudflare Pages deployment
# Removes cache files and files exceeding 25MB size limit

set -e

echo "🧹 Cleaning build output for Cloudflare Pages deployment..."

# Remove cache directories
echo "Removing cache directories..."
rm -rf .next/cache 2>/dev/null || true
rm -rf cache 2>/dev/null || true
rm -rf .cache 2>/dev/null || true

# Remove webpack cache files
echo "Removing webpack cache files..."
find .next -type d -name "cache" -exec rm -rf {} + 2>/dev/null || true
find .next -path "*/cache/*" -type f -delete 2>/dev/null || true

# Remove large pack files (webpack cache)
echo "Removing large pack files..."
find .next -name "*.pack" -type f -delete 2>/dev/null || true
find cache -name "*.pack" -type f -delete 2>/dev/null || true
find . -maxdepth 1 -name "*.pack" -type f -delete 2>/dev/null || true

# Remove any files larger than 25MB (Cloudflare Pages limit)
echo "Checking for files exceeding 25MB limit..."
find .next -type f -size +25M -exec rm -f {} + 2>/dev/null || true

# Remove source maps if they're too large (optional optimization)
# find .next -name "*.map" -type f -size +10M -delete 2>/dev/null || true

echo "✅ Build output cleaned successfully"
echo ""
echo "Remaining directory structure:"
du -sh .next 2>/dev/null || echo "No .next directory"
ls -lah .next 2>/dev/null | head -10 || echo "Cannot list .next"

