# Micro Paywall - Complete Application Specification

## Use Case & Purpose

**Micro Paywall** is a multi-chain micro-paywall and pay-per-use platform that enables publishers, creators, and API providers to monetize their content using instant blockchain payments. Supports **8 blockchains**: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, and Avalanche. The platform provides:

1. **Instant Payment Processing**: Sub-second transaction confirmations with near-zero fees
2. **Access Token System**: Short-lived JWT tokens (1-24 hours) that grant access to premium content after payment
3. **Embeddable Widget SDK**: Drop-in payment buttons that can be integrated into any website
4. **Merchant Dashboard**: Complete analytics, content management, and payment tracking
5. **Public Marketplace**: Content discovery and browsing for end users
6. **User Library**: Personal library of purchased content with access management

### Target Users

- **Publishers/Merchants**: Content creators who want to monetize articles, videos, courses, APIs, or any digital content
- **End Users/Payers**: Consumers who want to purchase and access premium content using Solana or EVM wallets
- **Developers**: Who want to integrate multi-chain payments into their applications via the Widget SDK

---

## Core Features & Functionality

### 1. Merchant Management & Authentication

#### Merchant Creation & Login
- **Create Merchant Account**: Merchants can create accounts with email and optional payout address (Solana or EVM)
- **Merchant Login**: JWT-based authentication using merchant ID
- **Merchant Profile**: Public profiles with display name, bio, avatar, social links (Twitter, Telegram, Discord, GitHub)
- **Merchant Status**: Status management (pending, active, suspended) with auto-activation for development

#### Merchant Settings
- **Payout Address Management**: Set/update wallet address for receiving payments (Solana address for Solana content; EVM `0x` address for EVM chains)
- **Webhook URL + secret**: HTTPS endpoint for signed deliveries; HMAC uses the merchant’s **`webhookSecret`** configured in settings (stored in D1)
- **Webhook Delivery Log**: Dashboard + `GET /api/merchants/me/webhook-deliveries` (merchant JWT)
- **Buyer-facing copy**: Refund policy text, support contact copy, optional support email (shown on marketplace/checkout where configured)
- **Developer API Keys**: Create/revoke keys in dashboard; use `X-Api-Key` on `POST /api/payments/create-payment-request` (and verify) for higher rate limits
- **Profile Customization**: Display name, bio, avatar, social links (Twitter, Telegram, Discord, GitHub)

**Implementation Details:**
- JWT tokens with 24-hour expiration
- Merchant ID stored in localStorage for session persistence
- URL-based merchant ID routing (`?merchantId=xxx`)
- Auto-redirect to dashboard after login/creation

---

### 2. Content Management (CRUD)

#### Create Content
- **Content Fields**:
  - Slug (unique per merchant)
  - Chain: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, or Avalanche
  - Price in smallest unit (lamports / wei) — **required baseline**; used when USD quoting is off or as fallback
  - Optional **`target_price_usd`**: if set, checkout computes native amount from cached spot rates (CoinGecko); see `GET /api/prices/quote`
  - Currency label (SOL, ETH, MATIC, etc., per chain)
  - Duration in seconds (null = one-time access, number = timed access)
  - Title, description (full body for owner; marketplace may show truncated public text until purchase)
  - Category, tags
  - Thumbnail URL
  - Visibility (public/private)
  - Preview snippet / preview text for listings
  - Optional **related content IDs** for “Related” on the content page
  - Canonical URL (optional)

#### Content Operations
- **List Content**: Paginated list of merchant's content with filtering
- **Edit Content**: Update all content fields
- **Delete Content**: Remove content (cascades to payment intents)
- **Content Analytics**: View count, purchase count per content item

**Implementation Details:**
- Form validation using Zod schemas
- React Hook Form for form management
- Modal-based create/edit UI
- Real-time updates after create/edit/delete

---

### 3. Payment System

#### Payment Request Flow
1. **Create Payment Request**: `POST /api/payments/create-payment-request` with `{ contentId }`. Optional headers: **`Idempotency-Key`** (replay-safe), **`X-Api-Key`** (merchant developer key for higher rate limits)
2. **Payment Intent**: Merchant payout address, amount (native smallest unit), memo/reference, nonce, expiration, chain; amount matches USD quote when `target_price_usd` is set
3. **Wallet Integration**: Solana: Phantom, Solflare. EVM: MetaMask, Rainbow, etc. (wagmi)
4. **Transaction Signing**: User signs (Solana Pay URL or EVM transfer deep link); EVM auto network switch where supported
5. **Payment Verification**: `POST /api/payments/verify-payment` — server verifies on-chain via chain verifier
6. **Access Token Issuance**: Short-lived access JWT after successful verification; optional webhook + merchant email on new purchase

