/**
 * Seeds the starter theme catalog.
 *
 * The catalog is a prerequisite for the whole customer journey: without at
 * least one template there is nothing to pick, so no invitation can be created.
 * Safe to re-run — templates are matched by name and updated in place.
 */
import { eq } from 'drizzle-orm';
import { db, client } from '@/lib/db/drizzle';
import { templates } from '@/lib/db/schema';

type Seed = {
  name: string;
  category: 'wedding' | 'birthday' | 'aqiqah' | 'tasyakuran' | 'khitanan' | 'corporate';
  isPremium: boolean;
  defaultConfig: Record<string, unknown>;
};

const catalog: Seed[] = [
  {
    name: 'Klasik Putih',
    category: 'wedding',
    isPremium: false,
    defaultConfig: {
      settings: { title: 'Undangan Pernikahan', openingCopy: 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.' },
      theme: { paletteId: 'ivory' },
      greetings: { enabled: true, prayer: 'Assalamualaikum warahmatullahi wabarakatuh' },
      rsvp: { enabled: true, maxGuestsPerRsvp: 2 },
      gallery: { enabled: true, layout: 'grid' },
      guestbook: { enabled: true, heading: 'Ucapan & Doa', prompt: 'Kirimkan doa terbaik untuk kedua mempelai.' },
    },
  },
  {
    name: 'Rose Emas',
    category: 'wedding',
    isPremium: true,
    defaultConfig: {
      settings: { title: 'The Wedding Of' },
      theme: { paletteId: 'rose-gold' },
      rsvp: { enabled: true, maxGuestsPerRsvp: 4 },
      gallery: { enabled: true, layout: 'masonry' },
      story: { enabled: true },
      guestbook: { enabled: true, heading: 'Ucapan & Doa' },
    },
  },
  {
    name: 'Pesta Ceria',
    category: 'birthday',
    isPremium: false,
    defaultConfig: {
      settings: { title: 'Undangan Ulang Tahun', openingCopy: 'Yuk, rayakan hari spesial bersama kami!' },
      theme: { paletteId: 'confetti' },
      rsvp: { enabled: true, maxGuestsPerRsvp: 3 },
      gallery: { enabled: true, layout: 'carousel' },
      guestbook: { enabled: true, heading: 'Ucapan Ulang Tahun' },
    },
  },
  {
    name: 'Syukur Kecil',
    category: 'aqiqah',
    isPremium: false,
    defaultConfig: {
      settings: { title: 'Undangan Aqiqah', openingCopy: 'Dengan penuh rasa syukur, kami mengundang Bapak/Ibu dalam acara aqiqah putra/putri kami.' },
      theme: { paletteId: 'sage' },
      greetings: { enabled: true, prayer: 'Assalamualaikum warahmatullahi wabarakatuh' },
      rsvp: { enabled: true },
      guestbook: { enabled: true, heading: 'Doa untuk Si Kecil' },
    },
  },
  {
    name: 'Tasyakuran Hangat',
    category: 'tasyakuran',
    isPremium: false,
    defaultConfig: {
      settings: { title: 'Undangan Tasyakuran' },
      theme: { paletteId: 'sand' },
      greetings: { enabled: true },
      rsvp: { enabled: true },
      guestbook: { enabled: true },
    },
  },
  {
    name: 'Korporat Modern',
    category: 'corporate',
    isPremium: true,
    defaultConfig: {
      settings: { title: 'Event Invitation' },
      theme: { paletteId: 'slate' },
      registrationForm: { enabled: true, allowPlusOne: false },
      checkInSettings: { enabled: true, allowManual: true, requireQr: false },
      rsvp: { enabled: true },
      gallery: { enabled: false },
    },
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const item of catalog) {
    const [existing] = await db.select({ id: templates.id }).from(templates).where(eq(templates.name, item.name)).limit(1);
    if (existing) {
      await db
        .update(templates)
        .set({ category: item.category, isPremium: item.isPremium, defaultConfig: item.defaultConfig })
        .where(eq(templates.id, existing.id));
      updated++;
    } else {
      await db.insert(templates).values(item);
      created++;
    }
  }

  console.log(`Theme catalog seeded. created=${created} updated=${updated} total=${catalog.length}`);
}

main()
  .catch((error) => {
    console.error('Template seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
