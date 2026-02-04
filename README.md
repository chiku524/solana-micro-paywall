# Micro Paywall

A multi-chain micro-paywall and pay-per-use platform that enables publishers, creators, and API providers to monetize their content using instant blockchain payments. Supports **8 blockchains**: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, and Avalanche.

## Features

- **Instant Payment Processing** – Sub-second transaction confirmations with near-zero fees
- **Multi-Chain** – Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, Avalanche
- **Access Token System** – Short-lived JWT tokens (1–24 hours) for premium content access after payment
- **Embeddable Widget** – Payment widget for any website (Solana + EVM wallets, QR code for Solana)
- **Merchant Dashboard** – Analytics, content management, payment tracking, settings, security (2FA, password recovery)
- **Public Marketplace** – Content discovery and browsing
- **User Library** – Purchased content and bookmarks

## Tech Stack

- **Frontend**: Next.js 15 (static export), React, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV
- **Blockchain**: Solana (Web3.js, Solana Pay), EVM chains (viem, wagmi)

## Quick Start

```bash
npm install
npm run worker:dev   # Terminal 1: API at http://localhost:8787
npm run dev          # Terminal 2: Frontend at http://localhost:3000
```

See **[docs/setup.md](docs/setup.md)** for full setup (D1, KV, migrations, `.dev.vars`).

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/setup.md](docs/setup.md) | Local development setup |
| [docs/deployment.md](docs/deployment.md) | Deploy to Cloudflare (Workers + Pages) |
| [docs/secrets.md](docs/secrets.md) | Worker secrets and env vars |
| [docs/architecture.md](docs/architecture.md) | Architecture and multi-chain integration |
| [docs/application-specification.md](docs/application-specification.md) | Full API and feature spec |
| [docs/enhancements.md](docs/enhancements.md) | Completed enhancements and recommendations |

## Project Structure

```
├── src/           # Next.js frontend
│   ├── app/       # App Router pages
│   ├── components/
│   ├── lib/
│   └── types/
├── workers/       # Cloudflare Workers API
│   ├── routes/
│   ├── lib/
│   ├── middleware/
│   └── migrations/
├── docs/          # Documentation (.md)
└── wrangler.toml
```

## License

MIT
