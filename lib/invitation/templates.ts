import { detailConfigSchema, type DetailConfig } from './detail-config';

/**
 * Invitation template catalog.
 *
 * Competitor scan (Jul 2026 — WebNikah, Wevitation, Satumomen, Katsudoto,
 * Paperless Post, Greenvelope): local players win on catalog breadth and
 * category filters, global players on strong per-theme art direction and
 * style filters. This catalog does both — broad, filterable, and every
 * template is an opinionated art direction instead of a palette swap.
 *
 * The contract with the backend is deliberately boring: every entry is plain
 * JSON-serialisable data, and `preset` is validated through
 * `detailConfigSchema` at module load, so it can be copied straight into the
 * invitation `config` column and the public renderer picks it up with zero
 * extra wiring. `id` maps to `config.theme.templateId` and `paletteId` to
 * `config.theme.paletteId` — every palette id below is also registered in
 * `components/invitation/public-renderer.tsx`.
 */

export type TemplateCategory =
  | 'wedding'
  | 'anniversary'
  | 'bridal-shower'
  | 'birthday'
  | 'aqiqah-khitanan'
  | 'syukuran'
  | 'baby-shower'
  | 'graduation'
  | 'reunion'
  | 'holiday-gathering'
  | 'corporate';

export type TemplateStyleTag =
  | 'elegant'
  | 'minimal'
  | 'floral'
  | 'boho'
  | 'luxury'
  | 'playful'
  | 'islamic'
  | 'vintage'
  | 'modern'
  | 'illustrated'
  | 'bold'
  | 'watercolor';

/** Drives the pure-CSS ornament on the catalog preview card. */
export type TemplateMotif =
  | 'arch'
  | 'floral'
  | 'deco'
  | 'confetti'
  | 'stars'
  | 'waves'
  | 'monogram'
  | 'botanical'
  | 'crescent'
  | 'geometric'
  | 'balloons'
  | 'rings';

export type TemplateTier = 'free' | 'premium' | 'signature';
export type TemplateFont = 'serif' | 'sans';

export type TemplatePalette = { bg: string; ink: string; accent: string; soft: string };

/** Hex mirrors of the renderer palettes, used for the pure-CSS catalog previews. */
export const templatePalettes: Record<string, TemplatePalette> = {
  ivory: { bg: '#faf7f2', ink: '#3f3a34', accent: '#a1743c', soft: '#f1e9dd' },
  'rose-gold': { bg: '#fdf6f4', ink: '#453437', accent: '#b76e79', soft: '#f7e4e3' },
  confetti: { bg: '#fef8f3', ink: '#3b3340', accent: '#e2653f', soft: '#fde5d6' },
  sage: { bg: '#f5f8f4', ink: '#34403a', accent: '#5f7d63', soft: '#e3ede2' },
  sand: { bg: '#faf7f0', ink: '#403a30', accent: '#9a7a4f', soft: '#efe6d5' },
  slate: { bg: '#f6f7f9', ink: '#2b3138', accent: '#3f6fa8', soft: '#e5eaf1' },
  midnight: { bg: '#101526', ink: '#e8e9f2', accent: '#d3b16a', soft: '#1c2338' },
  terracotta: { bg: '#faf3ee', ink: '#41332c', accent: '#bd5f34', soft: '#f3e0d3' },
  orchid: { bg: '#faf6fb', ink: '#3d3242', accent: '#8e5a9e', soft: '#efe0f2' },
  emerald: { bg: '#f2f7f4', ink: '#22352b', accent: '#1f6f50', soft: '#dcebe2' },
  dusk: { bg: '#f6f4f9', ink: '#33303f', accent: '#6a5acd', soft: '#e6e1f2' },
  mocha: { bg: '#f9f5f1', ink: '#3c332c', accent: '#8a6248', soft: '#eee2d7' },
  ocean: { bg: '#f3f8fa', ink: '#27353d', accent: '#2a7f9e', soft: '#dcedf2' },
  blossom: { bg: '#fdf5f6', ink: '#43333a', accent: '#d26d85', soft: '#f8e2e7' },
  'gold-noir': { bg: '#171310', ink: '#f1e9dc', accent: '#caa353', soft: '#262019' },
  lavender: { bg: '#f8f6fc', ink: '#3a3547', accent: '#7d6bb3', soft: '#ebe5f6' },
  mint: { bg: '#f3faf6', ink: '#2c3b33', accent: '#3e8e6b', soft: '#def0e6' },
  sunshine: { bg: '#fffaf0', ink: '#3f3626', accent: '#d98e04', soft: '#fdedcb' },
};

