import Link from 'next/link';
import { formatSol } from '@/lib/utils';
import type { Content } from '@/types';

interface ContentCardProps {
  content: Content;
  merchantName?: string;
}

export function ContentCard({ content, merchantName }: ContentCardProps) {
  return (
    <Link
      href={`/marketplace/content/${content.merchantId}/${content.slug}`}
      className="block bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-800 transition-colors"
    >
      {content.thumbnailUrl && (
        <div className="relative w-full aspect-video bg-neutral-800">
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover"
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
            <p className="text-lg font-bold text-emerald-400">
              {formatSol(content.priceLamports)} SOL
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
  );
}
