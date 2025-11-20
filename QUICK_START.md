# Quick Start Guide - Marketplace Setup

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration

**Option A: Supabase SQL Editor (Easiest)**
1. Open your Supabase project
2. Go to SQL Editor
3. Copy the SQL from `apps/backend/prisma/migrations/add-discovery-fields.sql`
4. Paste and click "Run"

**Option B: Command Line**
```bash
# If you have psql installed
psql $DATABASE_URL -f apps/backend/prisma/migrations/add-discovery-fields.sql
```

### Step 2: Start All Services

```bash
# From project root
npm run dev
```

This starts:
- ✅ Backend API: http://localhost:3000
- ✅ Dashboard: http://localhost:3001  
- ✅ Marketplace: http://localhost:3002

### Step 3: Make Content Public

You have two options:

**Option A: Via Dashboard (Recommended)**
1. Go to http://localhost:3001/dashboard/contents?merchantId=YOUR_MERCHANT_ID
2. Click edit on a content
3. Fill in:
   - Title: "My Premium Article"
   - Description: "A detailed guide..."
   - Category: "article"
   - Tags: "solana,web3,tutorial" (comma-separated)
   - Visibility: "public"
   - Preview Text: "Preview of content..."
4. Save

**Option B: Via API**
```bash
# Replace CONTENT_ID with your actual content ID
curl -X PUT http://localhost:3000/api/contents/CONTENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Premium Article",
    "description": "A detailed guide on Solana development",
    "category": "article",
    "tags": ["solana", "web3"],
    "visibility": "public",
    "previewText": "This is a preview..."
  }'
```

### Step 4: Visit Marketplace

Open http://localhost:3002 in your browser!

You should see:
- Your public content listed
- Trending section
- Categories
- Search and filters

## 🧪 Test the Flow

1. **Browse**: Visit http://localhost:3002
2. **View Details**: Click on any content card
3. **Purchase**: 
   - Connect your Solana wallet (Phantom, Solflare, etc.)
   - Click "Purchase with SOL"
   - Confirm transaction in wallet
4. **Access**: After payment, you'll see the full content

## 📝 Example: Create Public Content

```bash
# 1. Create content (via dashboard or API)
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_ID",
    "slug": "premium-article",
    "priceLamports": 100000000,
    "currency": "SOL",
    "title": "Advanced Solana Development",
    "description": "Learn advanced Solana concepts",
    "category": "article",
    "tags": ["solana", "blockchain", "tutorial"],
    "visibility": "public",
    "previewText": "This article covers..."
  }'
```

## 🔍 Verify It Works

1. **Check Discovery API**:
```bash
curl http://localhost:3000/api/discover/contents
```

Should return your public content.

2. **Check Marketplace**:
Visit http://localhost:3002 - you should see your content!

## 🐛 Troubleshooting

**No content showing?**
- Make sure content has `visibility: "public"`
- Check backend logs: `npm run dev:backend`
- Verify API: `curl http://localhost:3000/api/discover/contents`

**Marketplace not loading?**
- Check marketplace is running: `npm run dev:marketplace`
- Verify `.env.local` has correct API URL
- Check browser console for errors

**Payment not working?**
- Ensure wallet is connected
- Check you have SOL in devnet wallet
- Verify RPC endpoint is correct

## 📚 Next Steps

- [Integration Guide](./docs/integration-guide.md)
- [Marketplace Documentation](./docs/MARKETPLACE_AND_WIDGET_IMPLEMENTATION.md)
- [Widget SDK Usage](./packages/widget-sdk/README.md)


