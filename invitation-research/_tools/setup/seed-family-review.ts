/**
 * Family review fixture (harness tooling, not product code): seeds a LOCAL database with fictional invitations that
 * exercise every guest-page layout through the real routes. Per layout: full content, full content over a cover photo,
 * sparse content, a non-wedding event, an expired (read-only) invitation and a dark palette, each with the five stress
 * guests of seed-local-demo.ts plus one opaque-link guest. Idempotent per slug: an existing invitation is updated in
 * place and only missing guests are added. Every person, number and place is fictional, and there is no religious text
 * (the verified corpus is empty, B-003). Event dates are relative to the run so the countdown and calendar links show.
 *
 *   POSTGRES_URL=postgres://postgres@127.0.0.1:5433/invitesion \
 *     npx tsx invitation-research/_tools/setup/seed-family-review.ts [--cover-url http://127.0.0.1:3100/review/cover.png] [--palettes] \
 *       [--logo-url /media/900001/b029b029b029b029b029b029.png]   (fictional logo on every corporate variant, B-029; an
 *       upload path as the editor stores it, or an http(s) URL)
 *
 * Guest pages: /i/review-<layout>-<variant>/<guest>. Layouts: legacy | gapura | kartu | riang | lontar. Variants: full | photo
 * (only with --cover-url) | sparse | birthday | corporate (B-029 programme stress) | expired | dark (legacy: full, photo,
 * corporate). Guests: budi-hartono, nama-panjang, hostile-name,
 * rtl-name, emoji-name; the opaque-link guest is printed per invitation (reachable by its token only, B-011).
 * `--palettes` adds /i/review-<layout>-p-<paletteId>/budi-hartono for every palette (rendered contrast sweep).
 *
 * `--mark-variants` (s17, B-029 organiser mark) adds per layout: corp-wide (wide logo over the cover photo when
 * --cover-url is given), corp-rtl (Arabic organisation name, tall logo), corp-nologo (category only) and corp-broken
 * (an upload path with no stored file). `--logo-files <square.png>,<wide.png>,<tall.png>` stores the fictional logos
 * through `saveImage` keyed to each invitation, the storage call of the upload route, and saves the returned media
 * path; set UPLOAD_ROOT to the server's upload root. The square logo goes on every `corporate` variant.
 *
 * `--ceremony` (s17, B-029 slice 3) adds per layout: aqiqah (every field the aqiqah tab offers), khitanan (stress: long
 * full name and school, Arabic parents' names), tasyakuran (housewarming) and share (the full wedding with a hashtag and
 * an http(s) filter link). Their texts are neutral wishes, checked against the religious-text heuristic like presets.
 * `--cover-low-url <url>` (s17, S16-X1) adds `photo-low` to every layout: the full wedding over a low-contrast cover.
 * `--match <regex>` seeds only the rows whose slug matches, so adding variants leaves every other review page (and its
 * run-relative dates) untouched, e.g. `--ceremony --match '-(aqiqah|khitanan|tasyakuran|share)$'`.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { eq } from 'drizzle-orm';
import { client, db } from '@/lib/db/drizzle';
import { guestMessages, guests, invitations, users } from '@/lib/db/schema';
import { detailConfigSchema, type DetailConfig } from '@/lib/invitation/detail-config';
import { FAMILY_IDS, type FamilyId } from '@/lib/invitation/families';
import { paletteIds } from '@/lib/invitation/palettes';
import { findUnverifiedReligiousText, loadCorpus, looksReligious } from '@/lib/invitation/religious-text';

type GuestSeed = { name: string; slug: string; guestCount: number; linkToken?: string | null };
export type ReviewInvitation = {
  slug: string;
  eventType: 'wedding' | 'birthday' | 'corporate' | 'aqiqah' | 'khitanan' | 'tasyakuran';
  expired: boolean;
  config: DetailConfig;
  guests: GuestSeed[];
  withMessages: boolean;
  /** Which fictional logo `--logo-files` stores for this invitation; `broken` saves an upload path with no file. */
  logo?: LogoKind;
};
type LogoKind = 'square' | 'wide' | 'tall' | 'broken';

