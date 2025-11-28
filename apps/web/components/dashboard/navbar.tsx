'use client';

import { Link } from '../ui/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense, useState, useRef, useEffect } from 'react';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  EllipsisVerticalIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { NetworkToggle } from '../ui/network-toggle';

// Dynamically import WalletMultiButton to prevent hydration errors
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// Main navigation items (always visible)
const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Contents', href: '/dashboard/contents', icon: DocumentTextIcon },
];

// More menu items (in dropdown)
const moreMenuItems = [
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Payments', href: '/dashboard/payments', icon: DocumentTextIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

// Resources menu items (in dropdown)
const resourcesMenuItems = [
  { name: 'Documentation', href: '/docs', icon: BookOpenIcon },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon },
];

// Dropdown menu component
function DropdownMenu({ 
  items, 
  label, 
  buildHref, 
  pathname 
}: { 
  items: typeof moreMenuItems; 
  label: string;
  buildHref: (href: string) => string;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasActiveItem = items.some(item => pathname === item.href);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition ${
          hasActiveItem
            ? 'bg-neutral-800 text-emerald-400'
            : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
        }`}
      >
        <span>{label}</span>
        <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-48 rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg">
          <div className="py-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={buildHref(item.href)}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-neutral-800 text-emerald-400'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// User menu dropdown
function UserMenu({ 
  merchantId, 
  handleLogout 
}: { 
  merchantId: string;
  handleLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!merchantId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
        title="User menu"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg">
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center space-x-2 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
      localStorage.removeItem('auth_token');
    }
    router.push('/');
    setMobileMenuOpen(false);
  };

  // All navigation items combined for mobile menu
  const allNavItems = [
    ...mainNavigation,
    ...moreMenuItems,
    ...resourcesMenuItems,
  ];

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-emerald-400">
              Solana Paywall
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-10 lg:flex lg:items-center lg:space-x-4">
              {/* Main navigation items */}
              {mainNavigation.map((item) => {
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
              
              {/* More menu dropdown */}
              <DropdownMenu 
                items={moreMenuItems} 
                label="More" 
                buildHref={buildHref}
                pathname={pathname}
              />
              
              {/* Resources dropdown */}
              <DropdownMenu 
                items={resourcesMenuItems} 
                label="Resources" 
                buildHref={buildHref}
                pathname={pathname}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <NetworkToggle />
            </div>
            <div className="hidden sm:block">
              <WalletMultiButton />
            </div>
            <div className="hidden lg:block">
              <UserMenu merchantId={merchantId} handleLogout={handleLogout} />
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-md p-2 text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-800">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={buildHref(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 text-base font-medium transition ${
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
            <div className="pt-2">
              <div className="px-3 pb-2">
                <WalletMultiButton />
              </div>
              {merchantId && (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-base font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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

