#!/bin/bash
# Diagnostic script to check why micropaywall.app is showing 404

echo "🔍 Diagnosing 404 issue for micropaywall.app"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1️⃣ Checking DNS resolution..."
if command -v dig &> /dev/null; then
  echo "   Checking micropaywall.app..."
  dig +short micropaywall.app | head -1
  echo ""
elif command -v nslookup &> /dev/null; then
  echo "   Checking micropaywall.app..."
  nslookup micropaywall.app | grep -A 1 "Name:" || echo "   Could not resolve"
  echo ""
else
  echo "   ⚠️  dig/nslookup not available, skipping DNS check"
fi

echo "2️⃣ Testing domain responses..."
echo ""
echo "   Testing micropaywall.app:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://micropaywall.app 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $HTTP_CODE (OK)${NC}"
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "   ${RED}❌ Status: $HTTP_CODE (Not Found)${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
  echo -e "   ${YELLOW}⚠️  Status: Connection failed or timeout${NC}"
else
  echo -e "   ${YELLOW}⚠️  Status: $HTTP_CODE${NC}"
fi

echo ""
echo "   Testing micropaywall.pages.dev (Pages subdomain):"
PAGES_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://micropaywall.pages.dev 2>/dev/null)
if [ "$PAGES_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $PAGES_CODE (OK)${NC}"
elif [ "$PAGES_CODE" = "404" ]; then
  echo -e "   ${RED}❌ Status: $PAGES_CODE (Not Found)${NC}"
elif [ "$PAGES_CODE" = "000" ]; then
  echo -e "   ${YELLOW}⚠️  Connection failed or timeout${NC}"
else
  echo -e "   ${YELLOW}⚠️  Status: $PAGES_CODE${NC}"
fi

echo ""
echo "   Testing API endpoint:"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://api.micropaywall.app/health 2>/dev/null)
if [ "$API_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $API_CODE (OK)${NC}"
else
  echo -e "   ${YELLOW}⚠️  Status: $API_CODE${NC}"
fi

echo ""
echo "3️⃣ Checking response headers..."
echo ""
echo "   micropaywall.app headers:"
curl -s -I --max-time 10 https://micropaywall.app 2>/dev/null | head -5

echo ""
echo "4️⃣ Recommendations:"
echo ""
if [ "$PAGES_CODE" = "200" ] && [ "$HTTP_CODE" != "200" ]; then
  echo -e "   ${YELLOW}⚠️  Pages subdomain works but custom domain doesn't${NC}"
  echo "   → Custom domain may not be properly connected in Cloudflare dashboard"
  echo "   → Check: https://dash.cloudflare.com → Pages → micropaywall → Custom domains"
  echo ""
fi

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "   ${RED}❌ Getting 404 error${NC}"
  echo "   Possible causes:"
  echo "   1. Custom domain not connected to Pages project"
  echo "   2. Missing routing configuration (_routes.json)"
  echo "   3. Build output missing functions directory"
  echo "   4. Domain DNS not properly configured"
  echo ""
  echo "   Action items:"
  echo "   → Verify custom domain in Cloudflare dashboard"
  echo "   → Check deployment logs in GitHub Actions"
  echo "   → Verify .vercel/output contains functions/ directory"
  echo ""
fi

if [ "$HTTP_CODE" = "000" ]; then
  echo -e "   ${YELLOW}⚠️  Connection failed${NC}"
  echo "   → Domain may not be resolving"
  echo "   → Check DNS configuration"
  echo "   → Verify domain is added to Cloudflare"
  echo ""
fi

echo "5️⃣ Next steps:"
echo ""
echo "   To check custom domain configuration:"
echo "   → Visit: https://dash.cloudflare.com"
echo "   → Navigate to: Workers & Pages → Pages → micropaywall → Custom domains"
echo "   → Ensure 'micropaywall.app' is listed and active"
echo ""
echo "   To check deployment:"
echo "   → Visit: https://github.com/your-repo/actions"
echo "   → Check latest 'Deploy to Cloudflare Pages' workflow run"
echo ""

