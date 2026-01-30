'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { analytics } from '@/lib/analytics';

export default function HomePage() {
  useEffect(() => {
    analytics.trackPageView('/', 'Home');
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main id="main-content" className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10" role="main">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 opacity-0 animate-fade-in-up">
              <span className="gradient-text">Micro Paywall</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 mb-4 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-in-up [animation-delay:80ms]">
              Monetize your content with instant blockchain payments
            </p>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in-up [animation-delay:160ms]">
              Multi-chain support • Sub-second confirmations • Near-zero fees • Seamless integration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fade-in-up [animation-delay:240ms]">
              <Link href="/dashboard">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" size="lg">Browse Marketplace</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white text-center mb-4 opacity-0 animate-fade-in-up">
            Powerful Features
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-center mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in-up [animation-delay:80ms]">
            Everything you need to monetize your content with blockchain payments
          </p>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="glass-strong p-6 md:p-8 rounded-xl hover:border-emerald-500/30 transition-all group opacity-0 animate-fade-in-up [animation-delay:120ms] hover:scale-[1.02] duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                Instant Payments
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Lightning-fast blockchain transaction confirmations with near-zero fees across multiple networks.
              </p>
            </div>
            <div className="glass-strong p-6 md:p-8 rounded-xl hover:border-blue-500/30 transition-all group opacity-0 animate-fade-in-up [animation-delay:200ms] hover:scale-[1.02] duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                Easy Integration
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Drop-in payment widgets that work seamlessly with any website or application.
              </p>
            </div>
            <div className="glass-strong p-6 md:p-8 rounded-xl hover:border-purple-500/30 transition-all group opacity-0 animate-fade-in-up [animation-delay:280ms] hover:scale-[1.02] duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                Full Control
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Complete dashboard with analytics, content management, and comprehensive payment tracking.
              </p>
            </div>
          </div>
        </section>

        {/* Blockchain Support Section */}
        <section className="py-20 md:py-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4 opacity-0 animate-fade-in-up">
              Multi-Chain Support
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto opacity-0 animate-fade-in-up [animation-delay:80ms]">
              Built to support multiple blockchains. Start with Solana, expand to Ethereum, Polygon, and more.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {['Solana', 'Ethereum', 'Polygon', 'More Coming'].map((chain, idx) => (
              <div key={chain} className="glass p-6 rounded-xl text-center hover:border-emerald-500/30 transition-all group opacity-0 animate-fade-in-up hover:scale-[1.03] duration-300" style={{ animationDelay: `${160 + idx * 60}ms` }}>
                <div className="text-2xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform inline-block">
                  {chain}
                </div>
                {idx < 3 && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Supported</div>
                )}
                {idx === 3 && (
                  <div className="text-xs text-neutral-500 mt-2">Soon</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
