# Solana Micro-Paywall

A Solana-native micro-paywall and pay-per-use platform that enables publishers, creators, and API providers to monetize their content using instant Solana blockchain payments.

## Features

- **Instant Payment Processing**: Sub-second Solana transaction confirmations with near-zero fees
- **Access Token System**: Short-lived JWT tokens (1-24 hours) that grant access to premium content after payment
- **Embeddable Widget SDK**: Drop-in payment buttons that can be integrated into any website
- **Merchant Dashboard**: Complete analytics, content management, and payment tracking
- **Public Marketplace**: Content discovery and browsing for end users
- **User Library**: Personal library of purchased content with access management

## Tech Stack

- **Frontend**: Next.js 15 (static export), React, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV
- **Blockchain**: Solana (Web3.js, Solana Pay)

## Setup

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers and D1 access
- Solana RPC endpoint (Helius recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solana-micro-paywall
```

2. Install dependencies:
```bash
npm install
```

3. Create a Cloudflare D1 database:
```bash
wrangler d1 create solana-paywall-db
```

4. Update `wrangler.toml` with your database ID and KV namespace ID

5. Run migrations:
```bash
npm run db:migrate
```

6. Set up environment variables in `wrangler.toml` or `.dev.vars`:
```
JWT_SECRET=your-secret-key-here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your-helius-api-key (optional)
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### Development

1. Start the Cloudflare Worker (backend API):
```bash
npm run worker:dev
```

2. Start the Next.js frontend (in another terminal):
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:8787`.

### Deployment

1. Build the frontend:
```bash
npm run build
```

2. Deploy the Cloudflare Worker:
```bash
npm run worker:deploy
```

3. Deploy the frontend to Cloudflare Pages (or use the converged deployment)

## Recent Enhancements

- **Performance**: Lazy-loaded animated background (code splitting), `React.memo` on content cards for list performance
- **Accessibility**: Modal focus trap, Escape key, ARIA attributes; `.touch-target` utility (44×44px) for mobile
- **Type safety**: Typed API responses, `RecentPayment`/`Merchant`/`PaymentIntent` usage, `getErrorMessage(unknown)` for catch blocks
- **Error handling**: Consistent `catch (err: unknown)` and user-facing messages across auth, dashboard, payments, and forms

See `ENHANCEMENTS_RECOMMENDATIONS.md` for the full list of completed and suggested improvements.

For **multi-chain integration** (adding Ethereum, Polygon, etc.), see **`ARCHITECTURE.md`**. The app uses chain-agnostic types, a backend verifier abstraction, and frontend chain utilities so new networks can be added without rewriting payment flows.

## Project Structure

```
├── src/                    # Frontend source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and API client
│   └── types/            # TypeScript types
├── workers/              # Cloudflare Workers backend
│   ├── routes/          # API route handlers
│   ├── lib/             # Backend utilities
│   ├── middleware/      # Middleware functions
│   └── migrations/      # Database migrations
└── wrangler.toml        # Cloudflare Workers configuration
```

## API Endpoints

- `POST /api/merchants` - Create merchant account
- `POST /api/auth/login` - Merchant login
- `GET /api/merchants/me` - Get current merchant (protected)
- `GET /api/contents` - List merchant's content (protected)
- `POST /api/contents` - Create content (protected)
- `GET /api/payments/create-payment-request` - Create payment intent
- `POST /api/payments/verify-payment` - Verify transaction
- `POST /api/purchases` - Create purchase record
- `GET /api/discover` - Discover content
- `GET /api/analytics/stats` - Get payment statistics (protected)

See `APPLICATION_SPECIFICATION.md` for complete API documentation.

## License

MIT
