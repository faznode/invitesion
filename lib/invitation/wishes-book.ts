/**
 * I-22 (D-060): the wishes book, a PDF keepsake of the wishes guests left. Pure rules, no I/O and no pdf-lib: how a wish's
 * text becomes printable with the PDF standard fonts, how lines wrap, and where everything goes on the pages. The loader
 * (`wishes-book-db.ts`) supplies only VISIBLE wishes (R-04) with their name, message, time and the host's reply; the
 * renderer (`wishes-book-pdf.ts`) draws this plan; the route checks access.
 */

/** Technical ceiling, as the gift log's: the oldest 5,000 visible wishes; the cover says when there are more. */
export const WISHES_BOOK_MAX = 5_000;

export type BookWish = { name: string; message: string; createdAt: Date; reply: string | null };

// WinAnsi (CP1252) beyond Latin-1: what the standard fonts draw without an embedded font file.
const CP1252_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

export function winAnsi(codePoint: number): boolean {
  return (codePoint >= 0x20 && codePoint <= 0x7e) || (codePoint >= 0xa1 && codePoint <= 0xff && codePoint !== 0xad) || CP1252_EXTRA.has(codePoint);
}

// Invisible or reordering characters: controls, zero-width and joiners, bidirectional overrides and isolates, the BOM,
// variation selectors and skin-tone modifiers.
const REMOVED = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff\ufe00-\ufe0f]|\p{Emoji_Modifier}/gu;
const SPACES = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g;
// Emoji, flags and stray combining marks are left out; a keepsake printed in one ink loses little without them.
const DROPPED = /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{M}]/u;
const PLACEHOLDER = '\uFFFD';

/** What stands in for letters the standard fonts cannot draw (another script); the cover explains it. */
export const UNPRINTABLE_MARK = '[…]';

export type Printable = { text: string; replaced: boolean };

/**
 * Text the standard fonts can draw: Indonesian and every Latin-1 / CP1252 character as written, other Latin letters by
 * their base letter ("Bārakallāhu" → "Barakallahu"), emoji left out, and each run of another script (Arabic, CJK, …)
 * marked once with `[…]`. Paragraph breaks are kept (at most one blank line), spaces collapsed, lines trimmed.
 */
export function printable(raw: string): Printable {
  const normalized = raw.normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, ' ').replace(SPACES, ' ').replace(REMOVED, '');
  let out = '';
  for (const char of normalized) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (char === '\n' || winAnsi(codePoint)) {
      out += char;
      continue;
    }
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || DROPPED.test(char)) continue;
    const base = char.normalize('NFKD').replace(/\p{M}/gu, '');
    out += base && [...base].every((part) => winAnsi(part.codePointAt(0) ?? 0)) ? base : PLACEHOLDER;
  }
  const replaced = out.includes(PLACEHOLDER);
  const text = out
    .replace(/\uFFFD(?:[ ]*\uFFFD)*/g, UNPRINTABLE_MARK)
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, replaced };
}

