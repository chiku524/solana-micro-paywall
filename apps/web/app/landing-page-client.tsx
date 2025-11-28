'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  BoltIcon,
  WalletIcon,
  ChartBarIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export function LandingPageClient() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: BoltIcon,
      title: 'Instant Payments',
      description: 'Sub-second confirmation times with Solana Pay. No waiting, no delays.',
      bgClass: 'bg-emerald-500/10',
      iconClass: 'text-emerald-400',
    },
    {
      icon: WalletIcon,
      title: 'Wallet Integration',
      description: 'Seamless integration with Phantom, Solflare, and all major Solana wallets.',
      bgClass: 'bg-blue-500/10',
      iconClass: 'text-blue-400',
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics Dashboard',
      description: 'Track revenue, monitor sales, and analyze performance in real-time.',
      bgClass: 'bg-emerald-500/10',
      iconClass: 'text-emerald-400',
    },
    {
      icon: CodeBracketIcon,
      title: 'Embeddable Widget',
      description: 'Drop-in SDK that works anywhere. No blockchain expertise required.',
      bgClass: 'bg-blue-500/10',
      iconClass: 'text-blue-400',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Verified',
      description: 'On-chain payment verification ensures every transaction is legitimate.',
      bgClass: 'bg-emerald-500/10',
      iconClass: 'text-emerald-400',
    },
    {
      icon: GlobeAltIcon,
      title: 'Public Marketplace',
      description: 'Discover and browse premium content from creators worldwide.',
      bgClass: 'bg-blue-500/10',
      iconClass: 'text-blue-400',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Content',
      description: 'Set your price, configure access duration, and publish your content.',
    },
    {
      number: '02',
      title: 'Share & Sell',
      description: 'Share your content link or embed the widget. Buyers connect their wallet.',
    },
    {
      number: '03',
      title: 'Instant Access',
      description: 'After payment confirmation, buyers receive access tokens automatically.',
    },
  ];

  const useCases = [
    {
      title: 'Content Creators',
      description: 'Monetize articles, videos, courses, and premium content with instant Solana payments.',
      icon: '📝',
    },
    {
      title: 'API Providers',
      description: 'Offer pay-per-use API access with automatic rate limiting and access control.',
      icon: '🔌',
    },
    {
      title: 'Newsletters & Subscriptions',
      description: 'Sell time-limited access to premium newsletters and subscription content.',
      icon: '📧',
    },
    {
      title: 'Digital Products',
      description: 'Sell digital downloads, software licenses, and one-time access content.',
      icon: '💾',
    },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Navigation */}
      <nav className="border-b border-neutral-800/50 bg-neutral-900/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-emerald-400">
              Solana Micro-Paywall
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <a
                href="/marketplace"
                className="text-sm lg:text-base text-neutral-300 hover:text-white transition"
                onClick={(e) => {
                  console.log('Marketplace link clicked');
                  // Let browser handle navigation normally
                }}
              >
                Marketplace
              </a>
              <a
                href="/docs"
                className="text-sm lg:text-base text-neutral-300 hover:text-white transition"
                onClick={(e) => {
                  console.log('Docs link clicked');
                  // Let browser handle navigation normally
                }}
              >
                Docs
              </a>
              <a
                href="/dashboard"
                className="text-sm lg:text-base text-emerald-400 hover:text-emerald-300 transition font-medium"
                onClick={(e) => {
                  console.log('Dashboard link clicked');
                  // Let browser handle navigation normally
                }}
              >
                For Merchants
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className={`relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-40 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Animated Badge */}
            <div
              className={`inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 mb-8 transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <BoltIcon className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Powered by Solana Pay</span>
            </div>

            {/* Main Headline */}
            <h1
              className={`text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 transition-all duration-1000 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              Monetize Content with
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent animate-gradient">
                Instant Solana Payments
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className={`mx-auto max-w-3xl text-lg sm:text-xl lg:text-2xl text-neutral-400 mb-10 transition-all duration-1000 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              The easiest way for creators, publishers, and API providers to accept payments and grant access to premium content. Built for Solana.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-600 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <a
                href="/dashboard"
                className="group inline-flex items-center justify-center rounded-lg bg-emerald-500 px-8 py-4 text-lg font-semibold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-105 shadow-lg shadow-emerald-500/25"
                onClick={(e) => {
                  console.log('Start Selling button clicked');
                }}
              >
                Start Selling
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-700 px-8 py-4 text-lg font-semibold text-neutral-100 transition-all hover:border-neutral-600 hover:bg-neutral-800/50"
                onClick={(e) => {
                  console.log('Browse Marketplace button clicked');
                }}
              >
                Browse Marketplace
              </a>
            </div>
          </div>
        </div>

        {/* Floating Elements Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to Monetize
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Built specifically for the Solana ecosystem with instant payments, secure verification, and powerful tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 transition-all duration-500 hover:border-emerald-500/50 hover:bg-neutral-900 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.bgClass} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconClass}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32 relative bg-neutral-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Get started in minutes. No complex setup, no blockchain expertise required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-emerald-400">{step.number}</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-neutral-400">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent transform translate-x-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Perfect For
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Whether you're a creator, developer, or business, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="group rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 transition-all duration-500 hover:border-emerald-500/50 hover:bg-neutral-900"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{useCase.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{useCase.title}</h3>
                    <p className="text-neutral-400">{useCase.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-32 relative bg-neutral-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Why Choose Solana Micro-Paywall?
              </h2>
              <div className="space-y-4">
                {[
                  'Near-zero transaction fees (fractions of a cent)',
                  'Sub-second payment confirmation',
                  'No chargebacks or payment disputes',
                  'Global accessibility, no geographic restrictions',
                  'Built-in marketplace for content discovery',
                  'Comprehensive analytics and reporting',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-neutral-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-neutral-300">Transaction Speed</span>
                    <span className="text-emerald-400 font-semibold">&lt; 1 second</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-neutral-300">Transaction Fee</span>
                    <span className="text-blue-400 font-semibold">~$0.00025</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-neutral-300">Settlement Time</span>
                    <span className="text-emerald-400 font-semibold">Instant</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-neutral-300">Global Reach</span>
                    <span className="text-blue-400 font-semibold">Worldwide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-32 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-12 sm:p-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Monetizing?
            </h2>
            <p className="text-lg sm:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              Join creators and businesses already using Solana Micro-Paywall to accept instant payments and grow their revenue.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/dashboard"
                className="group inline-flex items-center justify-center rounded-lg bg-emerald-500 px-8 py-4 text-lg font-semibold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-105 shadow-lg shadow-emerald-500/25"
                onClick={(e) => {
                  console.log('Get Started Free button clicked');
                }}
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-700 px-8 py-4 text-lg font-semibold text-neutral-100 transition-all hover:border-neutral-600 hover:bg-neutral-800/50"
                onClick={(e) => {
                  console.log('Explore Marketplace button clicked');
                }}
              >
                Explore Marketplace
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-900/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="text-xl font-bold text-emerald-400">
                Solana Micro-Paywall
              </Link>
              <p className="text-sm text-neutral-400 mt-2">Built for the Solana ecosystem</p>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/marketplace" className="text-sm text-neutral-400 hover:text-white transition">
                Marketplace
              </Link>
              <Link href="/library" className="text-sm text-neutral-400 hover:text-white transition">
                My Library
              </Link>
              <Link href="/docs" className="text-sm text-neutral-400 hover:text-white transition">
                Documentation
              </Link>
              <Link href="/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300 transition">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
            <p>© 2025 Solana Micro-Paywall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

