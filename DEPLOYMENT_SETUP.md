# Deployment Setup Guide

## Project Structure

This application uses **two separate Cloudflare projects**:

1. **Pages Project**: `micropaywall` - Frontend (Next.js static site)
2. **Workers Project**: `micropaywall-api` - Backend API (Cloudflare Workers)

## Custom Domains Configuration

### Pages Project (`micropaywall`)

**Custom Domain:**
- `micropaywall.app` (primary domain)
- `www.micropaywall.app` (optional, redirects to main domain)

**Setup Steps:**
1. Go to Cloudflare Dashboard → Workers & Pages → `micropaywall` project
2. Navigate to **Custom domains** tab
3. Click **Set up a custom domain**
4. Add `micropaywall.app`
5. Cloudflare will automatically configure DNS records

### Workers Project (`micropaywall-api`)

**Custom Domain:**
- `api.micropaywall.app` (API subdomain)

**Setup Steps:**
1. Go to Cloudflare Dashboard → Workers & Pages → `micropaywall-api` project
2. Navigate to **Triggers** tab
3. Under **Routes**, click **Add Custom Domain**
4. Add `api.micropaywall.app`
5. Cloudflare will automatically configure DNS records

## DNS Records Required

Cloudflare will automatically create these DNS records when you add custom domains:

- **A Record** (or CNAME): `micropaywall.app` → Pages
- **A Record** (or CNAME): `api.micropaywall.app` → Workers

If you need to set them up manually:
- `micropaywall.app` → CNAME to `micropaywall.pages.dev`
- `api.micropaywall.app` → CNAME to `micropaywall-api.YOUR-ACCOUNT.workers.dev`

## Environment Variables

### Pages Project (`micropaywall`)
No environment variables needed (static site).

### Workers Project (`micropaywall-api`)
Set these in Cloudflare Dashboard → Workers & Pages → `micropaywall-api` → Settings → Variables:

**Required:**
- `JWT_SECRET`: Secret key for JWT signing (generate a secure random string)
- `SOLANA_RPC_URL`: Solana RPC endpoint (e.g., `https://api.mainnet-beta.solana.com`)

**Optional:**
- `HELIUS_API_KEY`: Helius API key for enhanced RPC access
- `NEXT_PUBLIC_WEB_URL`: `https://micropaywall.app`
- `NEXT_PUBLIC_API_URL`: `https://api.micropaywall.app`

## Database & KV Setup

### D1 Database
1. Create database: `wrangler d1 create solana-paywall-db`
2. Copy the database ID
3. Update `wrangler.toml` with the database ID
4. Run migrations: `npm run db:migrate`

### KV Namespace (for rate limiting)
1. Create namespace: `wrangler kv:namespace create CACHE`
2. Copy the namespace ID
3. Update `wrangler.toml` with the namespace ID

## Deployment

Both projects are automatically deployed via GitHub Actions when you push to `main`:

- **Pages**: Deploys from `out/` directory
- **Workers**: Deploys from `workers/` directory

## Testing the Setup

After deployment, verify:

1. **Frontend**: Visit `https://micropaywall.app` - should load the homepage
2. **API Health Check**: Visit `https://api.micropaywall.app/health` - should return `{"status":"ok","timestamp":...}`
3. **API Endpoint**: `POST https://api.micropaywall.app/api/merchants` - should create a merchant account

## Troubleshooting

### API requests failing with 405 Method Not Allowed
- Verify the custom domain `api.micropaywall.app` is configured for the Workers project
- Check that DNS records are properly set up
- Ensure the Worker is deployed and active

### CORS errors
- Verify CORS middleware is configured in `workers/middleware/cors.ts`
- Check that `NEXT_PUBLIC_WEB_URL` is set correctly in Worker environment variables

### Database connection errors
- Verify D1 database is created and ID is correct in `wrangler.toml`
- Ensure migrations have been run: `npm run db:migrate`
- Check database bindings in Cloudflare Dashboard

