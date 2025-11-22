# Domain Registration & Setup Guide

## 🌐 Do You Need a Domain?

### Short Answer: **Recommended, but not required initially**

You can start with Cloudflare's free subdomains:
- **Frontend**: `your-project.pages.dev`
- **Backend**: `solana-paywall-api.your-subdomain.workers.dev`

However, for production, a custom domain is **highly recommended** for:
- ✅ Professional branding
- ✅ Better SEO
- ✅ User trust
- ✅ Easier to remember
- ✅ Email addresses (noreply@yourdomain.com)

## 🎯 Domain Name Suggestions

Based on your app name **"Solana Micro-Paywall"**, here are domain suggestions:

### Top Recommendations:

1. **`solanapaywall.com`** ⭐ (Best option - direct, clear)
   - Pros: Exact match, professional, easy to remember
   - Cons: May be taken

2. **`solpaywall.com`** ⭐ (Short, catchy)
   - Pros: Short, easy to type, memorable
   - Cons: Less descriptive

3. **`micropaywall.io`** ⭐ (Tech-focused)
   - Pros: Modern, tech-friendly, available
   - Cons: .io is more expensive

4. **`solanapay.io`** (Alternative)
   - Pros: Short, payment-focused
   - Cons: Less specific to paywall

5. **`solpay.io`** (Very short)
   - Pros: Very short, easy to remember
   - Cons: Generic, may be taken

### Other Options:

- `solanapaywall.io`
- `micropaywall.sol` (if .sol domains available)
- `solpaywall.io`
- `solpaywall.com`
- `solanamicropay.com`

## 📋 Domain Registration Steps

### Step 1: Check Availability

Visit domain registrars and check availability:
- **Namecheap** (recommended): https://www.namecheap.com
- **Cloudflare Registrar** (best for Cloudflare integration): https://www.cloudflare.com/products/registrar/
- **Google Domains**: https://domains.google
- **GoDaddy**: https://www.godaddy.com

### Step 2: Register Domain

**Recommended: Use Cloudflare Registrar**
- ✅ Seamless integration with Cloudflare services
- ✅ At-cost pricing (no markup)
- ✅ Free WHOIS privacy
- ✅ Easy DNS management
- ✅ Automatic SSL

**Steps:**
1. Go to Cloudflare Dashboard
2. Click "Add a Site"
3. Enter your domain
4. If domain not registered, click "Register Domain"
5. Complete registration

### Step 3: Configure DNS

After registration, configure DNS records:

#### For Cloudflare Pages (Frontend):
```
Type  Name  Value                    Proxy
A     @     Cloudflare Pages IP      ✅ Proxied
CNAME www   your-project.pages.dev   ✅ Proxied
```

#### For Cloudflare Workers (Backend):
```
Type  Name  Value                                    Proxy
CNAME api   solana-paywall-api.workers.dev           ✅ Proxied
```

Or use a subdomain:
```
Type  Name  Value                                    Proxy
CNAME api   your-project.your-subdomain.workers.dev  ✅ Proxied
```

## 🎯 Recommended Domain Structure

### Option A: Single Domain (Recommended)
- **Frontend**: `https://solanapaywall.com`
- **Backend API**: `https://api.solanapaywall.com`

### Option B: Separate Subdomains
- **Frontend**: `https://app.solanapaywall.com`
- **Backend API**: `https://api.solanapaywall.com`

### Option C: Path-based (Not Recommended)
- **Frontend**: `https://solanapaywall.com`
- **Backend API**: `https://solanapaywall.com/api`

## 💰 Domain Costs

- **`.com`**: ~$10-15/year
- **`.io`**: ~$30-40/year
- **`.sol`**: Varies (if available)

**Cloudflare Registrar**: Usually at-cost pricing (cheapest option)

## 🚀 Quick Setup After Registration

### 1. Add Domain to Cloudflare

1. Go to Cloudflare Dashboard
2. Click "Add a Site"
3. Enter your domain
4. Cloudflare will scan existing DNS records
5. Update nameservers at your registrar (if not using Cloudflare Registrar)

### 2. Configure Pages

1. Go to Pages → Your Project → Custom Domains
2. Click "Set up a custom domain"
3. Enter `solanapaywall.com` (or your domain)
4. Cloudflare will automatically configure DNS
5. SSL certificate will be provisioned automatically (2-5 minutes)

### 3. Configure Workers

1. Go to Workers → Your Worker → Settings → Triggers
2. Add Custom Domain: `api.solanapaywall.com`
3. Cloudflare will configure DNS automatically
4. SSL certificate will be provisioned automatically

## 📝 Environment Variables Update

After setting up domains, update your environment variables:

### Frontend (Cloudflare Pages):
```bash
NEXT_PUBLIC_API_URL=https://api.solanapaywall.com
NEXT_PUBLIC_FRONTEND_URL=https://solanapaywall.com
```

### Backend (Cloudflare Workers):
```bash
FRONTEND_URL=https://solanapaywall.com
CORS_ORIGIN=https://solanapaywall.com,https://www.solanapaywall.com
```

## ⚡ Start Without Domain (Then Add Later)

You can absolutely start the migration without a domain:

1. **Use free subdomains** for development/testing
2. **Complete the migration** and verify everything works
3. **Register domain** when ready
4. **Add custom domain** to Cloudflare (takes 5 minutes)
5. **Update environment variables** and redeploy

## 🎯 My Recommendation

**Register: `solanapaywall.com`** (or `solpaywall.com` if taken)

**Why:**
- ✅ Direct match to your app name
- ✅ Professional and memorable
- ✅ Good for SEO
- ✅ Easy to communicate to users

**Setup:**
- Frontend: `https://solanapaywall.com`
- Backend: `https://api.solanapaywall.com`

## 📋 Domain Checklist

- [ ] Check domain availability
- [ ] Register domain (Cloudflare Registrar recommended)
- [ ] Add domain to Cloudflare
- [ ] Configure DNS records
- [ ] Wait for SSL certificates (automatic, 2-5 min)
- [ ] Update environment variables
- [ ] Test domain access
- [ ] Verify SSL is working

## 🚀 Next Steps

1. **Register domain** (or start with free subdomains)
2. **Begin Cloudflare migration** (we'll set this up)
3. **Configure domains** when ready
4. **Go live!**

Ready to start the migration? Let me know which domain you choose (or if you want to start with free subdomains)!

