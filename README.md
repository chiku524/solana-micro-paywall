# Solana Micro-Paywall

A Solana-native micro-paywall / pay-per-use SDK built on Solana Pay, targeting publishers, creators, and API providers. Built with NestJS, Next.js, Prisma, and optimized for the Solana blockchain.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (Supabase configured ✅)
- Redis (optional for local dev)
- Solana RPC endpoint (Helius configured ✅)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (already configured ✅)
   ```

3. **Set up database (Manual Setup Required):**
   
   Due to network/firewall restrictions, run the SQL migration manually:
   
   - Go to Supabase SQL Editor: https://boqdxdxkaszzfgfohdso.supabase.co
   - Open `apps/backend/prisma/migrations/manual-setup.sql`
   - Copy and paste the entire SQL into Supabase SQL Editor
   - Click "Run"
   - Verify tables were created in Table Editor
   
   **Note:** This is a one-time setup. After migration, all database operations use Prisma CLI or the API.

4. **Generate Prisma client:**
   ```bash
   cd apps/backend
   npm run db:generate
   ```

5. **Start the backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

6. **Start the dashboard (separate terminal):**
   ```bash
   cd apps/dashboard
   npm run dev
   ```

The API will be available at `http://localhost:3000/api`  
The Dashboard will be available at `http://localhost:3001` (or configured port)

## 📁 Project Structure

```
solana-micro-paywall/
├── apps/
│   ├── backend/          # NestJS API server
│   └── dashboard/        # Next.js merchant dashboard
├── packages/
│   ├── widget-sdk/       # Embeddable payment widget
│   ├── shared/           # Shared types and utilities
│   └── config/           # Environment configuration
└── docs/                 # Documentation
```

## 🎯 Features

### Backend API ✅
- ✅ On-chain payment verification via Solana Pay
- ✅ Short-lived access tokens (JWT)
- ✅ Merchant dashboard APIs
- ✅ Payment request generation
- ✅ Transaction verification with fallback
- ✅ Refund tracking
- ✅ Audit logging
- ✅ Analytics events

### Widget SDK ✅
- ✅ Drop-in payment button component
- ✅ QR code modal for mobile payments
- ✅ Wallet integration (Phantom, Solflare, etc.)
- ✅ Automatic payment status polling
- ✅ Event-driven architecture

### Dashboard Frontend ✅
- ✅ Merchant creation and management
- ✅ Content management (CRUD)
- ✅ Payment analytics and stats
- ✅ Settings management
- ✅ Responsive design

## 📚 Documentation

- [Product Blueprint](./docs/product-blueprint.md) - Full specification
- [Setup Progress](./docs/setup-progress.md) - Development status
- [Manual Database Setup](./docs/manual-database-setup.md) - **IMPORTANT: Database setup guide**
- [Widget SDK Guide](./packages/widget-sdk/README.md) - Widget usage
- [Merchant Module](./docs/merchant-module-complete.md) - Merchant API docs
- [Widget SDK & Dashboard](./docs/widget-sdk-dashboard-complete.md) - Frontend docs

## 🔧 Tech Stack

- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL (Supabase)
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Blockchain**: Solana Web3.js, Solana Pay, Helius RPC
- **Widget**: Vanilla JS/TypeScript with Solana Wallet Adapter
- **Infrastructure**: Supabase, Redis, BullMQ

## 📝 Quick API Examples

### Create Merchant
```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "payoutAddress": "YourSolanaWalletAddress"
  }'
```

### Create Content
```bash
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant-id",
    "slug": "premium-article",
    "priceLamports": 1000000000,
    "currency": "SOL",
    "durationSecs": 86400
  }'
```

### Create Payment Request
```bash
curl -X POST http://localhost:3000/api/payments/create-payment-request \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant-id",
    "contentId": "content-id"
  }'
```

## 🎯 Next Steps After Setup

1. ✅ **Run manual SQL migration** in Supabase SQL Editor
2. ✅ **Generate Prisma client** - `npm run db:generate` in `apps/backend`
3. ✅ **Start backend** - `npm run dev` in `apps/backend`
4. ✅ **Start dashboard** - `npm run dev` in `apps/dashboard`
5. ✅ **Create merchant** - Use dashboard or API
6. ✅ **Add content** - Create paywall content
7. ✅ **Test payments** - Use widget SDK on a test page

## 📝 License

Private - All Rights Reserved
