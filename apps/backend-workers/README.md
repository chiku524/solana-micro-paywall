# Cloudflare Workers Backend

This is the Cloudflare Workers version of the backend API, migrated from NestJS.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Cloudflare account
- Wrangler CLI installed globally: `npm install -g wrangler`

### Initial Setup

1. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

2. **Create D1 Database**:
   ```bash
   wrangler d1 create solana-paywall-db
   ```
   Copy the `database_id` and add it to `wrangler.toml`

3. **Create KV Namespace**:
   ```bash
   wrangler kv:namespace create "CACHE"
   wrangler kv:namespace create "CACHE" --preview
   ```
   Copy the IDs and add them to `wrangler.toml`

4. **Create Queues**:
   ```bash
   wrangler queues create payment-verification
   wrangler queues create webhooks
   ```

5. **Run Database Migration**:
   ```bash
   npm run db:migrate
   ```

6. **Install Dependencies**:
   ```bash
   npm install
   ```

7. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
apps/backend-workers/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic
│   ├── middleware/           # Auth, validation, etc.
│   ├── utils/                # Helpers
│   └── types/                # TypeScript types
├── wrangler.toml             # Cloudflare configuration
└── package.json
```

## 🔧 Development

### Local Development

```bash
npm run dev
```

This starts a local development server with D1, KV, and Queues support.

### Deploy

```bash
# Deploy to production
npm run deploy:production

# Deploy to staging
npm run deploy:staging
```

## 📝 Migration Status

- [x] Project structure
- [x] Health check endpoint
- [ ] Authentication module
- [ ] Payments module
- [ ] Merchants module
- [ ] Contents module
- [ ] All other modules
- [ ] Queue processors
- [ ] KV caching
- [ ] Full testing

## 🚨 Important Notes

1. **SQLite Limitations**: 
   - No foreign key constraints enforced
   - JSON stored as TEXT (parse in code)
   - Arrays stored as JSON strings

2. **Cold Starts**: Minimal (~0ms) but first request may be slower

3. **Execution Time**: 30s CPU time limit (usually not an issue)

4. **Memory**: 128MB limit (sufficient for most operations)

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
