# Content Discovery & Integration Design

## Overview

This document outlines the design for an optimal content discovery system and seamless integration mechanisms for the Solana Micro-Paywall platform.

## Architecture Goals

1. **Content Discovery**: Enable buyers to find and browse paywalled content across merchants
2. **Seamless Integration**: Provide multiple integration methods (widget, API, iframe) for merchants
3. **Flexible Embedding**: Support various use cases (blogs, docs, videos, APIs, downloads)
4. **Merchant Control**: Allow merchants to control visibility, pricing, and metadata

---

## 1. Content Discovery System

### 1.1 Enhanced Content Schema

Add metadata fields to `Content` model:

```prisma
model Content {
  // ... existing fields ...
  
  // Discovery & Presentation
  title         String?   // Human-readable title (e.g., "Advanced Solana Development Guide")
  description   String?   // Short description for listings
  thumbnailUrl  String?   // Image URL for marketplace cards
  category     String?   // Category: "article", "video", "course", "api", "download", "subscription"
  tags         String[]   // Array of tags for search/filtering
  visibility   String     @default("private") // "public", "private", "unlisted"
  
  // SEO & Sharing
  canonicalUrl  String?   // Original content URL (if hosted elsewhere)
  previewText   String?   // Free preview text (first paragraph, etc.)
  
  // Analytics
  viewCount     Int       @default(0)
  purchaseCount Int       @default(0) // Derived from payment count
}
```

### 1.2 Discovery API Endpoints

**Public Discovery Endpoints** (no auth required):

```
GET /api/discover/contents
  Query params:
    - category: string (filter by category)
    - tags: string[] (filter by tags)
    - search: string (full-text search on title/description/slug)
    - minPrice: number (in lamports)
    - maxPrice: number (in lamports)
    - currency: "SOL" | "USDC" | "PYUSD"
    - sort: "newest" | "popular" | "price_asc" | "price_desc"
    - page: number
    - limit: number
  Returns: { contents: Content[], total: number, page: number, limit: number }

GET /api/discover/contents/:id
  Returns: Full content details (if public) with merchant info

GET /api/discover/merchants/:merchantId/contents
  Returns: Public contents for a specific merchant

GET /api/discover/categories
  Returns: List of all categories with counts

GET /api/discover/trending
  Returns: Trending contents (by purchase count, view count)
```

**Merchant-Controlled Endpoints**:

```
PATCH /api/contents/:id/visibility
  Body: { visibility: "public" | "private" | "unlisted" }
  (Merchant auth required)

PATCH /api/contents/:id/metadata
  Body: { title, description, thumbnailUrl, category, tags, previewText }
  (Merchant auth required)
```

### 1.3 Marketplace Frontend

A new Next.js app: `apps/marketplace`

**Features**:
- Browse all public contents
- Search and filter by category, price, tags
- View merchant profiles
- Direct purchase flow (embedded widget)
- User account (optional) to track purchases
- Shareable content links

**Pages**:
- `/` - Homepage with featured/trending
- `/discover` - Browse all contents
- `/content/:merchantId/:slug` - Content detail page
- `/merchant/:merchantId` - Merchant profile page
- `/purchase/:merchantId/:slug` - Standalone purchase page

---

## 2. Integration Methods

### 2.1 Widget Embedding (Recommended for Most Use Cases)

**Iframe Widget** (easiest, no code changes needed):

```html
<!-- Simple embed -->
<iframe 
  src="https://paywall.example.com/widget?merchantId=xxx&slug=premium-article"
  width="100%" 
  height="400"
  frameborder="0">
</iframe>
```

**JavaScript Widget** (more control, custom styling):

```html
<script src="https://paywall.example.com/widget.js"></script>
<div id="paywall-widget"></div>
<script>
  SolanaPaywall.init({
    container: '#paywall-widget',
    merchantId: 'xxx',
    slug: 'premium-article',
    theme: 'dark',
    onPaymentSuccess: (token) => {
      // Unlock content
      unlockContent(token);
    }
  });
</script>
```

**React Component** (for React apps):

```tsx
import { PaywallWidget } from '@solana-paywall/widget-react';

<PaywallWidget
  merchantId="xxx"
  slug="premium-article"
  onPaymentSuccess={(token) => unlockContent(token)}
/>
```

### 2.2 API Integration (Headless)

For full control, use the REST API directly:

```typescript
// 1. Check access
const hasAccess = await checkAccess(merchantId, slug, walletAddress);

// 2. If no access, create payment intent
if (!hasAccess) {
  const paymentIntent = await createPaymentIntent({
    merchantId,
    contentId: content.id
  });
  
  // 3. Show payment UI (custom or widget)
  const txSignature = await sendPayment(paymentIntent);
  
  // 4. Verify payment
  const { accessToken } = await verifyPayment({
    txSignature,
    merchantId,
    contentId: content.id
  });
  
  // 5. Store token and unlock content
  localStorage.setItem(`access_${merchantId}_${slug}`, accessToken);
}
```