const STRESS_GUESTS: GuestSeed[] = [
  { name: 'Budi Hartono', slug: 'budi-hartono', guestCount: 2 },
  { name: 'Muhammad Fadhlurrahman Al-Ghifari & Putri Anindya Maharani Kusumawardhani', slug: 'nama-panjang', guestCount: 2 },
  { name: '<img src=x onerror=alert(1)>"\'><script>alert(2)</script>', slug: 'hostile-name', guestCount: 1 },
  { name: 'عبد الله بن أحمد', slug: 'rtl-name', guestCount: 1 },
  { name: 'Sari 💐 & Keluarga 👨‍👩‍👧', slug: 'emoji-name', guestCount: 3 },
];

/** A stable 128-bit URL-safe token per invitation; link tokens are unique across all guests, so it cannot be shared. */
export const reviewToken = (slug: string) => createHash('sha256').update(`family-review:${slug}`).digest().subarray(0, 16).toString('base64url');

/** `YYYY-MM-DDTHH:MM:00+08:00` (WITA), `days` from now, so the fixture stays in the future whenever it is seeded. */
function witaAt(days: number, time: string): string {
  const date = new Date(Date.now() + days * 86_400_000 + 8 * 3_600_000).toISOString().slice(0, 10);
  return `${date}T${time}:00+08:00`;
}

const COUPLE: DetailConfig['couple'] = {
  bride: { fullName: 'Laras Ayuningtyas', nickName: 'Laras', parents: 'Putri dari Bapak Fiktif & Ibu Contoh' },
  groom: { fullName: 'Dimas Prasetyo', nickName: 'Dimas', parents: 'Putra dari Bapak Rekaan & Ibu Sampel' },
  displayOrder: 'bride-first',
};

function weddingFull(paletteId: string, familyId?: FamilyId, imageUrl?: string): DetailConfig {
  return {
    couple: COUPLE,
    settings: { openingCopy: 'Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan berbagi kebahagiaan di hari pernikahan kami.' },
    theme: { paletteId, familyId, cover: { headline: 'Pernikahan', imageUrl } },
    quote: { enabled: true, text: 'Rumah bukan soal tempat, melainkan soal siapa yang menunggu kita pulang.', author: 'Penulis Contoh (fiktif)' },
    events: [
      {
        title: 'Akad Nikah',
        startAt: witaAt(60, '09:00'),
        endAt: witaAt(60, '10:30'),
        venueName: 'Aula Contoh Makassar',
        address: 'Jl. Fiktif No. 1, Kecamatan Sampel, Makassar',
        mapUrl: 'https://maps.google.com/?q=-5.14,119.42',
        note: 'Mohon hadir 15 menit sebelum acara dimulai.',
      },
      { title: 'Resepsi', startAt: witaAt(60, '19:00'), endAt: witaAt(60, '21:00'), venueName: 'Gedung Sampel', address: 'Jl. Rekaan No. 2, Makassar' },
    ],
    story: {
      enabled: true,
      items: [
        { date: '2021', title: 'Pertama bertemu', body: 'Teks cerita fiktif untuk menguji tata letak: dua orang bertemu di sebuah perpustakaan kota.' },
        { date: '2025', title: 'Lamaran', body: 'Teks cerita fiktif kedua, sedikit lebih panjang agar baris kedua dan ketiga ikut teruji di layar sempit.' },
      ],
    },
    streaming: { enabled: true, platform: 'other', url: 'https://example.test/siaran' },
    gift: {
      enabled: true,
      accounts: [
        { kind: 'bank', label: 'Bank Contoh', holder: 'Laras Ayuningtyas', number: '0000 0000 0000 0000' },
        { kind: 'ewallet', label: 'Dompet Digital Contoh', holder: 'Dimas Prasetyo', number: '0800-0000-0000', note: 'Konfirmasi tidak diperlukan.' },
      ],
    },
    guestbook: { enabled: true, moderation: false, heading: 'Ucapan & Doa', prompt: 'Tuliskan pesan terbaikmu untuk kedua mempelai.' },
  };
}

function weddingSparse(familyId?: FamilyId): DetailConfig {
  return { couple: { bride: { nickName: 'Laras' }, groom: { nickName: 'Dimas' } }, theme: { paletteId: 'sand', familyId }, events: [{ title: 'Resepsi', startAt: witaAt(45, '19:00') }] };
}

