# Solana Micro-Paywall - Complete Application Specification

## Use Case & Purpose

**Solana Micro-Paywall** is a Solana-native micro-paywall and pay-per-use platform that enables publishers, creators, and API providers to monetize their content using instant Solana blockchain payments. The platform provides:

1. **Instant Payment Processing**: Sub-second Solana transaction confirmations with near-zero fees
2. **Access Token System**: Short-lived JWT tokens (1-24 hours) that grant access to premium content after payment
3. **Embeddable Widget SDK**: Drop-in payment buttons that can be integrated into any website
4. **Merchant Dashboard**: Complete analytics, content management, and payment tracking
5. **Public Marketplace**: Content discovery and browsing for end users
6. **User Library**: Personal library of purchased content with access management

### Target Users

- **Publishers/Merchants**: Content creators who want to monetize articles, videos, courses, APIs, or any digital content
- **End Users/Payers**: Consumers who want to purchase and access premium content using Solana wallets
- **Developers**: Who want to integrate Solana payments into their applications via the Widget SDK

---

## Core Features & Functionality

### 1. Merchant Management & Authentication

#### Merchant Creation & Login
- **Create Merchant Account**: Merchants can create accounts with email and optional Solana payout address
- **Merchant Login**: JWT-based authentication using merchant ID
- **Merchant Profile**: Public profiles with display name, bio, avatar, social links (Twitter, Telegram, Discord, GitHub)
- **Merchant Status**: Status management (pending, active, suspended) with auto-activation for development

