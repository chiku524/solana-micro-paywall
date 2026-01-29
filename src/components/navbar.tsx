'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, merchant } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/marketplace', label: 'Marketplace' },
  ];
  
  return (
    <nav className="glass-bar border-b border-neutral-200/80 dark:border-neutral-700/50 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 rounded px-2 py-1" aria-label="Micro Paywall Home">
              Micro Paywall
            </Link>
            <div className="ml-10 flex space-x-4" role="menubar">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900',
                    pathname === item.href
                      ? 'text-emerald-400 bg-neutral-200/50 dark:bg-neutral-800/50'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-400 hover:bg-neutral-200/30 dark:hover:bg-neutral-800/30'
                  )}
                  role="menuitem"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                // Sun icon for light mode
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <>
                <Link href="/library">
                  <Button variant="ghost" size="sm">My Library</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                {merchant?.displayName && (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden sm:block">
                    {merchant.displayName}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="hover:bg-red-100/50 dark:hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-400"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
