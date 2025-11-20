# Next.js Blog Integration Example

This example shows how to integrate the Solana Micro-Paywall into a Next.js blog.

## Setup

1. Install dependencies:
```bash
npm install @solana-micro-paywall/widget-sdk @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
```

2. Create a paywall provider component:

```tsx
// components/paywall-provider.tsx
'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const wallets = [new SolflareWalletAdapter(), new TorusWalletAdapter()];
  
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

3. Wrap your app:

```tsx
// app/layout.tsx
import { PaywallProvider } from '@/components/paywall-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PaywallProvider>{children}</PaywallProvider>
      </body>
    </html>
  );
}
```

4. Create a paywall component:

```tsx
// components/paywall.tsx
'use client';

import { SolanaPaywallWidget } from '@solana-micro-paywall/widget-sdk';

interface PaywallProps {
  merchantId: string;
  slug: string;
  previewText?: string;
}

export function Paywall({ merchantId, slug, previewText }: PaywallProps) {
  return (
    <SolanaPaywallWidget
      merchantId={merchantId}
      slug={slug}
      apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}
      showPreview={!!previewText}
      previewText={previewText}
      onPaymentSuccess={(token) => {
        // Store token
        localStorage.setItem(`access_${merchantId}_${slug}`, token);
        // Refresh page to show content
        window.location.reload();
      }}
    />
  );
}
```

5. Use in your blog post:

```tsx
// app/blog/[slug]/page.tsx
import { Paywall } from '@/components/paywall';

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug); // Your function to get post data
  
  // Check if user has access
  const hasAccess = typeof window !== 'undefined' 
    ? !!localStorage.getItem(`access_${post.merchantId}_${post.contentSlug}`)
    : false;

  return (
    <article>
      <h1>{post.title}</h1>
      
      {hasAccess ? (
        <div>{post.content}</div>
      ) : (
        <>
          <div>{post.preview}</div>
          <Paywall 
            merchantId={post.merchantId}
            slug={post.contentSlug}
            previewText={post.preview}
          />
        </>
      )}
    </article>
  );
}
```

## Server-Side Access Check

For better security, verify access tokens server-side:

```tsx
// app/api/check-access/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token, merchantId, slug } = await request.json();
  
  const response = await fetch(`${process.env.API_URL}/payments/redeem-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  
  if (response.ok) {
    return NextResponse.json({ hasAccess: true });
  }
  
  return NextResponse.json({ hasAccess: false });
}
```