export const templateCategoryLabels: Record<TemplateCategory, { id: string; en: string }> = {
  wedding: { id: 'Pernikahan', en: 'Wedding' },
  anniversary: { id: 'Anniversary', en: 'Anniversary' },
  'bridal-shower': { id: 'Bridal shower', en: 'Bridal shower' },
  birthday: { id: 'Ulang tahun', en: 'Birthday' },
  'aqiqah-khitanan': { id: 'Aqiqah & Khitanan', en: 'Aqiqah & Khitanan' },
  syukuran: { id: 'Syukuran', en: 'Thanksgiving' },
  'baby-shower': { id: 'Baby shower', en: 'Baby shower' },
  graduation: { id: 'Wisuda', en: 'Graduation' },
  reunion: { id: 'Reuni', en: 'Reunion' },
  'holiday-gathering': { id: 'Hari raya', en: 'Holiday' },
  corporate: { id: 'Korporat', en: 'Corporate' },
};

export const templateStyleTagLabels: Record<TemplateStyleTag, { id: string; en: string }> = {
  elegant: { id: 'Elegan', en: 'Elegant' },
  minimal: { id: 'Minimal', en: 'Minimal' },
  floral: { id: 'Floral', en: 'Floral' },
  boho: { id: 'Boho', en: 'Boho' },
  luxury: { id: 'Mewah', en: 'Luxury' },
  playful: { id: 'Ceria', en: 'Playful' },
  islamic: { id: 'Islami', en: 'Islamic' },
  vintage: { id: 'Vintage', en: 'Vintage' },
  modern: { id: 'Modern', en: 'Modern' },
  illustrated: { id: 'Ilustrasi', en: 'Illustrated' },
  bold: { id: 'Bold', en: 'Bold' },
  watercolor: { id: 'Cat air', en: 'Watercolor' },
};

export type InvitationTemplate = {
  /** Maps to config.theme.templateId. */
  id: number;
  slug: string;
  name: string;
  tagline: { id: string; en: string };
  category: TemplateCategory;
  styleTags: TemplateStyleTag[];
  motif: TemplateMotif;
  tier: TemplateTier;
  paletteId: string;
  palette: TemplatePalette;
  font: TemplateFont;
  /** Placeholder copy rendered on the preview card. */
  sample: { eyebrow: string; names: string; date: string };
  /** Backend-ready starting config, validated against detailConfigSchema. */
  preset: DetailConfig;
};

type TemplateSeed = Omit<InvitationTemplate, 'palette' | 'preset'> & {
  /** Section-level overrides shallow-merged over the category base preset. */
  presetOverrides?: Record<string, unknown>;
};

/**
 * Category defaults keep every preset honest about what the public renderer
 * can actually display today: greetings, quote, events, story, gallery,
 * gift, RSVP, guestbook and music. Anything richer stays in the editor.
 */
