# Architecture & Multi-Chain Integration

This document describes how the application is structured and how to add support for new blockchain networks without rewriting existing flows.

## High-Level Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS. Static export for deployment.
- **Backend**: Cloudflare Workers + Hono. D1 (SQLite), KV (cache).
- **Payments**: Chain-agnostic flow: create payment intent → user signs on-chain → backend verifies via chain verifier → purchase/access token.

## Multi-Chain Design

The app is structured so that Solana is the first supported chain and others (e.g. Ethereum, Polygon) can be added by implementing a few well-defined pieces.

### 1. Shared types (`src/types/index.ts`)

- **`SupportedChain`**: Union of supported chain IDs (`'solana' | 'ethereum' | 'polygon'`). Extend this when adding a chain.
- **Optional `chain`** on `Content`, `Merchant`, `PaymentIntent`, `Purchase`, `RecentPayment`: used for explorer links and future per-chain payout/price. Defaults to `'solana'` when omitted.
- Amounts stay in **smallest unit** (lamports for Solana, wei for EVM). Field names remain `priceLamports` / `amountLamports` for DB compatibility; treat as “smallest unit for the chain” when using `chain`.

### 2. Frontend chain utilities (`src/lib/chains.ts`)

- **`CHAIN_CONFIGS`**: Per-chain config (name, symbol, decimals, explorer base URL).
- **`getExplorerTxUrl(chain, txSignature)`**: Block explorer link for a transaction. Use this instead of hardcoding Solscan/Etherscan.
- **`formatAmount(chain, amountSmallestUnit, options?)`**: Format amount for display (e.g. SOL, ETH, MATIC).
- **`DEFAULT_CHAIN`**: Current default `'solana'`.

**When adding a chain:** add an entry to `CHAIN_CONFIGS` and use `getExplorerTxUrl` / `formatAmount` in UI so new chains work without extra changes.

### 3. Backend verifiers (`workers/lib/verifiers/`)

Payment verification is abstracted so each chain has one verifier.

- **`types.ts`**: `VerifierResult` and `TransactionVerifier` interface:
  - `verify(env, signature, expectedRecipient, expectedAmount, expectedMemo?)` → `Promise<VerifierResult>`.
- **`solana-verifier.ts`**: Implements `TransactionVerifier` using existing Solana RPC + `transaction-verification.ts`.
- **`index.ts`**: `getVerifier(chain)`. Registers Solana; add new chains here after implementing their verifier.

**Payment route** (`workers/routes/payments.ts`): Uses `getVerifier(chain)` instead of calling Solana directly. Chain comes from payment intent (default `'solana'`).

### 4. Wallet & payment UI

- **Wallet provider** (`src/lib/wallet-provider.tsx`): Currently Solana-only (Wallet Adapter). For multiple chains, options include:
  - One provider per chain and a small “chain selector” in the payment flow, or
  - A unified wallet abstraction (e.g. `getAddress(chain)`, `signAndSend(chain, params)`) that wraps chain-specific SDKs.
- **Payment widget**: Uses wallet to sign; backend verifies via `getVerifier(chain)`. When content/merchant have `chain`, pass it into the payment request so the correct wallet and verifier are used.

### 5. Database (future)

- Current schema uses a single `payout_address` and no `chain` column. To support multiple chains you can:
  - Add optional `chain` column (e.g. on `content`, `payment_intents`, `purchases`) defaulting to `'solana'`, and/or
  - Add `payout_addresses` (e.g. JSON or separate table) keyed by chain.

Migrations and API changes for this can be done when you add the second chain.

---

## How to Add a New Blockchain

Follow these steps to support another network (e.g. Ethereum) while keeping existing Solana behavior intact.

### Step 1: Types and config

1. Add the new chain to **`SupportedChain`** in `src/types/index.ts` (e.g. `| 'ethereum'`).
2. Add its config to **`CHAIN_CONFIGS`** in `src/lib/chains.ts` (name, symbol, decimals, explorer TX URL).

### Step 2: Backend verifier

1. Create **`workers/lib/verifiers/ethereum-verifier.ts`** (or `<chain>-verifier.ts`).
2. Implement **`TransactionVerifier`**:
   - Take `env` (add any needed env vars, e.g. `ETHEREUM_RPC_URL` in `wrangler.toml`).
   - Call your Ethereum RPC to fetch the transaction by hash.
   - Verify: recipient matches `expectedRecipient`, value ≥ `expectedAmount`, optional memo/reference.
   - Return `{ valid, payerAddress, error? }`.
3. Register the verifier in **`workers/lib/verifiers/index.ts`**:  
   `ethereum: ethereumVerifier`.

### Step 3: Payment route

- Payment intent already carries an optional `chain` (default `'solana'`). When creating payment intents for the new chain, set `chain: 'ethereum'` (and later persist it in DB if you add a `chain` column).
- **Create payment request**: For Ethereum you’ll return different fields (e.g. `to`, `value`, `data`) instead of a Solana Pay URL; the frontend will use these to build an EVM transaction.
- **Verify payment**: No change needed if you use `getVerifier(paymentIntent.chain ?? 'solana')`; the new verifier will be used for `chain === 'ethereum'`.

### Step 4: Frontend wallet and payment UI

1. Add an Ethereum (or EVM) wallet connection (e.g. wagmi, ethers, or a similar adapter).
2. In the payment flow:
   - If content/merchant have `chain`, use the matching wallet and RPC.
   - Build the transaction (transfer ETH to merchant payout address, optional memo/reference).
   - After the user signs, send `transactionSignature` (tx hash) to `POST /api/payments/verify-payment` as today; backend will use `getVerifier(chain)`.
3. Use **`getExplorerTxUrl(chain, txSignature)`** for “View on Explorer” links so Etherscan (or other) is used for Ethereum.

### Step 5: Optional DB and API

- Add a `chain` column where needed (e.g. `content`, `payment_intents`, `purchases`) and default it to `'solana'`.
- Optionally support per-chain payout addresses (e.g. `payout_address_ethereum` or a JSON map).
- Return `chain` from API so the frontend can choose wallet and explorer without guessing.

---

## File Reference

| Purpose | Location |
|--------|----------|
| Chain type & optional `chain` on entities | `src/types/index.ts` |
| Chain config, explorer URL, format amount | `src/lib/chains.ts` |
| Verifier interface & result type | `workers/lib/verifiers/types.ts` |
| Solana verifier | `workers/lib/verifiers/solana-verifier.ts` |
| Verifier registry | `workers/lib/verifiers/index.ts` |
| Payment creation & verification | `workers/routes/payments.ts` |
| Explorer links in dashboard | `src/app/dashboard/page.tsx`, `src/app/dashboard/payments/page.tsx` |

---

## Recommendations for a Top-Notch App

Beyond multi-chain readiness, consider:

1. **Observability**: Structured logging, request IDs, and optional APM (e.g. Sentry, Axiom) in Workers and frontend.
2. **Resilience**: Retries with backoff for RPC and external APIs; circuit breaker for RPC in verifiers.
3. **Security**: Rate limit payment creation and verification (already in place); optional CAPTCHA or proof-of-work for public payment endpoints; audit log for sensitive actions.
4. **Performance**: Cache chain config and verifier lookups; use KV for idempotency or short-lived dedup of payment requests.
5. **Testing**: Unit tests for verifiers (mock RPC); integration tests for create → verify → purchase flow per chain.
6. **Docs**: Keep API docs (e.g. in `APPLICATION_SPECIFICATION.md` or OpenAPI) in sync with new endpoints and request/response shapes when adding chains or features.

These additions fit into the current architecture without changing the multi-chain abstraction.
