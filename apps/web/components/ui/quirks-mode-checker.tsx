'use client';

import { useEffect } from 'react';

/**
 * Client component to check for Quirks Mode and ensure proper Next.js initialization
 * Moved from inline script to fix CSP violations
 */
export function QuirksModeChecker() {
  useEffect(() => {
    // CRITICAL: Log immediately to verify script is executing
    console.log('[Layout] Quirks Mode detection script executing...');
    console.log('[Layout] document.compatMode:', document.compatMode);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quirks-mode-checker.tsx:12',message:'Quirks Mode check',data:{compatMode:document.compatMode,doctype:document.doctype ? 'present' : 'missing',pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL: Check for Quirks Mode immediately
    // If DOCTYPE is missing, the browser enters Quirks Mode before any scripts run
    // This check happens as early as possible to prevent React hydration errors
    if (document.compatMode === 'BackCompat') {
      console.error('[Layout] CRITICAL: Page is in Quirks Mode! DOCTYPE is missing. Forcing immediate page reload.');
      // Force a full page reload IMMEDIATELY - don't wait for React
      // Use replace to avoid adding to history stack
      if (window.location.search.indexOf('_quirks_fix') === -1) {
        window.location.replace(window.location.href + (window.location.search ? '&' : '?') + '_quirks_fix=1');
        // Stop execution - don't let React try to hydrate
        return;
      } else {
        // If we're already in a reload loop, something is seriously wrong
        console.error('[Layout] CRITICAL: Still in Quirks Mode after reload attempt. DOCTYPE injection may be required.');
        // Try to inject DOCTYPE programmatically as last resort
        if (document.doctype === null) {
          console.error('[Layout] Attempting to inject DOCTYPE programmatically...');
          // This won't work (DOCTYPE can't be added after page load), but logs the attempt
        }
      }
    } else {
      console.log('[Layout] Page is in Standards Mode - DOCTYPE is present');
    }
    
    // CRITICAL: Ensure #__next root element exists for React hydration
    // Next.js App Router should create this automatically, but Cloudflare Pages might strip it
    // The middleware should ensure it exists in HTML, but this is a safety net
    let nextRoot = document.getElementById('__next');
    
    if (!nextRoot) {
      console.error('[Layout] CRITICAL: #__next root element missing! This should have been fixed by middleware.');
      console.error('[Layout] Body HTML:', document.body.innerHTML.substring(0, 500));
      console.error('[Layout] Body children:', Array.from(document.body.children).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
      })));
      
      // Last resort: create it (but this shouldn't be necessary if middleware works)
      nextRoot = document.createElement('div');
      nextRoot.id = '__next';
      // Insert at the beginning of body
      if (document.body.firstChild) {
        document.body.insertBefore(nextRoot, document.body.firstChild);
      } else {
        document.body.appendChild(nextRoot);
      }
      console.error('[Layout] Created #__next as last resort - middleware should have fixed this!');
    } else {
      console.log('[Layout] #__next root element found');
    }
    
    // CRITICAL: Check for __NEXT_DATA__ script tag and create if missing
    // This must happen BEFORE React tries to hydrate
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) {
      console.warn('[Layout] CRITICAL: __NEXT_DATA__ script tag missing! Creating minimal version...');
      const pathname = window.location.pathname;
      const minimalNextData = {
        props: { pageProps: {} },
        page: pathname,
        pathname: pathname,
        query: {},
        buildId: 'development',
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
      
      // Create script tag
      const script = document.createElement('script');
      script.id = '__NEXT_DATA__';
      script.type = 'application/json';
      script.setAttribute('data-nextjs-data', '');
      script.textContent = JSON.stringify(minimalNextData);
      
      // Insert at the very beginning of body, before any other scripts
      if (document.body.firstChild) {
        document.body.insertBefore(script, document.body.firstChild);
      } else {
        document.body.appendChild(script);
      }
      
      // Also set window property
      (window as any).__NEXT_DATA__ = minimalNextData;
      console.log('[Layout] Created __NEXT_DATA__ script tag with pathname:', pathname);
    } else {
      console.log('[Layout] __NEXT_DATA__ script tag found');
      // Try to parse and set window property if not already set
      if (!(window as any).__NEXT_DATA__) {
        try {
          (window as any).__NEXT_DATA__ = JSON.parse(nextDataScript.textContent || '{}');
          console.log('[Layout] Parsed __NEXT_DATA__ from script tag');
        } catch (e) {
          console.error('[Layout] Failed to parse __NEXT_DATA__:', e);
        }
      }
    }
    
    // Disable Cloudflare Rocket Loader immediately
    (window as any).rocketloader = false;
    if ((window as any).$) {
      (window as any).$.rocketloader = false;
    }
    if ((window as any)._cf) {
      (window as any)._cf.rocketloader = false;
    }
    (window as any).__cf_rocketloader_disabled = true;
  }, []);

  return null;
}