#### Payment Verification
- **On-Chain Verification**: Chain-specific verifiers (Solana, EVM via viem)
- **Transaction Checks**:
  - Finality confirmation
  - Memo/nonce consistency
  - Destination address match
  - Amount verification
- **Fallback RPC**: Multiple RPC providers (Helius primary, QuickNode/GenesysGo fallback)
- **Rate Limiting**: 10 requests/minute for payment requests, 20/minute for verification

#### Payment States
- **Pending**: Payment request created, waiting for transaction
- **Confirmed**: Transaction verified on-chain, access token issued
- **Failed**: Transaction failed or expired
- **Refunded**: Payment refunded by merchant

**Implementation Details:**
- Solana Pay protocol for Solana; structured payload for EVM chains
- QR code generation for Solana mobile payments
- Automatic payment status polling
- Transaction signature tracking
- Payment expiration handling (default: 15 minutes)

---

### 4. Access Control & Token System

#### Access Tokens
- **JWT Tokens**: Short-lived tokens (1-24 hours) containing:
  - Merchant ID
  - Content ID
  - Wallet address
  - Expiration timestamp
  - Purchase ID

#### Access Verification
- **Check Access**: Verify if wallet has valid access token for content
- **Token Validation**: Server-side token verification
- **Expiration Handling**: Automatic token expiration after duration

#### Purchase Tracking
- **Purchase Records**: Track all purchases with:
  - Transaction signature
  - Payer wallet address
  - Content ID
  - Amount paid
  - Confirmation timestamp
  - Access expiration

**Implementation Details:**
- JWT signing with configurable expiration
- Token storage in database
- Access check API endpoint
- Shareable purchase links

---

### 5. Merchant Dashboard

#### Dashboard Overview
- **Statistics Display**:
  - Total payments (all time)
  - Today's payments
  - This week's payments
  - This month's payments
  - Total revenue (multi-chain)
  - Average payment amount
- **Recent Payments Table**: Last 10-20 payments with:
  - Transaction signature (link to Solscan)
  - Content name
  - Amount
  - Payer wallet (truncated)
  - Confirmation date

#### Analytics Page
- **Date Range Filtering**: 7 days, 30 days, 90 days, all time, custom range
- **Growth Metrics**: Percentage growth calculations (week vs today, month vs week)
- **Revenue Breakdown**: Total revenue and average payment per transaction
- **CSV Export**: Export payment data for accounting/reporting
- **Payment History Table**: Full payment history with filtering

#### Contents Management Page
- **Content List**: Table view of all merchant content
- **Create Content**: Modal form for creating new content
- **Edit Content**: Inline editing or modal for content updates
- **Delete Content**: Confirmation dialog before deletion
- **Content Stats**: View count and purchase count per item

#### Payments Page
- **Payment History**: Full list of all payments
- **Payment Details**: Transaction signatures, amounts, payers
- **Filtering**: Filter by date range, content, status

#### Settings Page
- **Profile Settings**: Display name, bio, avatar, social links
- **Payout Settings**: Payout address (Solana or EVM depending on content chains)
- **Webhooks**: Webhook URL, optional notes; delivery log (recent attempts)
- **Developer API Keys**: Create, label, revoke keys; documentation snippet for `X-Api-Key`
- **Buyer policy**: Refund/support copy, support email
- **Account / Security**: Link to security flows (2FA, password); merchant status

**Implementation Details:**
- SWR for data fetching with caching
- Real-time updates via polling
- Responsive design (mobile-friendly)
- Loading states and error handling
- Toast notifications for actions

---

### 6. Public Marketplace

#### Marketplace Homepage
- **Hero Section**: Main call-to-action and value proposition
- **Trending Content**: Top 6 trending content items (by purchase count)
- **Recent Content**: Latest 12 content items (newest first)
- **Categories Section**: Browse content by category with counts
- **Search & Discovery**: Search bar and category filters

#### Content Discovery
- **Discover Page**: Full content catalog with:
  - Sorting options (newest, oldest, price low-high, price high-low, trending)
  - Category filtering
  - Tag filtering
  - Pagination (12 items per page)
