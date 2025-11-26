# 🔐 Environment Variables Guide

This document describes all environment variables needed for deploying the Solana Micro-Paywall application to Cloudflare.

## 📋 Overview

The application uses environment variables in two places:
1. **Cloudflare Workers** (Backend API)
2. **Cloudflare Pages** (Frontend)

## 🔧 Cloudflare Workers Environment Variables

These are set in: **Workers & Pages → Your Worker → Settings → Variables**

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `JWT_SECRET` | Secret | Secret key for JWT token signing. **Generate a secure random string.** | `openssl rand -hex 32` |
| `SOLANA_RPC_ENDPOINT` | String | Solana RPC endpoint URL | `https://api.mainnet-beta.solana.com` |
| `FRONTEND_URL` | String | Your frontend domain (for CORS and redirects) | `https://micropaywall.app` |
| `CORS_ORIGIN` | String | Comma-separated list of allowed origins | `https://micropaywall.app,https://www.micropaywall.app` |
| `NODE_ENV` | String | Environment mode | `production` |

### Optional Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `LOG_LEVEL` | String | Logging level (`debug`, `info`, `warn`, `error`) | `info` |
| `RATE_LIMIT_ENABLED` | Boolean | Enable rate limiting | `true` |
| `MAX_REQUEST_SIZE` | Number | Maximum request body size in bytes | `1048576` (1MB) |

### Production Configuration Example

```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
FRONTEND_URL=https://micropaywall.app
CORS_ORIGIN=https://micropaywall.app,https://www.micropaywall.app
NODE_ENV=production
```

### Development Configuration Example

```bash
JWT_SECRET=dev-secret-key-change-in-production
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
NODE_ENV=development
```

## 🌐 Cloudflare Pages Environment Variables

These are set in: **Pages → Your Project → Settings → Environment Variables**

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | String | Your API endpoint URL | `https://api.micropaywall.app` |
| `NEXT_PUBLIC_WEB_URL` | String | Your frontend URL (for metadata, links) | `https://micropaywall.app` |

### Optional Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_RPC` | String | Solana Devnet RPC endpoint | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_RPC_MAINNET` | String | Solana Mainnet RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | String | Default Solana network | `devnet` |
| `NEXT_PUBLIC_SENTRY_DSN` | String | Sentry DSN for error tracking (optional) | - |
| `SENTRY_ORG` | String | Sentry organization (optional) | - |
| `SENTRY_PROJECT` | String | Sentry project name (optional) | - |

**Important**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these variables!

### Production Configuration Example

```bash
NEXT_PUBLIC_API_URL=https://api.micropaywall.app
NEXT_PUBLIC_WEB_URL=https://micropaywall.app
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### Development Configuration Example

```bash
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_WEB_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## 🔑 Generating Secure Secrets

### Generate JWT Secret

```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Example Output

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

## 📝 Setting Variables in Cloudflare

### For Workers

1. Go to: [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Workers & Pages** → Your Worker
3. Click: **Settings** → **Variables**
4. Select environment: **Production** (or **Staging**)
5. Click: **Add variable**
6. Enter variable name and value
7. Click: **Save**

### For Pages

1. Go to: [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Pages** → Your Project
3. Click: **Settings** → **Environment Variables**
4. Select environment: **Production** (or **Preview**)
5. Click: **Add variable**
6. Enter variable name and value
7. Click: **Save**

## 🔄 Environment-Specific Configurations

### Production

- Use production Solana RPC endpoints
- Use your production domain URLs
- Set `NODE_ENV=production`
- Use strong, randomly generated secrets
- Enable all security features

### Staging

- Use testnet/devnet Solana RPC endpoints
- Use staging domain URLs
- Set `NODE_ENV=staging`
- Can use weaker secrets (but still secure)
- Enable debugging features

### Development

- Use localhost URLs
- Use devnet Solana RPC endpoints
- Set `NODE_ENV=development`
- Can use simple secrets
- Enable verbose logging

## 🔒 Security Best Practices

1. **Never commit secrets to Git**
   - Use Cloudflare's environment variables
   - Use GitHub Secrets for CI/CD

2. **Use different secrets per environment**
   - Production secrets should be unique
   - Rotate secrets regularly

3. **Limit access to secrets**
   - Only give access to trusted team members
   - Use Cloudflare's access controls

4. **Monitor secret usage**
   - Check Cloudflare logs for suspicious activity
   - Set up alerts for unusual patterns

5. **Use strong secrets**
   - Minimum 32 characters for JWT secrets
   - Use cryptographically secure random generators

## 🧪 Testing Environment Variables

### Test Workers Variables

```bash
# Using Wrangler CLI
cd apps/backend-workers
wrangler dev

# Check logs for environment variable errors
```

### Test Pages Variables

```bash
# Build locally
cd apps/web
npm run build

# Check for undefined variables
grep -r "process.env" .next/
```

## 🐛 Troubleshooting

### Variables Not Working

1. **Check variable names**: Case-sensitive, must match exactly
2. **Check environment**: Make sure you're setting variables for the correct environment
3. **Rebuild**: After adding variables, rebuild/redeploy
4. **Check logs**: Look for errors in Cloudflare logs

### CORS Errors

- Verify `CORS_ORIGIN` includes your frontend URL
- Check that `FRONTEND_URL` matches your actual domain
- Ensure no trailing slashes in URLs

### API Connection Errors

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check that the API is deployed and accessible
- Verify CORS settings on the Workers side

## 📚 Additional Resources

- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Remember**: Always test your configuration in a staging environment before deploying to production!

