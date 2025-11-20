import Link from 'next/link';
import { marketplaceApi } from '../lib/api-client';

export async function CategoriesSection() {
  const categories = await marketplaceApi.getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-3xl font-bold text-white">Browse by Category</h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.category}
            href={`/discover?category=${encodeURIComponent(cat.category)}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-neutral-300 transition hover:border-emerald-500/50 hover:bg-neutral-900 hover:text-white"
          >
            {cat.category} ({cat.count})
          </Link>
        ))}
      </div>
    </section>
  );
}

