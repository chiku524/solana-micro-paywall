# Marketplace Setup Guide

## Step 1: Run Database Migration

The migration adds discovery fields to the Content table. You can run it in Supabase SQL Editor or via psql:

### Option A: Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `apps/backend/prisma/migrations/add-discovery-fields.sql`
4. Click "Run"

### Option B: Via psql

```bash
psql $DATABASE_URL -f apps/backend/prisma/migrations/add-discovery-fields.sql
```

## Step 2: Install Marketplace Dependencies

```bash
cd apps/marketplace
npm install
```

## Step 3: Environment Variables

The marketplace needs these environment variables (already created in `.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

## Step 4: Make Content Public

To make your content discoverable in the marketplace, update it with:

```bash
# Example: Update content to be public
curl -X PUT http://localhost:3000/api/contents/CONTENT_ID \
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

Or use the dashboard:
1. Go to Contents page
2. Edit a content
3. Add title, description, category, tags
4. Set visibility to "public"

## Step 5: Start All Services

From the project root:

```bash
npm run dev
```

This starts:
- Backend: http://localhost:3000
- Dashboard: http://localhost:3001
- Marketplace: http://localhost:3002

## Step 6: Test the Marketplace

1. Visit http://localhost:3002
2. Browse public content
3. Click on a content to view details
4. Connect wallet and purchase
5. Access granted content

## Troubleshooting

**Migration fails:**
- Check if columns already exist (migration uses `IF NOT EXISTS`)
- Verify database connection

**Marketplace not loading:**
- Check backend is running on port 3000
- Verify API URL in `.env.local`
- Check browser console for errors

**No content showing:**
- Make sure you have content with `visibility: "public"`
- Check backend logs for errors
- Verify discovery API endpoints are working


