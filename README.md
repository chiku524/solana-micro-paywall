# Micro Paywall

A multi-chain micro-paywall and pay-per-use platform that enables publishers, creators, and API providers to monetize content with instant blockchain payments. Supports **8 blockchains**: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, and Avalanche.

## Features

- **Instant payment processing** – On-chain verification; Solana Pay + EVM (viem)
- **Multi-chain** – Per-content chain; wallet adapters (Solana + wagmi/EVM)
- **Access tokens** – Short-lived JWTs after successful payment
- **USD-quoted pricing (optional)** – `target_price_usd` on content; amount computed at checkout via cached spot rates (CoinGecko)
- **Merchant tools** – Webhooks (HMAC-signed), sale email notifications, refund/support copy for buyers, developer API keys (higher rate limits)
- **Discovery** – Marketplace, discover, trending/recent; **KV-cached** list endpoints
- **Funnel analytics** – `POST /api/analytics/events` + merchant `GET /api/analytics/funnel`
- **Embeds** – Hosted [`public/micropaywall-embed.js`](public/micropaywall-embed.js) and npm package [`micropaywall-embed-react`](packages/micropaywall-embed-react) (React iframe)
- **Payment widget** – In-app checkout with receipt modal, idempotent create-request, memo/amount aligned with server intent
- **Marketplace UX** – EN/ES locale toggle, related content, truncated public descriptions with `?wallet=` unlock when purchased
- **Dashboard** – Contents, payments, settings (webhooks, API keys, delivery log), security (2FA, password recovery)
- **Library & bookmarks** – Purchases, bookmarks, recently viewed (`/library`; **My Library** in navbar when signed in)

## Tech Stack

- **Frontend**: Next.js 15 (static export), React 18, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, TypeScript
- **Database**: Cloudflare D1 (SQLite), migrations in `workers/migrations/`
- **Cache**: Cloudflare KV (rate limits, content lists, fiat quote cache, payment idempotency)
- **Chains**: Solana (Web3.js, Solana Pay), EVM (viem, wagmi)

## Quick Start

```bash
npm install
npm run worker:dev   # Terminal 1: API at http://localhost:8787
npm run dev          # Terminal 2: Frontend at http://localhost:3000
```

- **D1 (local)**: `npm run db:migrate` applies migrations to the **local** Wrangler D1 by default.
- **D1 (production)**: use `--remote` (see [docs/setup.md](docs/setup.md)).

Full setup: **[docs/setup.md](docs/setup.md)** (D1, KV, `.dev.vars`, migrations).

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/setup.md](docs/setup.md) | Local dev, D1/KV, migrations (local vs remote), troubleshooting |
| [docs/deployment.md](docs/deployment.md) | Cloudflare Workers + Pages deploy |
| [docs/secrets.md](docs/secrets.md) | Worker secrets and env vars |
| [docs/architecture.md](docs/architecture.md) | Stack, multi-chain, migrations, new subsystems |
| [docs/application-specification.md](docs/application-specification.md) | Features and API reference (keep in sync with code) |
| [docs/enhancements.md](docs/enhancements.md) | What’s shipped vs future ideas |
| [packages/micropaywall-embed-react/README.md](packages/micropaywall-embed-react/README.md) | Publishable React embed package |

## Project Structure

```
├── src/                      # Next.js frontend
│   ├── app/                  # App Router pages (static export → out/)
│   ├── components/
│   ├── lib/
│   └── types/                # Shared types (mirrored conceptually in workers)
├── workers/                  # Cloudflare Workers API
│   ├── routes/
│   ├── lib/                  # db, verifiers, fiat-quote, webhooks, email, …
│   ├── middleware/
│   └── migrations/           # D1 SQL migrations (0001–0007)
├── packages/
│   └── micropaywall-embed-react/   # Optional npm: iframe embed for React apps
├── public/
│   └── micropaywall-embed.js      # Vanilla script embed
├── docs/
└── wrangler.toml
```

## License

MIT
