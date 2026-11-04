/**
 * Family review fixture (harness tooling, not product code): seeds a LOCAL database with fictional invitations that
 * exercise every guest-page layout through the real routes. Per layout: full content, full content over a cover photo,
 * sparse content, a non-wedding event, an expired (read-only) invitation and a dark palette, each with the five stress
 * guests of seed-local-demo.ts plus one opaque-link guest. Idempotent per slug: an existing invitation is updated in
 * place and only missing guests are added. Every person, number and place is fictional, and there is no religious text
 * (the verified corpus is empty, B-003). Event dates are relative to the run so the countdown and calendar links show.
 *
 *   POSTGRES_URL=postgres://postgres@127.0.0.1:5433/invitesion \
 *     npx tsx invitation-research/_tools/setup/seed-family-review.ts [--cover-url http://127.0.0.1:3100/review/cover.png] [--palettes]
 *
 * Guest pages: /i/review-<layout>-<variant>/<guest>. Layouts: legacy | gapura | kartu | riang | lontar. Variants: full | photo
 * (only with --cover-url) | sparse | birthday | corporate (B-029 programme stress) | expired | dark (legacy: full, photo,
 * corporate). Guests: budi-hartono, nama-panjang, hostile-name,
 * rtl-name, emoji-name; the opaque-link guest is printed per invitation (reachable by its token only, B-011).
 * `--palettes` adds /i/review-<layout>-p-<paletteId>/budi-hartono for every palette (rendered contrast sweep).
 */
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { client, db } from '@/lib/db/drizzle';
import { guestMessages, guests, invitations, users } from '@/lib/db/schema';
import { detailConfigSchema, type DetailConfig } from '@/lib/invitation/detail-config';
import { FAMILY_IDS, type FamilyId } from '@/lib/invitation/families';
import { paletteIds } from '@/lib/invitation/palettes';
import { findUnverifiedReligiousText, loadCorpus } from '@/lib/invitation/religious-text';

type GuestSeed = { name: string; slug: string; guestCount: number; linkToken?: string | null };
export type ReviewInvitation = {
  slug: string;
  eventType: 'wedding' | 'birthday' | 'corporate';
  expired: boolean;
  config: DetailConfig;
  guests: GuestSeed[];
  withMessages: boolean;
};

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

/** B-029 stress: a long organisation name, 30 agenda rows (one very long), long and RTL speakers, contact links, no logo. */
function corporate(familyId?: FamilyId): DetailConfig {
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

export function familyReviewInvitations(coverImageUrl?: string, withPaletteSweep = false): ReviewInvitation[] {
  const withToken = (slug: string): GuestSeed[] => [...STRESS_GUESTS, { name: 'Tamu Bertoken', slug: 'tamu-bertoken', guestCount: 2, linkToken: reviewToken(slug) }];
  const make = (slug: string, config: DetailConfig, options: Partial<Pick<ReviewInvitation, 'eventType' | 'expired' | 'withMessages'>> = {}): ReviewInvitation => ({
    slug,
    eventType: options.eventType ?? 'wedding',
    expired: options.expired ?? false,
    config,
    guests: withToken(slug),
    withMessages: options.withMessages ?? true,
  });
  const fullPalette: Record<FamilyId, string> = { gapura: 'ivory', kartu: 'terracotta', riang: 'ocean', lontar: 'sage' };
  const rows: ReviewInvitation[] = [make('review-legacy-full', weddingFull('ivory'))];
  if (coverImageUrl) rows.push(make('review-legacy-photo', weddingFull('ivory', undefined, coverImageUrl)));
  rows.push(make('review-legacy-corporate', corporate(), { eventType: 'corporate', withMessages: false }));
  for (const familyId of FAMILY_IDS) {
    rows.push(make(`review-${familyId}-full`, weddingFull(fullPalette[familyId], familyId)));
    if (coverImageUrl) rows.push(make(`review-${familyId}-photo`, weddingFull(fullPalette[familyId], familyId, coverImageUrl)));
    rows.push(make(`review-${familyId}-sparse`, weddingSparse(familyId), { withMessages: false }));
    rows.push(make(`review-${familyId}-birthday`, birthday(familyId), { eventType: 'birthday' }));
    rows.push(make(`review-${familyId}-corporate`, corporate(familyId), { eventType: 'corporate', withMessages: false }));
    rows.push(make(`review-${familyId}-expired`, weddingFull(fullPalette[familyId], familyId), { expired: true }));
    rows.push(make(`review-${familyId}-dark`, weddingFull('midnight', familyId)));
  }
  if (withPaletteSweep) rows.push(...paletteSweep());
  const corpus = loadCorpus();
  return rows.map((row) => {
    const config = detailConfigSchema.parse(row.config);
    const religious = findUnverifiedReligiousText(config, corpus);
    if (religious.length) throw new Error(`${row.slug}: unverified religious text at ${religious.map((finding) => finding.path).join(', ')}`);
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
  return invitation.slug;
}

async function main() {
  const coverIndex = process.argv.indexOf('--cover-url');
  const rows = familyReviewInvitations(coverIndex > 0 ? process.argv[coverIndex + 1] : undefined, process.argv.includes('--palettes'));
  const owner = await upsertOwner();
  const seeded: string[] = [];
  for (const row of rows) seeded.push(await seed(row, owner.id));
  console.log(JSON.stringify({ invitations: seeded, guests: STRESS_GUESTS.map((guest) => guest.slug), tokens: Object.fromEntries(rows.map((row) => [row.slug, reviewToken(row.slug)])) }));
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
