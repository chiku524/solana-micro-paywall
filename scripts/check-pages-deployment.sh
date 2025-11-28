#!/bin/bash
# Enhanced script to check Cloudflare Pages deployment status and structure

echo "🔍 Checking Cloudflare Pages Deployment Status"
echo ""

# Test Pages subdomain first
echo "1️⃣ Testing Pages subdomain (should work if deployment succeeded)..."
PAGES_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://micropaywall.pages.dev 2>/dev/null)
PAGES_BODY=$(curl -s --max-time 10 https://micropaywall.pages.dev 2>/dev/null | head -20)

if [ "$PAGES_CODE" = "200" ]; then
  echo "   ✅ Pages subdomain returns 200 OK"
  echo "   → Deployment is working on subdomain"
  echo ""
  echo "   First 200 chars of response:"
  echo "$PAGES_BODY" | head -5
elif [ "$PAGES_CODE" = "404" ]; then
  echo "   ❌ Pages subdomain returns 404"
  echo "   → This indicates a deployment/routing issue"
  echo "   → Check if build output includes functions directory"
elif [ "$PAGES_CODE" = "000" ]; then
  echo "   ⚠️  Connection failed"
else
  echo "   ⚠️  Status: $PAGES_CODE"
fi

echo ""
echo "2️⃣ Testing custom domain..."
CUSTOM_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://micropaywall.app 2>/dev/null)
CUSTOM_HEADERS=$(curl -s -I --max-time 10 https://micropaywall.app 2>/dev/null | head -10)

if [ "$CUSTOM_CODE" = "200" ]; then
  echo "   ✅ Custom domain returns 200 OK"
elif [ "$CUSTOM_CODE" = "404" ]; then
  echo "   ❌ Custom domain returns 404"
  echo ""
  echo "   Response headers:"
  echo "$CUSTOM_HEADERS"
  
  # Check if it's a Cloudflare 404
  if echo "$CUSTOM_HEADERS" | grep -q "cf-ray"; then
    echo ""
    echo "   → Cloudflare is serving the request (cf-ray header found)"
    echo "   → But returning 404 - likely deployment/routing issue"
  fi
else
  echo "   ⚠️  Status: $CUSTOM_CODE"
  echo "   Response headers:"
  echo "$CUSTOM_HEADERS"
fi

echo ""
echo "3️⃣ Comparison:"
if [ "$PAGES_CODE" = "200" ] && [ "$CUSTOM_CODE" = "404" ]; then
  echo "   ✅ Pages subdomain works"
  echo "   ❌ Custom domain 404s"
  echo ""
  echo "   → Issue: Custom domain configuration or routing"
  echo "   → Solution: Check Cloudflare Pages custom domain settings"
elif [ "$PAGES_CODE" = "404" ] && [ "$CUSTOM_CODE" = "404" ]; then
  echo "   ❌ Both subdomain and custom domain return 404"
  echo ""
  echo "   → Issue: Deployment or routing problem"
  echo "   → Solution: Check build output, verify functions directory exists"
elif [ "$PAGES_CODE" = "200" ] && [ "$CUSTOM_CODE" = "200" ]; then
  echo "   ✅ Both work - no issues detected!"
fi

echo ""
echo "4️⃣ Recommendations:"
echo ""
echo "   Check GitHub Actions build logs for:"
echo "   - ✅ Found functions directory (needed for routing)"
echo "   - ✅ Deployment succeeded"
echo ""
echo "   If functions directory is missing:"
echo "   → Build output structure is incorrect"
echo "   → Check @cloudflare/next-on-pages output"
echo ""

