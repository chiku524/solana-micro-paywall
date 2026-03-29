import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

export interface MicropaywallEmbedProps {
  merchantId: string;
  slug: string;
  /** Hosted app origin, default production */
  baseUrl?: string;
  /** Initial iframe min-height in px */
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * Embeds the hosted Micropaywall content checkout in an iframe.
 * Listens for `micropaywall:resize` postMessage to adjust height (same protocol as `public/micropaywall-embed.js`).
 */
export function MicropaywallEmbed({
  merchantId,
  slug,
  baseUrl = 'https://micropaywall.app',
  minHeight = 520,
  className,
  style,
  title = 'Micropaywall checkout',
}: MicropaywallEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

  const src = `${baseUrl.replace(/\/$/, '')}/marketplace/content/?merchantId=${encodeURIComponent(merchantId)}&slug=${encodeURIComponent(slug)}`;

  const onMessage = useCallback(
    (ev: MessageEvent) => {
      const data = ev.data as { type?: string; height?: number } | null;
      if (!data || data.type !== 'micropaywall:resize') return;
      if (typeof data.height === 'number' && data.height > 200) {
        setHeight(Math.min(data.height + 32, 3200));
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onMessage]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className={className}
      style={{
        width: '100%',
        border: 0,
        minHeight,
        height,
        ...style,
      }}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
