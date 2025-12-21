import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SolanaWalletProvider } from '@/lib/wallet-provider';
import { AnimatedBackground } from '@/components/ui/animated-background';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Micro-Paywall',
  description: 'Solana-native micro-paywall and pay-per-use platform',
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
