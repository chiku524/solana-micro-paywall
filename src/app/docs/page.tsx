'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import Link from 'next/link';

const sections = [
  { id: 'overview', title: 'Overview', icon: '📚' },
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'merchant-guide', title: 'Merchants & settings', icon: '👤' },
  { id: 'content-management', title: 'Content', icon: '📝' },
  { id: 'payment-system', title: 'Payments & checkout', icon: '💳' },
  { id: 'embeds-integration', title: 'Embeds & integration', icon: '🔧' },
  { id: 'webhooks-api-keys', title: 'Webhooks & API keys', icon: '🔔' },
  { id: 'api-reference', title: 'API reference', icon: '🔌' },
  { id: 'marketplace', title: 'Marketplace', icon: '🛒' },
  { id: 'library', title: 'Library', icon: '📦' },
  { id: 'dashboard', title: 'Dashboard & analytics', icon: '📊' },
  { id: 'authentication', title: 'Authentication', icon: '🔐' },
  { id: 'faq', title: 'FAQ', icon: '❓' },
];

const DOCS_REPO_BASE = 'https://github.com/chiku524/micropaywall/tree/main/docs';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.micropaywall.app';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="glass-strong p-6 rounded-xl sticky top-24">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">On this page</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
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
              <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-500">
                Markdown docs for operators & deployers:{' '}
                <a
                  href={DOCS_REPO_BASE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  GitHub /docs
                </a>
              </p>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                {sections.find((s) => s.id === activeSection)?.icon}{' '}
                {sections.find((s) => s.id === activeSection)?.title || 'Documentation'}
              </h1>
              {activeSection === 'overview' && (
                <p className="text-xl text-neutral-600 dark:text-neutral-400">
                  Multi-chain paywall: sell content with on-chain checkout, access tokens, marketplace, and developer-friendly APIs.
                </p>
              )}
            </div>

            {activeSection === 'overview' && (
              <section id="overview" className="animate-in fade-in duration-300" key="overview">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">What is Micro Paywall?</h2>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      A blockchain-native platform for creators and publishers to sell digital access with{' '}
                      <strong className="text-neutral-900 dark:text-white">instant settlement</strong> on{' '}
                      <strong className="text-neutral-900 dark:text-white">eight networks</strong>: Solana, Ethereum,
                      Polygon, Base, Arbitrum, Optimism, BNB Chain, and Avalanche. Buyers use familiar wallets; you set
                      price per content (native units and/or USD-targeted quotes), optional webhooks, and optional
                      developer API keys for higher payment rate limits.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { t: 'Multi-chain checkout', d: 'Solana Pay + EVM flows, chain auto-selected from content.', c: 'text-emerald-600 dark:text-emerald-400' },
                      { t: 'USD-quoted pricing', d: 'Optional USD target; server converts using cached spot rates at checkout.', c: 'text-blue-600 dark:text-blue-400' },
                      { t: 'Access tokens', d: 'Short-lived JWT after verified payment; library & unlock flows.', c: 'text-purple-600 dark:text-purple-400' },
                      { t: 'Marketplace & discover', d: 'Public catalog, search, filters, creator profiles, related items.', c: 'text-pink-600 dark:text-pink-400' },
                      { t: 'Webhooks & email', d: 'Signed purchase webhooks; optional sale email via Resend.', c: 'text-cyan-600 dark:text-cyan-400' },
                      { t: 'Embeds', d: 'Hosted script, npm React iframe, or raw REST + your own wallet UI.', c: 'text-amber-600 dark:text-amber-400' },
                      { t: 'Analytics', d: 'Funnel events API + merchant payment stats & export in dashboard.', c: 'text-green-600 dark:text-green-400' },
                      { t: 'Merchant tools', d: 'Dashboard, API keys, delivery log, refund/support copy for buyers.', c: 'text-orange-600 dark:text-orange-400' },
                      { t: 'Security', d: 'JWT sessions, 2FA, password reset, rate limits, security headers.', c: 'text-red-600 dark:text-red-400' },
                    ].map((x) => (
                      <div key={x.t} className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                        <h3 className={`font-semibold mb-2 ${x.c}`}>{x.t}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{x.d}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    The web app includes EN/ES on the marketplace, receipt modal after purchase, breadcrumb navigation,
                    recently viewed tracking, and respects <strong className="text-neutral-900 dark:text-white">prefers-reduced-motion</strong>.
                  </p>
                </div>
              </section>
            )}

            {activeSection === 'getting-started' && (
              <section id="getting-started" className="animate-in fade-in duration-300" key="getting-started">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Merchants</h3>
                    <ol className="list-decimal list-inside space-y-3 text-neutral-600 dark:text-neutral-300">
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Sign up:</strong>{' '}
                        <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                          /signup
                        </Link>{' '}
                        with email (and optional payout address).
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Save your merchant ID</strong> and log in from the home page.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Payout address:</strong> Solana address for Solana content;{' '}
                        <code className="text-emerald-600 dark:text-emerald-400 text-sm">0x…</code> for EVM chains — set in{' '}
                        <Link href="/dashboard/settings" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                          Settings
                        </Link>
                        .
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Create content</strong> in{' '}
                        <Link href="/dashboard/contents" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                          Dashboard → Contents
                        </Link>
                        : chain, price, optional USD target, preview, related IDs, visibility.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Go live:</strong> share marketplace links, use{' '}
                        <strong className="text-neutral-900 dark:text-white">Embeds & integration</strong>, or call the REST API from your stack.
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Buyers</h3>
                    <ol className="list-decimal list-inside space-y-3 text-neutral-600 dark:text-neutral-300">
                      <li>
                        Browse{' '}
                        <Link href="/marketplace" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                          /marketplace
                        </Link>{' '}
                        and <Link href="/marketplace/discover" className="text-emerald-600 dark:text-emerald-400 hover:underline">Discover</Link>.
                      </li>
                      <li>
                        Connect a wallet that matches the content chain (Phantom/Solflare or an EVM wallet).
                      </li>
                      <li>Purchase from the content page; confirm the transaction in your wallet.</li>
                      <li>
                        Open <strong className="text-neutral-900 dark:text-white">My Library</strong> from the nav when signed in to see purchases; bookmarks and recently viewed live on{' '}
                        <Link href="/library" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                          /library
                        </Link>
                        .
                      </li>
                    </ol>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Logged-in merchants get a <strong className="text-neutral-900 dark:text-white">Dashboard</strong> dropdown (overview, contents, payments, settings, security). Press Escape to close it.
                  </p>
                </div>
              </section>
            )}

            {activeSection === 'merchant-guide' && (
              <section id="merchant-guide" className="animate-in fade-in duration-300" key="merchant-guide">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Account & login</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                      Create an account with email; add payout address now or later. Log in with email or merchant ID + password.
                      Password reset uses email when Resend (or configured mail) is set up on the API.
                    </p>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg space-y-2">
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/merchants</code>
                      <code className="block text-emerald-600 dark:text-emerald-400 text-sm">POST /api/auth/login</code>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Profile & public page</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                      Display name, bio, avatar, and social links appear on your public creator page at{' '}
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">/marketplace/merchant/[merchantId]</code>.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Settings (dashboard)</h3>
                    <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Payout address</strong> — must match how buyers pay (Solana vs EVM).
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Webhook URL + secret</strong> — HTTPS endpoint; HMAC-SHA256 over the JSON body using your secret (see Webhooks section).
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Webhook delivery log</strong> — recent attempts in UI; same data via API.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Developer API keys</strong> — create/revoke keys; send{' '}
                        <code className="text-emerald-600 dark:text-emerald-400 text-sm">X-Api-Key</code> on payment endpoints for higher rate limits.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Buyer-facing copy</strong> — refund/support text and support email shown on listings where configured.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'content-management' && (
              <section id="content-management" className="animate-in fade-in duration-300" key="content-management">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Fields</h3>
                    <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Slug</strong> — unique per merchant (used in URLs).
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Chain</strong> — one of the eight supported chains.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Price (native)</strong> — smallest unit (lamports / wei); always stored; used as fallback if USD quote fails.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Target price (USD)</strong> — optional; checkout computes native amount from cached rates.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Duration</strong> — seconds for timed access; omit for one-time.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Title, body, preview</strong> — listing copy; full body may unlock after purchase or via wallet query on the content page.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Category, tags, thumbnail</strong> — discovery and cards.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Related content IDs</strong> — “Related” module on the content page.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Visibility</strong> — public (marketplace) or private.
                      </li>
                    </ul>
                    <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg mt-4">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Authenticated API</p>
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">GET|POST|PUT|DELETE /api/contents</code>
                      <p className="text-xs text-neutral-500 mt-2">Bearer JWT required for list/create/update/delete.</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Dashboard UI</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      Manage everything at{' '}
                      <Link href="/dashboard/contents" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        /dashboard/contents
                      </Link>
                      : edit pricing, chain, USD target, related items, and visibility.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'payment-system' && (
              <section id="payment-system" className="animate-in fade-in duration-300" key="payment-system">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Flow</h3>
                    <ol className="list-decimal list-inside space-y-3 text-neutral-600 dark:text-neutral-300">
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Create intent</strong> —{' '}
                        <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/payments/create-payment-request</code> with{' '}
                        <code className="text-emerald-600 dark:text-emerald-400 text-sm">{'{'} &quot;contentId&quot; {'}'}</code>.
                        Optional: <code className="text-emerald-600 dark:text-emerald-400 text-sm">Idempotency-Key</code>,{' '}
                        <code className="text-emerald-600 dark:text-emerald-400 text-sm">X-Api-Key</code>.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Pay</strong> — wallet signs Solana Pay URL or EVM transfer (memo/amount match server intent).
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Verify</strong> —{' '}
                        <code className="text-emerald-600 dark:text-emerald-400 text-sm">POST /api/payments/verify-payment</code>; server verifies on-chain.
                      </li>
                      <li>
                        <strong className="text-neutral-900 dark:text-white">Access</strong> — JWT access token returned; optional purchase record + webhook + email.
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">In the web app</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      The content page embeds the payment widget: QR for Solana, wallet connect for both ecosystems, success receipt modal, and toast on errors.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Fiat quote helper</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                      Tools and UIs can preview conversion with:
                    </p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded block w-fit">
                      GET /api/prices/quote?usd=…&amp;chain=…
                    </code>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">States</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                        <span className="text-yellow-500 font-semibold">Pending</span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Intent created; awaiting chain confirmation.</p>
                      </div>
                      <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Confirmed</span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Verified; access issued.</p>
                      </div>
                      <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                        <span className="text-red-400 font-semibold">Failed / expired</span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">User can retry; intents time out (default window on server).</p>
                      </div>
                      <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">Refunded</span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Recorded when applicable; refunds are primarily manual on-chain.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'embeds-integration' && (
              <section id="embeds-integration" className="animate-in fade-in duration-300" key="embeds-integration">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Three integration levels: <strong className="text-neutral-900 dark:text-white">iframe embed</strong> (fastest),{' '}
                    <strong className="text-neutral-900 dark:text-white">REST + your wallet UI</strong> (full control), or{' '}
                    <strong className="text-neutral-900 dark:text-white">fork the in-app widget</strong> inside your React app (heavier dependency set).
                  </p>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Hosted script</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                      Serve <code className="text-emerald-600 dark:text-emerald-400 text-sm">/micropaywall-embed.js</code> from this deployment (or copy from{' '}
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">public/</code> in the repo). It loads the marketplace checkout in an iframe.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">npm: micropaywall-embed-react</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                      Lightweight React wrapper around the same iframe (unscoped package name for easy publishing).
                    </p>
                    <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm text-neutral-300">
{`npm install micropaywall-embed-react

import { MicropaywallEmbed } from 'micropaywall-embed-react';

<MicropaywallEmbed
  merchantId="your-merchant-id"
  slug="your-content-slug"
  baseUrl="https://micropaywall.app"
/>`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">REST-only</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      Call the same endpoints as the web app: create-payment-request → sign with wallet SDK → verify-payment. Use{' '}
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">Idempotency-Key</code> on creates and{' '}
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">X-Api-Key</code> when you have a developer key.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'webhooks-api-keys' && (
              <section id="webhooks-api-keys" className="animate-in fade-in duration-300" key="webhooks-api-keys">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Purchase webhooks</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                      When both <strong className="text-neutral-900 dark:text-white">webhook URL</strong> and{' '}
                      <strong className="text-neutral-900 dark:text-white">webhook secret</strong> are set, the API POSTs a JSON payload to your endpoint with{' '}
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">type: &quot;purchase.confirmed&quot;</code> and an HMAC-SHA256 signature derived from the raw body and your secret.
                      Retries and delivery rows are stored for debugging.
                    </p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded">
                      GET /api/merchants/me/webhook-deliveries
                    </code>
                    <span className="text-neutral-500 text-sm ml-2">(Bearer JWT)</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Developer API keys</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                      Created in Settings. Send the key on payment routes as <code className="text-emerald-600 dark:text-emerald-400 text-sm">X-Api-Key</code> to unlock higher rate limits for automated checkouts.
                    </p>
                    <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                      <li>
                        <code className="text-emerald-600 dark:text-emerald-400">GET /api/developer-keys</code> — list prefixes
                      </li>
                      <li>
                        <code className="text-emerald-600 dark:text-emerald-400">POST /api/developer-keys</code> — create (secret shown once)
                      </li>
                      <li>
                        <code className="text-emerald-600 dark:text-emerald-400">DELETE /api/developer-keys/:id</code> — revoke
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Client analytics (optional)</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                      The marketplace can emit funnel-friendly events (impression, pay click, verified purchase). Public endpoint:
                    </p>
                    <code className="text-emerald-600 dark:text-emerald-400 text-sm bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded block w-fit">
                      POST /api/analytics/events
                    </code>
                    <p className="text-xs text-neutral-500 mt-2">
                      Merchants aggregate counts with <code className="text-emerald-600 dark:text-emerald-400">GET /api/analytics/funnel</code> (JWT).
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'api-reference' && (
              <section id="api-reference" className="animate-in fade-in duration-300" key="api-reference">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Base URL</h3>
                    <code className="text-emerald-600 dark:text-emerald-400 bg-neutral-200 dark:bg-neutral-900 px-3 py-2 rounded inline-block">
                      {apiBase}
                    </code>
                    <p className="text-xs text-neutral-500 mt-2">
                      Responses include <code className="text-emerald-600 dark:text-emerald-400">X-Request-Id</code> for support correlation.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Auth</h3>
                    <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm text-neutral-300">{`Authorization: Bearer <jwt>`}</pre>
                  </div>
                  <div className="space-y-5">
                    {[
                      {
                        title: 'Merchants',
                        border: 'border-emerald-500',
                        items: [
                          'POST /api/merchants — signup',
                          'GET /api/merchants/:id — public profile',
                          'GET /api/merchants/me — current merchant (JWT)',
                          'PUT /api/merchants/me — update profile, payout, webhooks, policy fields (JWT)',
                          'GET /api/merchants/me/webhook-deliveries — delivery log (JWT)',
                        ],
                      },
                      {
                        title: 'Auth & security',
                        border: 'border-blue-500',
                        items: [
                          'POST /api/auth/login',
                          'POST /api/security/password-reset/request | /reset',
                          'POST /api/security/email-verification/*',
                          'POST /api/security/2fa/*',
                          'POST /api/security/password/change (JWT)',
                          'GET /api/security/activity (JWT)',
                        ],
                      },
                      {
                        title: 'Contents',
                        border: 'border-purple-500',
                        items: [
                          'GET /api/contents (JWT) — list yours',
                          'POST /api/contents (JWT)',
                          'GET /api/contents/:id',
                          'GET /api/contents/merchant/:merchantId/:slug — public by slug',
                          'PUT /api/contents/:id (JWT)',
                          'DELETE /api/contents/:id (JWT)',
                        ],
                      },
                      {
                        title: 'Payments',
                        border: 'border-pink-500',
                        items: [
                          'POST /api/payments/create-payment-request — optional Idempotency-Key, X-Api-Key',
                          'POST /api/payments/verify-payment — optional X-Api-Key',
                        ],
                      },
                      {
                        title: 'Purchases',
                        border: 'border-yellow-500',
                        items: [
                          'POST /api/purchases — after verified payment intent',
                          'GET /api/purchases/access/:token — resolve purchase by access token',
                          'GET /api/purchases/check-access?walletAddress=&contentId=',
                          'GET /api/purchases/wallet/:walletAddress',
                          'GET /api/purchases/merchant (JWT) — merchant’s sales',
                          'GET /api/purchases/:id (JWT) — single purchase for your merchant',
                        ],
                      },
                      {
                        title: 'Discover',
                        border: 'border-cyan-500',
                        items: [
                          'GET /api/discover — catalog (filters, sort, pagination)',
                          'GET /api/discover/trending',
                          'GET /api/discover/recent',
                          'GET /api/discover/categories',
                          'GET /api/discover/merchant/:merchantId',
                        ],
                      },
                      {
                        title: 'Bookmarks',
                        border: 'border-teal-500',
                        items: [
                          'GET /api/bookmarks/wallet/:walletAddress',
                          'GET /api/bookmarks/check?walletAddress=&contentId=',
                          'POST /api/bookmarks — body: walletAddress, contentId',
                          'DELETE /api/bookmarks?walletAddress=&contentId=',
                        ],
                      },
                      {
                        title: 'Analytics',
                        border: 'border-green-500',
                        items: [
                          'POST /api/analytics/events — public funnel events',
                          'GET /api/analytics/funnel (JWT)',
                          'GET /api/analytics/stats (JWT)',
                          'GET /api/analytics/recent-payments (JWT)',
                          'GET /api/analytics/payments (JWT)',
                          'GET /api/analytics/export (JWT)',
                        ],
                      },
                      {
                        title: 'Prices',
                        border: 'border-amber-500',
                        items: ['GET /api/prices/quote?usd=&chain= — rate limited'],
                      },
                      {
                        title: 'Developer keys',
                        border: 'border-orange-500',
                        items: ['GET|POST /api/developer-keys (JWT)', 'DELETE /api/developer-keys/:id (JWT)'],
                      },
                    ].map((block) => (
                      <div key={block.title} className={`border-l-4 ${block.border} pl-4`}>
                        <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">{block.title}</h4>
                        <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                          {block.items.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'marketplace' && (
              <section id="marketplace" className="animate-in fade-in duration-300" key="marketplace">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Discover</strong> — search (debounced), categories, tags, price range, sort (recent, trending, price, popularity).
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Content page</strong> — breadcrumb, creator link, payment widget, policy/support copy from merchant, related content, share buttons, bookmarks.
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Unlock rules</strong> — full description for buyers with access;{' '}
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">?wallet=</code> can unlock when that wallet already purchased.
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Locale</strong> — English / Español toggle on marketplace surfaces.
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-white">Performance</strong> — list endpoints are KV-cached on the API for snappy catalogs.
                    </li>
                  </ul>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Creator profiles: <code className="text-emerald-600 dark:text-emerald-400">/marketplace/merchant/[merchantId]</code>.
                  </p>
                </div>
              </section>
            )}

            {activeSection === 'library' && (
              <section id="library" className="animate-in fade-in duration-300" key="library">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <p className="text-neutral-600 dark:text-neutral-300">
                    <Link href="/library" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                      /library
                    </Link>{' '}
                    groups <strong className="text-neutral-900 dark:text-white">My Purchases</strong>,{' '}
                    <strong className="text-neutral-900 dark:text-white">My Creations</strong> (merchants),{' '}
                    <strong className="text-neutral-900 dark:text-white">Bookmarks</strong>, and{' '}
                    <strong className="text-neutral-900 dark:text-white">Recently Viewed</strong>. When your wallet is connected, use{' '}
                    <strong className="text-neutral-900 dark:text-white">My Library</strong> in the navbar for quick access.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300 text-sm">
                    <li>Purchases: on-chain-linked content you own; explorer links respect each chain.</li>
                    <li>Bookmarks: stored in-browser and synced to the bookmarks API where used.</li>
                    <li>Recently viewed: last several content pages, updated automatically.</li>
                  </ul>
                </div>
              </section>
            )}

            {activeSection === 'dashboard' && (
              <section id="dashboard" className="animate-in fade-in duration-300" key="dashboard">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Merchant hub at{' '}
                    <Link href="/dashboard" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                      /dashboard
                    </Link>
                    : revenue and payment counters, recent payments table (skeletons while loading), and links to deep pages.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-300">
                    <li>
                      <Link href="/dashboard/contents" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        Contents
                      </Link>{' '}
                      — CRUD, chain, USD target, related, preview.
                    </li>
                    <li>
                      <Link href="/dashboard/payments" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        Payments
                      </Link>{' '}
                      — history and detail.
                    </li>
                    <li>
                      <Link href="/dashboard/settings" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        Settings
                      </Link>{' '}
                      — profile, payout, webhooks, API keys, delivery log, buyer policy copy.
                    </li>
                    <li>
                      <Link href="/dashboard/security" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        Security
                      </Link>{' '}
                      — password, 2FA, activity.
                    </li>
                  </ul>
                  <div className="bg-neutral-100 dark:bg-neutral-800/50 p-4 rounded-lg">
                    <h4 className="text-neutral-900 dark:text-white font-semibold mb-2">Analytics API (dashboard data)</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                      The UI uses authenticated analytics routes for stats and tables. Funnel rollups (
                      <code className="text-emerald-600 dark:text-emerald-400 text-sm">/api/analytics/funnel</code>) are available for custom reporting or future dashboard panels.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'authentication' && (
              <section id="authentication" className="animate-in fade-in duration-300" key="authentication">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Merchant JWT</h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-3">
                      Login returns a JWT (typically 24h) stored client-side for dashboard calls. Expired tokens redirect to sign-in flows.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Buyer access JWT</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      After payment verification, the API issues a short-lived access token bound to content + wallet; used to prove purchase without sharing private keys.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">Protected routes</h3>
                    <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-300 text-sm">
                      <li>/dashboard and all sub-routes (merchant session)</li>
                      <li>Worker endpoints marked above require Bearer JWT unless noted public</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'faq' && (
              <section id="faq" className="animate-in fade-in duration-300" key="faq">
                <div className="glass-strong p-6 rounded-xl space-y-6">
                  {[
                    {
                      q: 'Which wallets work?',
                      a: (
                        <>
                          <strong className="text-neutral-900 dark:text-white">Solana:</strong> Phantom, Solflare.{' '}
                          <strong className="text-neutral-900 dark:text-white">EVM:</strong> MetaMask, Rainbow, or other injected wallets. The content&apos;s chain selects the flow.
                        </>
                      ),
                    },
                    {
                      q: 'How do USD prices work?',
                      a: 'Set an optional USD target on content. At checkout the API converts to native smallest units using cached spot rates (with fallback to your on-chain minimum if quotes fail).',
                    },
                    {
                      q: 'How do I automate checkout?',
                      a: 'Use REST: create-payment-request → sign → verify-payment. Add Idempotency-Key on creates; create a developer API key for higher rate limits.',
                    },
                    {
                      q: 'How do webhooks authenticate?',
                      a: 'Configure a shared secret in Settings; verify HMAC-SHA256 of the raw JSON body. Payload type is purchase.confirmed.',
                    },
                    {
                      q: 'Where do refunds happen?',
                      a: 'On-chain refunds are manual today; you can document your policy in Settings for buyers.',
                    },
                    {
                      q: 'Is there a sitemap or SEO?',
                      a: 'Public pages aim to be shareable; creator and content URLs are stable slugs under /marketplace.',
                    },
                  ].map((item) => (
                    <div key={item.q}>
                      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">{item.q}</h3>
                      <p className="text-neutral-600 dark:text-neutral-300">{item.a}</p>
                    </div>
                  ))}
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
