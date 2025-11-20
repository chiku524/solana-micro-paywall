# Testing Guide - Solana Micro-Paywall

## Prerequisites Checklist

- [x] Database schema created in Supabase
- [x] Prisma Client generated
- [x] Environment variables configured (`.env` file)
- [ ] Backend server running
- [ ] Dashboard running
- [ ] Test merchant created
- [ ] Test content created

## Starting the Development Servers

### Option 1: Run Both Servers Together (Recommended)
```bash
# From project root
npm run dev
```

This will start:
- **Backend**: http://localhost:3000/api
- **Dashboard**: http://localhost:3001

### Option 2: Run Servers Separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Dashboard  
npm run dev:dashboard
```

## Environment Setup

Make sure your `.env` file in the project root has:

```env
# Database (Supabase connection pooler URL)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Solana RPC
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
SOLANA_WS_ENDPOINT=wss://api.devnet.solana.com
SOLANA_RPC_ENDPOINT_FALLBACK=https://api.devnet.solana.com

# JWT Secret (for access tokens)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API Configuration
API_PORT=3000
API_HOST=0.0.0.0

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## Testing Workflow

### 1. Verify Backend is Running

```bash
# Health check
curl http://localhost:3000/api/health

# Should return: {"status":"ok","database":"connected"}
```

### 2. Create a Test Merchant

**Via Dashboard:**
1. Open http://localhost:3001
2. Navigate to merchant creation
3. Enter email and Solana wallet address

**Via API:**
```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "payoutAddress": "YourSolanaWalletAddress"
  }'
```

### 3. Create Test Content

**Via Dashboard:**
1. Go to Contents page
2. Click "Add Content"
3. Fill in:
   - Slug: `test-article`
   - Price: `0.1` SOL (will be converted to lamports)
   - Duration: `86400` (24 hours)

**Via API:**
```bash
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant-id-from-step-2",
    "slug": "test-article",
    "priceLamports": 100000000,
    "currency": "SOL",
    "durationSecs": 86400
  }'
```

### 4. Test Payment Flow

1. **Create Payment Request:**
```bash
curl -X POST http://localhost:3000/api/payments/create-payment-request \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant-id",
    "contentId": "content-id"
  }'
```

2. **Response will include:**
   - `paymentIntentId`
   - `memo` (unique identifier)
   - `solanaPayUrl` (for QR code)
   - `recipient` (merchant wallet address)
   - `amount` (in lamports)

3. **Make Payment:**
   - Use Solana wallet (Phantom, Solflare) to send payment
   - Include the memo in the transaction
   - Send to the recipient address
   - Amount should match exactly

4. **Verify Payment:**
```bash
curl -X POST http://localhost:3000/api/payments/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "txSignature": "transaction-signature-from-solana",
    "merchantId": "merchant-id",
    "contentId": "content-id"
  }'
```

5. **Response will include:**
   - `status: "confirmed"`
   - `accessToken` (JWT token for content access)
   - `paymentId`

### 5. Test Token Redemption

```bash
curl -X POST http://localhost:3000/api/payments/redeem-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "jwt-token-from-verify-payment"
  }'
```

## Testing with Widget SDK

1. Create a simple HTML page:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Payment Test</title>
    <script src="path/to/widget-sdk/dist/index.js"></script>
</head>
<body>
    <button id="payButton">Pay with Solana</button>
    <script>
        const widget = new PaymentWidget({
            apiUrl: 'http://localhost:3000/api'
        });
        
        document.getElementById('payButton').addEventListener('click', async () => {
            try {
                const paymentRequest = await widget.requestPayment({
                    merchantId: 'your-merchant-id',
                    contentId: 'your-content-id'
                });
                
                // Connect wallet and pay
                const token = await widget.connectWalletAndPay(paymentRequest, {
                    merchantId: 'your-merchant-id',
                    contentId: 'your-content-id'
                });
                
                console.log('Payment successful! Token:', token);
            } catch (error) {
                console.error('Payment failed:', error);
            }
        });
    </script>
</body>
</html>
```

## Common Issues & Solutions

### Backend Won't Start
- **Error**: `Cannot find module 'dist/main'`
- **Solution**: Run `npm run build` in `apps/backend` directory

### Database Connection Errors
- **Error**: `Failed to connect to database`
- **Solution**: 
  - Verify `DATABASE_URL` in `.env`
  - Check Supabase connection pooler is enabled
  - Ensure database schema is created

### Prisma Client Not Found
- **Error**: `Cannot find module '@prisma/client'`
- **Solution**: Run `npm run db:generate` in `apps/backend`

### CORS Errors
- **Error**: `CORS policy blocked`
- **Solution**: Check `CORS_ORIGIN` in `.env` or allow all in development

## Next Steps After Testing

1. ✅ Verify all API endpoints work
2. ✅ Test payment flow end-to-end
3. ✅ Test token redemption
4. ✅ Test dashboard functionality
5. ✅ Test widget SDK integration
6. ✅ Review logs for any errors
7. ✅ Test error handling (invalid payments, expired tokens, etc.)

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Use mainnet Solana RPC (not devnet)
- [ ] Review security settings
- [ ] Set up database backups
- [ ] Configure webhooks (if using)

