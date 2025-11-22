# Integration Guide

Step-by-step guides for common integration scenarios.

## Table of Contents

1. [Newsletter Monetization](#newsletter-monetization)
2. [API Access Control](#api-access-control)
3. [Course Platform](#course-platform)
4. [Blog Paywall](#blog-paywall)
5. [Download Protection](#download-protection)

## Newsletter Monetization

Monetize your newsletter with pay-per-article access.

### Setup

1. **Create Merchant Account**
```bash
POST /api/merchants
{
  "email": "newsletter@example.com",
  "payoutAddress": "YourSolanaWallet"
}
```

2. **Create Content for Each Article**
```bash
POST /api/contents
Authorization: Bearer <token>
{
  "merchantId": "merchant-id",
  "slug": "weekly-update-2024-01-01",
  "title": "Weekly Update - January 1, 2024",
  "priceLamports": 500000000,  // 0.5 SOL
  "currency": "SOL",
  "durationSecs": null,  // One-time purchase
  "category": "article",
  "visibility": "public"
}
```

3. **Embed Widget in Newsletter**
```html
<div id="paywall-widget"></div>
<script>
  const widget = new PaymentWidgetUI({
    containerId: 'paywall-widget',
    apiUrl: 'https://api.example.com',
    merchantId: 'merchant-id',
    contentId: 'content-id',
    ctaText: 'Unlock Article',
  });
  widget.renderButton({
    merchantId: 'merchant-id',
    contentId: 'content-id',
  });
</script>
```

4. **Verify Access Server-Side**
```javascript
// In your newsletter backend
async function checkAccess(walletAddress, contentSlug) {
  const response = await fetch(
    `https://api.example.com/api/purchases/check-access?` +
    `walletAddress=${walletAddress}&` +
    `merchantId=merchant-id&` +
    `contentSlug=${contentSlug}`
  );
  const { hasAccess } = await response.json();
  return hasAccess;
}
```

## API Access Control

Sell API access with time-limited tokens.

### Setup

1. **Create API Content**
```bash
POST /api/contents
{
  "merchantId": "merchant-id",
  "slug": "api-access",
  "title": "API Access - 30 Days",
  "priceLamports": 2000000000,  // 2 SOL
  "durationSecs": 2592000,  // 30 days
  "category": "api"
}
```

2. **Issue API Keys After Purchase**
```javascript
// After payment verification
const apiKey = await createApiKey({
  merchantId: 'merchant-id',
  name: `API Key for ${walletAddress}`,
  rateLimit: 1000,
});

// Return to user
return { apiKey: apiKey.key };
```

3. **Protect API Endpoints**
```javascript
// In your API
import { ApiKeyGuard } from '@solana-micro-paywall/backend';

@UseGuards(ApiKeyGuard)
@Get('protected-endpoint')
async protectedEndpoint(@Req() req) {
  const merchantId = req.merchantId; // From API key
  // Your protected logic
}
```

## Course Platform

Sell course access with time-based subscriptions.

### Setup

1. **Create Course Content**
```bash
POST /api/contents
{
  "merchantId": "merchant-id",
  "slug": "advanced-solana-course",
  "title": "Advanced Solana Development",
  "priceLamports": 5000000000,  // 5 SOL
  "durationSecs": 7776000,  // 90 days
  "category": "course",
  "tags": ["solana", "blockchain", "development"]
}
```

2. **Track Course Progress**
```javascript
// When user accesses course content
await trackEvent({
  type: 'course.accessed',
  merchantId: 'merchant-id',
  contentId: 'content-id',
  walletAddress: 'user-wallet',
  metadata: {
    lesson: 'lesson-1',
    progress: 25,
  },
});
```

3. **Send Expiration Reminders**
```javascript
// Webhook handler for access.expiring
if (event.type === 'access.expiring') {
  sendEmail({
    to: userEmail,
    subject: 'Your course access is expiring soon!',
    body: `You have 24 hours left to complete the course.`,
  });
}
```

## Blog Paywall

Implement a paywall for premium blog posts.

### Setup

1. **Create Premium Article**
```bash
POST /api/contents
{
  "merchantId": "merchant-id",
  "slug": "premium-article-slug",
  "title": "Premium Article Title",
  "previewText": "First paragraph preview...",
  "priceLamports": 1000000000,  // 1 SOL
  "visibility": "public"
}
```

2. **Show Preview + Paywall**
```html
<article>
  <h1>{{ article.title }}</h1>
  <div class="preview">
    {{ article.previewText }}
  </div>
  
  <div id="paywall" class="paywall-overlay">
    <div class="paywall-content">
      <h2>Unlock Full Article</h2>
      <div id="paywall-widget"></div>
    </div>
  </div>
  
  <div id="full-content" style="display: none;">
    {{ article.fullContent }}
  </div>
</article>

<script>
  // Check if user has access
  async function checkAccess() {
    const walletAddress = getWalletAddress();
    const hasAccess = await fetch(
      `/api/purchases/check-access?` +
      `walletAddress=${walletAddress}&` +
      `merchantId=${merchantId}&` +
      `contentSlug=${contentSlug}`
    ).then(r => r.json());
    
    if (hasAccess.hasAccess) {
      document.getElementById('paywall').style.display = 'none';
      document.getElementById('full-content').style.display = 'block';
    }
  }
  
  checkAccess();
</script>
```

## Download Protection

Protect downloadable files with one-time purchases.

### Setup

1. **Create Download Content**
```bash
POST /api/contents
{
  "merchantId": "merchant-id",
  "slug": "premium-template-pack",
  "title": "Premium Template Pack",
  "priceLamports": 2000000000,  // 2 SOL
  "durationSecs": null,  // One-time
  "category": "download"
}
```

2. **Protect Download Endpoint**
```javascript
// Download endpoint
app.get('/download/:contentSlug', async (req, res) => {
  const walletAddress = req.headers['x-wallet-address'];
  const hasAccess = await checkAccess(
    walletAddress,
    merchantId,
    req.params.contentSlug
  );
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Serve file
  res.download('/path/to/file.zip');
});
```

3. **Track Downloads**
```javascript
await trackEvent({
  type: 'download.completed',
  merchantId: 'merchant-id',
  contentId: 'content-id',
  walletAddress: 'user-wallet',
});
```

## Common Patterns

### Referral Integration

```javascript
// Apply referral code during checkout
const referralCode = getReferralCodeFromURL();
if (referralCode) {
  const discount = await applyReferralCode({
    code: referralCode,
    referrerWallet: referrerWallet,
    refereeWallet: userWallet,
    purchaseId: purchase.id,
    originalAmount: content.priceLamports.toString(),
  });
  
  // Apply discount to payment
  finalAmount = originalAmount - discount.discountAmount;
}
```

### Analytics Integration

```javascript
// Track conversions
const conversionRate = await getConversionRate(merchantId, 30);
console.log(`Conversion rate: ${conversionRate.conversionRate}%`);

// Get top content
const topContent = await getTopContent(merchantId, 10);
console.log('Top selling content:', topContent);
```

### Webhook Integration

```javascript
// Handle webhook events
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, webhookSecret);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'purchase.completed':
      // Grant access, send confirmation email, etc.
      handlePurchase(data);
      break;
    case 'access.expiring':
      // Send reminder email
      sendReminderEmail(data);
      break;
  }
  
  res.status(200).send('OK');
});
```

## Testing

### Devnet Testing

1. Switch to devnet in network toggle
2. Use devnet SOL (get from faucet)
3. Test payment flow
4. Verify access tokens

### Mainnet Testing

1. Switch to mainnet
2. Use small amounts for testing
3. Monitor transactions on Solscan
4. Verify webhooks and notifications

## Support

- **API Documentation**: [API Guide](./API_GUIDE.md)
- **Widget SDK**: [Widget SDK Docs](./WIDGET_SDK.md)
- **Examples**: [Example Projects](../examples/)

