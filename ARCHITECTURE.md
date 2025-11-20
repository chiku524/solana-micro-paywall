# Architecture Overview

## Project Structure

This is a **monorepo** with three main applications sharing one backend:

```
solana-micro-paywall/
├── apps/
│   ├── backend/          # NestJS API Server (Port 3000)
│   ├── dashboard/        # Next.js Merchant Dashboard (Port 3001)
│   └── marketplace/     # Next.js Public Marketplace (Port 3002)
└── packages/
    └── widget-sdk/       # Embeddable Payment Widget
```

## Architecture Diagram

```
┌─────────────────┐
│   Dashboard     │  (Next.js - Port 3001)
│  (Merchants)    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼─────────────────┐
│                         │
│   Backend API           │  (NestJS - Port 3000)
│   - Merchants           │
│   - Contents            │
│   - Payments            │
│   - Discovery           │
│                         │
└────────┬─────────────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Marketplace    │  (Next.js - Port 3002)
│   (Public)       │
└──────────────────┘
```

## Applications

### 1. Backend API (`apps/backend`)
- **Framework**: NestJS (Node.js/TypeScript)
- **Port**: 3000
- **Purpose**: Shared API server for both dashboard and marketplace
- **Endpoints**:
  - `/api/merchants` - Merchant management
  - `/api/contents` - Content CRUD operations
  - `/api/payments` - Payment processing
  - `/api/discover` - Public discovery API
  - `/api/tokens` - Access token management

### 2. Dashboard (`apps/dashboard`)
- **Framework**: Next.js 14 (React/TypeScript)
- **Port**: 3001
- **Purpose**: Merchant/admin interface
- **Features**:
  - Merchant account management
  - Content creation and editing
  - Analytics and revenue tracking
  - Settings configuration
  - Documentation

### 3. Marketplace (`apps/marketplace`)
- **Framework**: Next.js 14 (React/TypeScript)
- **Port**: 3002
- **Purpose**: Public-facing content discovery and purchase
- **Features**:
  - Browse and search content
  - Content detail pages
  - Wallet integration for purchases
  - Trending and categories
  - Documentation

## Shared Backend

Both applications communicate with the **same backend API**:

- **Single source of truth** for data
- **Unified authentication** and authorization
- **Consistent API** across both apps
- **Shared database** (PostgreSQL via Supabase)

## Database

- **Provider**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Connection**: Session pooler with PgBouncer
- **Schema**: Managed via Prisma migrations

## Running the Applications

### All at once:
```bash
npm run dev
```

### Individually:
```bash
npm run dev:backend      # Port 3000
npm run dev:dashboard    # Port 3001
npm run dev:marketplace  # Port 3002
```

## Communication Flow

### Merchant Flow (Dashboard):
1. Merchant logs into Dashboard (Port 3001)
2. Dashboard makes API calls to Backend (Port 3000)
3. Backend queries database
4. Response returned to Dashboard

### Buyer Flow (Marketplace):
1. Buyer visits Marketplace (Port 3002)
2. Marketplace fetches public content from Backend (Port 3000)
3. Buyer connects wallet and purchases
4. Marketplace calls Backend payment APIs
5. Backend verifies transaction on Solana
6. Access token issued and stored

## Why Separate Apps?

1. **Different User Bases**: Merchants vs. Buyers
2. **Different UI/UX**: Admin tools vs. Consumer marketplace
3. **Independent Deployment**: Can deploy separately
4. **Scalability**: Can scale marketplace and dashboard independently
5. **Security**: Different access patterns and permissions

## Shared Resources

- **Backend API**: Single API server
- **Database**: Shared PostgreSQL database
- **Environment**: Shared `.env` configuration
- **Types**: Shared TypeScript types (via packages)

## Development Workflow

1. **Backend changes**: Affect both apps
2. **Dashboard changes**: Only affect merchant experience
3. **Marketplace changes**: Only affect buyer experience
4. **Database migrations**: Run once, affect both apps

## Documentation

Both apps now have dedicated documentation pages:
- **Marketplace Docs**: http://localhost:3002/docs
- **Dashboard Docs**: http://localhost:3001/docs

Accessible from the navigation menu in each app.

