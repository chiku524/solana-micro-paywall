# Integration Guide

This guide shows you how to integrate the Solana Micro-Paywall into your website or application.

## Quick Start

### Option 1: Iframe Widget (Easiest)

Simply embed an iframe in your HTML:

```html
<iframe 
  src="http://localhost:3000/widget?merchantId=YOUR_MERCHANT_ID&slug=YOUR_CONTENT_SLUG"
  width="100%" 
  height="400"
  frameborder="0">
</iframe>
```

### Option 2: JavaScript Widget (More Control)

```html
<script src="http://localhost:3000/widget.js"></script>
<div id="paywall-widget"></div>
<script>
  SolanaPaywall.init({
    container: '#paywall-widget',
    merchantId: 'YOUR_MERCHANT_ID',
    slug: 'YOUR_CONTENT_SLUG',
    apiUrl: 'http://localhost:3000/api',
    onPaymentSuccess: (token) => {
      // Store token and unlock content
      localStorage.setItem('access_token', token);
      unlockContent();
    }
  });
</script>
```

### Option 3: API Integration (Full Control)

For complete control, use the REST API directly:

```typescript
// 1. Check if user has access
async function checkAccess(merchantId: string, slug: string, walletAddress?: string) {
  const response = await fetch(
    `http://localhost:3000/api/contents/merchant/${merchantId}/slug/${slug}`
  );
  const content = await response.json();
  
  // Check if user has a valid access token
  const token = localStorage.getItem(`access_${merchantId}_${slug}`);
  if (token) {
    const verifyResponse = await fetch('http://localhost:3000/api/payments/redeem-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return verifyResponse.ok;
  }
  return false;
}

// 2. Create payment intent
async function createPaymentIntent(merchantId: string, contentId: string) {
  const response = await fetch('http://localhost:3000/api/payments/create-payment-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId, contentId }),
  });
  return response.json();
}

// 3. After payment, verify and get access token
async function verifyPayment(txSignature: string, merchantId: string, contentId: string) {
  const response = await fetch('http://localhost:3000/api/payments/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txSignature, merchantId, contentId }),
  });
  const { accessToken } = await response.json();
  localStorage.setItem(`access_${merchantId}_${contentId}`, accessToken);
  return accessToken;
}
```

## Next.js Example

```tsx
// app/blog/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { PaywallWidget } from '@solana-paywall/widget-react';

export default function BlogPost({ params }: { params: { slug: string } }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const merchantId = 'YOUR_MERCHANT_ID';
  const contentSlug = params.slug;

  useEffect(() => {
    checkAccess(merchantId, contentSlug).then((access) => {
      setHasAccess(access);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <article>
      <h1>Your Blog Post Title</h1>
      {hasAccess ? (
        <div>
          {/* Full content here */}
          <p>This is the protected content...</p>
        </div>
      ) : (
        <>
          <p>This is a preview of the content...</p>
          <PaywallWidget
            merchantId={merchantId}
            slug={contentSlug}
            onPaymentSuccess={(token) => {
              setHasAccess(true);
            }}
          />
        </>
      )}
    </article>
  );
}
```

## React Component Example

```tsx
import { useState, useEffect } from 'react';

function PaywallContent({ merchantId, slug, children }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(`access_${merchantId}_${slug}`);
    if (token) {
      // Verify token
      fetch('http://localhost:3000/api/payments/redeem-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.accessGranted) {
            setHasAccess(true);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [merchantId, slug]);

  if (loading) return <div>Loading...</div>;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div>
      <p>This content requires payment.</p>
      {/* Embed widget here */}
    </div>
  );
}
```

## API Reference

### Discovery Endpoints (Public)

- `GET /api/discover/contents` - Browse public contents
- `GET /api/discover/contents/:id` - Get content details
- `GET /api/discover/merchants/:merchantId/contents` - Get merchant's public contents
- `GET /api/discover/categories` - List all categories
- `GET /api/discover/trending` - Get trending contents

### Payment Endpoints

- `POST /api/payments/create-payment-request` - Create payment intent
- `POST /api/payments/verify-payment` - Verify payment and get access token
- `GET /api/payments/payment-status?tx=...` - Check payment status
- `POST /api/payments/redeem-token` - Redeem access token

### Content Endpoints

- `GET /api/contents/merchant/:merchantId/slug/:slug` - Get content by slug
- `GET /api/contents/:id` - Get content by ID

## Making Content Discoverable

To make your content discoverable in the marketplace:

1. Update your content with discovery fields:
```bash
curl -X PUT http://localhost:3000/api/contents/CONTENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Premium Article",
    "description": "A detailed guide on...",
    "category": "article",
    "tags": ["solana", "web3", "tutorial"],
    "visibility": "public",
    "previewText": "This is a preview of the content..."
  }'
```

2. Your content will now appear in:
   - `/api/discover/contents` (public listings)
   - `/api/discover/trending` (if popular)
   - Search results when users search

## Security Best Practices

1. **Always verify access tokens server-side** for sensitive content
2. **Use HTTPS** in production
3. **Validate merchant IDs** before displaying payment widgets
4. **Rate limit** payment requests to prevent abuse
5. **Store tokens securely** (consider httpOnly cookies for server-side apps)

## Support

For more examples and documentation, see:
- [Design Document](./discovery-and-integration-design.md)
- [Product Blueprint](./product-blueprint.md)