function birthday(familyId?: FamilyId): DetailConfig {
  return {
    birthdayPerson: { fullName: 'Kirana Putri Maharani', nickName: 'Kirana', age: 7 },
    settings: { openingCopy: 'Ayo datang dan rayakan ulang tahun ketujuh Kirana bersama kami. Akan ada permainan, kue, dan banyak tawa.' },
    theme: { paletteId: 'confetti', familyId, cover: { headline: 'Ulang Tahun ke-7' } },
    events: [
      {
        title: 'Pesta Ulang Tahun',
        startAt: witaAt(30, '15:00'),
        endAt: witaAt(30, '17:30'),
        venueName: 'Taman Bermain Contoh',
        address: 'Jl. Fiktif No. 7, Makassar',
        note: 'Dresscode: warna cerah.',
      },
    ],
    gift: { enabled: true, accounts: [{ kind: 'address', label: 'Alamat kirim kado', holder: 'Keluarga Contoh', note: 'Jl. Fiktif No. 7, Makassar' }] },
    guestbook: { enabled: true, moderation: false, heading: 'Ucapan untuk Kirana' },
  };
}

/** B-029 stress: a long organisation name, 30 agenda rows (one very long), long and RTL speakers, contact links; logo only with --logo-url. */
function corporate(familyId?: FamilyId, logoUrl?: string): DetailConfig {
  const agenda = Array.from({ length: 30 }, (_, index) => {
    const minutes = 8 * 60 + index * 15;
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')} WITA`;
    const title = index === 4 ? 'Diskusi Panel: Transformasi Digital Layanan Publik dan Kolaborasi Lintas Sektor di Kawasan Timur Indonesia' : `Sesi ${index + 1}: Materi Contoh`;
    return { time, title, speaker: index % 3 === 0 ? 'Narasumber Fiktif, M.Sc.' : undefined };
  });
  return {
    corporateProfile: {
      organizationName: 'PT Contoh Nusantara Sejahtera Abadi Makmur Sentosa (Persero) Tbk',
      eventName: 'Konferensi Mitra Tahunan 2026',
      eventCategory: 'conference',
      ...(logoUrl ? { logoUrl } : {}),
      description: 'Pertemuan tahunan mitra, pemasok, dan karyawan untuk meninjau capaian dan rencana tahun depan.\nSeluruh nama dan data dalam undangan ini fiktif.',
      agenda,
      speakers: [
        { name: 'Rina Wulandari', role: 'Direktur Utama', org: 'PT Contoh Nusantara' },
        { name: 'Dr. Ir. Bambang Sampel Rekaan Prasetyo Wibowo, M.Eng., IPU', role: 'Kepala Divisi Riset dan Pengembangan Teknologi Terapan', org: 'Lembaga Fiktif Nasional' },
        { name: 'عبد الله بن أحمد', role: 'Pembicara tamu', org: 'Institut Contoh' },
      ],
      dressCode: 'Batik formal',
      contactName: 'Panitia Acara (fiktif)',
      contactPhone: '+62 800-0000-0000',
      contactEmail: 'panitia@example.test',
    },
    theme: { paletteId: 'slate', familyId, cover: { headline: 'Undangan Resmi' } },
    events: [
      {
        title: 'Konferensi Mitra Tahunan',
        startAt: witaAt(40, '08:00'),
        endAt: witaAt(40, '16:00'),
        venueName: 'Balai Sidang Contoh',
        address: 'Jl. Fiktif No. 9, Makassar',
        mapUrl: 'https://maps.google.com/?q=-5.14,119.42',
      },
    ],
    guestbook: { enabled: false, moderation: false },
  };
}

