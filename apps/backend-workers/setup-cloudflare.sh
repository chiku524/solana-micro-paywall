#!/bin/bash

# Cloudflare Workers Setup Script
# This script sets up all Cloudflare resources via terminal

set -e  # Exit on error

echo "🚀 Setting up Cloudflare Workers for micropaywall.app"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Step 1: Login to Cloudflare
echo "📝 Step 1: Login to Cloudflare"
echo "This will open your browser to authenticate..."
wrangler login

# Step 2: Create D1 Database
echo ""
echo "📦 Step 2: Creating D1 Database..."
DB_OUTPUT=$(wrangler d1 create micropaywall-db)
echo "$DB_OUTPUT"

# Extract database_id from output
DATABASE_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' | head -1)
if [ -z "$DATABASE_ID" ]; then
    # Try alternative pattern
    DATABASE_ID=$(echo "$DB_OUTPUT" | grep -oP 'id = "\K[^"]+' | head -1)
fi

if [ -z "$DATABASE_ID" ]; then
    echo "⚠️  Could not extract database_id automatically."
    echo "Please copy the database_id from the output above and update wrangler.toml manually."
else
    echo "✅ Database ID: $DATABASE_ID"
    # Update wrangler.toml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/database_id = \"\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    else
        # Linux
        sed -i "s/database_id = \"\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml with database_id"
fi

# Step 3: Create KV Namespace
echo ""
echo "💾 Step 3: Creating KV Namespace for CACHE..."
KV_OUTPUT=$(wrangler kv:namespace create CACHE)
echo "$KV_OUTPUT"

# Extract KV ID
KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+' | head -1)
if [ -z "$KV_ID" ]; then
    KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'Namespace ID: \K[^ ]+' | head -1)
fi

if [ -z "$KV_ID" ]; then
    echo "⚠️  Could not extract KV ID automatically."
    echo "Please copy the KV ID from the output above and update wrangler.toml manually."
else
    echo "✅ KV ID: $KV_ID"
    # Update wrangler.toml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/id = \"\"  # Will be set after creating namespace/id = \"$KV_ID\"  # Will be set after creating namespace/" wrangler.toml
    else
        sed -i "s/id = \"\"  # Will be set after creating namespace/id = \"$KV_ID\"  # Will be set after creating namespace/" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml with KV ID"
fi

# Step 4: Create Preview KV Namespace
echo ""
echo "💾 Step 4: Creating Preview KV Namespace..."
KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create CACHE --preview)
echo "$KV_PREVIEW_OUTPUT"

# Extract Preview KV ID
KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+' | head -1)
if [ -z "$KV_PREVIEW_ID" ]; then
    KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -oP 'Namespace ID: \K[^ ]+' | head -1)
fi

if [ -z "$KV_PREVIEW_ID" ]; then
    echo "⚠️  Could not extract Preview KV ID automatically."
    echo "Please copy the Preview KV ID from the output above and update wrangler.toml manually."
else
    echo "✅ Preview KV ID: $KV_PREVIEW_ID"
    # Update wrangler.toml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/preview_id = \"\"  # Will be set after creating preview namespace/preview_id = \"$KV_PREVIEW_ID\"  # Will be set after creating preview namespace/" wrangler.toml
    else
        sed -i "s/preview_id = \"\"  # Will be set after creating preview namespace/preview_id = \"$KV_PREVIEW_ID\"  # Will be set after creating preview namespace/" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml with Preview KV ID"
fi

# Step 5: Create Queues
echo ""
echo "📬 Step 5: Creating Queues..."
wrangler queues create payment-verification || echo "⚠️  Queue 'payment-verification' may already exist"
wrangler queues create webhooks || echo "⚠️  Queue 'webhooks' may already exist"
echo "✅ Queues created"

# Step 6: Run Database Migration
echo ""
echo "🗄️  Step 6: Running Database Migration..."
wrangler d1 execute micropaywall-db --file=../../migrations/d1-schema.sql
echo "✅ Database migration completed"

# Step 7: Set Environment Variables
echo ""
echo "⚙️  Step 7: Setting Environment Variables"
echo ""
echo "Please set these environment variables in Cloudflare Dashboard:"
echo "  1. Go to: https://dash.cloudflare.com/"
echo "  2. Workers & Pages → micropaywall → Settings → Variables"
echo "  3. Add the following:"
echo ""
echo "     JWT_SECRET: (generate a random string)"
echo "     SOLANA_RPC_ENDPOINT: https://api.mainnet-beta.solana.com (or your RPC)"
echo "     FRONTEND_URL: https://micropaywall.app"
echo "     CORS_ORIGIN: https://micropaywall.app,https://www.micropaywall.app"
echo ""

# Generate a JWT secret suggestion
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || echo "generate-a-random-32-byte-hex-string")
echo "💡 Suggested JWT_SECRET: $JWT_SECRET"
echo ""

# Step 8: Connect Domain
echo "🌐 Step 8: Domain Setup"
echo ""
echo "Your domain micropaywall.app needs to be added to Cloudflare:"
echo "  1. Go to: https://dash.cloudflare.com/"
echo "  2. Add Site → Enter micropaywall.app"
echo "  3. Follow the DNS setup instructions"
echo ""
echo "After domain is added, connect it to your Worker:"
echo "  1. Workers & Pages → micropaywall → Settings → Triggers"
echo "  2. Add Custom Domain → api.micropaywall.app"
echo ""

# Step 9: Deploy
echo "🚀 Step 9: Ready to Deploy!"
echo ""
echo "After setting environment variables, deploy with:"
echo "  npm run deploy:production"
echo ""
echo "Or use GitHub Actions (recommended):"
echo "  1. Add CLOUDFLARE_API_TOKEN to GitHub Secrets"
echo "  2. Push to main branch"
echo ""

echo "✅ Setup complete! Check the steps above for any manual configuration needed."

