import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-neutral-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-4">{icon || defaultIcon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-neutral-400 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <div>
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty state components
export function EmptyPurchases() {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-neutral-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      }
      title="No purchases yet"
      description="Content you purchase will appear here. Start exploring the marketplace to find great content!"
      action={{
        label: 'Browse Marketplace',
        href: '/marketplace',
      }}
    />
  );
}

export function EmptyContent() {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-neutral-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      }
      title="No content yet"
      description="Create your first piece of content to start monetizing. It only takes a few minutes!"
      action={{
        label: 'Create Content',
        href: '/dashboard/contents',
      }}
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-neutral-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title={query ? `No results for "${query}"` : 'No results found'}
      description={
        query
          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
          : 'Try searching with different keywords or browse all content.'
      }
    />
  );
}

export function EmptyPayments() {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-neutral-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No payments yet"
      description="Your payment history will appear here once you start receiving payments for your content."
    />
  );
}

