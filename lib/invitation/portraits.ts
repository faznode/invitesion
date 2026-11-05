import { safeImageSrc } from './image-url';

/**
 * s20 (D-038): person photos on the guest page, the last stored-only ceremony field and the couple's and celebrant's photos.
 * One rule set for every layout; layouts only choose the frame.
 *
 * Children's privacy: an aqiqah or khitanan honouree is a child, and a birthday celebrant often is. Such a photo is shown
 * only when the host switched it on (`showPhoto`) and only to someone holding a personal guest link (or the host's own
 * preview): never on the page without a guest link, and never in the link preview (that image carries no photo at all).
 * Adults' photos (the couple, a tasyakuran honouree) are shown once uploaded, as the editor has always offered.
 *
 * Every photo is framed at full strength with no text on it (T1), in a box of fixed aspect so nothing moves while it
 * loads, with an alt text naming the person. Upload paths and http(s) URLs only (`safeImageSrc`).
 */

export type Portrait = { key: string; src: string; alt: string; name?: string; caption?: string };
export type Portraits = { heading: string; people: Portrait[] } | null;
export type PortraitAudience = { personalLink: boolean; preview: boolean };

type Side = { fullName?: string; nickName?: string; parents?: string; order?: number; photoUrl?: string };
const ORDINALS = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];
const clean = (value?: string) => value?.trim() || undefined;

/**
 * The relation a host may already have typed in the parents field ("Putri dari …", "Putra sulung Bapak …"): the word,
 * then an optional rank, before "dari" or a parent's title. s20 acceptance found "Putri kedua dari Putri dari …".
 */
const TYPED_RELATION = new RegExp(
  `^(putra|putri|anak)(\\s+(?:${ORDINALS.join('|')}|sulung|bungsu|tunggal|ke-?\\s?\\d+))?(?=\\s+(?:dari|bapak|ibu|bpk|keluarga|alm|almh|almarhum|almarhumah)\\b)`,
  'i',
);

/**
 * "Putri kedua dari …": the parents line the couple section shows under a name, when the host gave the parents. The
 * editor asks for the parents' names only ("Bapak Budi & Ibu Ani"); when the host typed the relation anyway, their words
 * are kept, with the order the host set added after the relation word only if they wrote no rank of their own.
 */
export function parentsLine(child: 'putra' | 'putri', parents?: string, order?: number): string | undefined {
  const names = clean(parents);
  if (!names) return undefined;
  const rank = order && order >= 1 ? (ORDINALS[order - 1] ?? `ke-${order}`) : undefined;
  const typed = TYPED_RELATION.exec(names);
  if (typed) return typed[2] || !rank ? names : `${typed[1]} ${rank}${names.slice(typed[1].length)}`;
  const word = child === 'putri' ? 'Putri' : 'Putra';
  return `${word}${rank ? ` ${rank}` : ''} dari ${names}`;
}

function sidePortrait(key: string, side: Side | undefined, child: 'putra' | 'putri', fallbackAlt: string): Portrait | null {
  const src = safeImageSrc(side?.photoUrl);
  if (!src) return null;
  const name = clean(side?.fullName) ?? clean(side?.nickName);
  return { key, src, alt: name ? `Foto ${name}` : fallbackAlt, name, caption: parentsLine(child, side?.parents, side?.order) };
}

/** Whether a child's photo may be shown here: the host's consent and a personal guest link (or the host's preview). */
export function childPhotoAllowed(showPhoto: boolean | undefined, audience: PortraitAudience): boolean {
  return showPhoto === true && (audience.personalLink || audience.preview);
}

/** The couple, bride and groom in the host's display order; null without a photo, so pages without photos do not change. */
export function couplePortraits(
  input: { bride?: Side; groom?: Side; displayOrder?: 'bride-first' | 'groom-first' },
): Portraits {
  const bride = sidePortrait('bride', input.bride, 'putri', 'Foto mempelai wanita');
  const groom = sidePortrait('groom', input.groom, 'putra', 'Foto mempelai pria');
  const people = (input.displayOrder === 'groom-first' ? [groom, bride] : [bride, groom]).filter((p): p is Portrait => p !== null);
  return people.length ? { heading: 'Mempelai', people } : null;
}

/**
 * The birthday celebrant, by the child rule whatever the age: a birthday invitation is very often a child's, and a stored
 * age is optional and unchecked, so the photo needs the host's switch and a personal link.
 */
export function birthdayPortrait(
  input: { fullName?: string; nickName?: string; photoUrl?: string; showPhoto?: boolean },
  audience: PortraitAudience,
): Portraits {
  const src = safeImageSrc(input.photoUrl);
  if (!src) return null;
  if (!childPhotoAllowed(input.showPhoto, audience)) return null;
  const name = clean(input.fullName) ?? clean(input.nickName);
  return { heading: 'Yang Berulang Tahun', people: [{ key: 'celebrant', src, alt: name ? `Foto ${name}` : 'Foto yang berulang tahun', name }] };
}

/** The ceremony honouree: aqiqah and khitanan by the child rule; tasyakuran (an adult's thanksgiving) once uploaded. */
export function ceremonyPortrait(
  eventType: string,
  input: { honoureeName?: string; nickName?: string; photoUrl?: string; showPhoto?: boolean },
  audience: PortraitAudience,
): Portrait | null {
  const src = safeImageSrc(input.photoUrl);
  if (!src) return null;
  if (eventType === 'aqiqah' || eventType === 'khitanan') {
    if (!childPhotoAllowed(input.showPhoto, audience)) return null;
  } else if (eventType !== 'tasyakuran') {
    return null;
  }
  const name = clean(input.honoureeName) ?? clean(input.nickName);
  const fallback = eventType === 'aqiqah' ? 'Foto bayi' : eventType === 'khitanan' ? 'Foto anak' : 'Foto';
  return { key: 'honouree', src, alt: name ? `Foto ${name}` : fallback, name };
}
