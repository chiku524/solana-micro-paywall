import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookmarkButton } from './ui/bookmark-button';
import { formatAmount } from '@/lib/chains';
import type { Content } from '@/types';

interface ContentCardProps {
  content: Content;
  merchantName?: string;
}

export const ContentCard = React.memo(function ContentCard({ content, merchantName }: ContentCardProps) {
  return (
    <div className="relative bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-800 transition-colors group">
      <Link
        href={`/marketplace/content?merchantId=${content.merchantId}&slug=${content.slug}`}
        className="block"
      >
        {content.thumbnailUrl && (
          <div className="relative w-full aspect-video bg-neutral-800 overflow-hidden">
            <Image
              src={content.thumbnailUrl}
              alt={content.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {content.title}
          </h3>
          {content.description && (
            <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
              {content.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div>
              {merchantName && (
                <p className="text-xs text-neutral-500">{merchantName}</p>
              )}
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatAmount(content.chain ?? 'solana', content.priceLamports)}
              </p>
            </div>
            {content.purchaseCount > 0 && (
              <span className="text-xs text-neutral-500">
                {content.purchaseCount} purchases
              </span>
            )}
          </div>
        </div>
      </Link>
      {/* Bookmark button - positioned absolutely */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <BookmarkButton
          contentId={content.id}
          contentData={{
            title: content.title,
            thumbnailUrl: content.thumbnailUrl,
            merchantId: content.merchantId,
            slug: content.slug,
          }}
          variant="icon-only"
        />
      </div>
    </div>
  );
});
