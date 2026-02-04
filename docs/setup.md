# Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers and D1 access
- Solana RPC endpoint (Helius recommended for production)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create Cloudflare D1 database**
   ```bash
   wrangler d1 create solana-paywall-db
   ```
   Copy the database ID from the output and update `wrangler.toml` (replace the `database_id` under `[[env.production.d1_databases]]` and development if used).

3. **Create KV namespace** (for rate limiting, cache)
   ```bash
   wrangler kv:namespace create CACHE
   wrangler kv:namespace create CACHE --preview
   ```
   Copy the namespace IDs and update `wrangler.toml` under `[[env.production.kv_namespaces]]`.

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Configure environment for local development**
   Create a `.dev.vars` file in the project root (not committed):
   ```
   JWT_SECRET=your-secret-key-here
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   HELIUS_API_KEY=your-helius-api-key
   NEXT_PUBLIC_WEB_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:8787
   ```

6. **Start development servers**
   - Terminal 1 (backend API):
     ```bash
     npm run worker:dev
     ```
   - Terminal 2 (frontend):
     ```bash
     npm run dev
     ```

7. **Access the app**
   - Frontend: http://localhost:3000
   - API: http://localhost:8787

## First Steps

1. **Create a merchant account** – Go to http://localhost:3000/dashboard, sign up with email, and save your Merchant ID.
2. **Log in** – Use email or Merchant ID to access the dashboard.
3. **Set payout address** – In Settings, add your Solana wallet address for receiving payments.
4. **Create content** – Use Dashboard → Manage Content to create your first paywalled item.
5. **Test payment** – Open the content in the marketplace and use the payment widget to complete a test purchase.

## Project Structure

- **`src/`** – Next.js frontend (App Router, static export)
  - `app/` – Pages and routes
  - `components/` – React components
  - `lib/` – API client, auth, theme, chains, etc.
  - `types/` – TypeScript types
- **`workers/`** – Cloudflare Workers backend
  - `routes/` – API route handlers
  - `lib/` – DB, JWT, email, Solana, verifiers
  - `middleware/` – Auth, CORS, security
  - `migrations/` – D1 migrations

## Notes

- The frontend uses **static export** for Cloudflare Pages.
- All API calls go through the Cloudflare Workers backend.
- JWT tokens are used for merchant authentication; access tokens (JWT) are issued after payment verification.
- For production secrets and deployment, see [secrets.md](secrets.md) and [deployment.md](deployment.md).
