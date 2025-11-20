# ✅ Next Steps - Complete Setup Guide

## What's Ready

✅ **Marketplace app** - Fully implemented and dependencies installed  
✅ **Widget SDK** - React component ready to use  
✅ **Integration examples** - Code samples provided  
✅ **Environment variables** - Configured for marketplace  

## Step-by-Step Setup

### 1️⃣ Run Database Migration

**Easiest Method: Supabase SQL Editor**

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `MIGRATION_SQL.sql` (in project root)
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

The migration will:
- Add discovery fields (title, description, category, tags, etc.)
- Add visibility field (public/private/unlisted)
- Create indexes for fast queries
- Update purchase counts from existing payments

**Alternative: Command Line**
```bash
# If you have psql and DATABASE_URL set
psql $DATABASE_URL -f MIGRATION_SQL.sql
```

### 2️⃣ Start All Services

From the project root:

```bash
npm run dev
```

This will start:
- 🟦 Backend API: http://localhost:3000
- 🟩 Dashboard: http://localhost:3001
- 🟨 Marketplace: http://localhost:3002

**Or start individually:**
```bash
npm run dev:backend      # Port 3000
npm run dev:dashboard    # Port 3001
npm run dev:marketplace  # Port 3002
```

### 3️⃣ Make Your Content Public

You need to update existing content to make it discoverable. Choose one method:

#### Method A: Via Dashboard (Easiest)

1. Go to http://localhost:3001/dashboard/contents?merchantId=YOUR_MERCHANT_ID
2. Find a content you want to make public
3. Click edit (or create new content)
4. Fill in these fields:
   - **Title**: "My Premium Article"
   - **Description**: "A detailed guide on..."
   - **Category**: "article" (or "video", "course", etc.)
   - **Tags**: "solana,web3,tutorial" (comma-separated)
   - **Visibility**: Select "public"
   - **Preview Text**: "This is a preview..."
5. Click Save

#### Method B: Via API

```bash
# Get your content ID first (from dashboard or API)
CONTENT_ID="your-content-id-here"

curl -X PUT http://localhost:3000/api/contents/$CONTENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Premium Article",
    "description": "A detailed guide on Solana development",
    "category": "article",
    "tags": ["solana", "web3", "tutorial"],
    "visibility": "public",
    "previewText": "This is a preview of the content..."
  }'
```

#### Method C: Create New Public Content

```bash
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_ID",
    "slug": "premium-article",
    "priceLamports": 100000000,
    "currency": "SOL",
    "title": "Advanced Solana Development",
    "description": "Learn advanced Solana concepts and best practices",
    "category": "article",
    "tags": ["solana", "blockchain", "tutorial"],
    "visibility": "public",
    "previewText": "This article covers advanced topics in Solana development..."
  }'
```

### 4️⃣ Visit the Marketplace

Open http://localhost:3002 in your browser!

You should see:
- 🏠 Homepage with featured content
- 🔍 Discover page with search and filters
- 📄 Content detail pages
- 💰 Purchase flow with wallet integration

### 5️⃣ Test the Complete Flow

1. **Browse**: Visit http://localhost:3002
2. **Search**: Use the search bar or filters
3. **View Details**: Click on any content card
4. **Purchase**:
   - Connect your Solana wallet (Phantom, Solflare, etc.)
   - Click "Purchase with SOL"
   - Confirm transaction in wallet
5. **Access**: After payment, you'll see the full content

## 🧪 Verify Everything Works

### Test Discovery API

```bash
# Get all public contents
curl http://localhost:3000/api/discover/contents

# Get trending
curl http://localhost:3000/api/discover/trending

# Get categories
curl http://localhost:3000/api/discover/categories
```

### Test Marketplace

1. Visit http://localhost:3002
2. You should see your public content
3. Try searching and filtering
4. Click on content to view details

## 📋 Checklist

- [ ] Database migration run successfully
- [ ] All services started (backend, dashboard, marketplace)
- [ ] At least one content set to `visibility: "public"`
- [ ] Content has title, description, category, tags
- [ ] Marketplace loads at http://localhost:3002
- [ ] Can browse and view content
- [ ] Can connect wallet and purchase

## 🎯 Quick Test Script

```bash
# 1. Check backend is running
curl http://localhost:3000/api/health

# 2. Check discovery API
curl http://localhost:3000/api/discover/contents | jq

# 3. Check marketplace (should load in browser)
open http://localhost:3002
```

## 🐛 Common Issues

### "No content showing in marketplace"
- ✅ Make sure content has `visibility: "public"`
- ✅ Check backend is running: `curl http://localhost:3000/api/health`
- ✅ Verify discovery API: `curl http://localhost:3000/api/discover/contents`

### "Marketplace not loading"
- ✅ Check marketplace is running: `npm run dev:marketplace`
- ✅ Verify `.env.local` exists in `apps/marketplace/`
- ✅ Check browser console for errors

### "Payment not working"
- ✅ Ensure wallet is connected
- ✅ Check you have SOL in devnet wallet
- ✅ Verify RPC endpoint in `.env.local`

### "Migration failed"
- ✅ Check if columns already exist (migration uses `IF NOT EXISTS`)
- ✅ Verify database connection
- ✅ Check Supabase logs for errors

## 📚 Documentation

- **Quick Start**: `QUICK_START.md`
- **Integration Guide**: `docs/integration-guide.md`
- **Marketplace Docs**: `docs/MARKETPLACE_AND_WIDGET_IMPLEMENTATION.md`
- **Design Document**: `docs/discovery-and-integration-design.md`

## 🚀 You're Ready!

Once you've completed these steps, you'll have:
- ✅ A fully functional marketplace
- ✅ Content discovery system
- ✅ Purchase flow with Solana payments
- ✅ Widget SDK for integration

Happy building! 🎉