/** `--mark-variants`: a short corporate programme that leaves the organiser mark, the cover and the headline in focus. */
function corporateMarkVariant(
  familyId: FamilyId | undefined,
  organizationName: string,
  eventCategory: 'product_launch' | 'seminar' | 'gala_award',
  imageUrl?: string,
): DetailConfig {
  return {
    corporateProfile: {
      organizationName,
      eventName: 'Peluncuran Layanan Contoh 2026',
      eventCategory,
      description: 'Acara fiktif untuk menguji logo, kategori, dan sampul undangan korporat.',
      agenda: [
        { time: '09.00 WITA', title: 'Registrasi' },
        { time: '09.30 WITA', title: 'Sambutan', speaker: 'Narasumber Fiktif' },
        { time: '10.00 WITA', title: 'Peluncuran' },
      ],
      contactName: 'Panitia Acara (fiktif)',
      contactEmail: 'panitia@example.test',
    },
    theme: { paletteId: 'slate', familyId, cover: { headline: 'Undangan Resmi', imageUrl } },
    events: [{ title: 'Peluncuran Layanan', startAt: witaAt(40, '09:00'), endAt: witaAt(40, '12:00'), venueName: 'Balai Sidang Contoh', address: 'Jl. Fiktif No. 9, Makassar' }],
    guestbook: { enabled: false, moderation: false },
  };
}

/** `--ceremony`: an aqiqah with every field the aqiqah tab offers. */
function aqiqahFull(familyId?: FamilyId): DetailConfig {
  return {
    ceremonyProfile: {
      honoureeName: 'Arka Pratama Wicaksono',
      gender: 'male',
      childOrder: 2,
      birthDate: '2026-10-03',
      birthPlace: 'Makassar',
      birthWeight: '3,2 kg',
      birthLength: '49 cm',
      fatherName: 'Dimas Prasetyo',
      motherName: 'Laras Ayuningtyas',
      nameMeaning: 'Arka berarti matahari, Pratama berarti yang pertama, dan Wicaksono berarti bijaksana (arti fiktif untuk pengujian).',
      prayer: 'Semoga tumbuh sehat, ceria, dan menjadi kebanggaan keluarga.',
    },
    settings: { openingCopy: 'Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada syukuran kelahiran putra kedua kami.' },
    theme: { paletteId: 'mint', familyId, cover: { headline: 'Aqiqah' } },
    events: [{ title: 'Syukuran Aqiqah', startAt: witaAt(35, '10:00'), endAt: witaAt(35, '13:00'), venueName: 'Rumah Keluarga Contoh', address: 'Jl. Fiktif No. 3, Makassar' }],
    guestbook: { enabled: true, moderation: false, heading: 'Ucapan untuk Arka' },
  };
}

/** `--ceremony`: a khitanan profile under stress (long full name and school, Arabic parents' names). */
function khitananStress(familyId?: FamilyId): DetailConfig {
  return {
    ceremonyProfile: {
      honoureeName: 'Raka Aditya Nugraha Saputra Wijayakusuma',
      nickName: 'Raka',
      age: 10,
      school: 'Sekolah Dasar Negeri Contoh Nomor 1 Kecamatan Sampel Kabupaten Rekaan',
      circumcisionDate: '2026-12-20',
      fatherName: 'سامي',
      motherName: 'ليلى',
      prayer: 'Semoga lekas pulih dan segera kembali bermain bersama teman-teman.',
      recoveryNote: 'Raka belum bisa menerima tamu pada hari pertama. Terima kasih atas pengertiannya.',
    },
    theme: { paletteId: 'ocean', familyId, cover: { headline: 'Khitanan' } },
    events: [{ title: 'Syukuran Khitanan', startAt: witaAt(50, '10:00'), venueName: 'Rumah Keluarga Contoh', address: 'Jl. Fiktif No. 5, Makassar' }],
    guestbook: { enabled: false, moderation: false },
  };
}

/** `--ceremony`: a housewarming tasyakuran. */
function tasyakuranFull(familyId?: FamilyId): DetailConfig {
  return {
    ceremonyProfile: {
      honoureeName: 'Keluarga Hartono',
      thanksgivingCategory: 'housewarming',
      thanksgivingTitle: 'Syukuran Rumah Baru',
      achievement: 'Jl. Contoh Raya No. 12, Kelurahan Sampel, Makassar',
      ceremonyNote: 'Terima kasih atas dukungan selama kami pindah. Kami ingin berbagi kebahagiaan di rumah baru bersama Bapak/Ibu/Saudara/i.',
    },
    theme: { paletteId: 'sand', familyId, cover: { headline: 'Tasyakuran' } },
    events: [{ title: 'Syukuran Rumah Baru', startAt: witaAt(25, '16:00'), endAt: witaAt(25, '19:00'), venueName: 'Rumah Baru Keluarga Hartono', address: 'Jl. Contoh Raya No. 12, Makassar' }],
    guestbook: { enabled: true, moderation: false, heading: 'Ucapan untuk Keluarga Hartono' },
  };
}

