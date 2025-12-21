import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Solana Micro-Paywall
          </h1>
          <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto">
            Monetize your content with instant Solana blockchain payments. 
            Sub-second confirmations, near-zero fees, and seamless integration.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="lg">Browse Marketplace</Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-neutral-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                Instant Payments
              </h3>
              <p className="text-neutral-400">
                Sub-second Solana transaction confirmations with near-zero fees.
              </p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                Easy Integration
              </h3>
              <p className="text-neutral-400">
                Drop-in payment widgets that work with any website or application.
              </p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                Full Control
              </h3>
              <p className="text-neutral-400">
                Complete dashboard with analytics, content management, and payment tracking.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
