'use client';
import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import {
  ArrowRight, BarChart3, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, Contact,
  Heart, LayoutTemplate, Mail, Menu, MessageCircle,
  PartyPopper, QrCode, ShieldCheck, Sparkles, TicketCheck,
  Users, X, CreditCard, Globe2, BadgeCheck,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import styles from './home.module.css';

type MenuName = 'undangan' | 'fitur';
type Item = { title: string; note?: string; href: string; icon: React.ComponentType<{ size?: number }> };
type Group = { title: string; items: Item[] };
type MenuDef = { title: string; groups: Group[] };

/** Simple dropdown menus — appropriate for a focused wedding invitation product. */
const menus: Record<MenuName, MenuDef> = {
  undangan: {
    title: 'Tema & Acara',
    groups: [
      {
        title: 'PERNIKAHAN',
        items: [
          { title: 'Pernikahan', note: 'Tema eksklusif untuk hari istimewa', href: '/sign-up', icon: Heart },
          { title: 'Anniversary', note: 'Rayakan tahun ke-n bersama', href: '/sign-up', icon: Sparkles },
          { title: 'Bridal shower', note: 'Perayaan sebelum pernikahan', href: '/sign-up', icon: PartyPopper },
        ],
      },
      {
        title: 'MOMEN KELUARGA',
        items: [
          { title: 'Aqiqah & Khitanan', note: 'Tema islami & modern', href: '/sign-up', icon: Heart },
          { title: 'Syukuran', note: 'Perayaan penuh syukur', href: '/sign-up', icon: Sparkles },
          { title: 'Ulang tahun', note: 'Selebrasi semua usia', href: '/sign-up', icon: PartyPopper },
          { title: 'Reunian & Wisuda', note: 'Momen milestone', href: '/sign-up', icon: BookOpen },
        ],
      },
    ],
  },
  fitur: {
    title: 'Fitur',
    groups: [
      {
        title: 'UNDANGAN & TAMU',
        items: [
          { title: 'Halaman undangan', note: 'Tema, cerita, galeri & agenda', href: '/#fitur', icon: LayoutTemplate },
          { title: 'RSVP online', note: 'Konfirmasi kehadiran tanpa akun', href: '/#fitur', icon: CheckCircle2 },
          { title: 'Manajemen tamu', note: 'Daftar, status & tautan personal', href: '/#fitur', icon: Users },
          { title: 'Sebar via WhatsApp', note: 'Tautan personal per tamu', href: '/#cara-kerja', icon: MessageCircle },
        ],
      },
      {
        title: 'ACARA & KONTEN',
        items: [
          { title: 'Agenda & countdown', note: 'Jadwal acara real-time', href: '/#fitur', icon: CalendarDays },
          { title: 'Galeri foto & video', note: 'Upload & tampilkan kenangan', href: '/#fitur', icon: QrCode },
          { title: 'Amplop digital', note: 'Ucapan & kado cashless', href: '/#fitur', icon: Mail },
          { title: 'Multi-bahasa', note: 'Indonesia & English', href: '/#fitur', icon: Globe2 },
        ],
      },
      {
        title: 'KEPERCAYAAN',
        items: [
          { title: 'Privasi & keamanan', note: 'Data tamu terlindungi', href: '/#fitur', icon: ShieldCheck },
          { title: 'Pembayaran aman', note: 'QRIS & Stripe tersertifikasi', href: '/#fitur', icon: CreditCard },
          { title: 'Analitik kunjungan', note: 'Pantau tamu yang sudah buka', href: '/#fitur', icon: BarChart3 },
          { title: 'Bantuan & FAQ', note: 'Panduan dan dukungan', href: '/#fitur', icon: CircleHelp },
        ],
      },
    ],
  },
};

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(event: ReactKeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  if (event.key !== 'Tab' || !container) return;
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  if (!focusable.length) { event.preventDefault(); container.focus(); return; }
  const first = focusable[0], last = focusable[focusable.length - 1], active = document.activeElement;
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault(); first.focus();
  }
}