- **Content Cards**: Display:
  - Thumbnail image
  - Title and description
  - Merchant name
  - Price (chain-native: SOL, ETH, MATIC, etc.)
  - Category and tags
  - Purchase count
  - "View Details" button

#### Content Detail Page
- **Content View**: `/marketplace/content/[merchantId]/[slug]` — marketplace listing + checkout
- **Content Information**:
  - Title, public description (truncated until unlocked), full body when viewer has access or passes `?wallet=` for a wallet that already purchased
  - Merchant profile link
  - Price (USD-quoted or native), duration, chain
  - Category, tags, related content
  - Preview snippet
- **Purchase**: In-app payment widget; receipt modal on success
- **Locale**: Marketplace supports EN/ES toggle (UI copy)

#### Merchant Profile Page
- **Public Merchant Page**: `/marketplace/merchant/?merchantId=…`
- **Merchant Info**: Display name, bio, avatar, social links
- **Merchant's Content**: List of all public content from merchant
- **Content Grid**: Responsive grid of content cards

**Implementation Details:**
- Client-side data fetching
- Infinite scroll or pagination
- Responsive grid layouts
- SEO-friendly URLs
- Open Graph meta tags

---

### 7. User Library & Bookmarks

#### My Library (`/library`)
- **Purchased Content**: All content user has purchased
- **Access Status**: Show active vs expired purchases
- **Content Organization**: Group by merchant or date
- **Quick Access**: Direct links to access content
- **Purchase History**: Transaction signatures and dates

#### Bookmarks (`/bookmarks`)
- **Saved Content**: Content users have bookmarked for later
- **Bookmark Management**: Add/remove bookmarks
- **Quick Purchase**: Purchase directly from bookmarks
- **Organization**: Filter and sort bookmarks

**Implementation Details:**
- Wallet-based user identification
- LocalStorage for bookmark persistence (optional)
- API endpoints for bookmark management
- Responsive card layouts

---

### 8. Embeds & Checkout Widget

#### In-app payment widget (`payment-widget-enhanced.tsx`)
- **Chain-aware flow**: Solana Pay URL + QR path, or EVM transfer deep link
- **Wallet integration**: Solana Wallet Adapter + wagmi
- **Server-aligned memo/amount**: Uses `create-payment-request` response for signing
- **Receipt UI**: Modal summarizing purchase after successful verify

#### Hosted vanilla embed
- **Script**: Load `micropaywall-embed.js` from your deployed site (see `public/micropaywall-embed.js`)
- **Typical usage**: Inserts an iframe pointing at the marketplace content URL with configurable base URL and content path

#### React npm package
- **Package name**: `micropaywall-embed-react` (unscoped on npm)
- **Location**: `packages/micropaywall-embed-react/`
- **Role**: iframe wrapper component + props for `baseUrl`, merchant/content route

**Implementation Details:**
- Embeds rely on the same public marketplace URLs as the main app
- For custom sites, you can also call the REST API directly (`create-payment-request` → wallet sign → `verify-payment`) and store the returned access JWT

---

### 9. Discovery

- **Marketplace & discover APIs**: Under `/api/discover` (trending, recent, catalog, merchant profile payload)
- **KV caching**: List-style discover responses cached to reduce D1 load
- **Related content**: Curated per content item (IDs on content record), shown on the content page
- **Sharing**: Client-side share buttons on listings (social + copy link)

---

### 10. Analytics & Reporting

#### Merchant analytics (dashboard + API)
- **Stats & history**: `GET /api/analytics/stats` and related authenticated routes (see `workers/routes/analytics.ts`)
- **CSV export**: Export endpoints where implemented in dashboard
- **Funnel (30 days)**: `GET /api/analytics/funnel` — counts of `content_impression`, `pay_click`, `purchase_verified` by merchant and breakdown by content

#### Client/server event ingestion
- **Public track endpoint**: `POST /api/analytics/events` with body `{ eventType, contentId?, meta? }`  
  - `eventType`: `content_impression` | `pay_click` | `purchase_verified`  
  - Rate limited per IP; associates `merchantId` from `contentId` when present

#### Error monitoring
- **Optional Sentry**: Worker and browser DSNs when configured

---

### 11. Documentation

#### Documentation Page (`/docs`)
- **Integration Guide**: How to integrate the Widget SDK
- **API Documentation**: Complete API reference
- **Examples**: Code examples for common use cases
- **FAQ**: Frequently asked questions
- **Best Practices**: Recommendations for implementation

