/**
 * Event dates and times in the event's own zone, whatever zone the server runs in (B-004, QA-002).
 *
 * `startAt` / `endAt` are ISO strings with an offset (`detail-config.ts` requires `{ offset: true }`). The offset
 * the host saved is the zone the event happens in: +07:00 WIB, +08:00 WITA, +09:00 WIT. A UTC ("Z") value falls
 * back to the invitation's `eventOperations.timezone` when it names an Indonesian zone, else Asia/Jakarta. Any
 * other offset is shown as wall-clock time at that offset with a "UTC±hh:mm" label rather than a wrong local label.
 */

export const INDONESIAN_ZONES = {
  'Asia/Jakarta': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
} as const;

export type IndonesianZone = keyof typeof INDONESIAN_ZONES;

const ZONE_BY_OFFSET: Record<string, IndonesianZone> = {
  '+07:00': 'Asia/Jakarta',
  '+08:00': 'Asia/Makassar',
  '+09:00': 'Asia/Jayapura',
};

type Resolved = { date: Date; timeZone: string; label: string };

function isIndonesianZone(value: string | null | undefined): value is IndonesianZone {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(INDONESIAN_ZONES, value as string);
}

function resolve(value: string | undefined | null, fallbackZone?: string | null): Resolved | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offset = value.match(/([+-]\d{2}):?(\d{2})$/);
  if (offset) {
    const key = `${offset[1]}:${offset[2]}`;
    const zone = ZONE_BY_OFFSET[key];
    if (zone) return { date, timeZone: zone, label: INDONESIAN_ZONES[zone] };
    const minutes = (Math.abs(Number(offset[1])) * 60 + Number(offset[2])) * (offset[1].startsWith('-') ? -1 : 1);
    return { date: new Date(date.getTime() + minutes * 60_000), timeZone: 'UTC', label: `UTC${key}` };
  }
  const zone: IndonesianZone = isIndonesianZone(fallbackZone) ? fallbackZone : 'Asia/Jakarta';
  return { date, timeZone: zone, label: INDONESIAN_ZONES[zone] };
}

/** "Sabtu, 21 November 2026" in the event's zone, or null for a missing / invalid value. */
export function formatEventDate(value?: string | null, fallbackZone?: string | null): string | null {
  const resolved = resolve(value, fallbackZone);
  if (!resolved) return null;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: resolved.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(resolved.date);
}

export type EventDateParts = { weekday: string; day: string; month: string; monthShort: string; year: string };

/** Weekday, day, month and year in the event's zone, for date tiles; null for a missing / invalid value. */
export function eventDateParts(value?: string | null, fallbackZone?: string | null): EventDateParts | null {
  const resolved = resolve(value, fallbackZone);
  if (!resolved) return null;
  const parts = (options: Intl.DateTimeFormatOptions) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('id-ID', { timeZone: resolved.timeZone, ...options }).formatToParts(resolved.date).map((part) => [part.type, part.value]),
    );
  const long = parts({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return { weekday: long.weekday, day: long.day, month: long.month, monthShort: parts({ month: 'short' }).month.replace('.', ''), year: long.year };
}

/** "08.00 WIB" in the event's zone, or null for a missing / invalid value. */
export function formatEventTime(value?: string | null, fallbackZone?: string | null): string | null {
  const resolved = resolve(value, fallbackZone);
  if (!resolved) return null;
  const time = new Intl.DateTimeFormat('id-ID', { timeZone: resolved.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(resolved.date);
  return `${time} ${resolved.label}`;
}
