import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  getTemplateBySlug,
  invitationTemplates,
  templateCategoryLabels,
  type InvitationTemplate,
  type TemplateCategory,
} from '@/lib/invitation/templates';
import { getLocale } from '@/lib/locale-server';
import styles from './preview.module.css';

/**
 * Full, login-free template preview. Renders the template preset the same
 * way a real invitation would look (cover, opening, quote, events, story,
 * gallery, gift, RSVP, guestbook) using sample content per category, so a
 * visitor can judge the whole theme before signing up.
 */

export function generateStaticParams() {
  return invitationTemplates.map((template) => ({ slug: template.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  return {
    title: template ? `${template.name} — Preview Tema | Invitesion` : 'Preview Tema | Invitesion',
    description: template?.tagline.id,
  };
}

type SampleEvent = { title: string; time: string; venue: string; address: string };

const SAMPLE_EVENTS: Record<TemplateCategory, SampleEvent[]> = {
  wedding: [
    { title: 'Akad Nikah', time: 'SABTU · 09.00 – 10.30 WIB', venue: 'Masjid Agung Al-Azhar', address: 'Jl. Sisingamangaraja No. 1, Jakarta Selatan' },
    { title: 'Resepsi', time: 'SABTU · 11.30 – 14.00 WIB', venue: 'The Glass House, Pacific Place', address: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta' },
  ],
  anniversary: [
    { title: 'Syukuran Hari Jadi', time: 'SABTU · 18.30 WIB', venue: 'Kediaman Keluarga', address: 'Jl. Cempaka No. 12, Bandung' },
  ],
  'bridal-shower': [
    { title: 'Bridal Shower', time: 'SABTU · 15.00 WIB', venue: 'Amara Tea House', address: 'Jl. Senopati No. 41, Jakarta Selatan' },
  ],
  birthday: [
    { title: 'Pesta Ulang Tahun', time: 'MINGGU · 16.00 WIB', venue: 'Taman Kota Playground', address: 'Jl. Melati No. 8, Depok' },
  ],
  'aqiqah-khitanan': [
    { title: 'Tasyakuran', time: 'MINGGU · 10.00 WIB', venue: 'Kediaman Keluarga', address: 'Jl. Anggrek No. 3, Bogor' },
  ],
  syukuran: [
    { title: 'Acara Syukuran', time: 'MINGGU · 11.00 WIB', venue: 'Kediaman Keluarga', address: 'Jl. Kenanga No. 17, Yogyakarta' },
  ],
  'baby-shower': [
    { title: 'Baby Shower', time: 'SABTU · 14.00 WIB', venue: 'Rumah Nenek', address: 'Jl. Flamboyan No. 5, Tangerang' },
  ],
  graduation: [
    { title: 'Perayaan Wisuda', time: 'KAMIS · 18.00 WIB', venue: 'Balai Sarbini', address: 'Jl. Jend. Sudirman, Jakarta' },
  ],
  reunion: [
    { title: 'Reuni Akbar', time: 'SABTU · 17.00 WIB', venue: 'Aula SMA 3', address: 'Jl. Pendidikan No. 21, Semarang' },
  ],
  'holiday-gathering': [
    { title: 'Kumpul Keluarga', time: 'MINGGU · 10.00 WIB', venue: 'Kediaman Keluarga Besar', address: 'Jl. Mawar No. 2, Surabaya' },
  ],
  corporate: [
    { title: 'Main Event', time: 'THURSDAY · 18.30 WIB', venue: 'Grand Ballroom, Hotel Indonesia Kempinski', address: 'Jl. M.H. Thamrin No. 1, Jakarta' },
  ],
};

const SAMPLE_STORY = [
  { date: '2019', title: 'Awal Bertemu', body: 'Dipertemukan lewat teman lama di sebuah acara — obrolan singkat yang ternyata tidak pernah selesai.' },
  { date: '2025', title: 'Lamaran', body: 'Di tempat yang sama saat pertama bertemu, sebuah pertanyaan sederhana dijawab dengan air mata bahagia.' },
];

const SAMPLE_WISHES = [
  { name: 'Raisa & Keluarga', text: 'Selamat! Semoga acaranya lancar dan penuh berkah. Kami usahakan hadir ya!' },
  { name: 'Teman Kantor', text: 'Turut berbahagia! Sehat-sehat selalu dan sampai jumpa di hari H.' },
];

const SAMPLE_GIFTS = [
  { label: 'BCA', number: '4210 8812 3456', holder: 'a.n. Pemilik Undangan' },
  { label: 'GoPay · OVO', number: '0812 3456 7890', holder: 'a.n. Pemilik Undangan' },
];

export default async function TemplatePreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) notFound();
  const locale = await getLocale();

  const L =
    locale === 'en'
      ? {
          back: 'All themes',
          use: 'Use this theme',
          ctaText: 'Love this theme?',
          demoNote: 'This is a live preview — RSVP and guestbook activate once your invitation is created.',
          events: 'Event Schedule',
          story: 'Our Story',
          gallery: 'Gallery',
          gift: 'Gifts',
          rsvp: 'RSVP',
          name: 'Full name',
          attendance: 'Attendance',
          attending: 'Joyfully attending',
          tiers: { free: 'Free', premium: 'Premium', signature: 'Signature' },
        }
      : {
          back: 'Semua tema',
          use: 'Pakai tema ini',
          ctaText: 'Suka tema ini?',
          demoNote: 'Ini preview langsung — RSVP dan buku tamu aktif setelah undangan kamu dibuat.',
          events: 'Rangkaian Acara',
          story: 'Cerita Kami',
          gallery: 'Galeri',
          gift: 'Kado & Tanda Kasih',
          rsvp: 'Konfirmasi Kehadiran',
          name: 'Nama lengkap',
          attendance: 'Kehadiran',
          attending: 'Insya Allah hadir',
          tiers: { free: 'Gratis', premium: 'Premium', signature: 'Signature' },
        };

  const preset = template.preset;
  const useHref = `/dashboard/templates/use?slug=${template.slug}`;
  const vars = {
    '--bg': template.palette.bg,
    '--ink': template.palette.ink,
    '--a': template.palette.accent,
    '--s': template.palette.soft,
  } as CSSProperties;

  const events = SAMPLE_EVENTS[template.category];
  const guestbookHeading = preset.guestbook?.heading ?? 'Ucapan & Doa';

  return (
    <div className={styles.stage} style={vars} data-font={template.font}>
      <div className={styles.topBar}>
        <Link href="/templates" className={styles.backLink}>
          <ArrowLeft size={15} aria-hidden="true" /> {L.back}
        </Link>
        <span className={styles.topMeta}>
          {template.name} · {templateCategoryLabels[template.category][locale === 'en' ? 'en' : 'id']}
          <span className={styles.tierTag} data-tier={template.tier}>
            {L.tiers[template.tier]}
          </span>
        </span>
        <Link href={useHref} className={styles.topUse}>
          {L.use}
        </Link>
      </div>

      <main className={styles.invite}>
        <section className={styles.cover} data-motif={template.motif}>
          <i className={styles.petals} aria-hidden="true" />
          <span className={styles.frame} aria-hidden="true" />
          <p className={styles.cEyebrow}>{template.sample.eyebrow}</p>
          <h1 className={styles.cNames}>{template.sample.names}</h1>
          <p className={styles.cDate}>{template.sample.date}</p>
          <span className={styles.scrollHint} aria-hidden="true">
            ▾
          </span>
        </section>

        {preset.settings?.openingCopy ? (
          <section className={styles.section}>
            {preset.greetings?.prayer ? <p className={styles.prayer}>{preset.greetings.prayer}</p> : null}
            <p className={styles.opening}>{preset.settings.openingCopy}</p>
          </section>
        ) : null}

        {preset.quote?.enabled && preset.quote.text ? (
          <section className={styles.section}>
            <p className={styles.quoteText}>“{preset.quote.text}”</p>
            {preset.quote.author ? <p className={styles.quoteAuthor}>{preset.quote.author}</p> : null}
          </section>
        ) : null}

        <section className={styles.section}>
          <h2 className={styles.sTitle}>{L.events}</h2>
          {events.map((event) => (
            <div key={event.title} className={styles.eventCard}>
              <h3 className={styles.eventTitle}>{event.title}</h3>
              <p className={styles.eventTime}>{event.time}</p>
              <p className={styles.eventVenue}>{event.venue}</p>
              <p className={styles.eventAddr}>{event.address}</p>
            </div>
          ))}
        </section>

        {preset.story?.enabled ? (
          <section className={styles.section}>
            <h2 className={styles.sTitle}>{L.story}</h2>
            <div className={styles.timeline}>
              {SAMPLE_STORY.map((item) => (
                <div key={item.title} className={styles.tItem}>
                  <p className={styles.tDate}>{item.date}</p>
                  <p className={styles.tTitle}>{item.title}</p>
                  <p className={styles.tBody}>{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {preset.gallery?.enabled ? (
          <section className={styles.section}>
            <h2 className={styles.sTitle}>{L.gallery}</h2>
            <div className={styles.gallery}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles.ph} aria-hidden="true" />
              ))}
            </div>
          </section>
        ) : null}

        {preset.gift?.enabled ? (
          <section className={styles.section}>
            <h2 className={styles.sTitle}>{L.gift}</h2>
            {SAMPLE_GIFTS.map((gift) => (
              <div key={gift.label} className={styles.giftCard}>
                <p className={styles.giftLabel}>{gift.label}</p>
                <p className={styles.giftNumber}>{gift.number}</p>
                <p className={styles.giftHolder}>{gift.holder}</p>
              </div>
            ))}
          </section>
        ) : null}

        {preset.rsvp?.enabled !== false ? (
          <section className={styles.section}>
            <h2 className={styles.sTitle}>{L.rsvp}</h2>
            <div className={styles.rsvpForm}>
              <label className={styles.fLabel}>
                {L.name}
                <input className={styles.fInput} disabled placeholder="Nama tamu" />
              </label>
              <label className={styles.fLabel}>
                {L.attendance}
                <input className={styles.fInput} disabled placeholder={L.attending} />
              </label>
            </div>
            <p className={styles.demoNote}>{L.demoNote}</p>
          </section>
        ) : null}

        {preset.guestbook?.enabled !== false ? (
          <section className={styles.section}>
            <h2 className={styles.sTitle}>{guestbookHeading}</h2>
            <div className={styles.wishes}>
              {SAMPLE_WISHES.map((wish) => (
                <div key={wish.name} className={styles.wish}>
                  <p className={styles.wishName}>{wish.name}</p>
                  <p className={styles.wishText}>{wish.text}</p>
                </div>
              ))}
            </div>
            <p className={styles.demoNote}>{L.demoNote}</p>
          </section>
        ) : null}

        <footer className={styles.footer}>Undangan digital oleh Invitesion</footer>
      </main>

      <div className={styles.ctaBar}>
        <span className={styles.ctaText}>{L.ctaText}</span>
        <Link href={useHref} className={styles.ctaBtn}>
          {L.use} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
