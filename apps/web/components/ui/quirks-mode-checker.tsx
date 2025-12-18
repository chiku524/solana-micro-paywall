'use client';

import { useEffect } from 'react';

/**
 * Client component to check for Quirks Mode and ensure proper Next.js initialization
 * Moved from inline script to fix CSP violations
 */
export function QuirksModeChecker() {
  useEffect(() => {
    const canIngest =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    // CRITICAL: Log immediately to verify script is executing
    console.log('[Layout] Quirks Mode detection script executing...');
    console.log('[Layout] document.compatMode:', document.compatMode);
    
    // #region agent log
    if (canIngest) {
      fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quirks-mode-checker.tsx:18',message:'Quirks Mode check',data:{compatMode:document.compatMode,doctype:document.doctype ? 'present' : 'missing',pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    }
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

    // CRITICAL:
    // DO NOT create/mutate __NEXT_DATA__ in production.
    // This DOM mutation is a common trigger for React hydration mismatch (#418),
    // and Next.js App Router does not rely on __NEXT_DATA__ the way Pages Router did.
    //
    // If we ever need local experimentation, keep it localhost-only and use `NextDataInjector`,
    // not this component.
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) {
      console.warn('[Layout] __NEXT_DATA__ script tag missing (expected on App Router). Not injecting.');
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

