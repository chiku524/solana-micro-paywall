// Web Vitals performance monitoring

import { analytics } from './analytics';

export type Metric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

// Performance thresholds (in milliseconds or score)
// Note: FID has been replaced by INP in newer web-vitals versions
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 }, // Replaces FID
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

export function reportWebVitals(metric: Metric) {
  const rating = getRating(metric.name, metric.value);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating,
      delta: metric.delta,
    });
  }

  // Send to analytics
  analytics.trackEvent({
    action: 'web_vital',
    category: 'performance',
    label: metric.name,
    value: Math.round(metric.value),
  });

  // Send to custom analytics endpoint (if you have one)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: rating,
      non_interaction: true,
    });
  }
}

// Get Web Vitals using web-vitals library
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamically import web-vitals to avoid adding to bundle if not needed
  import('web-vitals')
    .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
      onINP(reportWebVitals);
    })
    .catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
}

