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
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // CRITICAL: We MUST inject __NEXT_DATA__ in production because @cloudflare/next-on-pages
    // doesn't inject it for edge runtime pages. Without it, Next.js cannot initialize.
    // This is a necessary workaround until we migrate to Workers + Pages convergence.

    // Check if __NEXT_DATA__ script tag exists in HTML
    const existingScript = document.getElementById('__NEXT_DATA__');
    if (existingScript) {
      console.log('[NextDataInjector] __NEXT_DATA__ script tag found in HTML');
      // Also check if window.__NEXT_DATA__ exists
      if ((window as any).__NEXT_DATA__) {
        console.log('[NextDataInjector] __NEXT_DATA__ already initialized');
        return;
      }
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
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'development',
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

    // CRITICAL: Try to inject as script tag first (Next.js expects it in HTML)
    // If script tag doesn't exist, create it
    if (!existingScript) {
      try {
        const script = document.createElement('script');
        script.id = '__NEXT_DATA__';
        script.type = 'application/json';
        script.setAttribute('data-nextjs-data', '');
        script.textContent = JSON.stringify(minimalNextData);
        
        // Insert before closing body tag or before first script
        const firstScript = document.querySelector('script');
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
          console.log('[NextDataInjector] Created __NEXT_DATA__ script tag in HTML');
        } else if (document.body) {
          document.body.insertBefore(script, document.body.firstChild);
          console.log('[NextDataInjector] Created __NEXT_DATA__ script tag in body');
        }
      } catch (error) {
        console.error('[NextDataInjector] Failed to create script tag:', error);
      }
    }

    // Also inject into window object (fallback)
    (window as any).__NEXT_DATA__ = minimalNextData;
    
    console.log('[NextDataInjector] Created minimal __NEXT_DATA__:', {
      page: minimalNextData.page,
      pathname: minimalNextData.pathname,
      buildId: minimalNextData.buildId,
    });

    // Try to trigger Next.js initialization if possible
    // This might not work perfectly, but it's better than nothing
    if ((window as any).next && typeof (window as any).next.router !== 'undefined') {
      console.log('[NextDataInjector] Next.js router found, attempting to initialize...');
    }
  }, [pathname]);

  return null;
}

