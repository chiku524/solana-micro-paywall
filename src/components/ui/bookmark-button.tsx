'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { bookmarks } from '@/lib/local-storage';
import { showToast } from '@/lib/toast';

interface BookmarkButtonProps {
  contentId: string;
  contentData?: {
    title: string;
    thumbnailUrl?: string;
    merchantId: string;
    slug: string;
  };
  variant?: 'default' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BookmarkButton({
  contentId,
  contentData,
  variant = 'default',
  size = 'sm',
  className,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setIsBookmarked(bookmarks.isBookmarked(contentId));
  }, [contentId]);

  const handleToggle = () => {
    if (isBookmarked) {
      bookmarks.remove(contentId);
      setIsBookmarked(false);
      showToast.success('Removed from bookmarks');
    } else {
      if (contentData) {
        bookmarks.add(contentId, contentData);
      } else {
        bookmarks.add(contentId);
      }
      setIsBookmarked(true);
      showToast.success('Added to bookmarks');
    }
  };

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 rounded-lg transition-colors ${
          isBookmarked
            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/30'
            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
        } ${className || ''}`}
        aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
      >
        {isBookmarked ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.757.429L12 18.03l-7.243 4.543A.5.5 0 014 22.143V3a1 1 0 011-1z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <Button
      variant={isBookmarked ? 'outline' : 'ghost'}
      size={size}
      onClick={handleToggle}
      className={`flex items-center gap-2 ${
        isBookmarked
          ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
          : ''
      } ${className || ''}`}
    >
      {isBookmarked ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.757.429L12 18.03l-7.243 4.543A.5.5 0 014 22.143V3a1 1 0 011-1z" />
          </svg>
          Bookmarked
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Bookmark
        </>
      )}
    </Button>
  );
}

