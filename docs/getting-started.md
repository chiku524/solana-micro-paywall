# Getting Started - Quick Reference

## ✅ Current Status

- [x] Database schema created in Supabase
- [x] Prisma Client generated
- [x] Backend built successfully
- [x] Development servers configured

## 🚀 Next Steps

### 1. Start Development Servers

```bash
# From project root
npm run dev
```

This starts:
- **Backend API**: http://localhost:3000/api
- **Dashboard**: http://localhost:3001

### 2. Verify Everything Works

```bash
# Test backend health
curl http://localhost:3000/api/health

# Should return: {"status":"ok","database":"connected"}
```

### 3. Test the Application

1. **Open Dashboard**: http://localhost:3001
2. **Create a Merchant**: Use the dashboard or API
3. **Create Content**: Add a paywall content item
4. **Test Payment Flow**: Create payment request and verify

See [Testing Guide](./testing-guide.md) for detailed steps.

## 📝 Database Migrations

### Do I need to run SQL manually every time?

**Short answer**: For schema changes, yes - but it's simple!

### Migration Workflow

When you change `schema.prisma`:

1. **Generate migration SQL**:
   ```bash
   cd apps/backend
   npx prisma migrate dev --create-only --name your_change_name
   ```

2. **Copy SQL from** `prisma/migrations/[timestamp]_your_change_name/migration.sql`

3. **Run in Supabase SQL Editor** (takes 30 seconds)

4. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

5. **Done!** ✅

### Why Manual SQL?

- Supabase connection pooler doesn't support DDL operations (CREATE/ALTER TABLE)
- This is **standard practice** - many teams do this
- Application queries work perfectly with the pooler (99% of usage)
- Migrations are rare (schema changes happen infrequently)

### Alternative: Command Line Migrations

You CAN use command line, but you need the **direct connection URL** (not pooler):

1. Get direct connection URL from Supabase:
   - Project Settings → Database → Connection String
   - Use the "Direct connection" (not "Session" or "Transaction" pooler)

2. Temporarily update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

3. Run migration:
   ```bash
   npx prisma migrate dev
   ```

4. Switch back to pooler URL for application

**Recommendation**: Manual SQL is simpler and safer - you can review the SQL before running it.

## 🧪 Testing on Localhost

Yes! You should test on localhost first. Here's the workflow:

### Quick Test Checklist

1. **Start servers**: `npm run dev`
2. **Verify health**: `curl http://localhost:3000/api/health`
3. **Create merchant**: Use dashboard at http://localhost:3001
4. **Create content**: Add a test article/content
5. **Test payment**: 
   - Create payment request
   - Use Solana wallet to pay (devnet)
   - Verify payment
   - Redeem token

### Testing with Devnet

- Use Solana **devnet** for testing (free, test SOL available)
- Get devnet SOL from: https://faucet.solana.com
- Configure in `.env`: `SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com`

### Testing Payment Flow

1. **Create Payment Request** → Get `solanaPayUrl` and `memo`
2. **Send Payment** → Use Phantom/Solflare wallet (devnet)
3. **Verify Payment** → Backend checks transaction on-chain
4. **Get Access Token** → JWT token for content access
5. **Redeem Token** → Verify token works

See [Testing Guide](./testing-guide.md) for detailed examples.

## 🔧 Troubleshooting

### Backend Build Error
```bash
# If you see "Cannot find module 'dist/main'"
cd apps/backend
npm run build
```

### Database Connection Error
- Check `DATABASE_URL` in `.env`
- Verify Supabase pooler is enabled
- Ensure schema is created (run `manual-setup.sql`)

### Prisma Client Error
```bash
cd apps/backend
npm run db:generate
```

### Port Already in Use
- Backend: Change `API_PORT` in `.env`
- Dashboard: Update port in `apps/dashboard/package.json`

## 📚 Documentation

- [Testing Guide](./testing-guide.md) - Detailed testing steps
- [Migration Guide](./migrations/README.md) - Database migration workflow
- [Optimization Report](./optimization-report.md) - Code improvements
- [Development Setup](./development-setup-summary.md) - Setup summary

## 🎯 What to Test First

1. ✅ **Health Check**: Verify backend is running
2. ✅ **Create Merchant**: Test merchant creation API
3. ✅ **Create Content**: Test content management
4. ✅ **Payment Request**: Create a payment intent
5. ✅ **Payment Verification**: Test transaction verification
6. ✅ **Token Redemption**: Test access token system

## 🚢 Production Deployment

Before going to production:

- [ ] Switch to mainnet Solana RPC
- [ ] Use secure JWT secret (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Set up error monitoring (Sentry)
- [ ] Enable rate limiting
- [ ] Review security settings
- [ ] Set up database backups

---

**You're all set!** Start the servers and begin testing. 🎉

