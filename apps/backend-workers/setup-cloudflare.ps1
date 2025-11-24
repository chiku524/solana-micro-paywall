# Cloudflare Workers Setup Script for PowerShell
# This script sets up all Cloudflare resources via terminal

Write-Host "🚀 Setting up Cloudflare Workers for micropaywall.app" -ForegroundColor Cyan
Write-Host ""

# Check if wrangler is installed
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Wrangler CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g wrangler
}

# Step 1: Login to Cloudflare
Write-Host "📝 Step 1: Login to Cloudflare" -ForegroundColor Cyan
Write-Host "This will open your browser to authenticate..."
wrangler login

# Step 2: Create D1 Database
Write-Host ""
Write-Host "📦 Step 2: Creating D1 Database..." -ForegroundColor Cyan
$dbOutput = wrangler d1 create micropaywall-db
Write-Host $dbOutput

# Extract database_id from output
$databaseId = ""
if ($dbOutput -match 'database_id = "([^"]+)"') {
    $databaseId = $matches[1]
} elseif ($dbOutput -match 'id = "([^"]+)"') {
    $databaseId = $matches[1]
}

if ([string]::IsNullOrEmpty($databaseId)) {
    Write-Host "⚠️  Could not extract database_id automatically." -ForegroundColor Yellow
    Write-Host "Please copy the database_id from the output above and update wrangler.toml manually."
} else {
    Write-Host "✅ Database ID: $databaseId" -ForegroundColor Green
    # Update wrangler.toml
    $wranglerContent = Get-Content wrangler.toml -Raw
    $wranglerContent = $wranglerContent -replace 'database_id = ""', "database_id = `"$databaseId`""
    Set-Content wrangler.toml -Value $wranglerContent
    Write-Host "✅ Updated wrangler.toml with database_id" -ForegroundColor Green
}

# Step 3: Create KV Namespace
Write-Host ""
Write-Host "💾 Step 3: Creating KV Namespace for CACHE..." -ForegroundColor Cyan
$kvOutput = wrangler kv:namespace create CACHE
Write-Host $kvOutput

# Extract KV ID
$kvId = ""
if ($kvOutput -match 'id = "([^"]+)"') {
    $kvId = $matches[1]
} elseif ($kvOutput -match 'Namespace ID: ([^\s]+)') {
    $kvId = $matches[1]
}

if ([string]::IsNullOrEmpty($kvId)) {
    Write-Host "⚠️  Could not extract KV ID automatically." -ForegroundColor Yellow
    Write-Host "Please copy the KV ID from the output above and update wrangler.toml manually."
} else {
    Write-Host "✅ KV ID: $kvId" -ForegroundColor Green
    # Update wrangler.toml
    $wranglerContent = Get-Content wrangler.toml -Raw
    $wranglerContent = $wranglerContent -replace 'id = ""  # Will be set after creating namespace', "id = `"$kvId`"  # Will be set after creating namespace"
    Set-Content wrangler.toml -Value $wranglerContent
    Write-Host "✅ Updated wrangler.toml with KV ID" -ForegroundColor Green
}

# Step 4: Create Preview KV Namespace
Write-Host ""
Write-Host "💾 Step 4: Creating Preview KV Namespace..." -ForegroundColor Cyan
$kvPreviewOutput = wrangler kv:namespace create CACHE --preview
Write-Host $kvPreviewOutput

# Extract Preview KV ID
$kvPreviewId = ""
if ($kvPreviewOutput -match 'id = "([^"]+)"') {
    $kvPreviewId = $matches[1]
} elseif ($kvPreviewOutput -match 'Namespace ID: ([^\s]+)') {
    $kvPreviewId = $matches[1]
}

if ([string]::IsNullOrEmpty($kvPreviewId)) {
    Write-Host "⚠️  Could not extract Preview KV ID automatically." -ForegroundColor Yellow
    Write-Host "Please copy the Preview KV ID from the output above and update wrangler.toml manually."
} else {
    Write-Host "✅ Preview KV ID: $kvPreviewId" -ForegroundColor Green
    # Update wrangler.toml
    $wranglerContent = Get-Content wrangler.toml -Raw
    $wranglerContent = $wranglerContent -replace 'preview_id = ""  # Will be set after creating preview namespace', "preview_id = `"$kvPreviewId`"  # Will be set after creating preview namespace"
    Set-Content wrangler.toml -Value $wranglerContent
    Write-Host "✅ Updated wrangler.toml with Preview KV ID" -ForegroundColor Green
}

# Step 5: Create Queues
Write-Host ""
Write-Host "📬 Step 5: Creating Queues..." -ForegroundColor Cyan
try {
    wrangler queues create payment-verification
} catch {
    Write-Host "⚠️  Queue 'payment-verification' may already exist" -ForegroundColor Yellow
}
try {
    wrangler queues create webhooks
} catch {
    Write-Host "⚠️  Queue 'webhooks' may already exist" -ForegroundColor Yellow
}
Write-Host "✅ Queues created" -ForegroundColor Green

# Step 6: Run Database Migration
Write-Host ""
Write-Host "🗄️  Step 6: Running Database Migration..." -ForegroundColor Cyan
wrangler d1 execute micropaywall-db --file=../../migrations/d1-schema.sql
Write-Host "✅ Database migration completed" -ForegroundColor Green

# Step 7: Set Environment Variables
Write-Host ""
Write-Host "⚙️  Step 7: Setting Environment Variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please set these environment variables in Cloudflare Dashboard:"
Write-Host "  1. Go to: https://dash.cloudflare.com/"
Write-Host "  2. Workers & Pages → micropaywall → Settings → Variables"
Write-Host "  3. Add the following:"
Write-Host ""
Write-Host "     JWT_SECRET: (generate a random string)"
Write-Host "     SOLANA_RPC_ENDPOINT: https://api.mainnet-beta.solana.com (or your RPC)"
Write-Host "     FRONTEND_URL: https://micropaywall.app"
Write-Host "     CORS_ORIGIN: https://micropaywall.app,https://www.micropaywall.app"
Write-Host ""

# Generate a JWT secret suggestion
$jwtSecret = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "💡 Suggested JWT_SECRET: $jwtSecret" -ForegroundColor Yellow
Write-Host ""

# Step 8: Connect Domain
Write-Host "🌐 Step 8: Domain Setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your domain micropaywall.app needs to be added to Cloudflare:"
Write-Host "  1. Go to: https://dash.cloudflare.com/"
Write-Host "  2. Add Site → Enter micropaywall.app"
Write-Host "  3. Follow the DNS setup instructions"
Write-Host ""
Write-Host "After domain is added, connect it to your Worker:"
Write-Host "  1. Workers & Pages → micropaywall → Settings → Triggers"
Write-Host "  2. Add Custom Domain → api.micropaywall.app"
Write-Host ""

# Step 9: Deploy
Write-Host "🚀 Step 9: Ready to Deploy!" -ForegroundColor Cyan
Write-Host ""
Write-Host "After setting environment variables, deploy with:"
Write-Host "  npm run deploy:production"
Write-Host ""
Write-Host "Or use GitHub Actions (recommended):"
Write-Host "  1. Add CLOUDFLARE_API_TOKEN to GitHub Secrets"
Write-Host "  2. Push to main branch"
Write-Host ""

Write-Host "✅ Setup complete! Check the steps above for any manual configuration needed." -ForegroundColor Green

