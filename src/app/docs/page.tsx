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
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="glass-strong p-6 rounded-xl sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Table of Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-gradient-primary text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
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
              <h1 className="text-4xl font-bold text-white mb-2">
                {sections.find(s => s.id === activeSection)?.icon} {sections.find(s => s.id === activeSection)?.title || 'Documentation'}
              </h1>
              {activeSection === 'overview' && (
                <p className="text-xl text-neutral-400">
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
                <h2 className="text-2xl font-semibold text-white mb-4">What is Micro Paywall?</h2>
                <p className="text-neutral-300 mb-4">
                  Micro Paywall is a blockchain-native platform that enables creators, publishers, and API providers to monetize their content using instant blockchain payments. Built with multi-chain support in mind, starting with Solana and expanding to Ethereum, Polygon, and more.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <h3 className="text-emerald-400 font-semibold mb-2">⚡ Instant Payments</h3>
                    <p className="text-sm text-neutral-400">Sub-second confirmations with near-zero fees</p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <h3 className="text-blue-400 font-semibold mb-2">🔗 Multi-Chain</h3>
                    <p className="text-sm text-neutral-400">Support for multiple blockchains</p>
                  </div>
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <h3 className="text-purple-400 font-semibold mb-2">🔌 Easy Integration</h3>
                    <p className="text-sm text-neutral-400">Drop-in widgets and comprehensive API</p>
                  </div>
                </div>
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
                  <h3 className="text-xl font-semibold text-white mb-3">For Content Creators (Merchants)</h3>
                  <ol className="list-decimal list-inside space-y-3 text-neutral-300">
                    <li>
                      <strong className="text-white">Create Account:</strong> Sign up at <Link href="/signup" className="text-emerald-400 hover:underline">/signup</Link> with your email address
                    </li>
                    <li>
                      <strong className="text-white">Get Merchant ID:</strong> After signup, you&apos;ll receive a unique Merchant ID (save this!)
                    </li>
                    <li>
                      <strong className="text-white">Set Payout Address:</strong> Configure your Solana wallet address in Dashboard → Settings
                    </li>
                    <li>
                      <strong className="text-white">Create Content:</strong> Add your first content item in Dashboard → Contents
                    </li>
                    <li>
                      <strong className="text-white">Integrate Widget:</strong> Add the payment widget to your website (see Widget SDK section)
                    </li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">For End Users (Buyers)</h3>
                  <ol className="list-decimal list-inside space-y-3 text-neutral-300">
                    <li>
                      <strong className="text-white">Browse Marketplace:</strong> Explore content at <Link href="/marketplace" className="text-emerald-400 hover:underline">/marketplace</Link>
                    </li>
                    <li>
                      <strong className="text-white">Connect Wallet:</strong> Use Phantom, Solflare, or other Solana wallets
                    </li>
                    <li>
                      <strong className="text-white">Purchase Content:</strong> Click purchase and sign the transaction
                    </li>
                    <li>
                      <strong className="text-white">Access Library:</strong> View all purchases in <Link href="/library" className="text-emerald-400 hover:underline">My Library</Link>
                    </li>
                  </ol>
                </div>
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
                  <h3 className="text-xl font-semibold text-white mb-3">Account Creation</h3>
                  <p className="text-neutral-300 mb-3">
                    Create your merchant account by providing your email address. Optionally, you can set your Solana payout address during signup or add it later in settings.
                  </p>
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-400 mb-2">Signup Endpoint:</p>
                    <code className="text-emerald-400 text-sm">POST /api/merchants</code>
                    <pre className="mt-2 text-xs text-neutral-300 bg-neutral-900 p-3 rounded overflow-x-auto">
{`{
  "email": "your@email.com",
  "payoutAddress": "optional-solana-address"
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Login</h3>
                  <p className="text-neutral-300 mb-3">
                    Login using your email address or Merchant ID. You&apos;ll receive a JWT token valid for 24 hours.
                  </p>
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-400 mb-2">Login Endpoint:</p>
                    <code className="text-emerald-400 text-sm">POST /api/auth/login</code>
                    <pre className="mt-2 text-xs text-neutral-300 bg-neutral-900 p-3 rounded overflow-x-auto">
{`{
  "email": "your@email.com"
  // OR
  "merchantId": "your-merchant-id"
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Profile Management</h3>
                  <p className="text-neutral-300">
                    Customize your merchant profile with display name, bio, avatar, and social links. Update your payout address and configure webhook secrets in the Settings page.
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
                  <h3 className="text-xl font-semibold text-white mb-3">Creating Content</h3>
                  <p className="text-neutral-300 mb-4">
                    Create content items with the following fields:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300 mb-4">
                    <li><strong className="text-white">Slug:</strong> Unique identifier per merchant (URL-friendly)</li>
                    <li><strong className="text-white">Title & Description:</strong> Content metadata</li>
                    <li><strong className="text-white">Price:</strong> In lamports (1 SOL = 1,000,000,000 lamports)</li>
                    <li><strong className="text-white">Duration:</strong> Access duration in seconds (null = one-time access)</li>
                    <li><strong className="text-white">Category & Tags:</strong> For organization and discovery</li>
                    <li><strong className="text-white">Thumbnail URL:</strong> Image URL for content card</li>
                    <li><strong className="text-white">Visibility:</strong> Public (marketplace) or Private</li>
                    <li><strong className="text-white">Preview Text:</strong> Free preview content</li>
                  </ul>
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-400 mb-2">Create Content Endpoint:</p>
                    <code className="text-emerald-400 text-sm">POST /api/contents</code>
                    <p className="text-xs text-neutral-500 mt-2">Requires: Bearer token (Authorization header)</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Managing Content</h3>
                  <p className="text-neutral-300 mb-3">
                    Access your content management dashboard at <Link href="/dashboard/contents" className="text-emerald-400 hover:underline">/dashboard/contents</Link>
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300">
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
                  <h3 className="text-xl font-semibold text-white mb-3">Payment Flow</h3>
                  <ol className="list-decimal list-inside space-y-3 text-neutral-300">
                    <li><strong className="text-white">Create Payment Request:</strong> Generate payment intent with unique nonce</li>
                    <li><strong className="text-white">Wallet Connection:</strong> User connects Phantom, Solflare, or other Solana wallet</li>
                    <li><strong className="text-white">Transaction Signing:</strong> User signs transaction via wallet</li>
                    <li><strong className="text-white">On-Chain Verification:</strong> Server verifies transaction on Solana blockchain</li>
                    <li><strong className="text-white">Access Token:</strong> JWT token issued after successful verification</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Payment States</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-yellow-400 font-semibold">Pending</span>
                      <p className="text-sm text-neutral-400 mt-1">Payment request created, waiting for transaction</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-emerald-400 font-semibold">Confirmed</span>
                      <p className="text-sm text-neutral-400 mt-1">Transaction verified, access token issued</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-red-400 font-semibold">Failed</span>
                      <p className="text-sm text-neutral-400 mt-1">Transaction failed or expired</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <span className="text-blue-400 font-semibold">Refunded</span>
                      <p className="text-sm text-neutral-400 mt-1">Payment refunded by merchant</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">API Endpoints</h3>
                  <div className="space-y-3">
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <code className="text-emerald-400 text-sm">POST /api/payments/create-payment-request</code>
                      <p className="text-xs text-neutral-400 mt-1">Create a new payment intent</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <code className="text-emerald-400 text-sm">POST /api/payments/verify-payment</code>
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
                  <h3 className="text-xl font-semibold text-white mb-3">Integration Methods</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-emerald-400 font-semibold mb-2">HTML/JavaScript</h4>
                      <p className="text-xs text-neutral-400">Vanilla JS integration</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2">React Component</h4>
                      <p className="text-xs text-neutral-400">React wrapper component</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-purple-400 font-semibold mb-2">TypeScript SDK</h4>
                      <p className="text-xs text-neutral-400">Full TypeScript support</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Basic Usage</h3>
                  <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm text-neutral-300">
{`import { PaymentWidget } from '@micropaywall/widget';

<PaymentWidget
  merchantId="your-merchant-id"
  contentId="content-id"
  priceLamports={1000000000} // 1 SOL
  onPaymentSuccess={(token) => {
    // Handle successful payment
    console.log('Access token:', token);
  }}
  onPaymentError={(error) => {
    // Handle payment error
    console.error('Payment failed:', error);
  }}
/>`}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300">
                    <li>Automatic wallet detection and connection</li>
                    <li>QR code generation for mobile payments</li>
                    <li>Automatic payment status polling</li>
                    <li>Customizable button text and styling</li>
                    <li>Event-driven architecture</li>
                    <li>Comprehensive error handling</li>
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
                  <h3 className="text-xl font-semibold text-white mb-4">Base URL</h3>
                  <code className="text-emerald-400 bg-neutral-900 px-3 py-2 rounded">
                    {process.env.NEXT_PUBLIC_API_URL || 'https://api.micropaywall.app'}
                  </code>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Authentication</h3>
                  <p className="text-neutral-300 mb-3">
                    Protected endpoints require a Bearer token in the Authorization header:
                  </p>
                  <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm text-neutral-300">
{`Authorization: Bearer <your-jwt-token>`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Endpoints</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Merchants</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-emerald-400">POST /api/merchants</code> - Create merchant account</li>
                        <li><code className="text-emerald-400">GET /api/merchants/:id</code> - Get merchant by ID (public)</li>
                        <li><code className="text-emerald-400">GET /api/merchants/me</code> - Get current merchant (protected)</li>
                        <li><code className="text-emerald-400">PUT /api/merchants/me</code> - Update merchant profile (protected)</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Authentication</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-blue-400">POST /api/auth/login</code> - Merchant login</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Content</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-purple-400">GET /api/contents</code> - List merchant&apos;s content (protected)</li>
                        <li><code className="text-purple-400">POST /api/contents</code> - Create content (protected)</li>
                        <li><code className="text-purple-400">GET /api/contents/:id</code> - Get content by ID</li>
                        <li><code className="text-purple-400">GET /api/contents/merchant/:merchantId/:slug</code> - Get content by merchant and slug</li>
                        <li><code className="text-purple-400">PUT /api/contents/:id</code> - Update content (protected)</li>
                        <li><code className="text-purple-400">DELETE /api/contents/:id</code> - Delete content (protected)</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-pink-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Payments</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-pink-400">POST /api/payments/create-payment-request</code> - Create payment intent</li>
                        <li><code className="text-pink-400">POST /api/payments/verify-payment</code> - Verify transaction</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Purchases</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-yellow-400">GET /api/purchases/wallet/:address</code> - Get purchases by wallet</li>
                        <li><code className="text-yellow-400">POST /api/purchases</code> - Create purchase record</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Discovery</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-cyan-400">GET /api/discover/trending</code> - Get trending content</li>
                        <li><code className="text-cyan-400">GET /api/discover/recent</code> - Get recent content</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h4 className="text-white font-semibold mb-2">Analytics</h4>
                      <ul className="space-y-1 text-sm text-neutral-300">
                        <li><code className="text-emerald-400">GET /api/analytics/stats</code> - Get payment statistics (protected)</li>
                        <li><code className="text-emerald-400">GET /api/analytics/recent-payments</code> - Get recent payments (protected)</li>
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
                  <h3 className="text-xl font-semibold text-white mb-3">Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300">
                    <li><strong className="text-white">Browse Content:</strong> Discover premium content from creators</li>
                    <li><strong className="text-white">Search:</strong> Real-time search across titles, descriptions, and creators</li>
                    <li><strong className="text-white">Filtering:</strong> Filter by category, tags, price range, and sort options</li>
                    <li><strong className="text-white">Sorting:</strong> Sort by recent, trending, price (low-high, high-low), or purchase count</li>
                    <li><strong className="text-white">Content Details:</strong> View full content information, preview, and purchase</li>
                    <li><strong className="text-white">Merchant Profiles:</strong> Browse content by specific merchants</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Filtering Options</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-emerald-400 font-semibold mb-2">Search</h4>
                      <p className="text-sm text-neutral-400">Search by title, description, or merchant</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2">Categories</h4>
                      <p className="text-sm text-neutral-400">Filter by content category</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-purple-400 font-semibold mb-2">Tags</h4>
                      <p className="text-sm text-neutral-400">Filter by multiple tags</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-pink-400 font-semibold mb-2">Price Range</h4>
                      <p className="text-sm text-neutral-400">Set min/max price in SOL</p>
                    </div>
                  </div>
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
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">My Purchases</h3>
                  <p className="text-neutral-300 mb-4">
                    View all content you&apos;ve purchased with your connected Solana wallet. Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300">
                    <li>View all purchased content with thumbnails</li>
                    <li>Filter by active/expired status</li>
                    <li>Group by date or merchant</li>
                    <li>Quick access to content details</li>
                    <li>Purchase history with expiration dates</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">My Creations</h3>
                  <p className="text-neutral-300 mb-4">
                    For merchants: View and manage all content you&apos;ve created. Features include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300">
                    <li>View all your created content</li>
                    <li>See purchase counts and statistics</li>
                    <li>Quick access to content management</li>
                    <li>Link to marketplace listings</li>
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
                  <h3 className="text-xl font-semibold text-white mb-3">Overview</h3>
                  <p className="text-neutral-300 mb-4">
                    Access your merchant dashboard at <Link href="/dashboard" className="text-emerald-400 hover:underline">/dashboard</Link>
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-emerald-400 font-semibold mb-2">Statistics</h4>
                      <ul className="text-sm text-neutral-300 space-y-1">
                        <li>• Total payments (all time)</li>
                        <li>• Today&apos;s payments</li>
                        <li>• This week&apos;s payments</li>
                        <li>• Total revenue (SOL)</li>
                      </ul>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2">Recent Activity</h4>
                      <ul className="text-sm text-neutral-300 space-y-1">
                        <li>• Recent payment transactions</li>
                        <li>• Transaction signatures</li>
                        <li>• Payer wallet addresses</li>
                        <li>• Payment dates</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Pages</h3>
                  <ul className="list-disc list-inside space-y-2 text-neutral-300">
                    <li><Link href="/dashboard" className="text-emerald-400 hover:underline">Dashboard</Link> - Overview and statistics</li>
                    <li><Link href="/dashboard/contents" className="text-emerald-400 hover:underline">Contents</Link> - Content management</li>
                    <li><Link href="/dashboard/payments" className="text-emerald-400 hover:underline">Payments</Link> - Full payment history</li>
                    <li><Link href="/dashboard/settings" className="text-emerald-400 hover:underline">Settings</Link> - Profile and account settings</li>
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
                  <h3 className="text-xl font-semibold text-white mb-3">JWT Tokens</h3>
                  <p className="text-neutral-300 mb-3">
                    Authentication uses JWT (JSON Web Tokens) with 24-hour expiration. Tokens are stored in localStorage and automatically validated on page load.
                  </p>
                  <div className="bg-neutral-800/50 p-4 rounded-lg">
                    <p className="text-sm text-neutral-400 mb-2">Token Structure:</p>
                    <pre className="text-xs text-neutral-300 bg-neutral-900 p-3 rounded overflow-x-auto">
{`{
  "merchantId": "uuid",
  "type": "merchant",
  "exp": 1234567890
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Protected Routes</h3>
                  <p className="text-neutral-300 mb-3">
                    The following routes require authentication:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-300">
                    <li>/dashboard - Main dashboard</li>
                    <li>/dashboard/contents - Content management</li>
                    <li>/dashboard/payments - Payment history</li>
                    <li>/dashboard/settings - Account settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Token Validation</h3>
                  <p className="text-neutral-300">
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
                  <h3 className="text-xl font-semibold text-white mb-3">How do I get started as a merchant?</h3>
                  <p className="text-neutral-300">
                    Sign up at <Link href="/signup" className="text-emerald-400 hover:underline">/signup</Link>, create your first content item in the dashboard, and integrate the payment widget into your website.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">What wallets are supported?</h3>
                  <p className="text-neutral-300">
                    Currently supports Phantom (Standard Wallet) and Solflare. More wallets will be added as they become Standard Wallets.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">How long do access tokens last?</h3>
                  <p className="text-neutral-300">
                    Access tokens are short-lived (1-24 hours) and are tied to the content&apos;s duration setting. One-time purchases don&apos;t expire, while timed access expires based on the duration.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Can I use this with other blockchains?</h3>
                  <p className="text-neutral-300">
                    The platform is built with multi-chain support in mind. Currently supports Solana, with Ethereum, Polygon, and more coming soon.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">How do I receive payments?</h3>
                  <p className="text-neutral-300">
                    Set your Solana payout address in Dashboard → Settings. All payments are sent directly to this address.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">What happens if a payment fails?</h3>
                  <p className="text-neutral-300">
                    Failed payments are marked as &quot;Failed&quot; in the system. Users can retry the payment. Payment requests expire after 15 minutes.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Can I refund a payment?</h3>
                  <p className="text-neutral-300">
                    Refunds are handled manually by merchants. Contact support or use the refund functionality in your dashboard (if implemented).
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
