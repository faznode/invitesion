import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { getLocale } from '@/lib/locale-server';
import { clerkAppearance, clerkLocalization } from '@/lib/auth/clerk-appearance';

export const metadata: Metadata = {
  title: 'Undangan Digital',
  description: 'Platform undangan digital Indonesia.',
};

export const viewport: Viewport = { maximumScale: 1 };
const manrope = Manrope({ subsets: ['latin'] });

/**
 * The `SWRConfig` fallback that used to live here is gone.
 *
 * It prefetched `getUser()` into an SWR cache key that **nothing consumed** — a
 * leftover from the saas-starter template. Harmless while sessions were a local
 * cookie read; not harmless once identity resolution means a Clerk session
 * lookup plus a database query, on every page render including
 * `/i/:slug/:guestSlug` — the public invitation page that receives a WhatsApp
 * blast to hundreds of guests at once. Removing it takes that cost off the hot
 * path entirely rather than optimising it.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    // Appearance and copy are passed once here rather than on each Clerk
    // component, so the hosted forms cannot drift from the rest of the product.
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization(locale)}>
      <html
        lang={locale}
        className={`bg-background text-foreground ${manrope.className}`}
        style={{ colorScheme: 'light' }}
      >
        <body className="min-h-[100dvh] bg-background text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  );
}
