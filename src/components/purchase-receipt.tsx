'use client';

import type { Purchase } from '@/types';
import { CHAIN_CONFIGS } from '@/lib/chains';
import type { SupportedChain } from '@/types';

interface PurchaseReceiptProps {
  purchase: Purchase;
  contentTitle: string;
  onDismiss: () => void;
}

export function PurchaseReceipt({ purchase, contentTitle, onDismiss }: PurchaseReceiptProps) {
  const chain = (purchase.chain ?? 'solana') as SupportedChain;
  const explorer = CHAIN_CONFIGS[chain]?.explorerTxUrl ?? 'https://solscan.io/tx';
  const txUrl = `${explorer}/${purchase.transactionSignature}`;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 space-y-4 print:shadow-none print:border-neutral-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Purchase receipt</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{contentTitle}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
        >
          Print / Save PDF
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Amount (smallest units)</dt>
          <dd className="text-neutral-900 dark:text-white font-mono">
            {purchase.amountLamports} {purchase.currency}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Chain</dt>
          <dd className="text-neutral-900 dark:text-white">{chain}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500 dark:text-neutral-400">Transaction</dt>
          <dd className="text-neutral-900 dark:text-white font-mono break-all">{purchase.transactionSignature}</dd>
        </div>
        <div className="sm:col-span-2">
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm"
          >
            View on explorer →
          </a>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500 dark:text-neutral-400">Buyer wallet</dt>
          <dd className="text-neutral-900 dark:text-white font-mono break-all">{purchase.payerAddress}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 print:hidden"
      >
        Close
      </button>
    </div>
  );
}
