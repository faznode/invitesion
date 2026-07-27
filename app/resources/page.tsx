import Link from 'next/link';
import MarketingHeader from '../marketing-header';
import MarketingFooter from '../marketing-footer';
import { marketingPages, marketingHref } from '../marketing-registry';
import styles from '../home.module.css';

export default function ResourcesPage() {
  return (
    <main className={styles.site}>
      <MarketingHeader />
      <section className={styles.simplePageHero}>
        <small className={styles.eyebrow}>INVITESION RESOURCE</small>
        <h1>Rencanakan acara dengan lebih tenang.</h1>
        <p>Panduan, dukungan, dan informasi perusahaan untuk membantu setiap detail acara berjalan rapi.</p>
        <div className={styles.resourceCards}>
          {marketingPages.resources.map(page => (
            <article key={page.slug}>
              <h2>{page.title}</h2>
              <p>{page.summary}</p>
              <Link href={marketingHref('resources', page.title)}>Buka halaman <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>
      <div className={styles.frame}>
        <MarketingFooter />
      </div>
    </main>
  );
}
