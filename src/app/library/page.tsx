'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/navbar';
import { ContentCard } from '@/components/content-card';
import { apiGet } from '@/lib/api';
import type { Purchase, Content } from '@/types';

export default function LibraryPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  const { data: purchases } = useSWR<{ purchases: Purchase[] }>(
    walletAddress ? `/api/purchases/wallet/${walletAddress}` : null,
    walletAddress ? (url: string) => apiGet<{ purchases: Purchase[] }>(url) : null
  );
  
  // Fetch content for each purchase (simplified - in production, backend should return content)
  const [contents, setContents] = useState<Record<string, Content>>({});
  
  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">My Library</h1>
        
        <div className="mb-8">
          <input
            type="text"
            placeholder="Enter your wallet address"
            className="w-full max-w-md px-4 py-2 bg-neutral-900 text-white rounded-lg border border-neutral-800"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>
        
        {purchases && purchases.purchases.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {purchases.purchases.map((purchase) => (
              <div key={purchase.id} className="bg-neutral-900 p-4 rounded-lg">
                <p className="text-sm text-neutral-400 mb-2">Purchase #{purchase.id.slice(0, 8)}</p>
                <p className="text-emerald-400 font-semibold">
                  {purchase.amountLamports / 1_000_000_000} SOL
                </p>
                {purchase.expiresAt && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Expires: {new Date(purchase.expiresAt * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : walletAddress ? (
          <p className="text-neutral-400">No purchases found for this wallet</p>
        ) : (
          <p className="text-neutral-400">Enter your wallet address to view your library</p>
        )}
      </main>
    </div>
  );
}
