'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import Link from 'next/link';

const sections = [
  { id: 'overview', title: 'Overview', icon: '📚' },
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'merchant-guide', title: 'Merchant Guide', icon: '👤' },
  { id: 'content-management', title: 'Content Management', icon: '📝' },
  { id: 'payment-system', title: 'Payment System', icon: '💳' },
  { id: 'widget-sdk', title: 'Widget SDK', icon: '🔧' },
  { id: 'api-reference', title: 'API Reference', icon: '🔌' },
  { id: 'marketplace', title: 'Marketplace', icon: '🛒' },
  { id: 'library', title: 'User Library', icon: '📦' },
  { id: 'dashboard', title: 'Dashboard & Analytics', icon: '📊' },
  { id: 'authentication', title: 'Authentication', icon: '🔐' },
  { id: 'faq', title: 'FAQ', icon: '❓' },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const selectSection = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="glass-strong p-6 rounded-xl sticky top-24">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Table of Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-gradient-primary text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-100 dark:bg-neutral-800/50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Documentation Content */}
          <div className="flex-1">
            {/* Section Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                {sections.find(s => s.id === activeSection)?.icon} {sections.find(s => s.id === activeSection)?.title || 'Documentation'}
              </h1>
              {activeSection === 'overview' && (
                <p className="text-xl text-neutral-600 dark:text-neutral-400">
                  Complete guide to Micro Paywall - the multi-chain micro-paywall and pay-per-use platform
                </p>
              )}
            </div>
            
            {/* Overview */}
            {activeSection === 'overview' && (
              <section 
                id="overview" 
                className="animate-in fade-in duration-300"
                key="overview"
              >
              <div className="glass-strong p-6 rounded-xl">
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">What is Micro Paywall?</h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  Micro Paywall is a blockchain-native platform that enables creators, publishers, and API providers to monetize their content using instant blockchain payments. Supports <strong className="text-neutral-900 dark:text-white">8 blockchains</strong>: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, and Avalanche.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <h3 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">⚡ Instant Payments</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Sub-second confirmations with near-zero fees</p>
                  </div>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <h3 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">🔗 Multi-Chain</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">8 chains: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB, Avalanche</p>
                  </div>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <h3 className="text-purple-600 dark:text-purple-400 font-semibold mb-2">🔌 Easy Integration</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Drop-in widgets and comprehensive API</p>
                  </div>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-4">
                  The app includes creator (merchant) profile pages, breadcrumb navigation, recently viewed tracking, and respects <strong className="text-neutral-900 dark:text-white">prefers-reduced-motion</strong> for accessibility.
                </p>
              </div>
              </section>
            )}

            {/* Getting Started */}
            {activeSection === 'getting-started' && (
              <section 
                id="getting-started" 
                className="animate-in fade-in duration-300"
                key="getting-started"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">For Content Creators (Merchants)</h3>
                  <ol className="list-decimal list-inside space-y-3 text-neutral-600 dark:text-neutral-300">
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Create Account:</strong> Sign up at <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 hover:underline">/signup</Link> with your email address
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Get Merchant ID:</strong> After signup, you&apos;ll receive a unique Merchant ID (save this!)
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Set Payout Address:</strong> Configure your Solana wallet address in Dashboard → Settings
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Create Content:</strong> Add your first content item in Dashboard → Contents
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Integrate Widget:</strong> Add the payment widget to your website (see Widget SDK section)
                    </li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">For End Users (Buyers)</h3>
                  <ol className="list-decimal list-inside space-y-3 text-neutral-600 dark:text-neutral-300">
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Browse Marketplace:</strong> Explore content at <Link href="/marketplace" className="text-emerald-600 dark:text-emerald-400 hover:underline">/marketplace</Link>
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Connect Wallet:</strong> For Solana content: Phantom, Solflare. For EVM content: MetaMask, Rainbow, etc.
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Purchase Content:</strong> Click purchase and sign the transaction
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Access Library:</strong> View all purchases, bookmarks, and recently viewed in <Link href="/library" className="text-emerald-600 dark:text-emerald-400 hover:underline">Library</Link> (also in the main navigation)
                    </li>
                  </ol>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                  From the home page you can also open <Link href="/docs" className="text-emerald-600 dark:text-emerald-400 hover:underline">Documentation</Link> for the full guide.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  <strong className="text-neutral-900 dark:text-white">Navigation:</strong> The main nav includes Home, Marketplace, and Library. Logged-in merchants get a Dashboard dropdown (Overview, Manage Content, Payments, Settings, Security); the dropdown closes when you click outside or press Escape.
                </p>
              </div>
              </section>
            )}

            {/* Merchant Guide */}
            {activeSection === 'merchant-guide' && (
              <section 
                id="merchant-guide" 
                className="animate-in fade-in duration-300"
                key="merchant-guide"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Account Creation</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Create your merchant account by providing your email address. Optionally, you can set your payout address during signup or add it later in settings. Use a Solana address for Solana content; an EVM address (0x...) for Ethereum, Polygon, Base, etc.
                  </p>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Signup Endpoint:</p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/merchants</code>
                    <pre className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-900 p-3 rounded overflow-x-auto">
{`{
  "email": "your@email.com",
  "payoutAddress": "optional-wallet-address"
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Login</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Login using your email address or Merchant ID, plus your password. You&apos;ll receive a JWT token valid for 24 hours. Use &quot;Forgot password?&quot; on the login page to reset your password via email.
                  </p>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Login Endpoint:</p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/auth/login</code>
                    <pre className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-900 p-3 rounded overflow-x-auto">
{`{
  "email": "your@email.com",
  "password": "your-password"
  // OR
  "merchantId": "your-merchant-id",
  "password": "your-password"
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Profile Management</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Customize your merchant profile with display name, bio, avatar, and social links (Twitter, Telegram, Discord, GitHub). Update your payout address and configure webhook secrets in the Settings page.
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Your public profile is visible at <code className="text-emerald-600 dark:text-emerald-400">/marketplace/merchant/[your-merchant-id]</code> so buyers can see your bio and all your public content.
                  </p>
                </div>
              </div>
              </section>
            )}

            {/* Content Management */}
            {activeSection === 'content-management' && (
              <section 
                id="content-management" 
                className="animate-in fade-in duration-300"
                key="content-management"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Creating Content</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Create content items with the following fields:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300 mb-4">
                    <li><strong className="text-neutral-900 dark:text-white">Slug:</strong> Unique identifier per merchant (URL-friendly)</li>
                    <li><strong className="text-neutral-900 dark:text-white">Title & Description:</strong> Content metadata</li>
                    <li><strong className="text-neutral-900 dark:text-white">Blockchain:</strong> Choose chain: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, or Avalanche</li>
                    <li><strong className="text-neutral-900 dark:text-white">Price:</strong> In native token (SOL, ETH, MATIC, etc.). Stored as smallest unit (lamports for Solana, wei for EVM)</li>
                    <li><strong className="text-neutral-900 dark:text-white">Duration:</strong> Access duration in seconds (null = one-time access)</li>
                    <li><strong className="text-neutral-900 dark:text-white">Category & Tags:</strong> For organization and discovery</li>
                    <li><strong className="text-neutral-900 dark:text-white">Thumbnail URL:</strong> Image URL for content card</li>
                    <li><strong className="text-neutral-900 dark:text-white">Visibility:</strong> Public (marketplace) or Private</li>
                    <li><strong className="text-neutral-900 dark:text-white">Preview Text:</strong> Free preview content</li>
                  </ul>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Create Content Endpoint:</p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/contents</code>
                    <p className="text-xs text-neutral-500 mt-2">Requires: Bearer token (Authorization header)</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Managing Content</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Access your content management dashboard at <Link href="/dashboard/contents" className="text-emerald-600 dark:text-emerald-400 hover:underline">/dashboard/contents</Link>
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>View all your content items</li>
                    <li>Edit content details and pricing</li>
                    <li>Delete content (cascades to payment intents)</li>
                    <li>View purchase statistics per content</li>
                  </ul>
                </div>
              </div>
              </section>
            )}

            {/* Payment System */}
            {activeSection === 'payment-system' && (
              <section 
                id="payment-system" 
                className="animate-in fade-in duration-300"
                key="payment-system"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Payment Flow</h3>
                  <ol className="list-decimal list-inside space-y-3 text-neutral-600 dark:text-neutral-300">
                    <li><strong className="text-neutral-900 dark:text-white">Create Payment Request:</strong> Generate payment intent with unique nonce (chain from content)</li>
                    <li><strong className="text-neutral-900 dark:text-white">Wallet Connection:</strong> Solana: Phantom, Solflare. EVM: MetaMask, Rainbow, etc.</li>
                    <li><strong className="text-neutral-900 dark:text-white">Transaction Signing:</strong> User signs transaction via wallet (auto network switch for EVM)</li>
                    <li><strong className="text-neutral-900 dark:text-white">On-Chain Verification:</strong> Server verifies transaction on the correct blockchain</li>
                    <li><strong className="text-neutral-900 dark:text-white">Access Token:</strong> JWT token issued after successful verification</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Payment States</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-yellow-400 font-semibold">Pending</span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Payment request created, waiting for transaction</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Confirmed</span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Transaction verified, access token issued</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-red-400 font-semibold">Failed</span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Transaction failed or expired</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Refunded</span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Payment refunded by merchant</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">User Feedback</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    On the content detail page, failed payments show a toast notification with the error message so users know what went wrong and can retry or fix the issue.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">API Endpoints</h3>
                  <div className="space-y-3">
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/payments/create-payment-request</code>
                      <p className="text-xs text-neutral-400 mt-1">Create a new payment intent</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/payments/verify-payment</code>
                      <p className="text-xs text-neutral-400 mt-1">Verify transaction and issue access token</p>
                    </div>
                  </div>
                </div>
              </div>
              </section>
            )}

            {/* Widget SDK */}
            {activeSection === 'widget-sdk' && (
              <section 
                id="widget-sdk" 
                className="animate-in fade-in duration-300"
                key="widget-sdk"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Integration Methods</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">HTML/JavaScript</h4>
                      <p className="text-xs text-neutral-400">Vanilla JS integration</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">React Component</h4>
                      <p className="text-xs text-neutral-400">React wrapper component</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-purple-600 dark:text-purple-400 font-semibold mb-2">TypeScript SDK</h4>
                      <p className="text-xs text-neutral-400">Full TypeScript support</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Basic Usage</h3>
                  <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm text-neutral-600 dark:text-neutral-300">
{`import { PaymentWidget } from '@micropaywall/widget';

<PaymentWidget
  merchantId="your-merchant-id"
  contentId="content-id"
  priceLamports={1000000000}
  chain="solana"
  onPaymentSuccess={(token) => {
    console.log('Access token:', token);
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
  }}
/>`}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>Multi-chain: Solana (Phantom, Solflare) and EVM (MetaMask, Rainbow)</li>
                    <li>Automatic wallet detection and connection</li>
                    <li>QR code generation for Solana mobile payments</li>
                    <li>Automatic payment status polling</li>
                    <li>Customizable button text and styling</li>
                    <li>Event-driven architecture</li>
                    <li>Comprehensive error handling: use <code className="text-emerald-600 dark:text-emerald-400">onPaymentError</code> to show toasts or custom UI when payment fails</li>
                  </ul>
                </div>
              </div>
              </section>
            )}

            {/* API Reference */}
            {activeSection === 'api-reference' && (
              <section 
                id="api-reference" 
                className="animate-in fade-in duration-300"
                key="api-reference"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Base URL</h3>
                  <code className="text-emerald-600 dark:text-emerald-400 bg-neutral-200 dark:bg-neutral-900 px-3 py-2 rounded">
                    {process.env.NEXT_PUBLIC_API_URL || 'https://api.micropaywall.app'}
                  </code>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Authentication</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Protected endpoints require a Bearer token in the Authorization header:
                  </p>
                  <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm text-neutral-600 dark:text-neutral-300">
{`Authorization: Bearer <your-jwt-token>`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Endpoints</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Merchants</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-emerald-600 dark:text-emerald-400">POST /api/merchants</code> - Create merchant account</li>
                        <li><code className="text-emerald-600 dark:text-emerald-400">GET /api/merchants/:id</code> - Get merchant by ID (public)</li>
                        <li><code className="text-emerald-600 dark:text-emerald-400">GET /api/merchants/me</code> - Get current merchant (protected)</li>
                        <li><code className="text-emerald-600 dark:text-emerald-400">PUT /api/merchants/me</code> - Update merchant profile (protected)</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Authentication</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-blue-600 dark:text-blue-400">POST /api/auth/login</code> - Merchant login</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Content</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-purple-400">GET /api/contents</code> - List merchant&apos;s content (protected)</li>
                        <li><code className="text-purple-600 dark:text-purple-400">POST /api/contents</code> - Create content (protected)</li>
                        <li><code className="text-purple-400">GET /api/contents/:id</code> - Get content by ID</li>
                        <li><code className="text-purple-400">GET /api/contents/merchant/:merchantId/:slug</code> - Get content by merchant and slug</li>
                        <li><code className="text-purple-400">PUT /api/contents/:id</code> - Update content (protected)</li>
                        <li><code className="text-purple-600 dark:text-purple-400">DELETE /api/contents/:id</code> - Delete content (protected)</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-pink-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Payments</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-pink-400">POST /api/payments/create-payment-request</code> - Create payment intent</li>
                        <li><code className="text-pink-400">POST /api/payments/verify-payment</code> - Verify transaction</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Purchases</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-yellow-400">GET /api/purchases/wallet/:address</code> - Get purchases by wallet</li>
                        <li><code className="text-yellow-400">POST /api/purchases</code> - Create purchase record</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Discovery</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-cyan-600 dark:text-cyan-400">GET /api/discover</code> - Discover content (pagination, category, tags, search, sort)</li>
                        <li><code className="text-cyan-600 dark:text-cyan-400">GET /api/discover/trending</code> - Get trending content</li>
                        <li><code className="text-cyan-600 dark:text-cyan-400">GET /api/discover/recent</code> - Get recent content</li>
                        <li><code className="text-cyan-600 dark:text-cyan-400">GET /api/discover/categories</code> - Get categories with counts</li>
                        <li><code className="text-cyan-600 dark:text-cyan-400">GET /api/discover/merchant/:merchantId</code> - Get public content by creator (for profile pages)</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Analytics</h4>
                      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <li><code className="text-emerald-600 dark:text-emerald-400">GET /api/analytics/stats</code> - Get payment statistics (protected)</li>
                        <li><code className="text-emerald-600 dark:text-emerald-400">GET /api/analytics/recent-payments</code> - Get recent payments (protected)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              </section>
            )}

            {/* Marketplace */}
            {activeSection === 'marketplace' && (
              <section 
                id="marketplace" 
                className="animate-in fade-in duration-300"
                key="marketplace"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li><strong className="text-neutral-900 dark:text-white">Browse Content:</strong> Discover premium content from creators</li>
                    <li><strong className="text-neutral-900 dark:text-white">Search:</strong> Real-time debounced search across titles, descriptions, and creators</li>
                    <li><strong className="text-neutral-900 dark:text-white">Filtering:</strong> Filter by category, tags, price range, and sort options</li>
                    <li><strong className="text-neutral-900 dark:text-white">Sorting:</strong> Sort by recent, trending, price (low-high, high-low), or purchase count</li>
                    <li><strong className="text-neutral-900 dark:text-white">Content Details:</strong> View full content information, preview, and purchase</li>
                    <li><strong className="text-neutral-900 dark:text-white">Merchant Profiles:</strong> Browse content by specific merchants</li>
                    <li><strong className="text-neutral-900 dark:text-white">Social Sharing:</strong> Share content on Twitter, LinkedIn, Facebook, or copy link</li>
                    <li><strong className="text-neutral-900 dark:text-white">Bookmarking:</strong> Save content for later with one click</li>
                    <li><strong className="text-neutral-900 dark:text-white">Recently Viewed:</strong> Automatically track viewed content</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Filtering Options</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">Search</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Debounced search by title, description, or merchant</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Categories</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Filter by content category</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Tags</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Filter by multiple tags</p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-pink-400 font-semibold mb-2">Price Range</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Set min/max price (varies by chain)</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Creator Profile Page</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Each creator has a public profile at <code className="text-emerald-600 dark:text-emerald-400">/marketplace/merchant/[merchantId]</code> showing their display name, bio, avatar, social links, and all their public content. Content detail pages include a &quot;View creator profile&quot; link and a breadcrumb: Marketplace → Creator → Content title.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Content Detail Page</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Each content item has a dedicated detail page with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>Breadcrumb navigation (Marketplace → Creator → Title)</li>
                    <li>Full content information and preview</li>
                    <li>Payment widget for purchasing; payment errors show a toast notification</li>
                    <li>Social sharing buttons (Twitter, LinkedIn, Facebook, Copy Link)</li>
                    <li>Native Web Share API support on mobile devices</li>
                    <li>Bookmark button for saving content</li>
                    <li>Automatic tracking in recently viewed</li>
                  </ul>
                </div>
              </div>
              </section>
            )}

            {/* Library */}
            {activeSection === 'library' && (
              <section 
                id="library" 
                className="animate-in fade-in duration-300"
                key="library"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  The Library at <Link href="/library" className="text-emerald-600 dark:text-emerald-400 hover:underline">/library</Link> is available from the main navigation for everyone. It has <strong className="text-neutral-900 dark:text-white">four tabs</strong>: My Purchases, My Creations, Bookmarks, and Recently Viewed.
                </p>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">My Purchases</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    View all content you&apos;ve purchased with your connected wallet (Solana or EVM). Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>View all purchased content with thumbnails</li>
                    <li>Filter by active/expired status</li>
                    <li>Group by date or merchant</li>
                    <li>Quick access to content details</li>
                    <li>Purchase history with expiration dates</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">My Creations</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    For merchants: View and manage all content you&apos;ve created. Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>View all your created content</li>
                    <li>See purchase counts and statistics</li>
                    <li>Quick access to content management</li>
                    <li>Link to marketplace listings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Bookmarks</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Save content for later viewing. Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>Bookmark any content from the marketplace or content detail pages</li>
                    <li>Bookmark button appears on hover for content cards</li>
                    <li>View all bookmarked content in the Bookmarks tab</li>
                    <li>Bookmarks persist across sessions using localStorage</li>
                    <li>Quick access to bookmarked content with timestamps</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Recently Viewed</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Automatically track content you&apos;ve viewed. Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>Automatic tracking when viewing content detail pages</li>
                    <li>Stores up to 10 most recently viewed items</li>
                    <li>View all recently viewed content in the Recently Viewed tab</li>
                    <li>See when you viewed each item</li>
                    <li>Quick access to continue browsing where you left off</li>
                  </ul>
                </div>
              </div>
              </section>
            )}

            {/* Dashboard */}
            {activeSection === 'dashboard' && (
              <section 
                id="dashboard" 
                className="animate-in fade-in duration-300"
                key="dashboard"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Overview</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Access your merchant dashboard at <Link href="/dashboard" className="text-emerald-600 dark:text-emerald-400 hover:underline">/dashboard</Link>
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">Statistics</h4>
                      <ul className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                        <li>• Total payments (all time)</li>
                        <li>• Today&apos;s payments</li>
                        <li>• This week&apos;s payments</li>
                        <li>• Total revenue (multi-chain)</li>
                      </ul>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Recent Activity</h4>
                      <ul className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                        <li>• Recent payment transactions</li>
                        <li>• Transaction signatures</li>
                        <li>• Payer wallet addresses</li>
                        <li>• Payment dates</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Loading States</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    While stats and recent payments are loading, the dashboard shows skeleton placeholders (cards and table rows) for a smoother experience.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Pages</h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li><Link href="/dashboard" className="text-emerald-600 dark:text-emerald-400 hover:underline">Dashboard</Link> - Overview and statistics</li>
                    <li><Link href="/dashboard/contents" className="text-emerald-600 dark:text-emerald-400 hover:underline">Contents</Link> - Content management</li>
                    <li><Link href="/dashboard/payments" className="text-emerald-600 dark:text-emerald-400 hover:underline">Payments</Link> - Full payment history</li>
                    <li><Link href="/dashboard/settings" className="text-emerald-600 dark:text-emerald-400 hover:underline">Settings</Link> - Profile and account settings</li>
                    <li><Link href="/dashboard/security" className="text-emerald-600 dark:text-emerald-400 hover:underline">Security</Link> - Password change, 2FA, backup codes, activity log</li>
                  </ul>
                </div>
              </div>
              </section>
            )}

            {/* User Features */}
            {activeSection === 'features' && (
              <section 
                id="features" 
                className="animate-in fade-in duration-300"
                key="features"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Social Sharing</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Share content easily across multiple platforms:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li><strong className="text-neutral-900 dark:text-white">Twitter:</strong> Share content with pre-filled tweet</li>
                    <li><strong className="text-neutral-900 dark:text-white">LinkedIn:</strong> Share professional content</li>
                    <li><strong className="text-neutral-900 dark:text-white">Facebook:</strong> Share with friends and followers</li>
                    <li><strong className="text-neutral-900 dark:text-white">Copy Link:</strong> Copy content URL to clipboard</li>
                    <li><strong className="text-neutral-900 dark:text-white">Native Share:</strong> Use device&apos;s native share menu on mobile</li>
                  </ul>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-3">
                    Sharing buttons are available on all content detail pages. Links include the full content URL for easy sharing.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Bookmarking System</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Save content for later viewing:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>Bookmark button appears on hover for content cards</li>
                    <li>Bookmark button available on content detail pages</li>
                    <li>All bookmarks stored in localStorage (persists across sessions)</li>
                    <li>View all bookmarks in the Library → Bookmarks tab</li>
                    <li>Quick access to bookmarked content with timestamps</li>
                    <li>Toast notifications for bookmark actions</li>
                  </ul>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-3">
                    Bookmarks are stored locally in your browser. To sync across devices, future updates may include cloud sync.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Recently Viewed</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Automatically track your browsing history:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>Automatic tracking when viewing content detail pages</li>
                    <li>Stores up to 10 most recently viewed items</li>
                    <li>View all recently viewed content in Library → Recently Viewed tab</li>
                    <li>See when you viewed each item</li>
                    <li>Quick access to continue browsing where you left off</li>
                  </ul>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-3">
                    Recently viewed items are stored locally in your browser and help you quickly return to content you&apos;ve explored.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Search & Discovery</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Enhanced search and filtering capabilities:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li><strong className="text-neutral-900 dark:text-white">Debounced Search:</strong> Real-time search with automatic debouncing for performance</li>
                    <li><strong className="text-neutral-900 dark:text-white">Advanced Filtering:</strong> Filter by category, tags, price range</li>
                    <li><strong className="text-neutral-900 dark:text-white">Sorting Options:</strong> Sort by recent, trending, price, or popularity</li>
                    <li><strong className="text-neutral-900 dark:text-white">Empty States:</strong> Helpful messages when no results are found</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Performance Features</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                    Optimized for speed and user experience:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li><strong className="text-neutral-900 dark:text-white">Image Optimization:</strong> Next.js Image component with lazy loading and blur placeholders</li>
                    <li><strong className="text-neutral-900 dark:text-white">Loading States:</strong> Skeleton components for better perceived performance</li>
                    <li><strong className="text-neutral-900 dark:text-white">Error Handling:</strong> Error boundaries and toast notifications</li>
                    <li><strong className="text-neutral-900 dark:text-white">Web Vitals:</strong> Performance monitoring for Core Web Vitals</li>
                    <li><strong className="text-neutral-900 dark:text-white">Analytics:</strong> Page view and event tracking</li>
                  </ul>
                </div>
              </div>
              </section>
            )}

            {/* Authentication */}
            {activeSection === 'authentication' && (
              <section 
                id="authentication" 
                className="animate-in fade-in duration-300"
                key="authentication"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">JWT Tokens</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    Authentication uses JWT (JSON Web Tokens) with 24-hour expiration. Tokens are stored in localStorage and automatically validated on page load.
                  </p>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Token Structure:</p>
                    <pre className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-900 p-3 rounded overflow-x-auto">
{`{
  "merchantId": "uuid",
  "type": "merchant",
  "exp": 1234567890
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Protected Routes</h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                    The following routes require merchant authentication:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-300">
                    <li>/dashboard - Main dashboard</li>
                    <li>/dashboard/contents - Content management</li>
                    <li>/dashboard/payments - Payment history</li>
                    <li>/dashboard/settings - Account settings</li>
                    <li>/dashboard/security - Password, 2FA, activity log</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Password Recovery & 2FA</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Use &quot;Forgot password?&quot; on the login page to receive a reset link by email. The Security page lets you change your password, enable two-factor authentication (2FA), and view recent account activity.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Token Validation</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Tokens are automatically validated on app load. If a token is expired or invalid, users are automatically logged out and redirected to the home page.
                  </p>
                </div>
              </div>
              </section>
            )}

            {/* FAQ */}
            {activeSection === 'faq' && (
              <section 
                id="faq" 
                className="animate-in fade-in duration-300"
                key="faq"
              >
              <div className="glass-strong p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">How do I get started as a merchant?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Sign up at <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 hover:underline">/signup</Link>, create your first content item in the dashboard, and integrate the payment widget into your website.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">What wallets are supported?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    <strong className="text-neutral-900 dark:text-white">Solana:</strong> Phantom, Solflare. <strong className="text-neutral-900 dark:text-white">EVM:</strong> MetaMask, Rainbow, and any injected wallet. The correct wallet is shown based on the content&apos;s blockchain.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">How long do access tokens last?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Access tokens are short-lived (1-24 hours) and are tied to the content&apos;s duration setting. One-time purchases don&apos;t expire, while timed access expires based on the duration.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Can I use this with other blockchains?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Yes. The platform supports 8 blockchains: Solana, Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, and Avalanche. Choose the chain when creating content.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">How do I receive payments?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Set your payout address in Dashboard → Settings. Use a Solana address for Solana content; an EVM address (0x...) for Ethereum, Polygon, Base, etc. Your address must match the chain of the content you sell.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">What happens if a payment fails?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Failed payments are marked as &quot;Failed&quot; in the system. Users can retry the payment. Payment requests expire after 15 minutes.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Can I refund a payment?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Refunds are handled manually by merchants. Contact support or use the refund functionality in your dashboard (if implemented).
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Where can I see a creator&apos;s profile and all their content?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Open any content and click &quot;View creator profile&quot; or use the breadcrumb link. Creator profiles are at <code className="text-emerald-600 dark:text-emerald-400">/marketplace/merchant/[merchantId]</code> and show their bio, social links, and public content.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">What if I prefer reduced motion?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    The app respects the <strong className="text-neutral-900 dark:text-white">prefers-reduced-motion</strong> system setting: smooth scrolling and fade-in animations are disabled when you have reduced motion enabled.
                  </p>
                </div>
              </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
