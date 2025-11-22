# Setup Instructions

Complete setup guide for all new features.

## Prerequisites

- Node.js 20+
- PostgreSQL (Supabase)
- Redis (optional, for caching and queues)
- Solana RPC endpoint

## Step 1: Database Migrations

Run migrations in this order:

### 1.1 Main Schema (if not already done)
```sql
-- Run in Supabase SQL Editor
-- File: MERCHANT_PAYMENTS_ACCESS_SCHEMA_FIXED.sql
```

### 1.2 Enhancements Migration
```sql
-- Run in Supabase SQL Editor
-- File: ENHANCEMENTS_MIGRATION.sql
-- Adds merchant profile fields and performance indexes
```

### 1.3 Referrals and API Keys
```sql
-- Run in Supabase SQL Editor
-- File: MIGRATION_REFERRALS_APIKEYS.sql
-- Adds ReferralCode, Referral, ApiKey, ApiKeyUsage tables
```

## Step 2: Update Prisma Client

```bash
cd apps/backend
npm run db:generate
```

This generates the Prisma client with all new models.

## Step 3: Environment Configuration

Update your `.env` file:

```bash
# Existing configuration
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com

# Email Configuration (optional but recommended)
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid  # or 'ses'
SENDGRID_API_KEY=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Solana Micro-Paywall

# Mainnet RPC (for network toggle)
NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com

# Frontend URL (for shareable links)
FRONTEND_URL=http://localhost:3001  # or your production URL
```

## Step 4: Install Dependencies

```bash
# From project root
npm install
```

## Step 5: Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend  # Backend on :3000
npm run dev:web      # Frontend on :3001
```

## Step 6: Verify Setup

### Check Database

```bash
cd apps/backend
npm run verify:setup
```

### Check Indexes

```bash
npm run check:indexes
```

### Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Swagger docs
open http://localhost:3000/api/docs
```

## Step 7: Test New Features

### Test Referral System

1. Create a merchant (if not exists)
2. Create a referral code:
```bash
curl -X POST http://localhost:3000/api/referrals/codes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Code",
    "discountPercent": 20,
    "maxUses": 10
  }'
```

3. Apply referral code during purchase

### Test Network Toggle

1. Open frontend: http://localhost:3001
2. Click network toggle in navbar
3. Verify RPC endpoint changes
4. Check localStorage for persistence

### Test API Keys

1. Create API key:
```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "rateLimit": 1000
  }'
```

2. Use API key:
```bash
curl http://localhost:3000/api/merchants/merchant-id \
  -H "X-API-Key: sk_live_your-key-here"
```

### Test Analytics

```bash
# Get conversion rate
curl http://localhost:3000/api/analytics/conversion/merchant-id?days=30 \
  -H "Authorization: Bearer <token>"

# Get top content
curl http://localhost:3000/api/analytics/top-content?limit=10
```

### Test Widget Customization

```html
<div id="widget"></div>
<script>
  const widget = new PaymentWidgetUI({
    containerId: 'widget',
    apiUrl: 'http://localhost:3000/api',
    colors: {
      primary: '#10b981',
    },
    logo: {
      url: 'https://example.com/logo.png',
    },
    ctaText: 'Unlock Now',
  });
</script>
```

## Step 8: Configure Webhooks (Optional)

1. Update merchant config:
```bash
curl -X PUT http://localhost:3000/api/merchants/merchant-id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "configJson": {
      "webhookUrl": "https://your-app.com/webhook",
      "enabledEvents": [
        "payment.confirmed",
        "purchase.completed",
        "access.expiring"
      ]
    }
  }'
```

2. Test webhook delivery

## Step 9: Enable Email Notifications (Optional)

1. Get SendGrid API key from https://sendgrid.com
2. Add to `.env`:
```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-key
EMAIL_FROM=noreply@yourdomain.com
```

3. Test email:
```bash
# Emails are sent automatically on:
# - Purchase completion
# - Payment confirmation
# - Access expiring
# - New followers
```

## Troubleshooting

### Database Errors

If you see Prisma errors:
```bash
cd apps/backend
npm run db:generate
npm run db:push  # If using Prisma migrations
```

### Module Not Found

If you see import errors:
```bash
npm install
npm run build
```

### Rate Limit Errors

Check Redis connection:
```bash
# Test Redis
redis-cli ping
```

### Email Not Sending

1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify SendGrid API key
3. Check logs for email errors

### Webhooks Not Delivering

1. Verify webhook URL is accessible
2. Check webhook secret is configured
3. Review webhook queue in Redis/BullMQ

## Production Deployment

### Environment Variables

Set all production environment variables:
- Database URL
- Redis URL
- JWT secrets
- Email credentials
- Solana RPC endpoints
- Frontend URL

### Database

Run all migrations on production database:
1. MERCHANT_PAYMENTS_ACCESS_SCHEMA_FIXED.sql
2. ENHANCEMENTS_MIGRATION.sql
3. MIGRATION_REFERRALS_APIKEYS.sql

### Build

```bash
npm run build
```

### Deploy

Deploy backend and frontend to your hosting platform.

## Verification Checklist

- [ ] All migrations run successfully
- [ ] Prisma client generated
- [ ] Environment variables configured
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] API docs accessible at `/api/docs`
- [ ] Network toggle works
- [ ] Referral codes can be created
- [ ] API keys can be created
- [ ] Analytics endpoints work
- [ ] Webhooks deliver (if configured)
- [ ] Email sends (if configured)

## Support

- **Documentation**: See `docs/` directory
- **API Docs**: http://localhost:3000/api/docs
- **Issues**: Check logs and error messages