#### Merchant Settings
- **Payout Address Management**: Set/update Solana wallet address for receiving payments
- **Webhook Configuration**: Configure webhook secrets for payment notifications
- **Profile Customization**: Update display name, bio, avatar, and social links

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
  - Price in lamports (Solana's smallest unit)
  - Currency (default: SOL)
  - Duration in seconds (null = one-time access, number = timed access)
  - Title, description, category, tags
  - Thumbnail URL
  - Visibility (public/private)
  - Preview text
  - Canonical URL

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
1. **Create Payment Request**: Generate a payment intent with unique nonce
2. **Payment Intent**: Contains merchant address, amount, memo, nonce, expiration
3. **Wallet Integration**: Connect Phantom, Solflare, or other Solana wallets
4. **Transaction Signing**: User signs transaction via wallet
5. **Payment Verification**: Server verifies on-chain transaction
6. **Access Token Issuance**: JWT token issued after successful verification

#### Payment Verification
- **On-Chain Verification**: Verify transaction signature on Solana blockchain
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
- Solana Pay protocol integration
- QR code generation for mobile payments
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
  - Total revenue (SOL)
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
- **Profile Settings**: Update merchant profile information
- **Payout Settings**: Manage Solana payout address
- **Webhook Settings**: Configure webhook secrets
- **Account Management**: View merchant status and account details

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
  - Price in SOL
  - Category and tags
  - Purchase count
  - "View Details" button

#### Content Detail Page
- **Content View**: Full content details at `/marketplace/content/[merchantId]/[slug]`
- **Content Information**:
  - Full title and description
  - Merchant profile link
  - Price and duration
  - Category and tags
  - Preview text
- **Purchase Button**: Widget SDK integration for payment
- **Access Check**: Verify if user already has access

#### Merchant Profile Page
- **Public Merchant Page**: `/marketplace/merchant/[merchantId]`
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

### 8. Widget SDK

#### Payment Widget Component
- **Drop-in Button**: Simple payment button component
- **QR Code Modal**: Mobile-friendly QR code for payment
- **Wallet Integration**: Automatic wallet detection and connection
- **Payment Flow**: Complete payment request → sign → verify → token flow
- **Event System**: Event-driven architecture for payment lifecycle

#### Widget Features
- **Customizable**: Button text, theme (light/dark/auto), styling
- **Multiple Integration Methods**:
  - HTML/JavaScript (vanilla)
  - React component
  - TypeScript SDK
- **Automatic Polling**: Polls payment status until confirmed
- **Error Handling**: Comprehensive error messages and retry logic
- **Success Callbacks**: Custom callbacks for payment success

#### Widget API
```typescript
// Create payment widget
const widget = createPaymentWidget({
  containerId: 'payment-widget',
  apiUrl: 'https://api.micropaywall.app',
  buttonText: 'Unlock with Solana',
  onPaymentSuccess: (token) => { /* handle success */ },
  onPaymentError: (error) => { /* handle error */ },
});

// Render payment button
widget.renderButton({
  merchantId: 'merchant-id',
  contentId: 'content-id',
});
```

**Implementation Details:**
- Vanilla JavaScript/TypeScript
- Solana Wallet Adapter integration
- QR code generation (Solana Pay format)
- Event emitter pattern
- TypeScript definitions

---

### 9. Recommendations & Discovery

#### Recommendation System
- **Content Recommendations**: Algorithm-based content suggestions
- **Trending Content**: Content sorted by purchase count
- **Similar Content**: Content recommendations based on category/tags
- **Merchant Recommendations**: Suggest merchants based on user purchases

#### Referral System
- **Shareable Links**: Generate shareable purchase links
- **Referral Tracking**: Track referrals and commissions (if implemented)
- **Social Sharing**: Share content on social media

---

### 10. Analytics & Reporting

#### Merchant Analytics
- **Payment Analytics**: Total payments, revenue, averages
- **Content Analytics**: View counts, purchase counts per content
- **Time-based Analytics**: Daily, weekly, monthly breakdowns
- **Growth Metrics**: Percentage growth calculations
- **CSV Export**: Export payment data for external analysis

#### Event Tracking
- **Analytics Events**: Track content views, purchases, widget interactions
- **Audit Logging**: Log all payment and access events
- **Error Tracking**: Sentry integration for error monitoring

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
- `/marketplace/merchant/[merchantId]` - Merchant profile
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

#### API Routes
- `/api/merchants` - Merchant CRUD operations
- `/api/auth/login` - Merchant authentication
- `/api/contents` - Content CRUD operations
- `/api/payments/create-payment-request` - Create payment intent
- `/api/payments/verify-payment` - Verify transaction
- `/api/purchases` - Purchase management
- `/api/discover` - Content discovery
- `/api/recommendations` - Content recommendations
- `/api/bookmarks` - Bookmark management
- `/api/analytics` - Analytics endpoints

#### Middleware
- **Authentication**: JWT verification for protected routes
- **Rate Limiting**: Request rate limiting
- **Caching**: KV-based response caching
- **Error Handling**: Centralized error handling
- **Security Headers**: CORS, CSP, etc.

#### Database (Cloudflare D1)
- **Merchant Table**: Merchant accounts and profiles
- **Content Table**: Content items with metadata
- **PaymentIntent Table**: Payment requests and states
- **Purchase Table**: Completed purchases and access tokens
- **Bookmark Table**: User bookmarks (optional)

#### External Services
- **Solana RPC**: Helius (primary), QuickNode/GenesysGo (fallback)
- **KV Cache**: Cloudflare KV for caching
- **Sentry**: Error tracking and monitoring

---

### Infrastructure

#### Deployment
- **Cloudflare Pages**: Frontend deployment
- **Cloudflare Workers**: Backend API deployment
- **Converged Deployment**: Workers + Pages in single project
- **GitHub Actions**: CI/CD pipeline

#### Environment Variables
- `NEXT_PUBLIC_WEB_URL` - Frontend URL
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `JWT_SECRET` - JWT signing secret
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `HELIUS_API_KEY` - Helius API key
- Database bindings (D1, KV)

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

### Widget Integration Flow
1. **Install SDK**: Add widget SDK to website
2. **Initialize**: Create payment widget instance
3. **Render Button**: Render payment button with merchant/content IDs
4. **User Clicks**: Widget handles payment flow
5. **Callback**: Receive access token in success callback
6. **Unlock Content**: Use token to grant access

---

## Key Technical Decisions

1. **Next.js App Router**: Modern React Server Components architecture
2. **Cloudflare Edge**: Deploy on Cloudflare for global edge performance
3. **Solana Pay**: Standard protocol for Solana payments
4. **JWT Tokens**: Stateless access tokens for scalability
5. **SWR**: Efficient data fetching with caching
6. **TypeScript**: Full type safety across codebase
7. **Tailwind CSS**: Rapid UI development
8. **Monorepo**: Shared packages for widget SDK and types

---

## Important Notes for Recreation

1. **Avoid Cloudflare Pages + Next.js App Router Issues**: Consider using Vercel for Next.js deployment, or use static export if using Cloudflare Pages
2. **RSC Streaming**: Be careful with React Server Components streaming on Cloudflare - may need client components for dynamic routes
3. **Middleware HTML Injection**: If using Cloudflare middleware, ensure proper DOCTYPE and __NEXT_DATA__ injection
4. **Wallet Integration**: Use @solana/wallet-adapter for wallet support
5. **Payment Verification**: Always verify transactions on-chain, never trust client-side data
6. **Rate Limiting**: Implement rate limiting on payment endpoints to prevent abuse
7. **Error Handling**: Comprehensive error handling for blockchain operations (network issues, transaction failures)
8. **Access Token Expiration**: Implement proper token expiration and refresh logic
9. **Database Schema**: Use proper indexes for merchantId, contentId, walletAddress queries
10. **Security**: Never expose JWT secrets, API keys, or private keys in client code

---

## Feature Checklist for Recreation

### Backend API
- [ ] Merchant CRUD operations
- [ ] JWT authentication
- [ ] Content CRUD operations
- [ ] Payment request creation
- [ ] Transaction verification (on-chain)
- [ ] Access token issuance
- [ ] Purchase tracking
- [ ] Analytics endpoints
- [ ] Discovery/recommendations
- [ ] Bookmark management
- [ ] Rate limiting
- [ ] Error handling
- [ ] Caching layer

### Frontend Web App
- [ ] Landing page
- [ ] Merchant dashboard
- [ ] Content management UI
- [ ] Analytics dashboard
- [ ] Settings page
- [ ] Marketplace homepage
- [ ] Content discovery
- [ ] Content detail pages
- [ ] Merchant profile pages
- [ ] User library
- [ ] Bookmarks page
- [ ] Documentation page
- [ ] Responsive design
- [ ] Error boundaries
- [ ] Loading states

### Widget SDK
- [ ] Payment widget component
- [ ] QR code generation
- [ ] Wallet integration
- [ ] Payment flow handling
- [ ] Event system
- [ ] TypeScript definitions
- [ ] React wrapper
- [ ] Vanilla JS support

### Infrastructure
- [ ] Database schema (D1/Postgres)
- [ ] Migration scripts
- [ ] CI/CD pipeline
- [ ] Environment configuration
- [ ] Error monitoring (Sentry)
- [ ] Analytics tracking

---

This specification provides a complete overview of the Solana Micro-Paywall application. Use this as a reference when recreating the application to ensure all features and functionality are preserved.

