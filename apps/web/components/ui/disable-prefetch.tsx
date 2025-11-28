'use client';

import { useEffect } from 'react';

/**
 * Component to disable Next.js prefetching completely
 * This prevents 503 errors on Cloudflare Pages
 */
export function DisablePrefetch() {
  useEffect(() => {
    // Disable Next.js router prefetching
    if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
      // Override the router's prefetch method
      const router = (window as any).__NEXT_DATA__;
      if (router && router.router) {
        const originalPrefetch = router.router.prefetch;
        router.router.prefetch = () => Promise.resolve();
      }
    }

    // Disable link prefetching at the browser level
    const links = document.querySelectorAll('link[rel="prefetch"]');
    links.forEach((link) => {
      link.remove();
    });

    // Monitor for new prefetch links and remove them
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'LINK' && element.getAttribute('rel') === 'prefetch') {
              element.remove();
            }
          }
        });
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

