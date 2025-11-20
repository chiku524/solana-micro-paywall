'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { HomeIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

// Dynamically import WalletMultiButton to prevent hydration errors
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// Get marketplace URL (client-side)
const getMarketplaceUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3002';
  }
  return process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3002';
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Contents', href: '/dashboard/contents', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Docs', href: '/docs', icon: DocumentTextIcon },
];

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get merchantId from URL or localStorage as fallback
  const getMerchantId = () => {
    const urlMerchantId = searchParams.get('merchantId') || '';
    if (urlMerchantId) {
      // Store in localStorage for future use
      if (typeof window !== 'undefined') {
        localStorage.setItem('merchantId', urlMerchantId);
      }
      return urlMerchantId;
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('merchantId') || '';
    }
    return '';
  };
  
  const merchantId = getMerchantId();

  // Helper function to build href with merchantId
  const buildHref = (href: string) => {
    if (merchantId) {
      return `${href}?merchantId=${merchantId}`;
    }
    return href;
  };

  // Logout function
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('merchantId');
    }
    router.push('/');
  };

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-emerald-400">
              Solana Paywall
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href={getMarketplaceUrl()}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                target="_self"
              >
                <span>View Marketplace</span>
              </a>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={buildHref(item.href)}
                    className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-neutral-800 text-emerald-400'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WalletMultiButton />
            {merchantId && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                title="Logout and return to home page"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 border-b border-neutral-800 bg-neutral-900/60" />}>
      <NavbarContent />
    </Suspense>
  );
}