function DropdownPanel({ name, close }: { name: MenuName; close: () => void }) {
  const menu = menus[name];
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() =>
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    );
  }, [name]);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    trapFocus(event, dialogRef.current);
  };
  return (
    <div
      ref={dialogRef}
      id={`dropdown-${name}`}
      className={styles.dropdownPanel}
      role="dialog"
      aria-modal="true"
      aria-label={`Menu ${menu.title}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className={styles.dropdownInner}>
        <div className={styles.dropdownGroups}>
          {menu.groups.map(g => (
            <section key={g.title}>
              <h3>{g.title}</h3>
              <div className={styles.groupLinks}>
                {g.items.map(({ title, note, href, icon: Icon }) => (
                  <Link key={title} href={href} onClick={close} className={styles.megaLink}>
                    <span className={styles.megaIcon}><Icon size={18}/></span>
                    <span>
                      <strong>{title}</strong>
                      {note && <small>{note}</small>}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className={styles.dropdownFooter}>
          <Link href="/sign-up" className={styles.dropdownCta} onClick={close}>
            Mulai buat undangan <ArrowRight size={15}/>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketingHeader() {
  const [open, setOpen] = useState<MenuName | null>(null);
  const [mobile, setMobile] = useState(false);
  const triggerRefs = useRef<Record<MenuName, HTMLButtonElement | null>>({ undangan: null, fitur: null });
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const keyboardNav = useRef(false);

  const closeDesktop = useCallback(() => {
    setOpen(null);
    if (keyboardNav.current) requestAnimationFrame(() => activeRef.current?.focus());
  }, []);
  const closeMobile = useCallback(() => {
    setMobile(false);
    if (keyboardNav.current) requestAnimationFrame(() => mobileToggleRef.current?.focus());
  }, []);
  const closeAll = useCallback(() => { if (open) closeDesktop(); if (mobile) closeMobile(); }, [open, mobile, closeDesktop, closeMobile]);

  useEffect(() => {
    const locked = Boolean(open) || mobile;
    const prev = document.body.style.overflow;
    document.body.style.overflow = locked ? 'hidden' : prev;
    return () => { document.body.style.overflow = prev; };
  }, [open, mobile]);

  return (
    <header
      className={styles.marketingHeader}
      onPointerDownCapture={() => { keyboardNav.current = false; }}
      onKeyDownCapture={() => { keyboardNav.current = true; }}
    >
      <div className={styles.nav}>
        <Wordmark onClick={closeAll}/>

        <nav className={styles.desktopNav} aria-label="Navigasi utama">
          {(['undangan', 'fitur'] as MenuName[]).map(n => (
            <button
              key={n}
              ref={el => { triggerRefs.current[n] = el; }}
              className={open === n ? styles.navActive : ''}
              aria-expanded={open === n}
              aria-controls={`dropdown-${n}`}
              onClick={() => {
                activeRef.current = triggerRefs.current[n];
                setOpen(open === n ? null : n);
              }}
            >
              {menus[n].title} <ChevronDown size={14}/>
            </button>
          ))}
          <Link href="/pricing" onClick={closeAll}>Harga</Link>
        </nav>

        <div className={styles.navRight}>
          <Link href="/sign-in" className={styles.login}>Masuk</Link>
          <Link href="/sign-up" className={styles.outlineBtn}>Coba gratis</Link>
          <button
            ref={mobileToggleRef}
            className={styles.mobileToggle}
            aria-label={mobile ? 'Tutup navigasi' : 'Buka navigasi'}
            aria-expanded={mobile}
            onClick={() => { if (mobile) closeMobile(); else { setOpen(null); setMobile(true); } }}
          >
            {mobile ? <X size={21}/> : <Menu size={21}/>}
          </button>
        </div>
      </div>

      {/* Desktop dropdown */}
      {open && (
        <>
          <button className={styles.megaBackdrop} aria-label="Tutup menu" onClick={closeDesktop}/>
          <DropdownPanel name={open} close={closeDesktop}/>
        </>
      )}

      {/* Mobile drawer */}
      {mobile && (
        <div
          ref={mobileDrawerRef}
          id="mobile-navigation"
          className={styles.mobileDrawer}
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi seluler"
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); closeMobile(); return; }
            trapFocus(event, mobileDrawerRef.current);
          }}
        >
          <div className={styles.mobileActions}>
            <Link href="/sign-in" onClick={closeMobile}>Masuk</Link>
            <Link href="/sign-up" onClick={closeMobile}>Coba gratis</Link>
          </div>
          {(Object.keys(menus) as MenuName[]).map(n => (
            <details key={n} className={styles.mobileGroup}>
              <summary>{menus[n].title}<ChevronDown size={16}/></summary>
              <div>
                {menus[n].groups.flatMap(g => g.items).map(({ title, href, icon: Icon }, i) => (
                  <Link key={`${title}-${i}`} href={href} onClick={closeMobile}>
                    <Icon size={17}/><span>{title}</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <Link href="/pricing" className={styles.mobilePrice} onClick={closeMobile}>
            Harga <ArrowRight size={16}/>
          </Link>
          <div className={styles.mobileActionsBottom}>
            <a href="mailto:hello@invitesion.id" className={styles.mobileContact}>
              <Contact size={15}/> hello@invitesion.id
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
