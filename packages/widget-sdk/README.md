# Solana Micro-Paywall Widget SDK

Embeddable payment widget for Solana Pay payments. Drop-in component for publishers to add Solana payment functionality to their websites.

## Installation

```bash
npm install @solana-micro-paywall/widget-sdk
```

## Quick Start

### HTML/JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Payment Widget Example</title>
</head>
<body>
  <div id="payment-widget"></div>

  <script type="module">
    import { createPaymentWidget } from '@solana-micro-paywall/widget-sdk';

    const widget = createPaymentWidget({
      containerId: 'payment-widget',
      apiUrl: 'http://localhost:3000/api',
      buttonText: 'Unlock with Solana',
      onPaymentSuccess: (token) => {
        console.log('Payment successful! Token:', token);
        // Unlock content or redirect
      },
      onPaymentError: (error) => {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
      },
    });

    // Render payment button
    widget.renderButton({
      merchantId: 'your-merchant-id',
      contentId: 'your-content-id',
    });
  </script>
</body>
</html>
```

### React

```tsx
import { useEffect, useRef } from 'react';
import { PaymentWidgetUI } from '@solana-micro-paywall/widget-sdk';

export function PaymentButton({ merchantId, contentId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<PaymentWidgetUI | null>(null);

  useEffect(() => {
    if (containerRef.current && !widgetRef.current) {
      widgetRef.current = new PaymentWidgetUI({
        container: containerRef.current,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        buttonText: 'Pay with Solana',
        onPaymentSuccess: (token) => {
          console.log('Payment successful!', token);
          // Handle success
        },
        onPaymentError: (error) => {
          console.error('Payment error:', error);
        },
      });

      widgetRef.current.renderButton({
        merchantId,
        contentId,
      });
    }

    return () => {
      widgetRef.current?.destroy();
    };
  }, [merchantId, contentId]);

  return <div ref={containerRef} />;
}
```

### Vanilla JavaScript (Advanced)

```javascript
import { PaymentWidget, ApiClient } from '@solana-micro-paywall/widget-sdk';

const widget = new PaymentWidget({
  apiUrl: 'http://localhost:3000/api',
  onPaymentSuccess: (token) => {
    console.log('Access token:', token);
  },
  onPaymentError: (error) => {
    console.error('Error:', error);
  },
});

// Create payment request
const paymentRequest = await widget.requestPayment({
  merchantId: 'merchant-id',
  contentId: 'content-id',
});

// Show QR code or connect wallet
await widget.connectWalletAndPay(paymentRequest, {
  merchantId: 'merchant-id',
  contentId: 'content-id',
});
```

## Features

- ✅ Drop-in payment button component
- ✅ QR code modal for mobile payments
- ✅ Wallet integration (Phantom, Solflare, etc.)
- ✅ Automatic payment status polling
- ✅ Event-driven architecture
- ✅ TypeScript support
- ✅ Works with any Solana wallet

## API Reference

### PaymentWidgetUI

Main UI component for rendering payment buttons and modals.

```typescript
const widget = new PaymentWidgetUI({
  containerId: 'payment-container', // or container: HTMLElement
  apiUrl: 'http://localhost:3000/api',
  buttonText: 'Pay with Solana',
  theme: 'auto', // 'light' | 'dark' | 'auto'
  onPaymentSuccess: (token: string) => void,
  onPaymentError: (error: Error) => void,
});

// Render payment button
widget.renderButton({
  merchantId: string,
  contentId: string,
  price?: number,      // Override content price (lamports)
  currency?: string,   // Override currency
  duration?: number,   // Override duration (seconds)
});

// Destroy widget
widget.destroy();
```

### PaymentWidget

Lower-level widget without UI.

```typescript
const widget = new PaymentWidget({
  apiUrl: 'http://localhost:3000/api',
  onPaymentSuccess: (token: string) => void,
  onPaymentError: (error: Error) => void,
});

// Create payment request
const paymentRequest = await widget.requestPayment({
  merchantId: string,
  contentId: string,
});

// Connect wallet and pay
const token = await widget.connectWalletAndPay(paymentRequest, {
  merchantId: string,
  contentId: string,
});

// Poll for payment status
const token = await widget.pollPaymentStatus(
  txSignature: string,
  merchantId: string,
  contentId: string
);
```

### Events

```typescript
widget.on('payment', (event: PaymentEvent) => {
  switch (event.type) {
    case 'payment_requested':
      console.log('Payment requested:', event.paymentIntentId);
      break;
    case 'payment_pending':
      console.log('Payment pending:', event.txSignature);
      break;
    case 'payment_confirmed':
      console.log('Payment confirmed:', event.token, event.paymentId);
      break;
    case 'payment_failed':
      console.error('Payment failed:', event.error);
      break;
    case 'payment_expired':
      console.log('Payment expired');
      break;
  }
});
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires a Solana wallet browser extension (Phantom, Solflare, etc.).

## License

Private - All Rights Reserved
