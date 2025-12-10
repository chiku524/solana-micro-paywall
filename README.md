# Solana Micro-Paywall

A Solana-native micro-paywall / pay-per-use SDK built on Solana Pay, targeting publishers, creators, and API providers. Built with NestJS, Next.js, Prisma, and optimized for the Solana blockchain.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+
- Cloudflare account (for Workers & Pages)
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

3. **Set up database:**
   
   The database is managed via Cloudflare D1. For local development:
   
   ```bash
   cd apps/backend-workers
   npm run db:migrate
   ```

4. **Start development servers:**
   ```bash
   # Start web app (frontend)
   npm run dev:web
   
   # Or start Workers locally (backend API)
   npm run dev:workers
   ```

The Web App (Marketplace + Dashboard) will be available at `http://localhost:3001`  
The Workers API will be available at `http://localhost:8787` (when running locally)

## 📁 Project Structure

```
solana-micro-paywall/
├── apps/
│   ├── backend-workers/  # Cloudflare Workers API
│   └── web/              # Next.js unified app (Marketplace + Dashboard)
├── packages/
│   ├── widget-sdk/       # Embeddable payment widget
│   ├── shared/           # Shared types and utilities
│   └── config/           # Environment configuration
├── scripts/              # Utility scripts (migrations, etc.)
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

### Web App (Marketplace + Dashboard) ✅
- ✅ **Marketplace**: Public content discovery, browsing, and purchase
- ✅ **Dashboard**: Merchant creation and management
- ✅ Content management (CRUD)
- ✅ Payment analytics and stats
- ✅ Settings management
- ✅ Responsive design
- ✅ Unified navigation between marketplace and dashboard

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - **Complete Cloudflare deployment instructions**
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Environment variable reference
- [Product Blueprint](./docs/product-blueprint.md) - Full specification
- [API Guide](./docs/API_GUIDE.md) - API documentation
- [Widget SDK Guide](./packages/widget-sdk/README.md) - Widget usage
- [Integration Guide](./docs/INTEGRATION_GUIDE.md) - Integration examples

## 🔧 Tech Stack

- **Backend**: Cloudflare Workers, Hono 4.10+, D1 Database, KV Cache
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Blockchain**: Solana Web3.js 1.95+, Solana Pay
- **Widget**: Vanilla JS/TypeScript with Solana Wallet Adapter
- **Infrastructure**: Cloudflare Workers & Pages, D1, KV
- **TypeScript**: 5.9+
- **Node.js**: 20+ (LTS)

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
3. ✅ **Start development servers** - `npm run dev` from project root
4. ✅ **Access web app** - Navigate to `http://localhost:3001`
5. ✅ **Create merchant** - Use the web app or API
6. ✅ **Add content** - Create paywall content via dashboard
7. ✅ **Browse marketplace** - Discover and purchase content
8. ✅ **Test payments** - Use widget SDK on a test page

## 📝 License

Private - All Rights Reserved
