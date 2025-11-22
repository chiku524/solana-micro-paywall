# Solana Micro-Paywall API Guide

Complete API documentation for the Solana Micro-Paywall platform.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

### JWT Authentication (Merchants)

Most merchant endpoints require JWT authentication. Get a token by logging in:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "merchantId": "your-merchant-id"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "merchant": {
    "id": "merchant-id",
    "email": "merchant@example.com",
    "status": "active"
  }
}
```

Use the token in subsequent requests:
```
Authorization: Bearer <accessToken>
```

### API Key Authentication (Third-party)

For programmatic access, use API keys:

```
X-API-Key: sk_live_your-api-key-here
```

## Core Endpoints

### Merchants

#### Create Merchant
```http
POST /api/merchants
Content-Type: application/json

{
  "email": "merchant@example.com",
  "payoutAddress": "SolanaWalletAddress"
}
```

#### Get Merchant Profile
```http
GET /api/merchants/:id/public-profile
```

#### Get Merchant Dashboard
```http
GET /api/merchants/:id/dashboard
Authorization: Bearer <token>
```

### Content

#### Create Content
```http
POST /api/contents
Authorization: Bearer <token>
Content-Type: application/json

{
  "merchantId": "merchant-id",
  "slug": "my-article",
  "priceLamports": 1000000000,
  "currency": "SOL",
  "durationSecs": 86400,
  "title": "My Article Title",
  "description": "Article description",
  "category": "article",
  "tags": ["solana", "web3"],
  "visibility": "public"
}
```

#### List Content
```http
GET /api/contents?merchantId=merchant-id&page=1&limit=20
```

### Payments

#### Create Payment Request
```http
POST /api/payments/create-payment-request
Content-Type: application/json

{
  "merchantId": "merchant-id",
  "contentId": "content-id"
}
```

**Rate Limit**: 10 requests per minute

#### Verify Payment
```http
POST /api/payments/verify-payment
Content-Type: application/json

{
  "txSignature": "transaction-signature",
  "merchantId": "merchant-id",
  "contentId": "content-id"
}
```

**Rate Limit**: 20 requests per minute

### Purchases

#### Get Purchases
```http
GET /api/purchases?walletAddress=wallet-address&page=1&limit=20
```

#### Check Access
```http
GET /api/purchases/check-access?walletAddress=wallet&merchantId=merchant&contentSlug=slug
```

#### Generate Shareable Link
```http
GET /api/purchases/:purchaseId/shareable-link?walletAddress=wallet-address
```

### Referrals

#### Create Referral Code
```http
POST /api/referrals/codes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Sale",
  "discountPercent": 20,
  "maxUses": 100,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Apply Referral Code
```http
POST /api/referrals/apply
Content-Type: application/json

{
  "code": "SUMMER20",
  "referrerWallet": "referrer-wallet",
  "refereeWallet": "referee-wallet",
  "purchaseId": "purchase-id",
  "originalAmount": "1000000000"
}
```

### API Keys

#### Create API Key
```http
POST /api/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production API Key",
  "rateLimit": 1000,
  "allowedIps": ["192.168.1.1"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### List API Keys
```http
GET /api/api-keys
Authorization: Bearer <token>
```

#### Get Usage Stats
```http
GET /api/api-keys/stats?apiKeyId=key-id&days=30
Authorization: Bearer <token>
```

### Analytics

#### Get Conversion Rate
```http
GET /api/analytics/conversion/:merchantId?days=30
Authorization: Bearer <token>
```

#### Get Top Content
```http
GET /api/analytics/top-content?merchantId=merchant-id&limit=10
```

#### Get Merchant Performance
```http
GET /api/analytics/performance/:merchantId?days=30
Authorization: Bearer <token>
```

### Recommendations

#### Get Recommendations for Wallet
```http
GET /api/recommendations/for-wallet?walletAddress=wallet&limit=6
```

#### Get Recommendations for Content
```http
GET /api/recommendations/for-content/:contentId?limit=6
```

#### Get Collaborative Recommendations
```http
GET /api/recommendations/collaborative/:contentId?limit=6
```

## Rate Limits

- **Default**: 100 requests per minute
- **Payment Endpoints**: 10-20 requests per minute
- **Strict Endpoints**: 5 requests per minute
- **API Key Authenticated**: 1000 requests per minute (or custom limit)

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Webhooks

Merchants can configure webhooks to receive real-time notifications.

### Webhook Events

- `payment.confirmed` - Payment successfully confirmed
- `purchase.completed` - Purchase completed
- `access.expiring` - Access expiring soon (24h before)
- `access.expired` - Access has expired
- `merchant.follower.added` - New follower

### Webhook Payload

```json
{
  "event": "payment.confirmed",
  "data": {
    "paymentId": "payment-id",
    "txSignature": "transaction-signature",
    "amount": "1000000000",
    "currency": "SOL",
    "payerWallet": "wallet-address",
    "confirmedAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "merchantId": "merchant-id"
}
```

### Webhook Signature

All webhooks include an `X-Webhook-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}
```

## Interactive API Documentation

Swagger/OpenAPI documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://your-domain.com/api/docs`

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
import { ApiClient } from '@solana-micro-paywall/api-client';

const client = new ApiClient('https://api.example.com');
const content = await client.getContent('content-id');
```

### Widget SDK

See [Widget SDK Documentation](./WIDGET_SDK.md) for embedding payment widgets.

## Examples

### Complete Purchase Flow

```javascript
// 1. Create payment request
const paymentRequest = await fetch('/api/payments/create-payment-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantId: 'merchant-id',
    contentId: 'content-id'
  })
}).then(r => r.json());

// 2. User pays with Solana wallet
// (Transaction happens on client side)

// 3. Verify payment
const verification = await fetch('/api/payments/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    txSignature: 'transaction-signature',
    merchantId: 'merchant-id',
    contentId: 'content-id'
  })
}).then(r => r.json());

// 4. Use access token
const accessToken = verification.accessToken;
```

## Support

For questions or issues:
- Check the [Swagger documentation](./api/docs)
- Review [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Contact support: support@solana-paywall.com

