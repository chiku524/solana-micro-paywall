import { Content } from '../lib/api-client';
import { ContentCard } from './content-card';

interface TrendingSectionProps {
  title: string;
  contents: Content[];
}

export function TrendingSection({ title, contents }: TrendingSectionProps) {
  if (contents.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-3xl font-bold text-white">{title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {contents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>
    </section>
  );
}