---

## Technical Architecture

### Frontend (Next.js 15 App Router)

#### Pages & Routes
- `/` - Landing page
- `/dashboard` - Merchant dashboard (requires merchantId)
- `/dashboard/contents` - Content management
- `/dashboard/payments` - Payment history
- `/dashboard/analytics` - Analytics and reporting
- `/dashboard/settings` - Merchant settings
- `/marketplace` - Marketplace homepage
- `/marketplace/discover` - Content discovery
- `/marketplace/content/[merchantId]/[slug]` - Content detail
- `/marketplace/merchant` - Merchant profile (`?merchantId=`)
- `/library` - User's purchased content
- `/bookmarks` - User's bookmarked content
- `/docs` - Documentation

#### Key Components
- **Layout Components**: Root layout, dashboard layout, marketplace layout
- **UI Components**: Buttons, modals, forms, tables, cards, skeletons
- **Feature Components**: MerchantLogin, ContentCard, PaymentWidget, Navbar
- **Utility Components**: ErrorBoundary, ToastProvider, LayoutDebugger

#### State Management
- **SWR**: Data fetching and caching
- **React Hook Form**: Form state management
- **LocalStorage**: Merchant ID persistence
- **URL State**: Merchant ID in query params

#### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Dark Theme**: Neutral color scheme (neutral-950 background, emerald accents)
- **Responsive Design**: Mobile-first approach
- **Animations**: Background animation component

---

### Backend (Cloudflare Workers + Hono)

#### API Routes (Workers + Hono)

| Prefix | Purpose |
|--------|---------|
| `/api/merchants` | Merchant CRUD, `GET /me`, `PATCH /me`, `GET /me/webhook-deliveries`, … |
| `/api/auth` | Login, JWT issuance |
| `/api/security` | 2FA, password reset, email verification flows |
| `/api/contents` | Content CRUD (merchant-scoped) |
| `/api/payments` | `POST /create-payment-request` (optional `Idempotency-Key`, `X-Api-Key`), `POST /verify-payment` |
| `/api/purchases` | Purchases, access checks, tokens |
| `/api/discover` | Public discovery, trending, merchant profile data |
| `/api/bookmarks` | Bookmarks by wallet query |
| `/api/analytics` | `POST /events`, `GET /funnel`, `GET /stats`, export routes, … |
| `/api/prices` | `GET /quote?usd=&chain=` — USD → native smallest units |
| `/api/developer-keys` | List/create/delete merchant API keys (JWT) |

**Global:** `GET /health` — D1 + KV probe. Responses include **`X-Request-Id`** for support/debugging.

#### Middleware
- **Authentication**: JWT (`authMiddleware`) on protected merchant routes
- **Rate limiting**: KV-backed limits (payments, analytics, quotes, …)
- **Caching**: Discover/list caches, fiat quote cache, payment idempotency records
- **Error handling**: Central `onError` with error id logging
- **Security headers** + CORS from `NEXT_PUBLIC_WEB_URL`

#### Database (Cloudflare D1)
Core tables include: **merchants** (webhook URL, policy fields, support email, …), **content** (chain, prices, `target_price_usd`, preview, related JSON, …), **payment_intents** (idempotency key, amounts, memo, chain), **purchases**, **bookmarks**, **merchant_api_keys**, **webhook_deliveries**, **analytics_events**. See `workers/migrations/` for authoritative schema.

#### External services
- **Solana RPC** (required for Solana): e.g. Helius
- **EVM RPCs** per chain (verifier)
- **CoinGecko** (public HTTP) for USD spot quotes
- **Resend** (optional) for email
- **KV** for rate limits, discover cache, quotes, idempotency
- **Sentry** (optional)

---

### Infrastructure

#### Deployment
- **Cloudflare Pages**: Frontend deployment
- **Cloudflare Workers**: Backend API deployment
- **Converged Deployment**: Workers + Pages in single project
- **GitHub Actions**: CI/CD pipeline

#### Environment variables

See [secrets.md](secrets.md). Frontend: `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_API_URL`. Worker: `JWT_SECRET`, RPC URLs, optional `RESEND_API_KEY`, `EMAIL_FROM`, optional `SENTRY_DSN`, plus D1/KV bindings in `wrangler.toml`.

---

## User Flows

