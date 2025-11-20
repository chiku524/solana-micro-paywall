# PowerShell script for testing optimizations on Windows
# Test Optimizations Script

$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3000/api" }

Write-Host "🧪 Testing Optimizations..." -ForegroundColor Cyan
Write-Host "API URL: $API_URL" -ForegroundColor Cyan
Write-Host ""

$testCount = 0
$passCount = 0
$failCount = 0

function Test-Optimization {
    param(
        [string]$Name,
        [scriptblock]$Command
    )
    
    $script:testCount++
    Write-Host -NoNewline "Test $testCount : $Name... "
    
    try {
        $result = & $Command
        if ($result) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red
            $script:failCount++
            return $false
        }
    } catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $script:failCount++
        return $false
    }
}

# Test 1: Health Check
Test-Optimization "Health Check" {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Content -match '"status":"ok"'
}

# Test 2: Response Compression
Test-Optimization "Response Compression" {
    $headers = @{
        "Accept-Encoding" = "gzip"
    }
    $response = Invoke-WebRequest -Uri "$API_URL/health" -Headers $headers -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Headers["Content-Encoding"] -eq "gzip"
}

# Test 3: Request ID Header
Test-Optimization "Request ID Header" {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Headers["X-Request-Id"] -ne $null
}

# Test 4: API Version Header
Test-Optimization "API Version Header" {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Headers["X-Api-Version"] -ne $null
}

# Test 5: CORS Headers
Test-Optimization "CORS Headers" {
    $headers = @{
        "Origin" = "http://localhost:3001"
    }
    $response = Invoke-WebRequest -Uri "$API_URL/health" -Headers $headers -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Headers["Access-Control-Allow-Origin"] -ne $null
}

# Test 6: Security Headers
Test-Optimization "Security Headers" {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Headers["X-Content-Type-Options"] -ne $null
}

# Test 7: Database Connection
Test-Optimization "Database Connection" {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Content -match '"database":\s*{\s*"status":\s*"ok"'
}

# Test 8: Solana RPC Connection
Test-Optimization "Solana RPC Connection" {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction SilentlyContinue
    $response.Content -match '"solana":\s*{\s*"status":\s*"ok"'
}

Write-Host ""
Write-Host "📊 Test Results:" -ForegroundColor Cyan
Write-Host "  Total: $testCount"
Write-Host "  Passed: $passCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed. Check the output above." -ForegroundColor Red
    exit 1
}

