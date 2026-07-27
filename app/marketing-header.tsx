'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Baby,
  BarChart3,
  BookOpen,
  Cake,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Contact,
  CreditCard,
  Gift,
  Globe2,
  GraduationCap,
  Heart,
  LayoutTemplate,
  Mail,
  Menu,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import styles from './home.module.css';
import type { Locale } from '@/lib/i18n';

type IconType = ComponentType<{ size?: number | string }>;
type MenuKey = 'acara' | 'fitur' | 'resource';
type MenuItem = { title: string; href: string; icon: IconType };
type MenuGroup = { title: string; items: MenuItem[] };
type MenuDef = { groups: MenuGroup[]; footer: { label: string; href: string } | null };

const LABELS = {
  id: {
    events: 'Jenis Acara', features: 'Fitur', resources: 'Resource', pricing: 'Harga',
    signIn: 'Masuk', cta: 'Coba gratis',
    allEvents: 'Lihat semua jenis acara', allFeatures: 'Lihat semua fitur',
    openNav: 'Buka navigasi', closeNav: 'Tutup navigasi', langAria: 'Pilih bahasa',
  },
  en: {
    events: 'Event Types', features: 'Features', resources: 'Resources', pricing: 'Pricing',
    signIn: 'Sign in', cta: 'Try it free',
    allEvents: 'See all event types', allFeatures: 'See all features',
    openNav: 'Open navigation', closeNav: 'Close navigation', langAria: 'Choose language',
  },
} as const;

/**
 * Every href below resolves to a real route: /event-types/[slug],
 * /features/[slug] and /resources/[slug] render from marketing-registry, and
 * unknown slugs fall through to Next's not-found page. No dead menus.
 */
function getMenus(locale: Locale): Record<MenuKey, MenuDef> {
  const id = locale === 'id';
  return {
    acara: {
      groups: [
        {
          title: id ? 'PERNIKAHAN' : 'WEDDINGS',
          items: [
            { title: id ? 'Pernikahan' : 'Weddings', href: '/event-types/weddings', icon: Heart },
            { title: id ? 'Anniversary pernikahan' : 'Wedding anniversaries', href: '/event-types/wedding-anniversaries', icon: Sparkles },
            { title: 'Bridal shower', href: '/event-types/bridal-showers', icon: Gift },
          ],
        },
        {
          title: id ? 'KELUARGA' : 'FAMILY',
          items: [
            { title: id ? 'Ulang tahun' : 'Birthdays', href: '/event-types/birthdays', icon: Cake },
            { title: 'Aqiqah & Khitanan', href: '/event-types/aqiqah-and-khitanan', icon: Star },
            { title: 'Baby shower', href: '/event-types/baby-showers', icon: Baby },
          ],
        },
        {
          title: id ? 'KOMUNITAS' : 'COMMUNITY',
          items: [
            { title: id ? 'Reuni' : 'Reunions', href: '/event-types/reunions', icon: Users },
            { title: id ? 'Wisuda' : 'Graduations', href: '/event-types/graduations', icon: GraduationCap },
            { title: id ? 'Kumpul hari raya' : 'Holiday gatherings', href: '/event-types/holiday-gatherings', icon: CalendarDays },
          ],
        },
      ],
      footer: { label: LABELS[locale].allEvents, href: '/event-types' },
    },
    fitur: {
      groups: [
        {
          title: id ? 'UNDANGAN' : 'INVITATIONS',
          items: [
            { title: id ? 'Undangan online' : 'Online invitations', href: '/features/online-invitations', icon: Mail },
            { title: id ? 'Halaman acara' : 'Event website builder', href: '/features/event-website-builder', icon: LayoutTemplate },
            { title: id ? 'Multi-bahasa' : 'Multi-language', href: '/features/multi-language', icon: Globe2 },
          ],
        },
        {
          title: id ? 'TAMU & RSVP' : 'GUESTS & RSVP',
          items: [
            { title: id ? 'RSVP online' : 'Online RSVPs', href: '/features/online-rsvps', icon: CheckCircle2 },
            { title: id ? 'Manajemen tamu' : 'Guest list management', href: '/features/guest-list-management', icon: Users },
            { title: id ? 'RSVP kode QR' : 'QR code RSVPs', href: '/features/qr-code-rsvps', icon: QrCode },
          ],
        },
        {
          title: id ? 'OPERASIONAL' : 'OPERATIONS',
          items: [
            { title: id ? 'Komunikasi email' : 'Email communications', href: '/features/email-communications', icon: Send },
            { title: id ? 'Pembayaran' : 'Payment processing', href: '/features/payment-processing', icon: CreditCard },
            { title: id ? 'Analitik & laporan' : 'Analytics & reporting', href: '/features/analytics-and-reporting', icon: BarChart3 },
          ],
        },
      ],
      footer: { label: LABELS[locale].allFeatures, href: '/features' },
    },
    resource: {
      groups: [
        {
          title: 'RESOURCE',
          items: [
            { title: id ? 'Pusat bantuan' : 'Help Center', href: '/resources/help-center', icon: CircleHelp },
            { title: 'FAQ', href: '/resources/faq', icon: BookOpen },
            { title: id ? 'Privasi & keamanan' : 'Privacy & security', href: '/resources/privacy-and-security', icon: ShieldCheck },
            { title: id ? 'Kontak' : 'Contact', href: 'mailto:hello@invitesion.id', icon: Contact },
          ],
        },
      ],
      footer: null,
    },
  };
}

