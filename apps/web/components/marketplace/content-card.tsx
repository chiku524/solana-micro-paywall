import { Link } from '../ui/link';
import Image from 'next/image';
import { Content } from '../../lib/api-client';
import { BookmarkButton } from './bookmark-button';

interface ContentCardProps {
  content: Content;
}

export function ContentCard({ content }: ContentCardProps) {
  const price = Number(content.priceLamports) / 1e9;
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'One-time';
    const hours = Math.floor(seconds / 3600);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <Link href={`/marketplace/content/${content.merchant.id}/${content.slug}`}>
      <div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60 transition hover:border-emerald-500/50 hover:bg-neutral-900">
        {content.thumbnailUrl ? (
          <div className="relative h-48 w-full overflow-hidden bg-neutral-800">
            <Image
              src={content.thumbnailUrl}
              alt={content.title || content.slug || 'Content thumbnail'}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
            <div className="absolute top-2 right-2">
              <BookmarkButton contentId={content.id} />
            </div>
          </div>
        ) : (
          <div className="relative flex h-48 w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
            <div className="text-4xl">📄</div>
            <div className="absolute top-2 right-2">
              <BookmarkButton contentId={content.id} />
            </div>
          </div>
        )}
        <div className="p-4">
          {content.category && (
            <span className="mb-2 inline-block rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
              {content.category}
            </span>
          )}
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white group-hover:text-emerald-400">
            {content.title || content.slug}
          </h3>
          {content.description && (
            <p className="mb-3 line-clamp-2 text-sm text-neutral-400">{content.description}</p>
          )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-emerald-400">
                  {price.toFixed(4)} {content.currency}
                </p>
                <p className="text-xs text-neutral-500">{formatDuration(content.durationSecs)}</p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p>{content.purchaseCount} purchases</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <Link
                href={`/marketplace/merchant/${content.merchant.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-neutral-400 hover:text-emerald-400 transition"
              >
                View merchant profile →
              </Link>
            </div>
        </div>
      </div>
    </Link>
  );
}