/** `--ceremony`: the full wedding with the hashtag switched on and an http(s) filter link. */
function weddingShare(paletteId: string, familyId?: FamilyId): DetailConfig {
  return { ...weddingFull(paletteId, familyId), instagramStory: { enabled: true, hashtag: '#LarasDimas2026 #SampaiTuaBersama', filterUrl: 'https://example.test/filter-contoh' } };
}

/** Host-text fields of the ceremony profile; fixture text there must not look religious (nothing is verified, B-003). */
const CEREMONY_TEXT_FIELDS = ['nameMeaning', 'prayer', 'recoveryNote', 'ceremonyNote'] as const;

/** `--palettes`: full content in every palette for every layout, one guest each (B-016 rendered contrast sweep). */
function paletteSweep(): ReviewInvitation[] {
  const layouts: (FamilyId | undefined)[] = [undefined, ...FAMILY_IDS];
  return layouts.flatMap((familyId) =>
    paletteIds.map((paletteId) => ({
      slug: `review-${familyId ?? 'legacy'}-p-${paletteId}`,
      eventType: 'wedding' as const,
      expired: false,
      config: weddingFull(paletteId, familyId),
      guests: [STRESS_GUESTS[0]],
      withMessages: true,
    })),
  );
}

export type ReviewOptions = {
  coverImageUrl?: string;
  /** `--cover-low-url`: a low-contrast cover for the `photo-low` variant of every layout (S16-X1 / taste candidate T1). */
  coverLowUrl?: string;
  palettes?: boolean;
  logoUrl?: string;
  markVariants?: boolean;
  ceremony?: boolean;
};

