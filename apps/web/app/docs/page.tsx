import Link from 'next/link';
import {
  BookOpenIcon,
  CodeBracketIcon,
  WalletIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function DocsPage() {
  const sections = [
    {
      title: 'Getting Started',
      icon: BookOpenIcon,
      items: [
        {
          title: 'What is Solana Micro-Paywall?',
          description:
            'A platform for creators to monetize content using Solana payments. Buyers can discover and purchase premium content with instant, low-cost transactions.',
        },
        {
          title: 'How It Works',
          description:
            '1. Browse or search for content → 2. Connect your Solana wallet → 3. Purchase with SOL → 4. Access your content instantly',
        },
        {
          title: 'Supported Wallets',
          description: 'Phantom, Solflare, Sollet, and other Solana wallet adapters.',
        },
      ],
    },
    {
      title: 'For Buyers',
      icon: ShoppingCartIcon,
      items: [
        {
          title: 'Discovering Content',
          description:
            'Use the search bar, browse categories, or check trending content. Filter by category, price, or sort by newest, trending, or price.',
        },
        {
          title: 'Making a Purchase',
          description:
            'Click on any content card to view details. Connect your wallet, click "Purchase with SOL", and confirm the transaction. Access is granted immediately after payment confirmation.',
        },
        {
          title: 'Accessing Purchased Content',
          description:
            'After purchase, you receive an access token. The content is unlocked automatically. You can view it anytime while the token is valid.',
        },
      ],
    },
    {
      title: 'For Creators',
      icon: ChartBarIcon,
      items: [
        {
          title: 'Getting Started as a Merchant',
          description:
            'Visit the Dashboard to create your merchant account. You\'ll need a Solana wallet address for receiving payouts.',
        },
        {
          title: 'Creating Content',
          description:
            'In the Dashboard, go to Contents → Create New. Set a price, add metadata (title, description, category, tags), and choose visibility (public, private, or unlisted).',
        },
        {
          title: 'Making Content Discoverable',
          description:
            'Set visibility to "public" and add rich metadata (title, description, category, tags) to make your content appear in the marketplace.',
        },
      ],
    },
    {
      title: 'Integration',
      icon: CodeBracketIcon,
      items: [
        {
          title: 'Widget SDK',
          description:
            'Integrate the payment widget into your website or app. Available as a React component or vanilla JS widget. See the integration guide for details.',
        },
        {
          title: 'API Access',
          description:
            'Use the REST API to create payment requests, verify transactions, and manage content programmatically.',
        },
        {
          title: 'Webhooks',
          description:
            'Receive real-time notifications for payment confirmations, refunds, and other events.',
        },
      ],
    },
    {
      title: 'Technical Details',
      icon: CodeBracketIcon,
      items: [
        {
          title: 'Blockchain',
          description: 'Built on Solana blockchain using Solana Pay protocol. Transactions are fast, low-cost, and secure.',
        },
        {
          title: 'Network',
          description: 'Currently running on Solana Devnet for testing. Mainnet support coming soon.',
        },
        {
          title: 'Access Tokens',
          description:
            'JWT-based tokens with configurable expiration. Tokens are tied to specific content and buyer wallet.',
        },
      ],
    },
  ];

  const quickLinks: Array<{ name: string; href: string; description: string }> = [
    { name: 'Dashboard', href: '/dashboard', description: 'Merchant dashboard' },
    { name: 'API Documentation', href: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api`, description: 'REST API endpoints' },
    { name: 'Marketplace', href: '/marketplace', description: 'Browse content' },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Solana Micro-Paywall
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-neutral-300 hover:text-white">
                Home
              </Link>
              <Link href="/marketplace" className="text-neutral-300 hover:text-white">
                Marketplace
              </Link>
              <Link href="/marketplace/discover" className="text-neutral-300 hover:text-white">
                Discover
              </Link>
              <Link href="/docs" className="text-emerald-400 hover:text-emerald-300">
                Documentation
              </Link>
              <Link href="/dashboard" className="text-neutral-300 hover:text-white">
                For Merchants
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">Documentation</h1>
          <p className="text-xl text-neutral-400">
            Everything you need to know about Solana Micro-Paywall
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickLinks.map((link) => {
            const isExternal = link.href.startsWith('http');
            const className = "rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-emerald-500 hover:bg-neutral-900";
            
            if (isExternal) {
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  <h3 className="mb-2 text-lg font-semibold text-white">{link.name}</h3>
                  <p className="text-sm text-neutral-400">{link.description}</p>
                </a>
              );
            }
            
            return (
              <Link
                key={link.name}
                href={link.href as any}
                className={className}
              >
                <h3 className="mb-2 text-lg font-semibold text-white">{link.name}</h3>
                <p className="text-sm text-neutral-400">{link.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Documentation Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-8">
              <div className="mb-6 flex items-center space-x-3">
                <section.icon className="h-6 w-6 text-emerald-400" />
                <h2 className="text-3xl font-bold text-white">{section.title}</h2>
              </div>
              <div className="space-y-6">
                {section.items.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-emerald-500/30 pl-6">
                    <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-neutral-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-12 rounded-lg border border-neutral-800 bg-neutral-900/60 p-8">
          <h2 className="mb-6 text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                What happens if a transaction fails?
              </h3>
              <p className="text-neutral-400">
                If a transaction fails or is cancelled, no payment is processed and you won't be charged. Simply try again.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">How long do I have access?</h3>
              <p className="text-neutral-400">
                Access duration depends on the content. Some content provides lifetime access, while others may have time-limited access. Check the content details before purchasing.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">Can I get a refund?</h3>
              <p className="text-neutral-400">
                Refund policies are set by individual creators. Contact the creator through their merchant dashboard or check their refund policy.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">Is this on mainnet or testnet?</h3>
              <p className="text-neutral-400">
                Currently running on Solana Devnet for testing. Mainnet support will be available soon. Make sure you're using a devnet wallet.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-800 bg-neutral-900/60 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-neutral-400 sm:px-6 lg:px-8">
          <p>Powered by Solana Micro-Paywall</p>
        </div>
      </footer>
    </div>
  );
}


