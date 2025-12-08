'use client';

import { Component, ReactNode } from 'react';
import { showError } from '../../lib/toast';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    
    logger.error('Error caught by boundary', error, {
      componentStack: errorInfo.componentStack,
      errorInfo,
    });
    
    // Send to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
    
    showError('Something went wrong. Please refresh the page.');
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when children change
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800 p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h2>
              <p className="text-red-300 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

