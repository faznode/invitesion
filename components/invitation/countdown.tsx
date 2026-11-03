'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/invitation/calendar';

const UNITS = [
  { key: 'days', label: 'Hari' },
  { key: 'hours', label: 'Jam' },
  { key: 'minutes', label: 'Menit' },
  { key: 'seconds', label: 'Detik' },
] as const;

/**
 * Countdown to the primary event (B-008). The server renders it with the request time, so the first client render
 * is identical (no hydration mismatch) and the boxes keep a fixed size while the numbers change (no layout shift).
 * `role="timer"` is not announced on every tick; the label carries the whole-day summary for screen readers.
 */
export function Countdown({ target, initialNow, eventTitle, boxClassName }: { target: number; initialNow: number; eventTitle: string; boxClassName: string }) {
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = countdownParts(target, now);
  if (!parts) return null;

  return (
    <div role="timer" aria-label={`${parts.days} hari lagi menuju ${eventTitle}`} className="mt-8 grid grid-cols-4 gap-3 text-center">
      {UNITS.map((unit) => (
        <div key={unit.key} className={`rounded-2xl px-2 py-4 ${boxClassName}`}>
          <span className="block font-serif text-2xl tabular-nums sm:text-3xl" aria-hidden>
            {String(parts[unit.key]).padStart(2, '0')}
          </span>
          <span className="mt-1 block text-xs uppercase tracking-widest opacity-70" aria-hidden>
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
