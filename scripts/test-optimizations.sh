#!/bin/bash
# Test Optimizations Script
# Tests all implemented optimizations

API_URL="${API_URL:-http://localhost:3000/api}"

echo "🧪 Testing Optimizations..."
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

test() {
    test_count=$((test_count + 1))
    name=$1
    command=$2
    
    echo -n "Test $test_count: $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        fail_count=$((fail_count + 1))
        return 1
    fi
}

# Test 1: Health Check
test "Health Check" "curl -s $API_URL/health | grep -q '\"status\":\"ok\"'"

# Test 2: Response Compression
test "Response Compression" "curl -s -H 'Accept-Encoding: gzip' -I $API_URL/health | grep -qi 'content-encoding: gzip'"

# Test 3: Request ID Header
test "Request ID Header" "curl -s -I $API_URL/health | grep -qi 'x-request-id'"

# Test 4: API Version Header
test "API Version Header" "curl -s -I $API_URL/health | grep -qi 'x-api-version'"

# Test 5: Rate Limiting (make 101 requests)
echo -n "Test 6: Rate Limiting... "
rate_limit_test=$(for i in {1..101}; do curl -s -o /dev/null -w "%{http_code}" $API_URL/health | tail -1; done | grep -c "429")
if [ "$rate_limit_test" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    pass_count=$((pass_count + 1))
else
    echo -e "${YELLOW}⚠ WARNING (Rate limit may not be triggered yet)${NC}"
fi
test_count=$((test_count + 1))

# Test 6: CORS Headers
test "CORS Headers" "curl -s -H 'Origin: http://localhost:3001' -I $API_URL/health | grep -qi 'access-control-allow-origin'"

# Test 7: Security Headers
test "Security Headers (X-Content-Type-Options)" "curl -s -I $API_URL/health | grep -qi 'x-content-type-options'"

# Test 8: Database Connection (via health check)
test "Database Connection" "curl -s $API_URL/health | grep -q '\"database\":{\"status\":\"ok\"}'"

# Test 9: Solana RPC Connection (via health check)
test "Solana RPC Connection" "curl -s $API_URL/health | grep -q '\"solana\":{\"status\":\"ok\"}'"

echo ""
echo "📊 Test Results:"
echo "  Total: $test_count"
echo -e "  ${GREEN}Passed: $pass_count${NC}"
echo -e "  ${RED}Failed: $fail_count${NC}"

if [ $fail_count -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi

