'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiClient } from '../../lib/api-client';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { showSuccess, showError } from '../../lib/toast';

interface FollowButtonProps {
  merchantId: string;
  className?: string;
}

export function FollowButton({ merchantId, className = '' }: FollowButtonProps) {
  const { publicKey, connected } = useWallet();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      checkFollowStatus();
    } else {
      setChecking(false);
    }
  }, [connected, publicKey, merchantId]);

  const checkFollowStatus = async () => {
    if (!connected || !publicKey) return;

    try {
      const result = await apiClient.getFollowStatus(publicKey.toString(), merchantId) as any;
      setIsFollowing(result.isFollowing);
      setFollowerCount(result.followerCount || 0);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!connected || !publicKey) {
      showError('Please connect your wallet to follow merchants');
      return;
    }

    // Optimistic update
    const previousFollowing = isFollowing;
    const previousCount = followerCount;
    setIsFollowing(!isFollowing);
    setFollowerCount((prev) => (previousFollowing ? Math.max(0, prev - 1) : prev + 1));
    setLoading(true);

    try {
      if (previousFollowing) {
        await apiClient.unfollowMerchant(publicKey.toString(), merchantId);
        showSuccess('Unfollowed merchant');
      } else {
        await apiClient.followMerchant(publicKey.toString(), merchantId);
        showSuccess('Following merchant');
      }
    } catch (error: any) {
      // Rollback on error
      setIsFollowing(previousFollowing);
      setFollowerCount(previousCount);
      console.error('Error toggling follow:', error);
      showError(error.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (!connected || checking) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className={`inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
          isFollowing
            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isFollowing ? (
          <>
            <UserMinusIcon className="h-4 w-4" />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <UserPlusIcon className="h-4 w-4" />
            <span>Follow</span>
          </>
        )}
      </button>
      {followerCount > 0 && (
        <span className="text-sm text-neutral-400">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}

