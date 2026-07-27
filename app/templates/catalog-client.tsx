'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Eye } from 'lucide-react';
import {
  invitationTemplates,
  templateCategories,
  templateCategoryLabels,
  templateStyleTagLabels,
  type TemplateCategory,
  type TemplateStyleTag,
} from '@/lib/invitation/templates';
import styles from './templates.module.css';

type Locale = 'id' | 'en';

const COPY: Record<
  Locale,
  {
    kicker: string;
    lead: string;
    filterCat: string;
    filterStyle: string;
    all: string;
    preview: string;
    use: string;
    empty: string;
    tiers: Record<'free' | 'premium' | 'signature', string>;
  }
> = {
  id: {
    kicker: 'KATALOG TEMA',
    lead: 'Setiap tema adalah arah seni tersendiri — floral yang bergerak, batik, art deco, cat air — bukan sekadar ganti warna. Klik tema mana pun untuk melihat preview undangan seutuhnya, tanpa perlu login.',
    filterCat: 'Kategori',
    filterStyle: 'Gaya',
    all: 'Semua',
    preview: 'Preview penuh',
    use: 'Pakai tema',
    empty: 'Belum ada tema untuk kombinasi filter ini — coba longgarkan salah satu filter.',
    tiers: { free: 'Gratis', premium: 'Premium', signature: 'Signature' },
  },
  en: {
    kicker: 'THEME CATALOG',
    lead: 'Every theme is its own art direction — moving florals, batik, art deco, watercolor — not just a palette swap. Click any theme to preview the full invitation, no login required.',
    filterCat: 'Category',
    filterStyle: 'Style',
    all: 'All',
    preview: 'Full preview',
    use: 'Use theme',
    empty: 'No themes match this filter combo — try loosening one filter.',
    tiers: { free: 'Free', premium: 'Premium', signature: 'Signature' },
  },
};

export default function CatalogClient({ locale = 'id' }: { locale?: Locale }) {
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all');
  const [tag, setTag] = useState<TemplateStyleTag | 'all'>('all');
  const t = COPY[locale];

  const catCounts = useMemo(() => {
    const counts = new Map<TemplateCategory, number>();
    for (const tpl of invitationTemplates) {
      counts.set(tpl.category, (counts.get(tpl.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const styleTags = useMemo(() => {
    const seen = new Set<TemplateStyleTag>();
    for (const tpl of invitationTemplates) {
      for (const styleTag of tpl.styleTags) seen.add(styleTag);
    }
    return Array.from(seen);
  }, []);

  const shown = useMemo(
    () =>
      invitationTemplates.filter(
        (tpl) =>
          (cat === 'all' || tpl.category === cat) &&
          (tag === 'all' || tpl.styleTags.includes(tag)),
      ),
    [cat, tag],
  );

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>
          {t.kicker} · {invitationTemplates.length} {locale === 'id' ? 'DESAIN' : 'DESIGNS'}
        </p>
        <h1 className={styles.title}>
          {locale === 'id' ? (
            <>
              Tema yang <em>hidup</em>, bukan template yang itu-itu saja.
            </>
          ) : (
            <>
              Themes that feel <em>alive</em>, not cookie-cutter templates.
            </>
          )}
        </h1>
        <p className={styles.lead}>{t.lead}</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <span className={styles.filterName}>{t.filterCat}</span>
          <button
            type="button"
            className={cat === 'all' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
            onClick={() => setCat('all')}
          >
            {t.all}
            <span className={styles.tabCount}>{invitationTemplates.length}</span>
          </button>
          {templateCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={cat === category ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => setCat(category)}
            >
              {templateCategoryLabels[category][locale]}
              <span className={styles.tabCount}>{catCounts.get(category) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className={styles.filterRow}>
          <span className={styles.filterName}>{t.filterStyle}</span>
          <button
            type="button"
            className={tag === 'all' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
            onClick={() => setTag('all')}
          >
            {t.all}
          </button>
          {styleTags.map((styleTag) => (
            <button
              key={styleTag}
              type="button"
              className={tag === styleTag ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => setTag(styleTag)}
            >
              {templateStyleTagLabels[styleTag][locale]}
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 ? (
        <div className={styles.grid}>
          {shown.map((tpl) => {
            const vars = {
              '--bg': tpl.palette.bg,
              '--ink': tpl.palette.ink,
              '--a': tpl.palette.accent,
              '--s': tpl.palette.soft,
            } as CSSProperties;
            return (
              <article key={tpl.slug} className={styles.card}>
                <Link
                  href={`/templates/${tpl.slug}`}
                  className={styles.coverLink}
                  aria-label={`${t.preview}: ${tpl.name}`}
                >
                  <div
                    className={styles.cover}
                    style={vars}
                    data-motif={tpl.motif}
                    data-font={tpl.font}
                  >
                    <span className={styles.tierBadge} data-tier={tpl.tier}>
                      {t.tiers[tpl.tier]}
                    </span>
                    <i className={styles.petals} aria-hidden="true" />
                    <span className={styles.frame} aria-hidden="true" />
                    <div className={styles.coverInner}>
                      <span className={styles.cEyebrow}>{tpl.sample.eyebrow}</span>
                      <span className={styles.cNames}>{tpl.sample.names}</span>
                      <span className={styles.cDate}>{tpl.sample.date}</span>
                    </div>
                  </div>
                </Link>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardName}>{tpl.name}</h3>
                    <span className={styles.cardCat}>{templateCategoryLabels[tpl.category][locale]}</span>
                  </div>
                  <p className={styles.cardTagline}>{tpl.tagline[locale]}</p>
                  <div className={styles.cardFoot}>
                    <Link href={`/templates/${tpl.slug}`} className={styles.previewLink}>
                      <Eye size={14} aria-hidden="true" /> {t.preview}
                    </Link>
                    <Link href={`/dashboard/templates/use?slug=${tpl.slug}`} className={styles.useLink}>
                      {t.use} <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>{t.empty}</p>
      )}
    </div>
  );
}
