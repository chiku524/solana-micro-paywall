# Secrets and Environment Variables

## Worker Secrets (Set via Wrangler CLI)

These secrets have been set for the `micropaywall-api` Worker in production:

### JWT_SECRET
- **Value**: `40cc0b637c931f7e78f27b1a6dd18d550e78ad422df7c645297b6ba446274b06`
- **Purpose**: Secret key for signing JWT tokens
- **Set via**: `wrangler secret put JWT_SECRET --env production`

### SOLANA_RPC_URL
- **Value**: `https://api.mainnet-beta.solana.com` (or the value you entered)
- **Purpose**: Solana RPC endpoint for transaction verification
- **Set via**: `wrangler secret put SOLANA_RPC_URL --env production`

## Important Notes

1. **Secrets are encrypted** and cannot be retrieved after setting. If you need to change them, use `wrangler secret put` again.

2. **Bindings are defined in `wrangler.toml`** and will be automatically applied during deployment:
   - D1 Database: `DB` → `micropaywall-db` (ID: `9fb849f1-b895-4670-baca-cdec2767f8c4`)
   - KV Namespace: `CACHE` → (ID: `7b095fcc4cb74cc787c1e7a20bf895a0`)

3. **GitHub Actions deployments** use `wrangler deploy --env production`, which will:
   - Apply bindings from `wrangler.toml`
   - Use secrets already set in Cloudflare
   - **NOT overwrite** manually configured bindings in the dashboard

## To Update Secrets

```bash
# Update JWT_SECRET
wrangler secret put JWT_SECRET --env production

# Update SOLANA_RPC_URL
wrangler secret put SOLANA_RPC_URL --env production

# List all secrets
wrangler secret list --env production
```

## Optional Secrets

You can also set these if needed:
- `HELIUS_API_KEY`: For enhanced Solana RPC access (optional)
- `NEXT_PUBLIC_WEB_URL`: `https://micropaywall.app` (optional, for CORS)
- `NEXT_PUBLIC_API_URL`: `https://api.micropaywall.app` (optional)

