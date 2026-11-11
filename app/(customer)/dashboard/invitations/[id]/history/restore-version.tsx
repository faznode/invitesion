'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw } from 'lucide-react';

/** Each refusal in the owner's words, with what to do next. */
const REFUSALS: Record<string, string> = {
  VERSION_CONFLICT: 'Undangan baru saja berubah di tab atau perangkat lain. Muat ulang halaman ini, lalu coba lagi.',
  ALREADY_CURRENT: 'Versi ini sudah menjadi versi saat ini.',
  UNRESTORABLE: 'Versi ini tidak bisa dipulihkan karena isinya tidak lagi sesuai format undangan saat ini.',
  INVALID_MEDIA: 'Versi ini memakai foto yang sudah dihapus atau tidak boleh dipakai di sini, jadi tidak bisa dipulihkan.',
  THEME_NOT_ENTITLED: 'Versi ini memakai tema yang tidak termasuk paket undangan ini, jadi tidak bisa dipulihkan.',
  SAVE_UNCONFIRMED: 'Pemulihan belum bisa dipastikan. Muat ulang halaman untuk melihat versi terbaru sebelum mencoba lagi.',
  UNAUTHENTICATED: 'Sesi berakhir. Masuk lagi, lalu coba lagi.',
};

/**
 * G-046: restores one older version after an explicit confirmation. The request names the version the page showed as
 * current, so a page left open while the invitation changed elsewhere is refused (409) instead of overwriting the newer
 * work. The outcome is announced in a polite live region; on success the page reloads its list from the server.
 */
export function RestoreVersion({ invitationId, versionNo, currentVersion }: { invitationId: number; versionNo: number; currentVersion: number }) {
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy'>('idle');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (step === 'confirm') confirmButton.current?.focus();
  }, [step]);

  async function restore() {
    setStep('busy');
    setMessage(null);
    try {
      const response = await fetch(`/api/invitations/${invitationId}/versions/${versionNo}/restore`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expectedVersion: currentVersion }),
      });
      const body = await response.json().catch(() => null);
      if (response.ok) {
        setMessage({ tone: 'ok', text: `Versi ${versionNo} dipulihkan dan disimpan sebagai versi ${body?.version}.` });
        setStep('idle');
        router.refresh();
        return;
      }
      setMessage({ tone: 'error', text: REFUSALS[body?.error?.code] ?? 'Pemulihan gagal. Coba lagi.' });
    } catch {
      setMessage({ tone: 'error', text: 'Koneksi terputus. Periksa internet, lalu coba lagi.' });
    }
    setStep('idle');
    startButton.current?.focus();
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {step === 'confirm' ? (
        <div role="group" aria-label={`Pulihkan versi ${versionNo}?`} className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Pulihkan versi {versionNo}?</span>
          <button
            ref={confirmButton}
            type="button"
            onClick={restore}
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Ya, pulihkan
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('idle');
              requestAnimationFrame(() => startButton.current?.focus());
            }}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          ref={startButton}
          type="button"
          onClick={() => setStep('confirm')}
          disabled={step === 'busy'}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
        >
          {step === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
          {step === 'busy' ? 'Memulihkan…' : 'Pulihkan versi ini'}
        </button>
      )}
      <p role="status" className={`min-h-5 text-pretty text-sm leading-5 ${message?.tone === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>
        {message?.text ?? ''}
      </p>
    </div>
  );
}
