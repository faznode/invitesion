'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Braces } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import {
  invitationTemplates,
  templateCategories,
  templateCategoryLabels,
  templateStyleTagLabels,
  type TemplateCategory,
  type TemplateStyleTag,
} from '@/lib/invitation/templates';
import styles from './templates.module.css';

const COPY = {
  id: {
    eyebrow: 'Katalog tema',
    title: 'Satu tema untuk setiap momen',
    lead: 'Semua tema di bawah ini berbasis preset JSON yang sama dengan editor undanganmu — pilih temanya, isi detail acara, dan undangan langsung jadi. Warna, musik, galeri, sampai buku tamu bisa diatur ulang kapan saja.',
    all: 'Semua',
    styleLabel: 'Gaya',
    countSuffix: 'tema · siap dikustomisasi lewat editor',
    use: 'Pakai tema ini',
    jsonReady: 'Preset JSON',
    categoryAria: 'Filter kategori',
    styleAria: 'Filter gaya',
    tier: { free: 'Gratis', premium: 'Premium', signature: 'Signature' },
  },
  en: {
    eyebrow: 'Template gallery',
    title: 'A theme for every moment',
    lead: 'Every theme below is built on the same JSON preset your invitation editor uses — pick one, fill in your event details, and your invitation is live. Colors, music, gallery and guestbook stay fully customizable.',
    all: 'All',
    styleLabel: 'Style',
    countSuffix: 'themes · fully customizable in the editor',
    use: 'Use this theme',
    jsonReady: 'JSON preset',
    categoryAria: 'Filter by category',
    styleAria: 'Filter by style',
    tier: { free: 'Free', premium: 'Premium', signature: 'Signature' },
  },
} as const;

export default function CatalogClient({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [style, setStyle] = useState<TemplateStyleTag | 'all'>('all');

  const styleTags = useMemo(() => {
    const seen = new Set<TemplateStyleTag>();
    for (const template of invitationTemplates) for (const tag of template.styleTags) seen.add(tag);
    return Array.from(seen);
  }, []);

  const list = useMemo(
    () =>
      invitationTemplates.filter(
        (template) =>
          (category === 'all' || template.category === category) &&
          (style === 'all' || template.styleTags.includes(style)),
      ),
    [category, style],
  );

  const chipClass = (on: boolean) => (on ? `${styles.chip} ${styles.chipOn}` : styles.chip);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{c.eyebrow}</span>
        <h1 className={styles.title}>{c.title}</h1>
        <p className={styles.lead}>{c.lead}</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.chipRow} role="group" aria-label={c.categoryAria}>
          <button type="button" className={chipClass(category === 'all')} onClick={() => setCategory('all')}>
            {c.all} <b>{invitationTemplates.length}</b>
          </button>
          {templateCategories.map((cat) => (
            <button key={cat} type="button" className={chipClass(category === cat)} onClick={() => setCategory(cat)}>
              {templateCategoryLabels[cat][locale]}{' '}
              <b>{invitationTemplates.filter((template) => template.category === cat).length}</b>
            </button>
          ))}
        </div>
        <div className={styles.chipRow} role="group" aria-label={c.styleAria}>
          <button type="button" className={chipClass(style === 'all')} onClick={() => setStyle('all')}>
            {c.styleLabel}: {c.all}
          </button>
          {styleTags.map((tag) => (
            <button key={tag} type="button" className={chipClass(style === tag)} onClick={() => setStyle(tag)}>
              {templateStyleTagLabels[tag][locale]}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.count}>
        {list.length} {c.countSuffix}
      </p>

      <div className={styles.grid}>
        {list.map((template) => {
          const vars = {
            '--bg': template.palette.bg,
            '--ink': template.palette.ink,
            '--a': template.palette.accent,
            '--s': template.palette.soft,
          } as CSSProperties;
          return (
            <article key={template.slug} className={styles.card}>
              <div className={styles.cover} data-motif={template.motif} data-font={template.font} style={vars}>
                <span className={styles.tierBadge} data-tier={template.tier}>
                  {c.tier[template.tier]}
                </span>
                <div className={styles.coverInner}>
                  <small>{template.sample.eyebrow}</small>
                  <strong>{template.sample.names}</strong>
                  <span>{template.sample.date}</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{template.name}</h3>
                <p className={styles.cardTagline}>{template.tagline[locale]}</p>
                <div className={styles.tagRow}>
                  <span className={styles.catChip}>{templateCategoryLabels[template.category][locale]}</span>
                  {template.styleTags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {templateStyleTagLabels[tag][locale]}
                    </span>
                  ))}
                </div>
                <div className={styles.cardFoot}>
                  <span className={styles.jsonChip}>
                    <Braces size={12} aria-hidden /> {c.jsonReady}
                  </span>
                  <Link href="/sign-up" className={styles.useLink}>
                    {c.use} <ArrowRight size={13} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
