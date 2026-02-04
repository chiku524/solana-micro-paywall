# Architecture & Multi-Chain Integration

This document describes how the application is structured and how to add support for new blockchain networks.

## High-Level Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS. Static export for deployment.
- **Backend**: Cloudflare Workers + Hono. D1 (SQLite), KV (cache).
- **Payments**: Chain-agnostic flow: create payment intent → user signs on-chain → backend verifies via chain verifier → purchase/access token.

## Multi-Chain Design

Solana is the first supported chain; others (e.g. Ethereum, Polygon) can be added by implementing a few well-defined pieces.

### 1. Shared types (`src/types/index.ts`)

- **`SupportedChain`**: Union of chain IDs (`'solana' | 'ethereum' | 'polygon'`). Extend when adding a chain.
- **Optional `chain`** on Content, Merchant, PaymentIntent, Purchase, RecentPayment: used for explorer links and future per-chain payout/price. Defaults to `'solana'` when omitted.
- Amounts stay in **smallest unit** (lamports for Solana, wei for EVM). Field names remain `priceLamports` / `amountLamports` for DB compatibility.

### 2. Frontend chain utilities (`src/lib/chains.ts`)

- **`CHAIN_CONFIGS`**: Per-chain config (name, symbol, decimals, explorer base URL).
- **`getExplorerTxUrl(chain, txSignature)`**: Block explorer link. Use instead of hardcoding Solscan/Etherscan.
- **`formatAmount(chain, amountSmallestUnit, options?)`**: Format for display (SOL, ETH, MATIC).
- **`DEFAULT_CHAIN`**: Current default `'solana'`.

### 3. Backend verifiers (`workers/lib/verifiers/`)

- **`types.ts`**: `VerifierResult` and `TransactionVerifier` interface.
- **`solana-verifier.ts`**: Implements `TransactionVerifier` using Solana RPC and `transaction-verification.ts`.
- **`index.ts`**: `getVerifier(chain)`. Registers Solana; add new chains here.

**Payment route** (`workers/routes/payments.ts`): Uses `getVerifier(chain)`; chain comes from payment intent (default `'solana'`).

### 4. Wallet & payment UI

- **Wallet provider** (`src/lib/wallet-provider.tsx`): Currently Solana-only (Wallet Adapter). For multiple chains, add a chain selector or unified wallet abstraction.
- **Payment widget**: Uses wallet to sign; backend verifies via `getVerifier(chain)`.

### 5. Database (future)

- Current schema: single `payout_address`, no `chain` column. To support multiple chains: add optional `chain` column and/or `payout_addresses` keyed by chain.

## Adding a New Blockchain

1. **Types**: Add chain to `SupportedChain` in `src/types/index.ts`. Add config to `CHAIN_CONFIGS` in `src/lib/chains.ts`.
2. **Verifier**: Create `workers/lib/verifiers/<chain>-verifier.ts` implementing `TransactionVerifier`; register in `workers/lib/verifiers/index.ts`.
3. **Payment route**: Payment intent already has optional `chain`. For the new chain, return the right payload (e.g. EVM `to`/`value`/`data`); verification uses `getVerifier(chain)`.
4. **Frontend**: Add wallet/RPC for the chain; build and sign the transaction; send `transactionSignature` to `POST /api/payments/verify-payment`. Use `getExplorerTxUrl(chain, signature)` for explorer links.
5. **Optional**: Add `chain` column and per-chain payout in DB/API.

## File Reference

| Purpose | Location |
|--------|----------|
| Chain type & optional `chain` on entities | `src/types/index.ts` |
| Chain config, explorer URL, format amount | `src/lib/chains.ts` |
| Verifier interface & result | `workers/lib/verifiers/types.ts` |
| Solana verifier | `workers/lib/verifiers/solana-verifier.ts` |
| Verifier registry | `workers/lib/verifiers/index.ts` |
| Payment creation & verification | `workers/routes/payments.ts` |

## Recommendations

- **Observability**: Structured logging, request IDs, optional APM (Sentry, Axiom).
- **Resilience**: Retries with backoff for RPC; circuit breaker in verifiers.
- **Security**: Rate limits (already in place); optional CAPTCHA; audit log for sensitive actions.
- **Testing**: Unit tests for verifiers (mock RPC); integration tests for create → verify → purchase.
