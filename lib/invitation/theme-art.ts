import type { InvitationTemplate, TemplateCategory, TemplateMotif } from './templates';

/**
 * Kurasi aset foto per tema — semua dari Unsplash (Unsplash License:
 * gratis untuk komersial, tanpa atribusi). Foto tidak disimpan di repo,
 * melainkan di-hotlink dari CDN Unsplash via endpoint download resmi.
 *
 * Prinsip art direction:
 * - Setiap tema dipetakan ke satu “mood pool” (floral, night, batik, dst.)
 *   lewat slug spesifik → motif → kategori, agar tidak ada tema tanpa seni.
 * - Foto SELALU dirender di bawah lapisan tint palet tema (lihat
 *   preview.module.css), sehingga 47 tema tetap punya bahasa visual sendiri
 *   meski berbagi pool aset.
 */

export type ThemeArt = {
  cover: string;
  gallery: string[];
};

// URL dirakit dari potongan agar tidak dirusak linkifier saat transfer file.
const asset = (id: string, width = 1200): string =>
  ['https:', '//unsplash.com/photos/', id, '/download?force=true&w=', String(width)].join('');

type Pool = { cover: string; gallery: string[] };

const POOLS = {
  /** Buket pengantin, mawar putih, bunga segar. */
  floral: {
    cover: 'M9plHtqtooo',
    gallery: ['y6Qj8MmFn_Y', 'jziexf1zCpE', 'U-ouhtPgHH4', 'LW5SptinceM', 'EqN9ZNTQL8A', 'M9plHtqtooo'],
  },
  /** Lukisan cat air — lembut, cocok untuk baby shower / aqiqah. */
  watercolor: {
    cover: 'EqN9ZNTQL8A',
    gallery: ['U-ouhtPgHH4', 'dYI8Zuq6NKw', 'EqN9ZNTQL8A', '3j1wHuGWyWo', 'y6Qj8MmFn_Y', 'LW5SptinceM'],
  },
  /** Bulan purnama, langit malam — tema selestial. */
  night: {
    cover: 've_uN9V8xqU',
    gallery: ['9ETLKjGT23s', 'gy_aWlGJ3OI', 've_uN9V8xqU', 'Z06J1uXTmE4', 'V9MbvZdcjrA', 'ZsmGM195K1w'],
  },
  /** Dedaunan tropis gelap — Bali, kebun, rimbun. */
  tropics: {
    cover: 'Z06J1uXTmE4',
    gallery: ['Xb-6me_7ppI', 'aTEZUXCkCa0', 'NY8rjKmuXKA', 'Zsq1vCXdkEY', 'Vi_I8vX65Hc', 'Z06J1uXTmE4'],
  },
  /** Kain batik Indonesia asli — sogan, parang, mega mendung. */
  batik: {
    cover: 'rIaTxHPwPQs',
    gallery: ['N7RwH3-iG-c', 'fCwagrCDsXE', 'Je5LAz-fTxk', '_udDObpRQeE', 'FAouwi10XCc', 'rIaTxHPwPQs'],
  },
  /** Dried flowers, pampas, nuansa boho krem. */
  boho: {
    cover: '3pR7d-tIRx8',
    gallery: ['3j1wHuGWyWo', 'LW5SptinceM', 'Fwvpv1SYeOo', '3pR7d-tIRx8', 'dYI8Zuq6NKw', 'Zsq1vCXdkEY'],
  },
  /** Balon pastel, kue, pesta ceria. */
  party: {
    cover: 'Hli3R6LKibo',
    gallery: ['egBDGW-fgF0', '2uEIkDj1ZkE', 'YX0rzQ-N6rc', 'a_vaToRnvPs', '5eRjQXca4ro', 'Hli3R6LKibo'],
  },
  /** Ballroom, lampu gantung — elegan formal. */
  elegant: {
    cover: 'V9MbvZdcjrA',
    gallery: ['ZsmGM195K1w', 'EJQnHC6GEe8', 'V9MbvZdcjrA', 've_uN9V8xqU', 'y6Qj8MmFn_Y', 'M9plHtqtooo'],
  },
} satisfies Record<string, Pool>;

type PoolKey = keyof typeof POOLS;

/** Override per tema signature — pasangan seni paling pas. */
const SLUG_POOLS: Record<string, PoolKey> = {
  'melati-suci': 'floral',
  'garden-rose': 'floral',
  'batik-kencana': 'batik',
  'frangipani-bali': 'tropics',
  'vine-ivy': 'tropics',
  'teratai-subuh': 'night',
  'pearl-koi': 'night',
  'bunga-kering': 'boho',
  'kurma-oasis': 'boho',
  'marigold-fiesta': 'party',
};

const MOTIF_POOLS: Partial<Record<TemplateMotif, PoolKey>> = {
  stars: 'night',
  crescent: 'night',
  waves: 'night',
  botanical: 'tropics',
  confetti: 'party',
  balloons: 'party',
  deco: 'elegant',
};

const CATEGORY_POOLS: Record<TemplateCategory, PoolKey> = {
  wedding: 'floral',
  anniversary: 'elegant',
  'bridal-shower': 'watercolor',
  birthday: 'party',
  'aqiqah-khitanan': 'watercolor',
  syukuran: 'boho',
  'baby-shower': 'watercolor',
  graduation: 'elegant',
  reunion: 'party',
  'holiday-gathering': 'tropics',
  corporate: 'elegant',
};

export function getThemeArt(
  template: Pick<InvitationTemplate, 'slug' | 'category' | 'motif'>,
): ThemeArt {
  const key: PoolKey =
    SLUG_POOLS[template.slug] ??
    MOTIF_POOLS[template.motif] ??
    CATEGORY_POOLS[template.category] ??
    'floral';
  const pool = POOLS[key];
  return {
    cover: asset(pool.cover, 1400),
    gallery: pool.gallery.map((id) => asset(id, 800)),
  };
}
