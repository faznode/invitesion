import Link from 'next/link';
import { Check } from 'lucide-react';
import styles from '../home.module.css';
import MarketingHeader from '../marketing-header';
import { getMarketingCopy } from '../marketing-copy';
import { getLocale } from '@/lib/locale-server';

export default async function PricingPage() {
  const copy = getMarketingCopy(await getLocale());
  return <main className={styles.site}>
    <MarketingHeader />
    <section className={styles.simplePageHero}><small className={styles.eyebrow}>{copy.pricingEyebrow}</small><h1>{copy.pricingTitle}</h1><p>{copy.pricingBody}</p><article className={styles.pricingCard}><div><small>{copy.pricingBadge}</small><h2>{copy.pricingPlan}</h2><strong>Rp0</strong><p>{copy.pricingPlanBody}</p></div><ul>{copy.pricingIncluded.map(item => <li key={item}><Check size={17}/>{item}</li>)}</ul><Link href="/sign-up" className={styles.primaryBtn}>{copy.pricingCta} <span>→</span></Link></article><p className={styles.pricingNote}>{copy.pricingNote}</p></section>
  </main>;
}
