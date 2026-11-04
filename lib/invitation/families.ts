/**
 * Design families (B-030, template system v2): trusted layout code that renders the same invitation content as the
 * legacy page through the content contract, with its own composition. A family is opt-in per invitation
 * (`theme.familyId`); a missing or unknown id keeps the legacy layout, so retiring a family never breaks a stored
 * invitation. Families use only palette tokens (B-016) and the two self-hosted fonts.
 */
export const FAMILY_IDS = ['gapura', 'kartu', 'riang'] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

type Label = { id: string; en: string };

export type FamilyMeta = {
  id: FamilyId;
  name: string;
  /** What the composition is designed around; every family still renders every event type. */
  intendedFor: 'wedding' | 'celebration';
  /** Manifest motion level: 0 none, 1 entrance fades (switched off under prefers-reduced-motion). */
  motionLevel: 0 | 1;
  summary: Label;
};

export const FAMILIES: Record<FamilyId, FamilyMeta> = {
  gapura: {
    id: 'gapura',
    name: 'Gapura',
    intendedFor: 'wedding',
    motionLevel: 1,
    summary: {
      id: 'Simetris dan khidmat: sampul, kartu acara, dan formulir berada di dalam lengkung gapura.',
      en: 'Symmetric and ceremonial: the cover, event cards and forms sit inside gate arches.',
    },
  },
  kartu: {
    id: 'kartu',
    name: 'Kartu',
    intendedFor: 'wedding',
    motionLevel: 0,
    summary: {
      id: 'Tumpukan kartu cetak yang asimetris; setiap acara tampil sebagai tiket berperforasi.',
      en: 'An asymmetric stack of printed cards; each event appears as a perforated ticket.',
    },
  },
  riang: {
    id: 'riang',
    name: 'Riang',
    intendedFor: 'celebration',
    motionLevel: 1,
    summary: {
      id: 'Pita warna selebar layar, tanggal bergaya kalender, dan umbul-umbul untuk ulang tahun, syukuran, dan acara kantor.',
      en: 'Full-width tinted bands, calendar-tile dates and bunting for birthdays, thanksgivings and company events.',
    },
  },
};

export function familyOf(id?: string | null): FamilyMeta | null {
  return id && (FAMILY_IDS as readonly string[]).includes(id) ? FAMILIES[id as FamilyId] : null;
}
