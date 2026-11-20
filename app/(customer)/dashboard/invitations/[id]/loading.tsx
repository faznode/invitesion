import { getLocale, t } from '@/lib/locale-server';

export default async function InvitationLoading() {
  const locale = await getLocale();
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4 p-4 lg:p-8">
      <span className="sr-only">{t(locale, 'Memuat halaman undangan…', 'Loading the invitation page…')}</span>
      <div aria-hidden="true" className="h-8 w-56 max-w-full rounded-md bg-muted motion-safe:animate-pulse" />
      <div aria-hidden="true" className="h-4 w-80 max-w-full rounded bg-muted motion-safe:animate-pulse" />
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-xl bg-muted motion-safe:animate-pulse" />
        <div className="h-40 rounded-xl bg-muted motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
