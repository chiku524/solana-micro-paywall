'use client';

import dynamic from 'next/dynamic';

const AnimatedBackground = dynamic(
  () => import('./animated-background').then((m) => ({ default: m.AnimatedBackground })),
  { ssr: false }
);

export function LazyAnimatedBackground() {
  return <AnimatedBackground />;
}
