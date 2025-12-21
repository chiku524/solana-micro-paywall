'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/docs', label: 'Docs' },
  ];
  
  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              Solana Paywall
            </Link>
            <div className="ml-10 flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-emerald-400 bg-neutral-800'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/library">
              <Button variant="ghost" size="sm">My Library</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}