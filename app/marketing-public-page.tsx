import Link from 'next/link';
import MarketingHeader from './marketing-header';
import type { MarketingPage } from './marketing-registry';
import styles from './home.module.css';

export function MarketingDetailPage({ page }: { page: MarketingPage }) {
  return <main className={styles.site}>
    <MarketingHeader />
    <article className={styles.simplePageHero}>
      <small className={styles.eyebrow}>{page.eyebrow}</small>
      <h1>{page.title}</h1>
      <p>{page.summary}</p>
      <section className={styles.resourceCards} aria-label={`Keunggulan ${page.title}`}>
        {page.highlights.map((highlight, index) => <div key={highlight}><span>0{index + 1}</span><h2>{highlight}</h2><p>Atur detailnya bersama Invitesion agar tim dan tamu selalu mendapat informasi yang tepat.</p></div>)}
      </section>
      <Link href="/sign-up" className={styles.primaryBtn}>Mulai buat event <span aria-hidden="true">→</span></Link>
    </article>
  </main>;
}
