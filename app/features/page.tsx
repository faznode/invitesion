import Link from 'next/link';
import MarketingHeader from '../marketing-header';
import { marketingPages, marketingHref } from '../marketing-registry';
import styles from '../home.module.css';

export default function Page() { return <main className={styles.site}><MarketingHeader /><section className={styles.simplePageHero}><small className={styles.eyebrow}>FITUR INVITESION</small><h1>Semua fitur dalam satu alur.</h1><p>Pilih kebutuhan Anda dan temukan halaman khusus dengan alur yang relevan.</p><div className={styles.resourceCards}>{marketingPages['features'].map(page => <article key={page.slug}><h2>{page.title}</h2><p>{page.summary}</p><Link href={marketingHref('features', page.title)}>Pelajari <span aria-hidden="true">→</span></Link></article>)}</div></section></main>; }
