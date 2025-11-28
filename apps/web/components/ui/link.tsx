'use client';

import NextLink, { type LinkProps } from 'next/link';
import { ComponentProps } from 'react';

/**
 * Custom Link component that completely disables prefetching
 * This prevents 503 errors on Cloudflare Pages when routes are prefetched
 */
export const Link = ({ href, children, ...props }: ComponentProps<typeof NextLink>) => {
  return (
    <NextLink href={href} prefetch={false} {...props}>
      {children}
    </NextLink>
  );
};

