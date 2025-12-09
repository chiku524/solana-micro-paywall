'use client';

import { useEffect } from 'react';

/**
 * CRITICAL: Force full page reloads on navigation to prevent Quirks Mode
 * 
 * During client-side navigation, Next.js App Router streams RSC payloads.
 * On Cloudflare Pages, this can cause the DOCTYPE to be lost, resulting in Quirks Mode,
 * which breaks React hydration (error #418).
 * 
 * This component intercepts navigation and forces full page reloads to ensure
 * proper HTML structure (including DOCTYPE) is always present.
 */
export function NavigationHandler() {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    // Check if we're in Quirks Mode
    if (document.compatMode === 'BackCompat') {
      console.error('[NavigationHandler] Quirks Mode detected! Forcing page reload.');
      // Force a full page reload to get proper DOCTYPE
      if (window.location.search.indexOf('_quirks_fix') === -1) {
        window.location.href = window.location.href + (window.location.search ? '&' : '?') + '_quirks_fix=1';
        return;
      }
    }
    
    // Intercept Link component clicks to force full page reloads
    // This bypasses Next.js RSC streaming which loses DOCTYPE on Cloudflare Pages
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        // Only intercept internal navigation (same origin)
        if (url.origin === window.location.origin) {
          // Check if it's a Next.js Link (has href starting with /)
          const isInternalLink = link.getAttribute('href')?.startsWith('/');
          
          // Skip if explicitly marked to not reload
          if (isInternalLink && !link.hasAttribute('data-no-reload')) {
            // Prevent default Next.js navigation
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[NavigationHandler] Intercepting Link click to:', link.href);
            // Force full page reload to ensure proper DOCTYPE
            window.location.href = link.href;
          }
        }
      }
    };
    
    // Add click listener to document
    document.addEventListener('click', handleLinkClick, true);
    
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, []);
  
  return null;
}

