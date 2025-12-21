# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Cloudflare D1 Database**
   ```bash
   wrangler d1 create solana-paywall-db
   ```
   Copy the database ID and update `wrangler.toml` (replace `YOUR_DATABASE_ID`)

3. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

4. **Configure Environment Variables**
   
   Create a `.dev.vars` file (for local development):
   ```
   JWT_SECRET=your-secret-key-here
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   HELIUS_API_KEY=your-helius-api-key (optional)
   NEXT_PUBLIC_WEB_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:8787
   ```

   Or update `wrangler.toml` environment variables for production.

5. **Start Development Servers**
   
   Terminal 1 (Backend API):
   ```bash
   npm run worker:dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8787

## First Steps

1. **Create a Merchant Account**
   - Go to http://localhost:3000/dashboard
   - Enter your email and create an account
   - Save your Merchant ID (you'll need it to login)

2. **Login to Dashboard**
   - Use your Merchant ID to login
   - Set up your payout address (Solana wallet address)

3. **Create Content**
   - Navigate to Contents page
   - Create your first content item
   - Set price and description

4. **Test Payment Flow**
   - View your content in the marketplace
   - Use the payment widget to test purchases

## Project Structure

- `src/` - Frontend Next.js application
  - `app/` - Pages and routes
  - `components/` - React components
  - `lib/` - Utilities and API client
  - `types/` - TypeScript type definitions

- `workers/` - Cloudflare Workers backend
  - `routes/` - API route handlers
  - `lib/` - Backend utilities (DB, JWT, Solana)
  - `middleware/` - Auth, CORS middleware
  - `migrations/` - Database migrations

## Important Notes

- The frontend uses static export for Cloudflare Pages compatibility
- All API calls go through the Cloudflare Workers backend
- JWT tokens are used for merchant authentication
- Access tokens (JWT) are issued after successful payment verification
- Payment verification happens on-chain via Solana RPC

## Next Steps

- Configure production environment variables
- Set up custom domains
- Deploy to Cloudflare (see DEPLOYMENT.md)
- Integrate wallet adapter for Solana wallet connections
- Add QR code generation for mobile payments
- Implement webhook notifications

## Troubleshooting

- **Database errors**: Ensure migrations have run and database ID is correct in `wrangler.toml`
- **CORS errors**: Check `NEXT_PUBLIC_WEB_URL` matches your frontend URL
- **Payment verification fails**: Verify Solana RPC endpoint is accessible and correct
- **Build errors**: Ensure all dependencies are installed (`npm install`)