export function familyReviewInvitations(options: ReviewOptions = {}): ReviewInvitation[] {
  const { coverImageUrl, coverLowUrl, logoUrl } = options;
  const withPaletteSweep = options.palettes ?? false;
  const withMarkVariants = options.markVariants ?? false;
  const withCeremony = options.ceremony ?? false;
  const withToken = (slug: string): GuestSeed[] => [...STRESS_GUESTS, { name: 'Tamu Bertoken', slug: 'tamu-bertoken', guestCount: 2, linkToken: reviewToken(slug) }];
  const make = (
    slug: string,
    config: DetailConfig,
    options: Partial<Pick<ReviewInvitation, 'eventType' | 'expired' | 'withMessages' | 'logo'>> = {},
  ): ReviewInvitation => ({
    slug,
    eventType: options.eventType ?? 'wedding',
    expired: options.expired ?? false,
    config,
    guests: withToken(slug),
    withMessages: options.withMessages ?? true,
    ...(options.logo ? { logo: options.logo } : {}),
  });
  const corporateOptions = { eventType: 'corporate' as const, withMessages: false };
  const markVariants = (layout: string, familyId?: FamilyId): ReviewInvitation[] =>
    withMarkVariants
      ? [
          make(`review-${layout}-corp-wide`, corporateMarkVariant(familyId, 'PT Contoh Sinar Terang', 'product_launch', coverImageUrl), { ...corporateOptions, logo: 'wide' }),
          make(`review-${layout}-corp-rtl`, corporateMarkVariant(familyId, 'مؤسسة المثال للتنمية المستدامة', 'seminar'), { ...corporateOptions, logo: 'tall' }),
          make(`review-${layout}-corp-nologo`, corporateMarkVariant(familyId, 'Yayasan Contoh Lestari', 'gala_award'), corporateOptions),
          make(`review-${layout}-corp-broken`, corporateMarkVariant(familyId, 'CV Contoh Tautan Putus', 'seminar'), { ...corporateOptions, logo: 'broken' }),
        ]
      : [];
  const fullPalette: Record<FamilyId, string> = { gapura: 'ivory', kartu: 'terracotta', riang: 'ocean', lontar: 'sage' };
  const ceremonyVariants = (layout: string, familyId?: FamilyId): ReviewInvitation[] =>
    withCeremony
      ? [
          make(`review-${layout}-aqiqah`, aqiqahFull(familyId), { eventType: 'aqiqah' }),
          make(`review-${layout}-khitanan`, khitananStress(familyId), { eventType: 'khitanan', withMessages: false }),
          make(`review-${layout}-tasyakuran`, tasyakuranFull(familyId), { eventType: 'tasyakuran', withMessages: false }),
          make(`review-${layout}-share`, weddingShare(familyId ? fullPalette[familyId] : 'ivory', familyId)),
        ]
      : [];
  const rows: ReviewInvitation[] = [make('review-legacy-full', weddingFull('ivory'))];
  rows.push(...ceremonyVariants('legacy'));
  if (coverImageUrl) rows.push(make('review-legacy-photo', weddingFull('ivory', undefined, coverImageUrl)));
  if (coverLowUrl) rows.push(make('review-legacy-photo-low', weddingFull('ivory', undefined, coverLowUrl)));
  rows.push(make('review-legacy-corporate', corporate(undefined, logoUrl), { ...corporateOptions, logo: 'square' }));
  rows.push(...markVariants('legacy'));
  for (const familyId of FAMILY_IDS) {
    rows.push(make(`review-${familyId}-full`, weddingFull(fullPalette[familyId], familyId)));
    if (coverImageUrl) rows.push(make(`review-${familyId}-photo`, weddingFull(fullPalette[familyId], familyId, coverImageUrl)));
    if (coverLowUrl) rows.push(make(`review-${familyId}-photo-low`, weddingFull(fullPalette[familyId], familyId, coverLowUrl)));
    rows.push(make(`review-${familyId}-sparse`, weddingSparse(familyId), { withMessages: false }));
    rows.push(make(`review-${familyId}-birthday`, birthday(familyId), { eventType: 'birthday' }));
    rows.push(make(`review-${familyId}-corporate`, corporate(familyId, logoUrl), { ...corporateOptions, logo: 'square' }));
    rows.push(...markVariants(familyId, familyId));
    rows.push(make(`review-${familyId}-expired`, weddingFull(fullPalette[familyId], familyId), { expired: true }));
    rows.push(make(`review-${familyId}-dark`, weddingFull('midnight', familyId)));
    rows.push(...ceremonyVariants(familyId, familyId));
  }
  if (withPaletteSweep) rows.push(...paletteSweep());
  const corpus = loadCorpus();
  return rows.map((row) => {
    const config = detailConfigSchema.parse(row.config);
    const religious = findUnverifiedReligiousText(config, corpus);
    if (religious.length) throw new Error(`${row.slug}: unverified religious text at ${religious.map((finding) => finding.path).join(', ')}`);
    const ceremonyText = CEREMONY_TEXT_FIELDS.filter((field) => looksReligious(config.ceremonyProfile?.[field]));
    if (ceremonyText.length) throw new Error(`${row.slug}: fixture text looks religious at ceremonyProfile.${ceremonyText.join(', ceremonyProfile.')}`);
    return { ...row, config };
  });
}

async function upsertOwner() {
  const [existing] = await db.select().from(users).where(eq(users.email, 'demo.owner@example.test')).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email: 'demo.owner@example.test', name: 'Demo Owner (fixture)' }).returning();
  return created;
}