/** Lines no wider than `maxWidth`, breaking at spaces, and inside a word only when the word alone is wider. */
export function wrapText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      if (!word) continue;
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }
      for (const char of word) {
        if (!line || measure(line + char) <= maxWidth) line += char;
        else {
          lines.push(line);
          line = char;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "9 November 2026, 19.05 WIB" (Western Indonesia Time, the product's default zone). */
export function tanggalWib(at: Date): string {
  const local = new Date(at.getTime() + 7 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]} ${local.getUTCFullYear()}, ${pad(local.getUTCHours())}.${pad(local.getUTCMinutes())} WIB`;
}

export type FontKey = 'serif' | 'serifItalic' | 'sans' | 'sansBold';
export type Ink = 'text' | 'muted' | 'accent';
export type DrawText = { kind: 'text'; text: string; x: number; y: number; size: number; font: FontKey; ink: Ink };
export type DrawRule = { kind: 'rule'; x1: number; y1: number; x2: number; y2: number; thickness: number; ink: Ink };
export type DrawOp = DrawText | DrawRule;
export type BookPlan = { pages: DrawOp[][]; included: number; total: number; replaced: number };
export type BookInput = { title: string; dateLine: string | null; wishes: readonly BookWish[]; total: number; generatedAt: Date };
export type Metrics = { width: (text: string, font: FontKey, size: number) => number };

/** A5 portrait, in points. */
export const PAGE = { width: 419.53, height: 595.28, margin: 48, top: 72, bottom: 60 } as const;
const BODY = PAGE.width - 2 * PAGE.margin;
const REPLY_INDENT = 14;
const TYPE = {
  name: { font: 'sansBold', size: 10.5, leading: 14 },
  date: { font: 'sans', size: 8, leading: 13 },
  message: { font: 'serif', size: 11, leading: 15.5 },
  replyLabel: { font: 'sansBold', size: 8, leading: 12 },
  reply: { font: 'serifItalic', size: 10.5, leading: 14.5 },
} as const;

type Prepared = { name: string[]; date: string; message: string[]; reply: string[] | null; replaced: boolean };

function prepare(wish: BookWish, metrics: Metrics): Prepared {
  const name = printable(wish.name);
  const message = printable(wish.message);
  const reply = wish.reply ? printable(wish.reply) : null;
  const lines = (text: string, style: (typeof TYPE)[keyof typeof TYPE], width = BODY) => wrapText(text, width, (part) => metrics.width(part, style.font, style.size));
  return {
    name: lines(name.text || 'Tamu', TYPE.name),
    date: tanggalWib(wish.createdAt),
    message: lines(message.text || UNPRINTABLE_MARK, TYPE.message),
    reply: reply && reply.text ? lines(reply.text, TYPE.reply, BODY - REPLY_INDENT) : null,
    replaced: name.replaced || message.replaced || !message.text || Boolean(reply?.replaced),
  };
}

/**
 * The pages: a cover (title, the event's date, how many wishes, when it was made, and the `[…]` note when needed), then the
 * wishes oldest first, each with its name, time, message and the host's reply. A wish starts on a new page when its name,
 * time and first two lines would not fit; a long one continues on the next page. Wish pages carry a running title and a
 * page number.
 */
export function layoutBook(input: BookInput, metrics: Metrics): BookPlan {
  const prepared = input.wishes.map((wish) => prepare(wish, metrics));
  const replaced = prepared.filter((wish) => wish.replaced).length;
  const centered = (text: string, y: number, font: FontKey, size: number, ink: Ink): DrawText => ({
    kind: 'text',
    text,
    x: (PAGE.width - metrics.width(text, font, size)) / 2,
    y,
    size,
    font,
    ink,
  });

  const cover: DrawOp[] = [];
  let y = PAGE.height - 200;
  cover.push(centered('BUKU UCAPAN & DOA', y, 'sansBold', 9, 'accent'));
  y -= 40;
  const title = printable(input.title).text || 'Undangan';
  for (const line of wrapText(title, BODY, (part) => metrics.width(part, 'serif', 26))) {
    cover.push(centered(line, y, 'serif', 26, 'text'));
    y -= 32;
  }
  if (input.dateLine) {
    const date = printable(input.dateLine).text;
    if (date) cover.push(centered(date, y, 'sans', 10.5, 'muted'));
    y -= 18;
  }
  y -= 10;
  cover.push({ kind: 'rule', x1: PAGE.width / 2 - 24, y1: y, x2: PAGE.width / 2 + 24, y2: y, thickness: 0.75, ink: 'accent' });
  y -= 28;
  const count = input.wishes.length;
  const summary = !count
    ? 'Belum ada ucapan yang tampil di undangan.'
    : count < input.total
      ? `${count.toLocaleString('id-ID')} dari ${input.total.toLocaleString('id-ID')} ucapan, yang terlama lebih dulu`
      : `${count.toLocaleString('id-ID')} ucapan dari tamu`;
  cover.push(centered(summary, y, count ? 'sans' : 'serifItalic', count ? 10 : 11, count ? 'text' : 'muted'));
  const notes = [`Dibuat ${tanggalWib(input.generatedAt)} dari ucapan yang tampil di undangan.`];
  if (replaced) notes.push(`Huruf atau emoji yang tidak dapat dicetak di buku ini ditandai ${UNPRINTABLE_MARK}; isinya utuh di halaman ucapan.`);
  let noteY = PAGE.bottom + 12 * notes.length;
  for (const note of notes) {
    for (const line of wrapText(note, BODY, (part) => metrics.width(part, 'sans', 7.5))) {
      cover.push(centered(line, noteY, 'sans', 7.5, 'muted'));
      noteY -= 11;
    }
  }

  const pages: DrawOp[][] = [cover];
  let page: DrawOp[] = [];
  const header = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  const newPage = () => {
    page = [
      { kind: 'text', text: header, x: PAGE.margin, y: PAGE.height - 40, size: 8, font: 'sans', ink: 'muted' },
      { kind: 'rule', x1: PAGE.margin, y1: PAGE.height - 47, x2: PAGE.width - PAGE.margin, y2: PAGE.height - 47, thickness: 0.4, ink: 'muted' },
    ];
    const number = `— ${pages.length + 1} —`;
    page.push(centered(number, 30, 'sans', 8, 'muted'));
    pages.push(page);
    y = PAGE.height - PAGE.top;
  };
  const room = () => y - PAGE.bottom;
  const line = (text: string, style: (typeof TYPE)[keyof typeof TYPE], x: number, ink: Ink) => {
    if (room() < style.leading) newPage();
    page.push({ kind: 'text', text, x, y: y - style.size, size: style.size, font: style.font, ink });
    y -= style.leading;
  };

  if (prepared.length) newPage();
  prepared.forEach((wish, index) => {
    const opening = wish.name.length * TYPE.name.leading + TYPE.date.leading + Math.min(2, wish.message.length) * TYPE.message.leading;
    if (room() < opening) newPage();
    for (const text of wish.name) line(text, TYPE.name, PAGE.margin, 'text');
    line(wish.date, TYPE.date, PAGE.margin, 'muted');
    y -= 3;
    for (const text of wish.message) line(text, TYPE.message, PAGE.margin, 'text');
    if (wish.reply) {
      y -= 6;
      if (room() < TYPE.replyLabel.leading + TYPE.reply.leading) newPage();
      let top = y;
      let current = page;
      const bar = () => current.push({ kind: 'rule', x1: PAGE.margin + 4, y1: top, x2: PAGE.margin + 4, y2: y + 3, thickness: 1, ink: 'accent' });
      line('Balasan tuan rumah', TYPE.replyLabel, PAGE.margin + REPLY_INDENT, 'accent');
      for (const text of wish.reply) {
        if (room() < TYPE.reply.leading) {
          bar();
          newPage();
          top = y;
          current = page;
        }
        line(text, TYPE.reply, PAGE.margin + REPLY_INDENT, 'text');
      }
      bar();
    }
    if (index < prepared.length - 1) {
      y -= 12;
      if (room() > 24) page.push({ kind: 'rule', x1: PAGE.width / 2 - 12, y1: y, x2: PAGE.width / 2 + 12, y2: y, thickness: 0.5, ink: 'muted' });
      y -= 18;
    }
  });

  return { pages, included: count, total: input.total, replaced };
}
