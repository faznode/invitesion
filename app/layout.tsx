import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope, Instrument_Serif } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { getLocale } from '@/lib/locale-server';
import { clerkAppearance, clerkLocalization } from '@/lib/auth/clerk-appearance';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Invitesion — Undangan Pernikahan Digital: Buat, Sebar & Kelola RSVP',
  description:
    'Platform undangan pernikahan digital Indonesia. Pilih tema, isi detail acara, sebar ke WhatsApp, dan pantau RSVP tamu secara real-time. Bayar sekali mulai Rp149.000.',
  openGraph: {
    title: 'Invitesion — Undangan Pernikahan Digital',
    description:
      'Undangan digital yang hidup. Tema premium, RSVP online, sebar via WhatsApp. Bayar sekali, aktif 12 bulan.',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invitesion — Undangan Pernikahan Digital',
    description: 'Undangan digital yang hidup. Tema premium, RSVP online, sebar via WhatsApp.',
  },
};

// maximumScale intentionally omitted — WCAG 1.4.4 requires pinch-zoom to remain enabled.
export const viewport: Viewport = { themeColor: '#e80053' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization(locale)}>
      <html
        lang={locale}
        className={`bg-background text-foreground ${manrope.variable} ${instrumentSerif.variable} ${manrope.className}`}
        style={{ colorScheme: 'light' }}
      >
        <body className="min-h-[100dvh] bg-background text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  );
}
