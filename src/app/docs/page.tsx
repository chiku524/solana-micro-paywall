import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Documentation</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Getting Started</h2>
          <div className="bg-neutral-900 p-6 rounded-lg">
            <p className="text-neutral-300 mb-4">
              Solana Micro-Paywall allows you to monetize your content with instant Solana payments.
            </p>
            <h3 className="text-lg font-semibold text-white mb-2">1. Create a Merchant Account</h3>
            <p className="text-neutral-300 mb-4">
              Sign up to create your merchant account and get your Merchant ID.
            </p>
            <h3 className="text-lg font-semibold text-white mb-2">2. Create Content</h3>
            <p className="text-neutral-300 mb-4">
              Add content items with pricing and descriptions in your dashboard.
            </p>
            <h3 className="text-lg font-semibold text-white mb-2">3. Integrate Payment Widget</h3>
            <p className="text-neutral-300">
              Add the payment widget to your website to accept payments.
            </p>
          </div>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">API Reference</h2>
          <div className="bg-neutral-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Base URL</h3>
            <code className="text-emerald-400">{process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}</code>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
