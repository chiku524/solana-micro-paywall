# Migration to Unified App - Progress Summary

## ✅ Completed

1. **Created unified app structure** (`apps/web/`)
   - Package.json with merged dependencies
   - Next.js configuration
   - Tailwind configuration
   - TypeScript configuration
   - Root layout with unified providers

2. **Created unified API client** (`apps/web/lib/api-client.ts`)
   - Merged dashboard and marketplace API clients
   - All endpoints available in one place

3. **Created unified providers** (`apps/web/components/app-providers.tsx`)
   - Solana wallet adapter providers
   - Works for both marketplace and dashboard

4. **Created middleware** (`apps/web/middleware.ts`)
   - Protects `/dashboard/*` routes
   - Requires merchantId in URL or cookie

5. **Created home page** (`apps/web/app/page.tsx`)
   - Unified landing page
   - Shows marketplace content
   - Links to dashboard

6. **Created marketplace components**
   - ContentCard
   - TrendingSection
   - CategoriesSection

7. **Created dashboard navbar** (`apps/web/components/dashboard/navbar.tsx`)
   - Updated to use Next.js Link components
   - Links to marketplace (seamless navigation)

## 🚧 In Progress / To Complete

### Marketplace Pages
- [ ] `/marketplace` - Marketplace home (copy from marketplace app)
- [ ] `/marketplace/discover` - Discover page with filters
- [ ] `/marketplace/content/[merchantId]/[slug]` - Content detail page
- [ ] `/marketplace/components/discover-content.tsx` - Discover component
- [ ] `/marketplace/components/content-detail.tsx` - Content detail component

### Dashboard Pages
- [ ] `/dashboard` - Main dashboard page (copy from dashboard app)
- [ ] `/dashboard/contents` - Contents management page
- [ ] `/dashboard/analytics` - Analytics page
- [ ] `/dashboard/settings` - Settings page
- [ ] `/dashboard/layout.tsx` - Dashboard layout with navbar

### Shared Pages
- [ ] `/docs` - Documentation page (merge from both apps)

## 📝 Next Steps

1. **Copy remaining pages from marketplace app:**
   ```bash
   # Marketplace pages
   - apps/marketplace/app/discover/page.tsx → apps/web/app/marketplace/discover/page.tsx
   - apps/marketplace/app/content/[merchantId]/[slug]/page.tsx → apps/web/app/marketplace/content/[merchantId]/[slug]/page.tsx
   - apps/marketplace/components/discover-content.tsx → apps/web/components/marketplace/discover-content.tsx
   - apps/marketplace/components/content-detail.tsx → apps/web/components/marketplace/content-detail.tsx
   ```

2. **Copy remaining pages from dashboard app:**
   ```bash
   # Dashboard pages
   - apps/dashboard/app/dashboard/page.tsx → apps/web/app/dashboard/page.tsx
   - apps/dashboard/app/dashboard/contents/page.tsx → apps/web/app/dashboard/contents/page.tsx
   - apps/dashboard/app/dashboard/analytics/page.tsx → apps/web/app/dashboard/analytics/page.tsx
   - apps/dashboard/app/dashboard/settings/page.tsx → apps/web/app/dashboard/settings/page.tsx
   - Create apps/web/app/dashboard/layout.tsx with Navbar
   ```

3. **Update imports in migrated files:**
   - Change `../lib/api-client` to `../../lib/api-client` (adjust paths)
   - Change `marketplaceApi` to `apiClient`
   - Update component imports

4. **Update root package.json:**
   ```json
   {
     "scripts": {
       "dev": "concurrently -n \"backend,web\" -c \"blue,green\" \"npm run dev:backend\" \"npm run dev:web\"",
       "dev:web": "npm run dev --prefix apps/web",
       // Remove dev:dashboard and dev:marketplace
     }
   }
   ```

5. **Update .env:**
   - Remove `NEXT_PUBLIC_DASHBOARD_URL` and `NEXT_PUBLIC_MARKETPLACE_URL` (no longer needed)
   - Keep `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOLANA_RPC`

6. **Install dependencies:**
   ```bash
   cd apps/web
   npm install
   ```

7. **Test the unified app:**
   ```bash
   npm run dev:web
   # Should run on http://localhost:3001
   ```

## 🎯 Benefits Achieved

- ✅ Single deployment (one Next.js app)
- ✅ Seamless navigation (no cross-app links)
- ✅ Shared components (no duplication)
- ✅ Unified API client
- ✅ Single domain/URL
- ✅ Easier maintenance

## 📋 File Structure

```
apps/web/
├── app/
│   ├── page.tsx                    # Home (marketplace + merchant login)
│   ├── layout.tsx                  # Root layout
│   ├── marketplace/
│   │   ├── page.tsx                # Marketplace home
│   │   ├── discover/
│   │   │   └── page.tsx            # Discover page
│   │   └── content/
│   │       └── [merchantId]/
│   │           └── [slug]/
│   │               └── page.tsx    # Content detail
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout (with navbar)
│   │   ├── page.tsx                # Dashboard home
│   │   ├── contents/
│   │   │   └── page.tsx            # Contents management
│   │   ├── analytics/
│   │   │   └── page.tsx            # Analytics
│   │   └── settings/
│   │       └── page.tsx            # Settings
│   └── docs/
│       └── page.tsx                # Documentation
├── components/
│   ├── app-providers.tsx           # Unified providers
│   ├── merchant-login.tsx           # Merchant login component
│   ├── marketplace/
│   │   ├── content-card.tsx
│   │   ├── trending-section.tsx
│   │   ├── categories-section.tsx
│   │   ├── discover-content.tsx
│   │   └── content-detail.tsx
│   └── dashboard/
│       └── navbar.tsx              # Dashboard navbar
├── lib/
│   └── api-client.ts               # Unified API client
└── middleware.ts                   # Auth middleware
```

## ⚠️ Important Notes

1. **Update all imports** - Paths will change when moving files
2. **Test navigation** - Ensure all links work correctly
3. **Update API calls** - Use `apiClient` instead of `marketplaceApi`
4. **Remove old apps** - After testing, can remove `apps/dashboard` and `apps/marketplace`

