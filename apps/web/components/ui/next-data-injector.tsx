'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * CRITICAL: Workaround for missing __NEXT_DATA__ on Cloudflare Pages
 * 
 * @cloudflare/next-on-pages doesn't properly inject __NEXT_DATA__ for edge runtime pages.
 * This component attempts to create a minimal __NEXT_DATA__ object to allow Next.js to initialize.
 * 
 * This is a TEMPORARY workaround until we migrate to Workers + Pages convergence.
 */
export function NextDataInjector() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Check if __NEXT_DATA__ exists
    if ((window as any).__NEXT_DATA__) {
      console.log('[NextDataInjector] __NEXT_DATA__ already exists');
      return;
    }

    // CRITICAL: Create minimal __NEXT_DATA__ to allow Next.js to initialize
    // This is a workaround for @cloudflare/next-on-pages not injecting it
    console.warn('[NextDataInjector] __NEXT_DATA__ missing! Creating minimal version...');
    
    const minimalNextData = {
      props: {
        pageProps: {},
      },
      page: pathname,
      pathname: pathname,
      query: {},
      buildId: 'development', // This will be replaced by actual build ID if available
      isFallback: false,
      gssp: true,
      customServer: false,
      appGip: false,
      locale: undefined,
      locales: undefined,
      defaultLocale: undefined,
      domainLocales: undefined,
      scriptLoader: [],
    };

    // Inject __NEXT_DATA__ into window
    (window as any).__NEXT_DATA__ = minimalNextData;
    
    console.log('[NextDataInjector] Created minimal __NEXT_DATA__:', {
      page: minimalNextData.page,
      pathname: minimalNextData.pathname,
    });

    // Try to trigger Next.js initialization if possible
    // This might not work perfectly, but it's better than nothing
    if ((window as any).next && typeof (window as any).next.router !== 'undefined') {
      console.log('[NextDataInjector] Next.js router found, attempting to initialize...');
    }
  }, [pathname]);

  return null;
}

