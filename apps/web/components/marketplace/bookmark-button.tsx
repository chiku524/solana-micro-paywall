'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiClient } from '../../lib/api-client';
import { showSuccess, showError } from '../../lib/toast';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface BookmarkButtonProps {
  contentId: string;
  className?: string;
}

export function BookmarkButton({ contentId, className = '' }: BookmarkButtonProps) {
  const { publicKey, connected } = useWallet();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      checkBookmarkStatus();
    } else {
      setChecking(false);
    }
  }, [connected, publicKey, contentId]);

  const checkBookmarkStatus = async () => {
    if (!connected || !publicKey) return;

    try {
      const result = await apiClient.isBookmarked(publicKey.toString(), contentId) as any;
      setIsBookmarked(result.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!connected || !publicKey) {
      return;
    }

    // Optimistic update
    const previousState = isBookmarked;
    setIsBookmarked(!isBookmarked);
    setLoading(true);

    try {
      if (previousState) {
        await apiClient.removeBookmark(publicKey.toString(), contentId);
        showSuccess('Removed from bookmarks');
      } else {
        await apiClient.addBookmark(publicKey.toString(), contentId);
        showSuccess('Added to bookmarks');
      }
    } catch (error) {
      // Rollback on error
      setIsBookmarked(previousState);
      showError(previousState ? 'Failed to remove bookmark' : 'Failed to add bookmark');
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected || checking) {
    return null;
  }

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={loading}
      className={`rounded-full p-2 transition ${
        isBookmarked
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-red-400'
      } ${className}`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      {isBookmarked ? (
        <HeartIconSolid className="h-5 w-5" />
      ) : (
        <HeartIcon className="h-5 w-5" />
      )}
    </button>
  );
}