function basePreset(seed: TemplateSeed): Record<string, unknown> {
  const theme = { templateId: seed.id, paletteId: seed.paletteId, cover: { headline: seed.sample.eyebrow } };
  const common = { theme, events: [] as unknown[], rsvp: { enabled: true } };
  switch (seed.category) {
    case 'wedding':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami.' },
        greetings: { enabled: true },
        quote: { enabled: true, text: 'Dan segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat kebesaran Allah.', author: 'QS. Az-Zariyat: 49' },
        story: { enabled: true, items: [] },
        gallery: { enabled: true, layout: 'grid', assetIds: [] },
        gift: { enabled: true, accounts: [] },
        guestbook: { enabled: true, heading: 'Ucapan & Doa' },
        music: { enabled: true },
      };
    case 'anniversary':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Dengan penuh syukur, kami mengundang Bapak/Ibu/Saudara/i untuk merayakan hari jadi pernikahan kami.' },
        greetings: { enabled: true },
        story: { enabled: true, items: [] },
        gallery: { enabled: true, layout: 'masonry', assetIds: [] },
        guestbook: { enabled: true, heading: 'Ucapan & Doa' },
        music: { enabled: true },
      };
    case 'bridal-shower':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Sebelum hari bahagianya tiba, mari rayakan sang calon pengantin.' },
        gallery: { enabled: true, layout: 'carousel', assetIds: [] },
        guestbook: { enabled: true, heading: 'Pesan untuk Calon Pengantin' },
      };
    case 'birthday':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Yuk, rayakan hari istimewa ini bersama kami!' },
        gallery: { enabled: true, layout: 'carousel', assetIds: [] },
        guestbook: { enabled: true, heading: 'Ucapan Ulang Tahun' },
        music: { enabled: true },
      };
    case 'aqiqah-khitanan':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan tasyakuran.' },
        greetings: { enabled: true, prayer: 'Bismillahirrahmanirrahim' },
        quote: { enabled: true, text: 'Ya Tuhanku, jadikanlah aku dan anak cucuku orang yang tetap melaksanakan salat.', author: 'QS. Ibrahim: 40' },
        gallery: { enabled: true, layout: 'grid', assetIds: [] },
        guestbook: { enabled: true, heading: 'Doa & Ucapan' },
      };
    case 'syukuran':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i hadir dalam acara syukuran kami.' },
        greetings: { enabled: true },
        guestbook: { enabled: true, heading: 'Doa & Ucapan' },
      };
    case 'baby-shower':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Menyambut kehadiran buah hati, kami mengundangmu berbagi doa dan kebahagiaan.' },
        greetings: { enabled: true },
        gallery: { enabled: true, layout: 'carousel', assetIds: [] },
        guestbook: { enabled: true, heading: 'Ucapan untuk Si Kecil' },
      };
    case 'graduation':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Satu babak selesai. Rayakan kelulusan ini bersama kami.' },
        story: { enabled: true, items: [] },
        gallery: { enabled: true, layout: 'grid', assetIds: [] },
        guestbook: { enabled: true, heading: 'Ucapan Selamat' },
      };
    case 'reunion':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Sudah lama tidak bertemu — mari kumpul lagi.' },
        gallery: { enabled: true, layout: 'masonry', assetIds: [] },
        guestbook: { enabled: true, heading: 'Salam Kangen' },
      };
    case 'holiday-gathering':
      return {
        ...common,
        settings: { language: 'id', openingCopy: 'Mari rayakan momen hangat ini bersama keluarga dan sahabat.' },
        greetings: { enabled: true },
        gallery: { enabled: true, layout: 'grid', assetIds: [] },
        guestbook: { enabled: true, heading: 'Ucapan & Doa' },
      };
    case 'corporate':
      return {
        ...common,
        settings: { language: 'en', openingCopy: 'We cordially invite you to join us at our upcoming event.' },
        gallery: { enabled: true, layout: 'grid', assetIds: [] },
        guestbook: { enabled: false },
      };
  }
}

function make(seed: TemplateSeed): InvitationTemplate {
  const { presetOverrides, ...template } = seed;
  const raw = { ...basePreset(seed), ...presetOverrides };
  // A bad preset must never take the marketing page down; fall back to the
  // smallest valid config and let the editor fill in the rest.
  const parsed = detailConfigSchema.safeParse(raw);
  const fallback = parsed.success ? null : detailConfigSchema.safeParse({});
  const preset = parsed.success
    ? parsed.data
    : fallback && fallback.success
      ? fallback.data
      : ({} as DetailConfig);
  return { ...template, palette: templatePalettes[seed.paletteId], preset };
}