async function seed(row: ReviewInvitation, ownerId: number) {
  const now = Date.now();
  const values = {
    userId: ownerId,
    templateId: null,
    slug: row.slug,
    eventType: row.eventType,
    config: row.config,
    status: 'PUBLISHED',
    publishedAt: new Date(row.expired ? now - 400 * 86_400_000 : now),
    expiresAt: new Date(row.expired ? now - 35 * 86_400_000 : now + 365 * 86_400_000),
  };
  const [existing] = await db.select().from(invitations).where(eq(invitations.slug, row.slug)).limit(1);
  const [invitation] = existing
    ? await db.update(invitations).set(values).where(eq(invitations.id, existing.id)).returning()
    : await db.insert(invitations).values(values).returning();
  const present = new Set((await db.select({ slug: guests.slug }).from(guests).where(eq(guests.invitationId, invitation.id))).map((guest) => guest.slug));
  for (const guest of row.guests) if (!present.has(guest.slug)) await db.insert(guests).values({ invitationId: invitation.id, ...guest });
  if (row.withMessages) {
    const [message] = await db.select({ id: guestMessages.id }).from(guestMessages).where(eq(guestMessages.invitationId, invitation.id)).limit(1);
    const [first] = await db.select().from(guests).where(eq(guests.invitationId, invitation.id)).limit(1);
    if (!message && first) {
      await db.insert(guestMessages).values([
        { invitationId: invitation.id, guestId: first.id, name: first.name, message: 'Selamat berbahagia, semoga langgeng sampai kakek nenek.' },
        { invitationId: invitation.id, guestId: first.id, name: first.name, message: '<b>bold?</b> <script>alert("wish")</script> — uji markup di ucapan' },
      ]);
    }
  }
  return invitation;
}

/** lib/storage is marked server-only for the bundler; like scripts/verify-*.ts, this plain Node script neutralises it. */
async function loadStorage() {
  const loader = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
  const load = loader._load;
  loader._load = function (this: unknown, request: string, ...rest: unknown[]) {
    return request === 'server-only' ? {} : load.call(this, request, ...rest);
  };
  return import('@/lib/storage');
}

/** `--logo-files`: the fictional logo through the upload route's storage call, then the returned path saved in the config. */
async function attachLogo(invitationId: number, row: ReviewInvitation, files: string[]): Promise<string> {
  let url: string;
  if (row.logo === 'broken') {
    url = `/media/${invitationId}/${'0'.repeat(24)}.png`;
  } else {
    const { invitationMediaKey, saveImage } = await loadStorage();
    const path = files[{ square: 0, wide: 1, tall: 2 }[row.logo ?? 'square']];
    const file = new File([new Uint8Array(readFileSync(path))], 'logo.png', { type: 'image/png' });
    const stored = await saveImage((ext) => invitationMediaKey(invitationId, ext), file, 5 * 1024 * 1024);
    if (!stored) throw new Error(`${row.slug}: saveImage refused ${path}`);
    url = stored;
  }
  const config = detailConfigSchema.parse({ ...row.config, corporateProfile: { ...row.config.corporateProfile, logoUrl: url } });
  await db.update(invitations).set({ config }).where(eq(invitations.id, invitationId));
  return url;
}

async function main() {
  const argValue = (flag: string) => (process.argv.indexOf(flag) > 0 ? process.argv[process.argv.indexOf(flag) + 1] : undefined);
  const all = familyReviewInvitations({
    coverImageUrl: argValue('--cover-url'),
    coverLowUrl: argValue('--cover-low-url'),
    palettes: process.argv.includes('--palettes'),
    logoUrl: argValue('--logo-url'),
    markVariants: process.argv.includes('--mark-variants'),
    ceremony: process.argv.includes('--ceremony'),
  });
  const match = argValue('--match');
  const rows = match ? all.filter((row) => new RegExp(match).test(row.slug)) : all;
  if (match && !rows.length) throw new Error(`--match ${match}: no review slug matches`);
  const logoFiles = argValue('--logo-files')?.split(',');
  if (logoFiles && logoFiles.length !== 3) throw new Error('--logo-files takes <square.png>,<wide.png>,<tall.png>');
  const owner = await upsertOwner();
  const seeded: string[] = [];
  const logos: Record<string, string> = {};
  for (const row of rows) {
    const invitation = await seed(row, owner.id);
    seeded.push(invitation.slug);
    if (row.logo && logoFiles) logos[row.slug] = await attachLogo(invitation.id, row, logoFiles);
  }
  console.log(
    JSON.stringify({ invitations: seeded, guests: STRESS_GUESTS.map((guest) => guest.slug), tokens: Object.fromEntries(rows.map((row) => [row.slug, reviewToken(row.slug)])), logos }),
  );
}

if (require.main === module) {
  main()
    .then(() => client.end())
    .catch(async (error) => {
      console.error(error);
      await client.end();
      process.exit(1);
    });
}
