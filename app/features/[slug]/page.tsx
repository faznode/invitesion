import { notFound } from 'next/navigation';
import { getMarketingPage, marketingPages } from '../../marketing-registry';
import { MarketingDetailPage } from '../../marketing-public-page';

export const dynamicParams = false;
export function generateStaticParams() { return marketingPages['features'].map(({ slug }) => ({ slug })); }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getMarketingPage('features', slug);
  if (!page) notFound();
  return <MarketingDetailPage page={page} />;
}