### 2.3 Deep Link Integration

Generate shareable purchase links:

```
https://paywall.example.com/pay?merchantId=xxx&slug=premium-article
```

This page:
- Shows content preview
- Embeds payment widget
- After payment, redirects to merchant's canonical URL with token

---

## 3. Widget SDK Enhancements

### 3.1 Enhanced Widget Configuration

```typescript
interface WidgetConfig {
  // Required
  merchantId: string;
  slug: string;
  
  // Appearance
  theme?: 'light' | 'dark' | 'auto';
  buttonText?: string;
  showPreview?: boolean;
  previewText?: string;
  
  // Behavior
  autoCheckAccess?: boolean; // Check access on load
  redirectAfterPayment?: string; // URL to redirect after payment
  onPaymentSuccess?: (token: string) => void;
  onPaymentError?: (error: Error) => void;
  
  // Advanced
  apiUrl?: string;
  rpcEndpoint?: string;
  walletAdapter?: any; // Custom wallet adapter
}
```

### 3.2 Widget Features

1. **Access Check**: Automatically checks if user has access
2. **Payment Flow**: Handles entire payment flow (QR, wallet connect, verification)
3. **Token Management**: Stores and manages access tokens
4. **Auto-Unlock**: Can automatically unlock content on payment success
5. **Responsive**: Works on mobile and desktop
6. **Theming**: Customizable colors, fonts, layout

### 3.3 Widget Modes

- **Inline**: Embedded in page, shows paywall or content
- **Modal**: Opens in modal overlay
- **Banner**: Sticky banner at top/bottom
- **Button**: Simple button that opens payment flow

---

## 4. Integration Examples

### 4.1 Next.js Blog (MDX)

```tsx
// app/blog/[slug]/page.tsx
import { PaywallWidget } from '@solana-paywall/widget-react';
import { checkAccess } from '@/lib/paywall-api';

export default async function BlogPost({ params }) {
  const { slug } = params;
  const post = await getPost(slug);
  const hasAccess = await checkAccess(post.merchantId, post.contentSlug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      {hasAccess ? (
        <MDXContent source={post.content} />
      ) : (
        <>
          <p>{post.preview}</p>
          <PaywallWidget
            merchantId={post.merchantId}
            slug={post.contentSlug}
            onPaymentSuccess={() => router.refresh()}
          />
        </>
      )}
    </article>
  );
}
```

### 4.2 Video Platform

```tsx
// Video player with paywall
import { PaywallWidget } from '@solana-paywall/widget-react';

function VideoPlayer({ video }) {
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    checkAccess(video.merchantId, video.slug).then(setHasAccess);
  }, []);
  
  return (
    <div>
      {hasAccess ? (
        <VideoPlayer src={video.url} />
      ) : (
        <>
          <VideoThumbnail src={video.thumbnail} />
          <PaywallWidget
            merchantId={video.merchantId}
            slug={video.slug}
            showPreview
            previewText="Watch the first 30 seconds free"
            onPaymentSuccess={() => setHasAccess(true)}
          />
        </>
      )}
    </div>
  );
}
```

### 4.3 API Endpoint Protection

```typescript
// API route with paywall check
export async function GET(request: Request) {
  const { merchantId, slug } = parseRequest(request);
  const token = request.headers.get('X-Access-Token');
  
  const isValid = await verifyAccessToken(token, merchantId, slug);
  
  if (!isValid) {
    return new Response('Payment required', { status: 402 });
  }
  
  // Return protected data
  return Response.json({ data: getProtectedData() });
}
```

---

## 5. Implementation Phases

### Phase 1: Backend Enhancements
- [ ] Add metadata fields to Content schema
- [ ] Create discovery API endpoints
- [ ] Add visibility controls
- [ ] Implement search/filtering

### Phase 2: Widget SDK
- [ ] Enhance widget configuration
- [ ] Create iframe embeddable widget
- [ ] Add React/Vue/Angular components
- [ ] Improve access checking

### Phase 3: Marketplace Frontend
- [ ] Create marketplace Next.js app
- [ ] Implement browse/search UI
- [ ] Add content detail pages
- [ ] Integrate payment flow

### Phase 4: Integration Examples
- [ ] Create example integrations
- [ ] Write documentation
- [ ] Create code snippets
- [ ] Video tutorials

---

## 6. Security Considerations

1. **Access Token Validation**: Server-side validation required
2. **CORS Configuration**: Proper CORS for widget domains
3. **Content Security Policy**: CSP headers for iframe embedding
4. **Rate Limiting**: Prevent abuse of discovery endpoints
5. **Merchant Verification**: Optional KYC for public marketplace

---

## 7. Future Enhancements

- **User Accounts**: Track purchases across devices
- **Subscriptions**: Recurring payments for time-based access
- **Bundles**: Package multiple contents together
- **Affiliate System**: Revenue sharing for referrals
- **Analytics Dashboard**: Merchant analytics for content performance
- **Reviews & Ratings**: Social proof for marketplace