### Merchant Flow
1. **Onboarding**: Create merchant account with email
2. **Login**: Login with merchant ID, receive JWT token
3. **Dashboard**: View stats, recent payments
4. **Create Content**: Add content with price, description, etc.
5. **Monitor**: View analytics, payment history
6. **Settings**: Update profile, payout address

### End User Flow
1. **Browse**: Discover content on marketplace
2. **View Details**: Click content card to see details
3. **Purchase**: Click "Purchase" button, connect wallet
4. **Pay**: Sign transaction in wallet
5. **Access**: Receive access token, view content
6. **Library**: Access purchased content from library

### Widget / embed integration flow
1. **Choose integration**: iframe embed (`micropaywall-embed.js` or `micropaywall-embed-react`) **or** direct REST + your own wallet UI
2. **Create intent**: `POST /api/payments/create-payment-request` with `contentId` (add `Idempotency-Key` for safe retries; `X-Api-Key` if using developer keys)
3. **Sign**: User pays via Solana Pay or EVM wallet using returned payload
4. **Verify**: `POST /api/payments/verify-payment` with transaction signature / payload
5. **Access**: Use returned JWT; optional webhook to your backend for fulfillment

---

## Key Technical Decisions

1. **Next.js App Router**: Modern React Server Components architecture
2. **Cloudflare Edge**: Deploy on Cloudflare for global edge performance
3. **Solana Pay**: Standard protocol for Solana payments; viem for EVM transaction verification
4. **JWT Tokens**: Stateless access tokens for scalability
5. **SWR**: Efficient data fetching with caching
6. **TypeScript**: Full type safety across codebase
7. **Tailwind CSS**: Rapid UI development
8. **Monorepo**: Shared packages for widget SDK and types

---

## Important Notes for Recreation

1. **Static export**: This app targets `output: 'export'`. Dynamic routes (e.g. some marketplace segments) may need `generateStaticParams` or fallbacks so `next build` succeeds — run the build after route changes.
2. **Wallet integration**: Solana Wallet Adapter + wagmi for EVM; keep chain IDs in sync with `workers/routes/payments.ts` for EVM deep links.
3. **Payment verification**: Always verify on-chain; never trust client-only checks for entitlement.
4. **Rate limiting**: Public endpoints (payments, analytics, quotes) are rate limited; use merchant API keys where appropriate.
5. **Idempotency**: Use `Idempotency-Key` on payment intent creation to avoid duplicate charges on double-submit.
6. **Access tokens**: Respect JWT expiration; re-verify or re-purchase as needed.
7. **Security**: Never expose `JWT_SECRET`, developer key secrets, or private keys in client bundles.
8. **D1 migrations**: Always apply migrations to the target environment (`local` vs `--remote`) before relying on new columns.

---

## Feature Checklist for Recreation

### Backend API
- [x] Merchant CRUD + profile/me + webhook deliveries
- [x] JWT authentication (+ security routes)
- [x] Content CRUD (multi-chain, USD fields, related)
- [x] Payment request creation (idempotency, optional API key)
- [x] Transaction verification (Solana + EVM)
- [x] Access token issuance
- [x] Purchase tracking + webhooks + optional email
- [x] Analytics events + funnel + stats
- [x] Discovery (KV-cached lists)
- [x] Bookmark API
- [x] Developer API keys
- [x] Fiat quote endpoint
- [x] Rate limiting + KV caching + request IDs

### Frontend Web App
- [x] Landing page
- [x] Merchant dashboard (contents, payments, analytics, settings)
- [x] Marketplace, discover, content detail, merchant profile
- [x] User library (purchases, bookmarks, recently viewed)
- [x] Documentation page
- [x] Payment widget + receipt; marketplace i18n (EN/ES)
- [x] Responsive design, error boundaries, loading/skeleton patterns

### Embeds
- [x] In-app payment widget
- [x] Hosted `micropaywall-embed.js`
- [x] npm `micropaywall-embed-react`

### Infrastructure
- [x] D1 schema + migrations (`workers/migrations/`)
- [x] CI/CD (GitHub Actions / Workers + Pages)
- [x] Environment configuration + secrets doc
- [ ] Optional: full static export coverage for every dynamic route (verify `next build`)
- [ ] Optional: OpenAPI / contract tests

---

This specification provides a complete overview of the Micro Paywall application. Use this as a reference when recreating the application to ensure all features and functionality are preserved.