function LocaleSwitch({ locale, ariaLabel }: { locale: Locale; ariaLabel: string }) {
  const set = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `locale-pref=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  };
  return (
    <div className={styles.langSwitch} role="group" aria-label={ariaLabel}>
      <button type="button" className={locale === 'id' ? styles.langOn : undefined} aria-pressed={locale === 'id'} onClick={() => set('id')}>ID</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={locale === 'en' ? styles.langOn : undefined} aria-pressed={locale === 'en'} onClick={() => set('en')}>EN</button>
    </div>
  );
}

export default function MarketingHeader({ locale = 'id' }: { locale?: Locale }) {
  const [open, setOpen] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const L = LABELS[locale];
  const menus = getMenus(locale);

  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };
  const openMenu = (key: MenuKey) => { cancelClose(); setOpen(key); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); setMobileOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const menuEntries: Array<[MenuKey, string]> = [
    ['acara', L.events],
    ['fitur', L.features],
    ['resource', L.resources],
  ];

  return (
    <header className={styles.marketingHeader}>
      <nav className={styles.nav} aria-label="Main">
        <Link href="/" className={styles.logo} onClick={() => setOpen(null)}>invitesion<b>.</b></Link>

        <div className={styles.desktopNav} onMouseLeave={scheduleClose}>
          {menuEntries.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={open === key ? styles.navActive : undefined}
              aria-expanded={open === key}
              onMouseEnter={() => openMenu(key)}
              onFocus={() => openMenu(key)}
              onClick={() => setOpen(open === key ? null : key)}
            >
              {label} <ChevronDown size={14} />
            </button>
          ))}
          <Link href="/pricing" onClick={() => setOpen(null)}>{L.pricing}</Link>
        </div>

        <div className={styles.navRight}>
          <LocaleSwitch locale={locale} ariaLabel={L.langAria} />
          <Link href="/sign-in" className={styles.login}>{L.signIn}</Link>
          <Link href="/sign-up" className={styles.primaryBtn}>{L.cta} <ArrowRight size={15} /></Link>
          <button
            type="button"
            className={styles.mobileToggle}
            aria-label={mobileOpen ? L.closeNav : L.openNav}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open !== null && (
        <>
          <div className={styles.megaBackdrop} onClick={() => setOpen(null)} />
          <div className={styles.dropdownPanel} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <div className={styles.dropdownInner}>
              <div className={styles.dropdownGroups}>
                {menus[open].groups.map((group) => (
                  <div key={group.title}>
                    <h4>{group.title}</h4>
                    <div className={styles.groupLinks}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} className={styles.megaLink} onClick={() => setOpen(null)}>
                            <span className={styles.megaIcon}><Icon size={15} /></span>
                            <b>{item.title}</b>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {menus[open].footer && (
                <div className={styles.dropdownFooter}>
                  <Link href={menus[open].footer!.href} onClick={() => setOpen(null)}>
                    {menus[open].footer!.label} <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {mobileOpen && (
        <div className={styles.mobileDrawer}>
          {menuEntries.map(([key, label]) => (
            <div key={key} className={styles.mobileGroup}>
              <h4>{label}</h4>
              {menus[key].groups.flatMap((g) => g.items).map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.title}</Link>
              ))}
            </div>
          ))}
          <div className={styles.mobileGroup}>
            <h4>{L.pricing}</h4>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>{L.pricing}</Link>
          </div>
          <div className={styles.mobileActions}>
            <LocaleSwitch locale={locale} ariaLabel={L.langAria} />
            <Link href="/sign-in" onClick={() => setMobileOpen(false)}>{L.signIn}</Link>
            <Link href="/sign-up" className={styles.primaryBtn} onClick={() => setMobileOpen(false)}>{L.cta} <ArrowRight size={15} /></Link>
          </div>
        </div>
      )}
    </header>
  );
}
