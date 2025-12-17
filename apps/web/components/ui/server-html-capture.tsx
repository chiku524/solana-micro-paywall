'use client';

import { useEffect } from 'react';

/**
 * CRITICAL: Capture and log the actual server-rendered HTML
 * This helps identify hydration mismatches by showing what the server sent
 * vs what React expects on the client
 */
export function ServerHtmlCapture() {
  useEffect(() => {
    const canIngest =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    // Capture the HTML as it exists immediately after page load (before React hydrates)
    // This is the server-rendered HTML
    const serverHtml = document.documentElement.outerHTML;
    
    // Log key parts of the HTML structure
    const reactRoot = document.getElementById('__next');
    const bodyContent = document.body.innerHTML;
    
    console.log('[ServerHtmlCapture] ===== SERVER HTML ANALYSIS =====');
    console.log('[ServerHtmlCapture] Full HTML length:', serverHtml.length);
    console.log('[ServerHtmlCapture] DOCTYPE present:', serverHtml.trim().startsWith('<!DOCTYPE'));
    console.log('[ServerHtmlCapture] #__next exists:', !!reactRoot);
    
    if (reactRoot) {
      console.log('[ServerHtmlCapture] #__next children count:', reactRoot.children.length);
      console.log('[ServerHtmlCapture] #__next innerHTML length:', reactRoot.innerHTML.length);
      console.log('[ServerHtmlCapture] #__next innerHTML (first 500 chars):', reactRoot.innerHTML.substring(0, 500));
      
      // Log each child element
      Array.from(reactRoot.children).forEach((child, index) => {
        console.log(`[ServerHtmlCapture] Child ${index}:`, {
          tagName: child.tagName,
          id: child.id,
          className: child.className,
          innerHTML: child.innerHTML.substring(0, 200),
        });
      });
    }
    
    // Check for ClientOnly wrapper
    const clientOnlyWrapper = document.querySelector('[data-client-only]');
    console.log('[ServerHtmlCapture] ClientOnly wrapper exists:', !!clientOnlyWrapper);
    
    // Check for children content
    const hasChildrenContent = reactRoot && (
      reactRoot.querySelector('[data-page]') ||
      reactRoot.querySelector('main') ||
      reactRoot.children.length > 2
    );
    console.log('[ServerHtmlCapture] Has children content:', hasChildrenContent);
    
    // Log body structure
    console.log('[ServerHtmlCapture] Body innerHTML length:', bodyContent.length);
    console.log('[ServerHtmlCapture] Body innerHTML (first 1000 chars):', bodyContent.substring(0, 1000));
    
    // #region agent log
    if (canIngest) {
      fetch('http://127.0.0.1:7243/ingest/58d8abd3-b384-4728-8b61-35208e2e155a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server-html-capture.tsx:45',message:'Server HTML captured',data:{htmlLength:serverHtml.length,hasDoctype:serverHtml.trim().startsWith('<!DOCTYPE'),hasNextRoot:!!reactRoot,nextRootChildrenCount:reactRoot?.children.length||0,nextRootInnerHTML:reactRoot?.innerHTML.substring(0,500)||'none',hasClientOnly:!!clientOnlyWrapper,hasChildrenContent:hasChildrenContent,bodyLength:bodyContent.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    
    console.log('[ServerHtmlCapture] ===== END SERVER HTML ANALYSIS =====');
  }, []);

  return null;
}

