# Widget SDK Documentation

Complete guide for embedding Solana Micro-Paywall payment widgets.

## Installation

### NPM

```bash
npm install @solana-micro-paywall/widget-sdk
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@solana-micro-paywall/widget-sdk@latest/dist/index.js"></script>
```

## Quick Start

### Basic Usage

```html
<div id="paywall-widget"></div>

<script>
  const { PaymentWidgetUI } = window.SolanaPaywall;

  const widget = new PaymentWidgetUI({
    containerId: 'paywall-widget',
    apiUrl: 'https://api.example.com',
    buttonText: 'Unlock Content',
  });

  widget.renderButton({
    merchantId: 'merchant-id',
    contentId: 'content-id',
  });
</script>
```

### React Component

```jsx
import { PaymentWidget } from '@solana-micro-paywall/widget-sdk/react';

function MyComponent() {
  return (
    <PaymentWidget
      merchantId="merchant-id"
      contentId="content-id"
      apiUrl="https://api.example.com"
      onPaymentSuccess={(token) => {
        console.log('Payment successful!', token);
      }}
    />
  );
}
```

## Configuration Options

### Basic Configuration

```typescript
interface WidgetConfig {
  apiUrl?: string;              // Backend API URL
  theme?: 'light' | 'dark' | 'auto';
  buttonText?: string;          // Button label
  buttonClass?: string;         // Custom CSS class
}
```

### Advanced Customization

```typescript
interface WidgetConfig {
  // Colors
  colors?: {
    primary?: string;           // Primary button color
    primaryHover?: string;       // Hover state color
    text?: string;              // Text color
    background?: string;        // Background color
    border?: string;            // Border color
  };
  
  // Logo
  logo?: {
    url?: string;               // Logo image URL
    alt?: string;               // Alt text
    width?: number;             // Logo width (px)
    height?: number;            // Logo height (px)
  };
  
  // Content
  ctaText?: string;            // Custom CTA text
  showPrice?: boolean;         // Show/hide price
  showDuration?: boolean;      // Show/hide duration
  borderRadius?: number;       // Border radius (px)
  fontFamily?: string;         // Custom font
  
  // Callbacks
  onPaymentSuccess?: (token: string) => void;
  onPaymentError?: (error: Error) => void;
}
```

## Examples

### Custom Styled Widget

```javascript
const widget = new PaymentWidgetUI({
  containerId: 'paywall-widget',
  apiUrl: 'https://api.example.com',
  colors: {
    primary: '#10b981',
    primaryHover: '#059669',
    text: '#ffffff',
  },
  logo: {
    url: 'https://example.com/logo.png',
    width: 24,
    height: 24,
  },
  ctaText: 'Unlock Premium Content',
  borderRadius: 12,
  fontFamily: 'Inter, sans-serif',
});
```

### Theme-Based Widget

```javascript
const widget = new PaymentWidgetUI({
  containerId: 'paywall-widget',
  apiUrl: 'https://api.example.com',
  theme: 'auto', // Automatically matches system theme
  colors: {
    primary: '#10b981',
  },
});
```

### Minimal Widget (No Price/Duration)

```javascript
const widget = new PaymentWidgetUI({
  containerId: 'paywall-widget',
  apiUrl: 'https://api.example.com',
  showPrice: false,
  showDuration: false,
  ctaText: 'Get Access',
});
```

## Payment Flow

1. **User clicks button** → Widget creates payment request
2. **QR code modal opens** → User can scan or connect wallet
3. **User pays** → Transaction sent to Solana network
4. **Payment verified** → Access token issued
5. **Success callback** → Your app receives token

## Event Handling

```javascript
const widget = new PaymentWidgetUI({
  containerId: 'paywall-widget',
  apiUrl: 'https://api.example.com',
  onPaymentSuccess: (token) => {
    // Store token and grant access
    localStorage.setItem('access_token', token);
    showContent();
  },
  onPaymentError: (error) => {
    // Handle error
    console.error('Payment failed:', error);
    showError(error.message);
  },
});
```

## Network Configuration

The widget automatically detects the network from:
1. `window.__SOLANA_NETWORK__` (if set)
2. `NEXT_PUBLIC_SOLANA_NETWORK` environment variable
3. Defaults to `devnet`

To manually set:
```javascript
window.__SOLANA_RPC__ = 'https://api.mainnet-beta.solana.com';
window.__SOLANA_NETWORK__ = 'mainnet-beta';
```

## Styling

### CSS Customization

The widget uses inline styles by default, but you can override with CSS:

```css
.solana-pay-button {
  /* Your custom styles */
}

.solana-pay-modal {
  /* Modal styles */
}
```

### Theme Variables

For theme-based styling:

```css
:root {
  --solana-pay-primary: #10b981;
  --solana-pay-text: #ffffff;
  --solana-pay-border-radius: 8px;
}
```

## Advanced Usage

### Programmatic Payment

```javascript
const widget = new PaymentWidgetUI({
  containerId: 'paywall-widget',
  apiUrl: 'https://api.example.com',
});

// Create payment programmatically
const paymentRequest = await widget.widget.requestPayment({
  merchantId: 'merchant-id',
  contentId: 'content-id',
});

// Show modal
await widget.showModal(paymentRequest);
```

### Custom Payment Handler

```javascript
const widget = new PaymentWidgetUI({
  containerId: 'paywall-widget',
  apiUrl: 'https://api.example.com',
});

widget.widget.on('payment', (event) => {
  switch (event.type) {
    case 'payment_requested':
      console.log('Payment requested:', event.paymentIntentId);
      break;
    case 'payment_confirmed':
      console.log('Payment confirmed:', event.token);
      break;
    case 'payment_failed':
      console.error('Payment failed:', event.error);
      break;
  }
});
```

## Best Practices

1. **Always handle errors**: Implement `onPaymentError` callback
2. **Store tokens securely**: Use secure storage for access tokens
3. **Verify tokens server-side**: Don't trust client-side tokens alone
4. **Test on devnet first**: Use devnet for testing before mainnet
5. **Monitor network**: Check network toggle matches your environment

## Troubleshooting

### Widget not loading
- Check API URL is correct
- Verify container element exists
- Check browser console for errors

### Payment not working
- Ensure wallet is connected
- Check network (devnet vs mainnet)
- Verify merchant and content IDs

### Styling issues
- Check CSS specificity
- Verify color values are valid hex codes
- Ensure container has proper dimensions

## Support

- **Documentation**: [Full API Docs](./API_GUIDE.md)
- **Examples**: [Example Projects](../examples/)
- **Issues**: GitHub Issues

