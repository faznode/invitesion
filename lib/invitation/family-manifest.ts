import type { EventType } from './create';
import { FAMILY_IDS, type FamilyId } from './families';
import type { PortraitFrame } from '@/components/invitation/guest-blocks';

/**
 * B-030 (U7 step 1, `08-template-system-and-harness.md` §8 "Family capabilities"): what each design family declares.
 * The manifest is the source of the section order a family composes (`composeSections` in
 * `components/invitation/family-sections.tsx` calls the layout's renderers in this order) and of its motion tier
 * (`motionClasses`), so changing either is a manifest change the tests and the harness check, never an edit buried in a
 * layout. The family still owns how each section looks; the invitation still owns its content (`DetailConfig`).
 */

/**
 * Every guest-facing section a family composes. This list is also the canonical order: a section a family does not
 * declare is placed after the nearest section before it here and drawn by the shared fallback, never left blank.
 */
export const SECTION_IDS = [
  'cover',
  'notices',
  'greeting',
  'quote',
  'profiles',
  'events',
  'ceremony',
  'programme',
  'story',
  'gallery',
  'streaming',
  'share',
  'gift',
  'rsvp',
  'guestbook',
  'footer',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** The rules every family's order keeps: who reads what before acting. `[a, b]` means a comes before b. */
export const CONTRACT_ORDER_RULES: readonly (readonly [SectionId, SectionId])[] = [
  // The time and place come before the RSVP form and the gift details.
  ['events', 'rsvp'],
  ['events', 'gift'],
  // The RSVP comes before the guestbook; both forms close the page.
  ['rsvp', 'guestbook'],
  ['gift', 'rsvp'],
];

/**
 * Motion tiers. Tier 0: nothing moves. Tier 1: a one-time entrance (`inv-rise`, opacity and transform only, switched off
 * under `prefers-reduced-motion` in `app/globals.css`), never on the names, so they paint first. A higher tier
 * (scroll-linked or ambient motion) does not exist until it has a byte budget, a reduced-motion fallback and a written
 * review; the validator refuses any other value.
 */
export const MOTION_TIERS = {
  0: { label: 'still', classes: [] as readonly string[] },
  1: { label: 'entrance', classes: ['inv-rise'] as readonly string[] },
} as const;
export type MotionTier = keyof typeof MOTION_TIERS;

/** The entrance class a tier allows; `rise('mt-6 …')` prefixes it, and adds nothing on tier 0. */
export function motionClasses(tier: MotionTier) {
  const entrance = MOTION_TIERS[tier].classes[0] ?? '';
  return { rise: (classes = '') => [entrance, classes].filter(Boolean).join(' ') };
}

/** An aspect window as the layout draws it: a CSS ratio, or `bounded` where the height follows the viewport (S18-G2). */
export type Aspect = '4:3' | '3:4' | '1:1' | 'bounded';

export type FamilyManifest = {
  schemaVersion: 1;
  family: FamilyId;
  /** The order the layout composes its sections in. */
  sections: readonly SectionId[];
  /** Sections the cover draws inside itself (Lontar's opening words sit under the greeting); never composed twice. */
  coverIncludes: readonly SectionId[];
  /** This family's own order rules on top of `CONTRACT_ORDER_RULES`. */
  orderRules: readonly (readonly [SectionId, SectionId])[];
  /** Every event type the family renders (all of them: a template change never requires a content change). */
  eventTypes: readonly EventType[];
  /** The event types a new invitation starts on this family for (F-02, `defaultFamilyFor`). */
  startsNewFor: readonly EventType[];
  photoSlots: {
    cover: { phone: Aspect; wide: Aspect };
    portrait: PortraitFrame;
    gallery: { tile: Aspect; columns: { phone: number; wide: number } };
  };
  /** Where the organiser's logo sits on the cover (B-029). */
  logoFrame: 'center' | 'start';
  motionTier: MotionTier;
  /** B-009: the cover gate and the music are one shared island around every layout; a layout never draws its own. */
  music: { coverGate: 'shared'; audio: 'shared' };
  /** B-016: every registered palette's tokens (contrast-checked per family in the rendered sweep). */
  palettes: 'all-registered';
  /** Q-D17: judged by `PRODUCT_PAGE_BUDGETS.familyKiB` on design bytes (`tools/template-harness/policy.ts`). */
  byteBudget: { familyKiB: number; basis: 'design' };
  provenance: {
    fonts: readonly ('font-serif' | 'font-sans')[];
    /** Ornament drawn in CSS (no image, font or audio asset ships with a family). */
    art: 'css-only';
    brief: string;
  };
};

const ALL_EVENT_TYPES: readonly EventType[] = ['wedding', 'birthday', 'aqiqah', 'tasyakuran', 'khitanan', 'corporate'];
const SHARED = {
  schemaVersion: 1,
  eventTypes: ALL_EVENT_TYPES,
  music: { coverGate: 'shared', audio: 'shared' },
  palettes: 'all-registered',
  byteBudget: { familyKiB: 80, basis: 'design' },
} as const;
const fonts = ['font-serif', 'font-sans'] as const;

export const FAMILY_MANIFESTS: Record<FamilyId, FamilyManifest> = {
  // Ceremonial: the opening words and the verse first, then the couple, then the day.
  gapura: {
    ...SHARED,
    family: 'gapura',
    sections: ['cover', 'notices', 'greeting', 'quote', 'profiles', 'events', 'ceremony', 'programme', 'story', 'gallery', 'streaming', 'share', 'gift', 'rsvp', 'guestbook', 'footer'],
    coverIncludes: [],
    orderRules: [
      ['greeting', 'events'],
      ['profiles', 'events'],
    ],
    startsNewFor: ['wedding'],
    photoSlots: { cover: { phone: '4:3', wide: 'bounded' }, portrait: 'arch', gallery: { tile: '3:4', columns: { phone: 2, wide: 2 } } },
    logoFrame: 'center',
    motionTier: 1,
    provenance: { fonts, art: 'css-only', brief: 'templates/_briefs/gapura.md' },
  },
  // A stack of printed cards, in the ceremonial order.
  kartu: {
    ...SHARED,
    family: 'kartu',
    sections: ['cover', 'notices', 'greeting', 'quote', 'profiles', 'events', 'ceremony', 'programme', 'story', 'gallery', 'streaming', 'share', 'gift', 'rsvp', 'guestbook', 'footer'],
    coverIncludes: [],
    orderRules: [
      ['greeting', 'events'],
      ['profiles', 'events'],
    ],
    startsNewFor: [],
    photoSlots: { cover: { phone: '4:3', wide: 'bounded' }, portrait: 'card', gallery: { tile: '1:1', columns: { phone: 2, wide: 2 } } },
    logoFrame: 'start',
    motionTier: 0,
    provenance: { fonts, art: 'css-only', brief: 'templates/_briefs/kartu.md' },
  },
  // A celebration leads with who and when; the opening words follow the facts, in alternating bands.
  riang: {
    ...SHARED,
    family: 'riang',
    sections: ['cover', 'notices', 'profiles', 'events', 'ceremony', 'programme', 'greeting', 'quote', 'story', 'gallery', 'streaming', 'share', 'gift', 'rsvp', 'guestbook', 'footer'],
    coverIncludes: [],
    orderRules: [
      ['events', 'greeting'],
      ['events', 'quote'],
    ],
    startsNewFor: ['birthday', 'aqiqah', 'tasyakuran', 'khitanan'],
    photoSlots: { cover: { phone: '1:1', wide: '1:1' }, portrait: 'round', gallery: { tile: '1:1', columns: { phone: 2, wide: 3 } } },
    logoFrame: 'center',
    motionTier: 1,
    provenance: { fonts, art: 'css-only', brief: 'templates/_briefs/riang.md' },
  },
  // Programme-led: the agenda comes before the events with address and map; the opening words sit in the cover letter.
  lontar: {
    ...SHARED,
    family: 'lontar',
    sections: ['cover', 'notices', 'profiles', 'ceremony', 'programme', 'events', 'quote', 'story', 'gallery', 'streaming', 'share', 'gift', 'rsvp', 'guestbook', 'footer'],
    coverIncludes: ['greeting'],
    orderRules: [
      ['programme', 'events'],
      ['ceremony', 'events'],
    ],
    startsNewFor: ['corporate'],
    photoSlots: { cover: { phone: '4:3', wide: 'bounded' }, portrait: 'leaf', gallery: { tile: '1:1', columns: { phone: 2, wide: 3 } } },
    logoFrame: 'start',
    motionTier: 0,
    provenance: { fonts, art: 'css-only', brief: 'templates/_briefs/lontar.md' },
  },
};

/**
 * The order a page is composed in: the family's declared sections, then every section it neither declares nor draws in
 * its cover, each placed after the nearest section before it in `SECTION_IDS` (the shared fallback draws it).
 */
export function composedSectionOrder(manifest: FamilyManifest): SectionId[] {
  const order = [...manifest.sections];
  for (const id of SECTION_IDS) {
    if (order.includes(id) || manifest.coverIncludes.includes(id)) continue;
    const canonical = SECTION_IDS.indexOf(id);
    let at = 0;
    for (let index = order.length - 1; index >= 0; index--) {
      if (SECTION_IDS.indexOf(order[index]) < canonical && order[index] !== 'footer') {
        at = index + 1;
        break;
      }
    }
    order.splice(at, 0, id);
  }
  return order;
}

/** Every problem with a manifest, empty when it is valid; the tests and `pnpm harness families` run it on each family. */
export function validateFamilyManifest(manifest: FamilyManifest): string[] {
  const problems: string[] = [];
  const where = (id: SectionId) => manifest.sections.indexOf(id);
  if (manifest.schemaVersion !== 1) problems.push(`schemaVersion ${manifest.schemaVersion} is not 1`);
  if (!(FAMILY_IDS as readonly string[]).includes(manifest.family)) problems.push(`unknown family ${manifest.family}`);
  const seen = new Set<string>();
  for (const id of [...manifest.sections, ...manifest.coverIncludes]) {
    if (!(SECTION_IDS as readonly string[]).includes(id)) problems.push(`unknown section ${id}`);
    if (seen.has(id)) problems.push(`section ${id} is declared twice`);
    seen.add(id);
  }
  if (manifest.sections[0] !== 'cover') problems.push('the cover comes first');
  if (manifest.sections[1] !== 'notices') problems.push('the notices follow the cover, before any other section');
  if (manifest.sections.at(-1) !== 'footer') problems.push('the footer comes last');
  for (const id of manifest.coverIncludes) if (id === 'cover' || id === 'notices' || id === 'footer') problems.push(`the cover cannot include ${id}`);
  const composed = composedSectionOrder(manifest);
  for (const [first, then] of [...CONTRACT_ORDER_RULES, ...manifest.orderRules]) {
    const a = composed.indexOf(first);
    const b = composed.indexOf(then);
    if (a >= 0 && b >= 0 && a > b) problems.push(`${first} must come before ${then}`);
  }
  for (const [first, then] of manifest.orderRules) {
    if (where(first) < 0 || where(then) < 0) problems.push(`order rule ${first} → ${then} names a section the family does not compose`);
  }
  if (!(manifest.motionTier in MOTION_TIERS)) problems.push(`motion tier ${manifest.motionTier} does not exist`);
  for (const type of ALL_EVENT_TYPES) if (!manifest.eventTypes.includes(type)) problems.push(`event type ${type} is not rendered`);
  for (const type of manifest.startsNewFor) if (!manifest.eventTypes.includes(type)) problems.push(`starts new ${type} invitations it does not render`);
  if (manifest.provenance.fonts.length > 2) problems.push('more than two font families');
  if (manifest.byteBudget.familyKiB <= 0) problems.push('no byte budget');
  return problems;
}
