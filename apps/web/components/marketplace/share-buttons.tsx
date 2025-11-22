'use client';

import { useState } from 'react';
import { 
  ShareIcon, 
  ClipboardDocumentIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';

interface ShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ShareButtons({ url, title, description, className = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareText = title ? `${title}${description ? ` - ${description}` : ''}` : url;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-sm"
        title="Copy link"
      >
        {copied ? (
          <>
            <CheckIcon className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <ClipboardDocumentIcon className="h-4 w-4" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-sm"
        title="Share on X (Twitter)"
      >
        <span>🐦</span>
        <span>Share on X</span>
      </a>

      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-sm"
        title="Share on Telegram"
      >
        <span>✈️</span>
        <span>Share on Telegram</span>
      </a>

      {/* Native Web Share API if available */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={async () => {
            try {
              await navigator.share({
                title,
                text: description,
                url,
              });
            } catch (error) {
              // User cancelled or error occurred
              console.log('Share cancelled or failed:', error);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition text-sm font-medium"
          title="Share"
        >
          <ShareIcon className="h-4 w-4" />
          <span>Share</span>
        </button>
      )}
    </div>
  );
}

