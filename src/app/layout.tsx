import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SolanaWalletProvider } from '@/lib/wallet-provider';
import { AnimatedBackground } from '@/components/ui/animated-background';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Micro Paywall - Blockchain Payment Platform',
  description: 'Multi-chain micro-paywall and pay-per-use platform. Monetize content with instant blockchain payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SolanaWalletProvider>
          <AnimatedBackground />
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
