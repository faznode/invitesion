'use client';

import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';

const COPY = {
  id: {
    title: 'Halaman ini gagal dimuat',
    body: 'Terjadi kendala saat memuat data. Menu dasbor tetap bisa dipakai; coba muat ulang bagian ini.',
    retry: 'Coba lagi',
    reference: 'Kode rujukan',
  },
  en: {
    title: 'This page failed to load',
    body: 'Something went wrong while loading the data. The dashboard menu still works; try loading this part again.',
    retry: 'Try again',
    reference: 'Reference code',
  },
} as const;

type Language = keyof typeof COPY;

const subscribe = () => () => {};
const documentLanguage = (): Language => (document.documentElement.lang === 'en' ? 'en' : 'id');
const serverLanguage = (): Language => 'id';

export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  const copy = COPY[useSyncExternalStore(subscribe, documentLanguage, serverLanguage)];
  const digest = error instanceof Error && 'digest' in error && typeof error.digest === 'string' ? error.digest : null;
  return (
    <section aria-labelledby="dashboard-error-title" className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center text-card-foreground shadow-sm">
        <h1 id="dashboard-error-title" className="text-balance text-lg font-semibold">
          {copy.title}
        </h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        {digest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {copy.reference}: <code>{digest}</code>
          </p>
        ) : null}
        <Button className="mt-6" onClick={() => retry()}>
          {copy.retry}
        </Button>
      </div>
    </section>
  );
}
