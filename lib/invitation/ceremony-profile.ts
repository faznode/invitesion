import type { DetailConfig } from './detail-config';
import type { Portrait } from './portraits';

/**
 * B-029 (G-033): the profile an aqiqah, khitanan or tasyakuran host typed (the "ceremony blocks"), rendered when filled.
 * `buildGuestView()` passes the stored fields; this module keeps, per event type, exactly the fields that type's editor
 * tab offers, so a value left from another ceremony type never reaches the page. Values are trimmed, blanks dropped and
 * calendar dates formatted as written. The host's own words (doa, catatan, pesan syukur) are shown as typed: the product
 * adds no religious wording (ADR-O04). s20 (D-038): the honouree's photo, decided by `ceremonyPortrait` (children's
 * privacy rule), is passed in and shown above the facts; a photo alone is enough for the section.
 */
type StoredProfile = NonNullable<DetailConfig['ceremonyProfile']>;

export type CeremonyProfileInput = Omit<StoredProfile, 'photoUrl' | 'showPhoto'>;
export type ProfileRow = { label: string; value: string };
export type ProfileText = { label: string; text: string };
export type CeremonyProfile = { heading: string; rows: ProfileRow[]; texts: ProfileText[]; portrait?: Portrait };

export const CEREMONY_EVENT_TYPES = ['aqiqah', 'khitanan', 'tasyakuran'] as const;
export type CeremonyEventType = (typeof CEREMONY_EVENT_TYPES)[number];

export function isCeremonyEventType(value: string): value is CeremonyEventType {
  return (CEREMONY_EVENT_TYPES as readonly string[]).includes(value);
}

const GENDER_LABELS = { male: 'Laki-laki', female: 'Perempuan' } as const;

/** The editor's names for the thanksgiving categories (`editor.tsx`, tasyakuran tab). */
export const THANKSGIVING_LABELS = {
  housewarming: 'Rumah baru',
  promotion: 'Naik jabatan',
  graduation: 'Kelulusan / wisuda',
  new_business: 'Usaha baru',
  hajj_umrah: 'Haji / umrah',
  other: 'Lainnya',
} as const;

type ThanksgivingCategory = keyof typeof THANKSGIVING_LABELS;

/** What the achievement field holds for each category, as the editor labels it. */
function achievementLabel(category: ThanksgivingCategory | undefined): string {
  if (category === 'housewarming') return 'Alamat rumah baru';
  if (category === 'promotion') return 'Jabatan & instansi';
  if (category === 'graduation') return 'Institusi & gelar';
  if (category === 'new_business') return 'Nama / jenis usaha';
  return 'Pencapaian';
}

const filled = (value: string | undefined) => value?.trim() || undefined;

/** "3 Oktober 2026" for a stored calendar date (YYYY-MM-DD). A date has no zone, so it is shown exactly as written. */
export function formatPlainDate(value: string | undefined): string | undefined {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const at = new Date(Date.UTC(year, month - 1, day));
  if (at.getUTCFullYear() !== year || at.getUTCMonth() !== month - 1 || at.getUTCDate() !== day) return undefined;
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(at);
}

/** The profile for this event type with blank values dropped; null for other event types or when nothing is filled. */
export function ceremonyProfileOf(eventType: string, input: CeremonyProfileInput | undefined, portrait?: Portrait | null): CeremonyProfile | null {
  if (!input || !isCeremonyEventType(eventType)) return null;
  const rows: ProfileRow[] = [];
  const texts: ProfileText[] = [];
  const row = (label: string, value: string | undefined) => {
    if (value) rows.push({ label, value });
  };
  const text = (label: string, value: string | undefined) => {
    const trimmed = filled(value);
    if (trimmed) texts.push({ label, text: trimmed });
  };

  const honouree = filled(input.honoureeName);
  const nickName = filled(input.nickName);
  // The headline shows the nickname when there is one (`headline.ts`), so the full name is listed only then.
  const fullName = honouree && nickName && honouree !== nickName ? honouree : undefined;
  const parents = [filled(input.fatherName), filled(input.motherName)].filter(Boolean).join(' & ') || filled(input.parents);

  if (eventType === 'aqiqah') {
    row('Nama lengkap', fullName);
    row('Jenis kelamin', input.gender ? GENDER_LABELS[input.gender] : undefined);
    row('Urutan', input.childOrder ? `Anak ke-${input.childOrder}` : undefined);
    const born = [filled(input.birthPlace), formatPlainDate(input.birthDate)].filter(Boolean).join(', ');
    const time = filled(input.birthTime);
    row('Lahir', born && time ? `${born}, pukul ${time}` : born || (time ? `Pukul ${time}` : undefined));
    row('Berat lahir', filled(input.birthWeight));
    row('Panjang lahir', filled(input.birthLength));
    row('Orang tua', parents);
    text('Arti nama', input.nameMeaning);
    text('Doa & harapan', input.prayer);
  } else if (eventType === 'khitanan') {
    row('Nama lengkap', fullName);
    row('Usia', input.age ? `${input.age} tahun` : undefined);
    row('Sekolah', filled(input.school));
    row('Tanggal khitan', formatPlainDate(input.circumcisionDate));
    row('Orang tua', parents);
    text('Doa & harapan', input.prayer);
    text('Catatan', input.recoveryNote);
  } else {
    const category = input.thanksgivingCategory;
    row('Acara', filled(input.thanksgivingTitle));
    row('Jenis syukuran', category ? THANKSGIVING_LABELS[category] : undefined);
    row(achievementLabel(category), filled(input.achievement));
    text('Pesan syukur', input.ceremonyNote);
  }

  if (!rows.length && !texts.length && !portrait) return null;
  return { heading: eventType === 'tasyakuran' ? 'Tentang Syukuran' : 'Tentang Ananda', rows, texts, ...(portrait && { portrait }) };
}
