import Link from 'next/link';
import {
  BookOpenIcon,
  CodeBracketIcon,
  WalletIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function DocsPage() {
  const sections = [
    {
      title: 'Getting Started',
      icon: BookOpenIcon,
      items: [
        {
          title: 'What is the Merchant Dashboard?',
          description:
            'The dashboard is your control center for managing content, viewing analytics, and configuring your Solana Micro-Paywall integration.',
        },
        {
          title: 'Creating Your Merchant Account',
          description:
            'On the home page, enter your email and Solana wallet address. You\'ll receive a merchant ID that you\'ll use to access the dashboard.',
        },
        {
          title: 'Accessing the Dashboard',
          description:
            'Use your merchant ID in the URL parameter: /dashboard?merchantId=YOUR_MERCHANT_ID. The system will remember your ID for future visits.',
        },
      ],
    },
    {
      title: 'Content Management',
      icon: DocumentTextIcon,
      items: [
        {
          title: 'Creating Content',
          description:
            'Go to Contents → Create New. Set a unique slug, price in lamports (1 SOL = 1,000,000,000 lamports), currency, and optional duration. Add metadata for better discoverability.',
        },
        {
          title: 'Content Metadata',
          description:
            'Add title, description, category, tags, and preview text to make your content discoverable in the marketplace. Set visibility to "public" to appear in search results.',
        },
        {
          title: 'Visibility Options',
          description:
            'Public: Appears in marketplace and search. Private: Only accessible via direct link. Unlisted: Accessible via link but not in marketplace.',
        },
        {
          title: 'Editing and Deleting',
          description:
            'Click edit on any content to update details. Deleting content removes it from the marketplace but preserves payment history.',
        },
      ],
    },
    {
      title: 'Analytics & Payments',
      icon: ChartBarIcon,
      items: [
        {
          title: 'Viewing Analytics',
          description:
            'The Analytics page shows revenue, purchase counts, popular content, and payment trends over time.',
        },
        {
          title: 'Payment Tracking',
          description:
            'All payments are tracked on-chain. View payment intents, confirmed transactions, and access token redemptions.',
        },
        {
          title: 'Revenue Overview',
          description:
            'See total revenue, average transaction value, and revenue trends. Export data for accounting purposes.',
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
            'Integrate the payment widget into your website. Available as a React component or vanilla JS. See the integration guide for code examples.',
        },
        {
          title: 'API Integration',
          description:
            'Use the REST API to programmatically create content, generate payment requests, and verify transactions.',
        },
        {
          title: 'Webhooks',
          description:
            'Configure webhooks to receive real-time notifications for payment confirmations, refunds, and access token redemptions.',
        },
        {
          title: 'Customization',
          description:
            'Customize widget appearance, branding, and behavior through the Settings page or API configuration.',
        },
      ],
    },
    {
      title: 'Settings',
      icon: Cog6ToothIcon,
      items: [
        {
          title: 'Merchant Configuration',
          description:
            'Update your email, payout address, and webhook settings. Configure widget defaults and branding.',
        },
        {
          title: 'Wallet Configuration',
          description:
            'Set your Solana wallet address for receiving payouts. Ensure the wallet is secure and backed up.',
        },
        {
          title: 'API Keys',
          description:
            'Generate API keys for programmatic access. Keep keys secure and rotate them regularly.',
        },
      ],
    },
    {
      title: 'Best Practices',
      icon: BookOpenIcon,
      items: [
        {
          title: 'Content Optimization',
          description:
            'Use descriptive titles, detailed descriptions, and relevant tags. Add preview text to entice buyers.',
        },
        {
          title: 'Pricing Strategy',
          description:
            'Start with competitive pricing. Consider offering previews or free samples to attract buyers.',
        },
        {
          title: 'Marketing',
          description:
            'Share direct links to your content. Use social media to drive traffic. Leverage the marketplace for discovery.',
        },
        {
          title: 'Customer Support',
          description:
            'Monitor analytics for issues. Respond to refund requests promptly. Keep content updated and valuable.',
        },
      ],
    },
  ];

  const quickLinks = [
    { name: 'Marketplace', href: 'http://localhost:3002', description: 'Browse public content' },
    { name: 'API Documentation', href: 'http://localhost:3000/api', description: 'REST API endpoints' },
    { name: 'Integration Guide', href: '/docs/integration', description: 'Widget integration guide' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-emerald-400">
              Solana Paywall Dashboard
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-neutral-300 hover:text-white">
                Home
              </Link>
              <Link href="/docs" className="text-emerald-400 hover:text-emerald-300">
                Documentation
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">Merchant Documentation</h1>
          <p className="text-xl text-neutral-400">
            Complete guide to using the Solana Micro-Paywall Dashboard
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-emerald-500 hover:bg-neutral-900"
            >
              <h3 className="mb-2 text-lg font-semibold text-white">{link.name}</h3>
              <p className="text-sm text-neutral-400">{link.description}</p>
            </a>
          ))}
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
                How do I receive payments?
              </h3>
              <p className="text-neutral-400">
                Payments are sent directly to your configured payout address on the Solana blockchain. You can view all transactions in the Analytics page.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">What fees are charged?</h3>
              <p className="text-neutral-400">
                Solana transaction fees are minimal (typically less than $0.01). The platform may charge a small service fee - check your merchant agreement for details.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">How do refunds work?</h3>
              <p className="text-neutral-400">
                You can process refunds through the dashboard. Refund requests are tracked and can be approved or denied. Refunds are processed on-chain.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white">Can I test before going live?</h3>
              <p className="text-neutral-400">
                Yes! The platform is currently on Solana Devnet. Use devnet SOL to test all features before deploying to mainnet.
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