export const invitationTemplates: InvitationTemplate[] = [
  // ————— Pernikahan —————
  make({ id: 101, slug: 'eternal-ivory', name: 'Eternal Ivory', category: 'wedding', styleTags: ['elegant', 'minimal'], motif: 'arch', tier: 'premium', paletteId: 'ivory', font: 'serif', sample: { eyebrow: 'THE WEDDING OF', names: 'Alya & Raka', date: '20 . 12 . 2026' }, tagline: { id: 'Putih gading klasik dengan lengkung arch yang tenang', en: 'Quiet ivory classic framed by a soft arch' } }),
  make({ id: 102, slug: 'rose-gold-romance', name: 'Rose Gold Romance', category: 'wedding', styleTags: ['floral', 'elegant'], motif: 'floral', tier: 'premium', paletteId: 'rose-gold', font: 'serif', sample: { eyebrow: 'UNDANGAN PERNIKAHAN', names: 'Nadia & Fajar', date: 'Sabtu, 14 Februari 2027' }, tagline: { id: 'Rona rose gold dengan taburan floral di tiap sudut', en: 'Rose gold glow with florals in every corner' } }),
  make({ id: 103, slug: 'sage-garden', name: 'Sage Garden', category: 'wedding', styleTags: ['floral', 'boho'], motif: 'botanical', tier: 'free', paletteId: 'sage', font: 'serif', sample: { eyebrow: 'THE WEDDING OF', names: 'Sinta & Bayu', date: '08 . 08 . 2026' }, tagline: { id: 'Hijau sage dan dedaunan untuk pesta kebun', en: 'Sage greens and foliage for a garden party' } }),
  make({ id: 104, slug: 'midnight-gala', name: 'Midnight Gala', category: 'wedding', styleTags: ['luxury', 'modern'], motif: 'deco', tier: 'signature', paletteId: 'midnight', font: 'serif', sample: { eyebrow: 'WE ARE GETTING MARRIED', names: 'Laras & Dimas', date: '31 . 12 . 2026' }, tagline: { id: 'Biru malam dan emas untuk resepsi malam hari', en: 'Midnight blue and gold for an evening reception' }, presetOverrides: { settings: { language: 'en', openingCopy: 'Together with our families, we joyfully invite you to celebrate our wedding.' }, quote: { enabled: true, text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Bronte' } } }),
  make({ id: 105, slug: 'terracotta-vow', name: 'Terracotta Vow', category: 'wedding', styleTags: ['boho', 'vintage'], motif: 'arch', tier: 'premium', paletteId: 'terracotta', font: 'sans', sample: { eyebrow: 'UNDANGAN PERNIKAHAN', names: 'Ratih & Gilang', date: 'Minggu, 6 Juni 2027' }, tagline: { id: 'Tanah liat hangat bergaya boho rustic', en: 'Warm clay tones with a rustic boho mood' } }),
  make({ id: 106, slug: 'orchid-monogram', name: 'Orchid Monogram', category: 'wedding', styleTags: ['elegant', 'modern'], motif: 'monogram', tier: 'premium', paletteId: 'orchid', font: 'serif', sample: { eyebrow: 'THE WEDDING OF', names: 'Kirana & Arga', date: '17 . 05 . 2026' }, tagline: { id: 'Ungu anggrek dengan monogram lingkar ganda', en: 'Orchid purple with a double-ring monogram' } }),
  make({ id: 107, slug: 'sand-minimal', name: 'Sand Minimal', category: 'wedding', styleTags: ['minimal', 'modern'], motif: 'geometric', tier: 'free', paletteId: 'sand', font: 'sans', sample: { eyebrow: 'WEDDING INVITATION', names: 'Dewi & Rizky', date: '12 . 09 . 2026' }, tagline: { id: 'Netral pasir, tipografi bersih, tanpa distraksi', en: 'Sandy neutrals, clean type, zero distraction' } }),
  make({ id: 108, slug: 'gold-noir-deco', name: 'Gold Noir', category: 'wedding', styleTags: ['luxury', 'vintage'], motif: 'deco', tier: 'signature', paletteId: 'gold-noir', font: 'serif', sample: { eyebrow: 'A NIGHT TO REMEMBER', names: 'Maharani & Bima', date: 'SABTU · 21 . 11 . 2026' }, tagline: { id: 'Art deco hitam-emas ala Gatsby', en: 'Black-and-gold art deco, Gatsby style' } }),
  make({ id: 109, slug: 'blossom-aquarelle', name: 'Blossom Aquarelle', category: 'wedding', styleTags: ['watercolor', 'floral'], motif: 'floral', tier: 'premium', paletteId: 'blossom', font: 'serif', sample: { eyebrow: 'THE WEDDING OF', names: 'Puti & Danu', date: 'Minggu, 3 Oktober 2027' }, tagline: { id: 'Sapuan cat air merah muda yang lembut', en: 'Soft pink watercolor washes' } }),
  make({ id: 110, slug: 'emerald-royale', name: 'Emerald Royale', category: 'wedding', styleTags: ['luxury', 'elegant'], motif: 'rings', tier: 'signature', paletteId: 'emerald', font: 'serif', sample: { eyebrow: 'THE ROYAL WEDDING OF', names: 'Saraswati & Mahesa', date: '01 . 01 . 2027' }, tagline: { id: 'Zamrud megah dengan cincin bersilang', en: 'Regal emerald with interlocking rings' } }),
  make({ id: 138, slug: 'melati-suci', name: 'Melati Suci', category: 'wedding', styleTags: ['floral', 'islamic', 'elegant'], motif: 'floral', tier: 'free', paletteId: 'mint', font: 'serif', sample: { eyebrow: 'AKAD NIKAH', names: 'Hana & Yusuf', date: 'Sabtu, 12 Juni 2027' }, tagline: { id: 'Melati putih dan doa yang khusyuk', en: 'White jasmine and solemn prayers' }, presetOverrides: { greetings: { enabled: true, prayer: 'Bismillahirrahmanirrahim' } } }),
  make({ id: 139, slug: 'batik-kencana', name: 'Batik Kencana', category: 'wedding', styleTags: ['vintage', 'luxury'], motif: 'geometric', tier: 'signature', paletteId: 'midnight', font: 'serif', sample: { eyebrow: 'UNDANGAN NGUNDUH MANTU', names: 'Sekar & Panji', date: 'Minggu, 11 April 2027' }, tagline: { id: 'Parang emas di atas biru malam, klasik Jawa', en: 'Golden parang on midnight blue, a Javanese classic' } }),
  make({ id: 140, slug: 'frangipani-bali', name: 'Frangipani Bali', category: 'wedding', styleTags: ['boho', 'floral'], motif: 'botanical', tier: 'premium', paletteId: 'sand', font: 'sans', sample: { eyebrow: 'PAWIWAHAN', names: 'Ayu & Bagus', date: 'Sabtu, 24 Juli 2027' }, tagline: { id: 'Kamboja putih dan angin pantai pulau dewata', en: 'White frangipani and island sea breeze' } }),
  make({ id: 141, slug: 'bunga-kering', name: 'Bunga Kering', category: 'wedding', styleTags: ['boho', 'vintage', 'floral'], motif: 'floral', tier: 'free', paletteId: 'terracotta', font: 'serif', sample: { eyebrow: 'THE WEDDING OF', names: 'Laras & Bima', date: '19 . 09 . 2027' }, tagline: { id: 'Bunga kering earthy: beige, dusty rose, terakota', en: 'Earthy pressed flowers: beige, dusty rose, terracotta' } }),
  make({ id: 142, slug: 'garden-rose', name: 'Garden Rose', category: 'wedding', styleTags: ['elegant', 'floral', 'illustrated'], motif: 'floral', tier: 'premium', paletteId: 'blossom', font: 'serif', sample: { eyebrow: 'WEDDING INVITATION', names: 'Alma & Radit', date: 'Minggu, 30 Mei 2027' }, tagline: { id: 'Mawar taman ilustratif untuk resepsi ballroom', en: 'Illustrated garden roses for a ballroom reception' } }),
  // ————— Anniversary —————
  make({ id: 111, slug: 'silver-years', name: 'Silver Years', category: 'anniversary', styleTags: ['elegant'], motif: 'rings', tier: 'free', paletteId: 'lavender', font: 'serif', sample: { eyebrow: '25TH ANNIVERSARY', names: 'Ratna & Hasan', date: '12 . 12 . 2026' }, tagline: { id: 'Perak tenang untuk seperempat abad bersama', en: 'Quiet silver for a quarter century together' } }),
  make({ id: 112, slug: 'golden-years', name: 'Golden Years', category: 'anniversary', styleTags: ['vintage', 'luxury'], motif: 'monogram', tier: 'premium', paletteId: 'mocha', font: 'serif', sample: { eyebrow: 'GOLDEN ANNIVERSARY', names: 'Eyang Uti & Kakung', date: '50 TAHUN BERSAMA' }, tagline: { id: 'Cokelat moka hangat untuk kenangan emas', en: 'Warm mocha for golden memories' } }),
  make({ id: 143, slug: 'vine-ivy', name: 'Vine & Ivy', category: 'anniversary', styleTags: ['floral', 'minimal'], motif: 'botanical', tier: 'free', paletteId: 'emerald', font: 'sans', sample: { eyebrow: '10TH ANNIVERSARY', names: 'Tia & Rangga', date: 'Sabtu, 17 Juli 2027' }, tagline: { id: 'Sulur daun hijau yang tumbuh bersama', en: 'Green vines that grew together' } }),
  make({ id: 144, slug: 'pearl-koi', name: 'Pearl Koi', category: 'anniversary', styleTags: ['elegant', 'watercolor'], motif: 'waves', tier: 'premium', paletteId: 'ocean', font: 'serif', sample: { eyebrow: 'PEARL ANNIVERSARY', names: 'Maya & Surya', date: '30 TAHUN BERSAMA' }, tagline: { id: 'Gelombang cat air biru mutiara', en: 'Pearl blue watercolor waves' } }),
  // ————— Bridal shower —————
  make({ id: 113, slug: 'blush-brunch', name: 'Blush Brunch', category: 'bridal-shower', styleTags: ['playful', 'floral'], motif: 'confetti', tier: 'free', paletteId: 'rose-gold', font: 'serif', sample: { eyebrow: 'BRIDAL SHOWER', names: 'Bride to Be: Salma', date: 'Sabtu, 11 Juli 2026' }, tagline: { id: 'Merona ceria untuk pesta menjelang hari H', en: 'Blushing and cheerful before the big day' } }),
  make({ id: 114, slug: 'boho-picnic', name: 'Boho Picnic', category: 'bridal-shower', styleTags: ['boho', 'illustrated'], motif: 'botanical', tier: 'premium', paletteId: 'terracotta', font: 'sans', sample: { eyebrow: 'BRIDAL SHOWER', names: 'Tara & The Girls', date: 'Minggu, 9 Agustus 2026' }, tagline: { id: 'Piknik boho santai dengan dedaunan terakota', en: 'Laid-back boho picnic with terracotta leaves' } }),
  // ————— Ulang tahun —————
  make({ id: 115, slug: 'confetti-pop', name: 'Confetti Pop', category: 'birthday', styleTags: ['playful', 'bold'], motif: 'confetti', tier: 'free', paletteId: 'confetti', font: 'sans', sample: { eyebrow: 'YOU ARE INVITED', names: 'Kenzie is Turning 7!', date: 'Minggu, 15 Maret 2026' }, tagline: { id: 'Taburan confetti untuk pesta anak yang meriah', en: 'A confetti burst for a lively kids party' } }),
  make({ id: 116, slug: 'pastel-wonder', name: 'Pastel Wonder', category: 'birthday', styleTags: ['playful'], motif: 'balloons', tier: 'free', paletteId: 'lavender', font: 'sans', sample: { eyebrow: 'BIRTHDAY PARTY', names: 'Arunika ke-5', date: 'Sabtu, 2 Mei 2026' }, tagline: { id: 'Balon pastel lembut untuk si kecil', en: 'Soft pastel balloons for the little one' } }),
  make({ id: 117, slug: 'neon-night', name: 'Neon Night', category: 'birthday', styleTags: ['bold', 'modern'], motif: 'stars', tier: 'premium', paletteId: 'midnight', font: 'sans', sample: { eyebrow: 'BIRTHDAY BASH', names: 'Radit Turns 21', date: '21 . 08 . 2026' }, tagline: { id: 'Gelap, berani, dan siap pesta sampai larut', en: 'Dark, bold, and ready to party late' } }),
  make({ id: 118, slug: 'little-star', name: 'Little Star', category: 'birthday', styleTags: ['playful', 'illustrated'], motif: 'stars', tier: 'free', paletteId: 'ocean', font: 'sans', sample: { eyebrow: 'FIRST BIRTHDAY', names: 'Baby Alma Turns 1', date: 'Minggu, 19 April 2026' }, tagline: { id: 'Bintang kecil untuk ulang tahun pertama', en: 'A little star for the very first birthday' } }),
  make({ id: 119, slug: 'sweet-seventeen', name: 'Sweet Seventeen', category: 'birthday', styleTags: ['elegant', 'playful'], motif: 'confetti', tier: 'premium', paletteId: 'blossom', font: 'serif', sample: { eyebrow: 'SWEET SEVENTEEN', names: 'Queensha Aurelia', date: 'Sabtu, 27 Juni 2026' }, tagline: { id: 'Elegan merona untuk usia tujuh belas', en: 'Blushing elegance for turning seventeen' } }),
  make({ id: 145, slug: 'marigold-fiesta', name: 'Marigold Fiesta', category: 'birthday', styleTags: ['bold', 'playful'], motif: 'confetti', tier: 'free', paletteId: 'sunshine', font: 'sans', sample: { eyebrow: 'FIESTA!', names: 'Gempita ke-30', date: 'Sabtu, 21 Maret 2026' }, tagline: { id: 'Marigold jingga yang hangat dan meriah', en: 'Warm, festive orange marigold' } }),
  // ————— Aqiqah & Khitanan —————
  make({ id: 120, slug: 'barakah-mint', name: 'Barakah Mint', category: 'aqiqah-khitanan', styleTags: ['islamic'], motif: 'crescent', tier: 'free', paletteId: 'mint', font: 'serif', sample: { eyebrow: 'TASYAKURAN AQIQAH', names: 'Muhammad Al Fatih', date: 'Minggu, 12 April 2026' }, tagline: { id: 'Hijau mint teduh dengan hilal yang lembut', en: 'Calm mint green with a gentle crescent' } }),
  make({ id: 121, slug: 'bintang-kecil', name: 'Bintang Kecil', category: 'aqiqah-khitanan', styleTags: ['islamic', 'playful'], motif: 'stars', tier: 'free', paletteId: 'ocean', font: 'sans', sample: { eyebrow: 'WALIMATUL KHITAN', names: 'Ananda Rafif', date: 'Minggu, 28 Juni 2026' }, tagline: { id: 'Langit biru dan bintang untuk sang jagoan', en: 'Blue skies and stars for the brave boy' } }),
  make({ id: 122, slug: 'sakinah-sand', name: 'Sakinah Sand', category: 'aqiqah-khitanan', styleTags: ['islamic', 'elegant'], motif: 'crescent', tier: 'premium', paletteId: 'sand', font: 'serif', sample: { eyebrow: 'TASYAKURAN AQIQAH', names: 'Aisyah Humaira', date: 'Sabtu, 9 Mei 2026' }, tagline: { id: 'Nuansa pasir elegan bernapas islami', en: 'Elegant sandy tones with an Islamic soul' } }),
  // ————— Syukuran —————
  make({ id: 123, slug: 'syukur-hangat', name: 'Syukur Hangat', category: 'syukuran', styleTags: ['vintage'], motif: 'geometric', tier: 'free', paletteId: 'mocha', font: 'serif', sample: { eyebrow: 'SYUKURAN KELUARGA', names: 'Keluarga Wijaya', date: 'Minggu, 26 Juli 2026' }, tagline: { id: 'Hangat dan bersahaja untuk syukuran keluarga', en: 'Warm and humble for a family thanksgiving' } }),
  make({ id: 124, slug: 'rumah-baru', name: 'Rumah Baru', category: 'syukuran', styleTags: ['modern', 'minimal'], motif: 'geometric', tier: 'free', paletteId: 'terracotta', font: 'sans', sample: { eyebrow: 'HOUSEWARMING', names: 'Rumah Baru Keluarga Putra', date: 'Sabtu, 5 September 2026' }, tagline: { id: 'Garis geometris bersih untuk rumah baru', en: 'Clean geometric lines for a new home' } }),
  make({ id: 146, slug: 'teratai-subuh', name: 'Teratai Subuh', category: 'syukuran', styleTags: ['islamic', 'watercolor'], motif: 'waves', tier: 'premium', paletteId: 'dusk', font: 'serif', sample: { eyebrow: 'TASYAKURAN', names: 'Keluarga Ananta', date: 'Minggu, 18 April 2027' }, tagline: { id: 'Teratai subuh: cat air ungu yang teduh', en: 'Dawn lotus in calm purple watercolor' } }),
  // ————— Baby shower —————
  make({ id: 125, slug: 'awan-lembut', name: 'Awan Lembut', category: 'baby-shower', styleTags: ['playful'], motif: 'waves', tier: 'free', paletteId: 'ocean', font: 'sans', sample: { eyebrow: 'BABY SHOWER', names: 'Menanti Dedek Bayi', date: 'Minggu, 10 Mei 2026' }, tagline: { id: 'Gelombang biru selembut awan', en: 'Blue waves as soft as clouds' } }),
  make({ id: 126, slug: 'peach-cuddle', name: 'Peach Cuddle', category: 'baby-shower', styleTags: ['playful', 'illustrated'], motif: 'balloons', tier: 'premium', paletteId: 'blossom', font: 'sans', sample: { eyebrow: 'BABY SHOWER', names: 'Welcoming Baby R', date: 'Sabtu, 20 Juni 2026' }, tagline: { id: 'Persik hangat dan balon menyambut si kecil', en: 'Warm peach and balloons to welcome baby' } }),
  make({ id: 127, slug: 'reveal-dusk', name: 'Reveal Dusk', category: 'baby-shower', styleTags: ['modern'], motif: 'stars', tier: 'free', paletteId: 'dusk', font: 'sans', sample: { eyebrow: 'GENDER REVEAL', names: 'He or She?', date: 'Sabtu, 8 Agustus 2026' }, tagline: { id: 'Senja ungu untuk kejutan he or she', en: 'Purple dusk for the he-or-she surprise' } }),
  // ————— Wisuda —————
  make({ id: 128, slug: 'toga-slate', name: 'Toga Slate', category: 'graduation', styleTags: ['minimal', 'modern'], motif: 'geometric', tier: 'free', paletteId: 'slate', font: 'sans', sample: { eyebrow: 'GRADUATION', names: 'Sarjana Baru: Naufal', date: 'Kamis, 22 Oktober 2026' }, tagline: { id: 'Biru slate rapi untuk hari kelulusan', en: 'Crisp slate blue for graduation day' } }),
  make({ id: 129, slug: 'summa-gold', name: 'Summa Gold', category: 'graduation', styleTags: ['luxury'], motif: 'deco', tier: 'premium', paletteId: 'gold-noir', font: 'serif', sample: { eyebrow: 'GRADUATION NIGHT', names: 'Class of 2026', date: '30 . 10 . 2026' }, tagline: { id: 'Malam kelulusan bergaya hitam-emas', en: 'A black-and-gold graduation night' } }),
  // ————— Reuni —————
  make({ id: 130, slug: 'retro-reunion', name: 'Retro Reunion', category: 'reunion', styleTags: ['vintage', 'bold'], motif: 'confetti', tier: 'free', paletteId: 'sunshine', font: 'sans', sample: { eyebrow: 'REUNI AKBAR', names: 'SMA 3 Angkatan 2010', date: 'Sabtu, 15 Agustus 2026' }, tagline: { id: 'Kuning retro yang bikin kangen masa sekolah', en: 'Retro yellow that brings the school days back' } }),
  make({ id: 131, slug: 'alumni-classic', name: 'Alumni Classic', category: 'reunion', styleTags: ['elegant'], motif: 'monogram', tier: 'premium', paletteId: 'slate', font: 'serif', sample: { eyebrow: 'HOMECOMING', names: 'Alumni FT 2005', date: 'Sabtu, 12 September 2026' }, tagline: { id: 'Klasik berkelas untuk temu alumni', en: 'Classic and classy for an alumni homecoming' } }),
  // ————— Hari raya —————
  make({ id: 132, slug: 'halal-bihalal', name: 'Halal Bihalal', category: 'holiday-gathering', styleTags: ['islamic'], motif: 'crescent', tier: 'free', paletteId: 'mint', font: 'serif', sample: { eyebrow: 'HALAL BIHALAL', names: 'Keluarga Besar Hartono', date: 'Minggu, 29 Maret 2026' }, tagline: { id: 'Hijau syawal untuk silaturahmi keluarga', en: 'Eid greens for the family gathering' }, presetOverrides: { greetings: { enabled: true, prayer: 'Taqabbalallahu minna wa minkum' }, guestbook: { enabled: true, heading: 'Maaf Lahir & Batin' } } }),
  make({ id: 133, slug: 'natal-hangat', name: 'Natal Hangat', category: 'holiday-gathering', styleTags: ['elegant'], motif: 'stars', tier: 'free', paletteId: 'emerald', font: 'serif', sample: { eyebrow: 'CHRISTMAS DINNER', names: 'Keluarga Tobing', date: 'Jumat, 25 Desember 2026' }, tagline: { id: 'Hijau natal dengan kerlip bintang', en: 'Christmas green with twinkling stars' }, presetOverrides: { guestbook: { enabled: true, heading: 'Ucapan Natal & Tahun Baru' } } }),
  make({ id: 134, slug: 'midnight-countdown', name: 'Midnight Countdown', category: 'holiday-gathering', styleTags: ['bold', 'modern'], motif: 'stars', tier: 'premium', paletteId: 'midnight', font: 'sans', sample: { eyebrow: 'NEW YEAR PARTY', names: 'Countdown to 2027', date: '31 . 12 . 2026' }, tagline: { id: 'Hitung mundur bergaya langit tengah malam', en: 'A countdown styled like the midnight sky' } }),
  make({ id: 147, slug: 'kurma-oasis', name: 'Kurma Oasis', category: 'holiday-gathering', styleTags: ['islamic', 'elegant'], motif: 'crescent', tier: 'free', paletteId: 'mocha', font: 'serif', sample: { eyebrow: 'IFTAR BERSAMA', names: 'Keluarga Besar Ramadhan', date: 'Sabtu, 6 Maret 2027' }, tagline: { id: 'Cokelat kurma hangat untuk buka bersama', en: 'Warm date-palm browns for an iftar gathering' }, presetOverrides: { greetings: { enabled: true, prayer: 'Allahumma laka shumtu wa bika amantu' }, guestbook: { enabled: true, heading: 'Doa & Harapan' } } }),
  // ————— Korporat —————
  make({ id: 135, slug: 'boardroom', name: 'Boardroom', category: 'corporate', styleTags: ['minimal', 'modern'], motif: 'geometric', tier: 'free', paletteId: 'slate', font: 'sans', sample: { eyebrow: 'CORPORATE GATHERING', names: 'NodeX Annual Summit', date: 'Kamis, 19 November 2026' }, tagline: { id: 'Tegas dan profesional untuk acara kantor', en: 'Sharp and professional for company events' } }),
  make({ id: 136, slug: 'gala-awards', name: 'Gala Awards', category: 'corporate', styleTags: ['luxury'], motif: 'deco', tier: 'signature', paletteId: 'gold-noir', font: 'serif', sample: { eyebrow: 'AWARDS NIGHT', names: 'Innovator Awards 2026', date: 'BALLROOM · 05 . 12 . 2026' }, tagline: { id: 'Malam penghargaan berbalut hitam-emas', en: 'An awards night dressed in black and gold' } }),
  make({ id: 137, slug: 'launch-day', name: 'Launch Day', category: 'corporate', styleTags: ['modern', 'bold'], motif: 'waves', tier: 'premium', paletteId: 'ocean', font: 'sans', sample: { eyebrow: 'PRODUCT LAUNCH', names: 'Invitesion 2.0', date: 'Rabu, 14 Oktober 2026' }, tagline: { id: 'Gelombang biru untuk peluncuran produk', en: 'Blue waves for a product launch' } }),
];

export const templateCategories = Object.keys(templateCategoryLabels) as TemplateCategory[];

export function getTemplateBySlug(slug: string): InvitationTemplate | undefined {
  return invitationTemplates.find((template) => template.slug === slug);
}

export function getTemplatesByCategory(category: TemplateCategory): InvitationTemplate[] {
  return invitationTemplates.filter((template) => template.category === category);
}
