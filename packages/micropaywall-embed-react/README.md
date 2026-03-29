# micropaywall-embed-react

Lightweight **React iframe embed** for Micropaywall checkout. Keeps Solana/EVM wallet code on the hosted app; your site only renders an iframe.

**Note:** The scoped name `@micropaywall/embed-react` requires an npm org named `micropaywall`. This package uses an unscoped name so you can publish without creating that org. To use a scope, create the org at [npmjs.com/org/create](https://www.npmjs.com/org/create) and change the `name` in `package.json`.

## Install

```bash
npm install micropaywall-embed-react
```

## Usage

```tsx
import { MicropaywallEmbed } from 'micropaywall-embed-react';

export function Checkout() {
  return (
    <MicropaywallEmbed
      merchantId="your-merchant-uuid"
      slug="your-content-slug"
      baseUrl="https://micropaywall.app"
    />
  );
}
```

## Publish

From this directory:

```bash
npm run build
npm publish --access public
```

Unscoped packages are public by default; `--access public` is optional. Add a `repository` field to `package.json` when you have a Git URL (optional for npm).

## Full checkout component

For a drop-in widget with wallets inside **your** app, depend on the main app’s `PaymentWidget` (or copy it) and list `wagmi`, `@solana/wallet-adapter-*`, etc. as peer dependencies—that is a heavier package; this embed is the recommended default for third-party sites.

## API reference

REST endpoints (`create-payment-request`, `verify-payment`, optional `Idempotency-Key` / `X-Api-Key`) are documented in the repo at [`docs/application-specification.md`](../../docs/application-specification.md).
