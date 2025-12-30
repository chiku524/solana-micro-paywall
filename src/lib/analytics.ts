// Analytics tracking utilities

import { useEffect } from 'react';

type AnalyticsEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

// Simple analytics implementation
// Can be extended to integrate with Google Analytics, Plausible, etc.

class Analytics {
  private enabled: boolean;

  constructor() {
    // Enable analytics in production or when explicitly enabled
    this.enabled =
      typeof window !== 'undefined' &&
      (process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true');
  }

  trackPageView(path: string, title?: string) {
    if (!this.enabled) return;

    try {
      // Track page view
      console.debug('[Analytics] Page View:', { path, title });

      // Send to analytics service (e.g., Google Analytics, Plausible)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_path: path,
          page_title: title,
        });
      }

      // Track in custom analytics if needed
      this.sendEvent({
        action: 'page_view',
        category: 'navigation',
        label: path,
      });
    } catch (error) {
      console.error('[Analytics] Error tracking page view:', error);
    }
  }

  trackEvent(event: AnalyticsEvent) {
    if (!this.enabled) return;

    try {
      console.debug('[Analytics] Event:', event);

      // Send to analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
        });
      }

      this.sendEvent(event);
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }

  trackPurchase(amount: number, currency: string, contentId: string) {
    this.trackEvent({
      action: 'purchase',
      category: 'ecommerce',
      label: contentId,
      value: amount,
    });
  }

  trackContentView(contentId: string, contentType?: string) {
    this.trackEvent({
      action: 'view_content',
      category: 'content',
      label: contentId,
    });
  }

  trackSearch(query: string) {
    this.trackEvent({
      action: 'search',
      category: 'engagement',
      label: query,
    });
  }

  trackWalletConnect(walletType: string) {
    this.trackEvent({
      action: 'wallet_connect',
      category: 'wallet',
      label: walletType,
    });
  }

  private sendEvent(event: AnalyticsEvent) {
    // Custom analytics endpoint (if you have one)
    // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })
  }
}

export const analytics = new Analytics();

// React hook for tracking page views
export function usePageTracking(path: string, title?: string) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      analytics.trackPageView(path, title);
    }
  }, [path, title]);
}

