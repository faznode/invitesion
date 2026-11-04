import type { DetailConfig } from './detail-config';

/**
 * Invitation content contract (s11, `invitation-research/01-codebase-audit/template-editability-s11.md`).
 *
 * One shared, versioned schema for invitation-owned content (`detailConfigSchema`), plus this map of what the guest
 * page actually renders. The editor reads the map to label inputs the guest page does not show yet; a test keeps the
 * map and the renderer in agreement. A field moves from `storedOnly` to `rendered` in the same change that renders it.
 * Type-only import on purpose: the editor (a client component) uses this module without bundling zod; the lenient
 * read path that needs the schema lives in `content-read.ts`.
 */
export const CONTENT_SCHEMA_VERSION = 1;

type Label = { id: string; en: string };

export type SectionCapability = {
  /** Fields the guest page renders (dot paths inside the section; array items use the item field name). */
  rendered: readonly string[];
  /** Fields the editor can store that the guest page does not render. Shown to hosts as "not on the invitation yet". */
  storedOnly: readonly string[];
  /** Fields that are never guest-facing by design (host tools, operations, internal ids). */
  hostOnly?: readonly string[];
  /** Behaviour the editor offers but the product does not perform yet. */
  caveat?: Label;
};

export const RENDER_CAPABILITIES = {
  schemaVersion: { rendered: [], storedOnly: [], hostOnly: ['schemaVersion'] },
  settings: { rendered: ['title', 'openingCopy'], storedOnly: ['fontFamily', 'language'], hostOnly: ['linkSlug'] },
  couple: {
    rendered: ['bride.fullName', 'bride.nickName', 'groom.fullName', 'groom.nickName', 'displayOrder'],
    storedOnly: ['bride.parents', 'bride.photoUrl', 'bride.instagram', 'bride.order', 'groom.parents', 'groom.photoUrl', 'groom.instagram', 'groom.order'],
  },
  birthdayPerson: { rendered: ['fullName', 'nickName'], storedOnly: ['birthDate', 'age', 'parents', 'photoUrl', 'instagram', 'message'] },
  ceremonyProfile: {
    rendered: ['honoureeName', 'nickName'],
    storedOnly: [
      'parents', 'fatherName', 'motherName', 'birthDate', 'birthTime', 'birthPlace', 'age', 'ceremonyNote', 'photoUrl', 'gender',
      'birthWeight', 'birthLength', 'childOrder', 'nameMeaning', 'prayer', 'school', 'circumcisionDate', 'recoveryNote',
      'thanksgivingCategory', 'thanksgivingTitle', 'achievement',
    ],
  },
  corporateProfile: {
    // B-029: the programme renders when filled (`lib/invitation/programme.ts`); logo (an upload or an http(s) URL,
    // `lib/invitation/image-url.ts`) and category above the headline (`lib/invitation/corporate-mark.ts`).
    rendered: [
      'organizationName', 'eventName', 'description', 'agenda', 'speakers', 'dressCode', 'contactName', 'contactPhone', 'contactEmail',
      'eventCategory', 'logoUrl',
    ],
    storedOnly: [],
  },
  theme: { rendered: ['paletteId', 'familyId', 'cover.imageUrl', 'cover.headline'], storedOnly: [], hostOnly: ['templateId'] },
  events: { rendered: ['title', 'startAt', 'endAt', 'venueName', 'address', 'mapUrl', 'note'], storedOnly: [] },
  music: { rendered: [], storedOnly: ['enabled', 'assetUrl', 'title', 'autoplay'] },
  greetings: { rendered: ['enabled', 'prayer'], storedOnly: [] },
  gift: { rendered: ['enabled', 'accounts', 'label', 'number', 'holder', 'note'], storedOnly: ['kind'] },
  // B-027: the deadline is shown in the event's wall clock and closes the form and the action from that instant on.
  rsvp: { rendered: ['enabled', 'deadline'], storedOnly: ['maxGuestsPerRsvp'] },
  gallery: { rendered: ['enabled'], storedOnly: ['layout'], hostOnly: ['assetIds'] },
  streaming: { rendered: ['enabled', 'url'], storedOnly: ['platform', 'scheduledAt'] },
  story: { rendered: ['enabled', 'items', 'date', 'title', 'body'], storedOnly: [] },
  instagramStory: { rendered: [], storedOnly: ['enabled', 'hashtag', 'filterUrl'] },
  quote: { rendered: ['enabled', 'text', 'author'], storedOnly: [] },
  guestbook: {
    rendered: ['enabled', 'heading', 'prompt'],
    storedOnly: ['moderation'],
    caveat: {
      id: 'Moderasi belum aktif: ucapan tamu langsung tampil di undangan.',
      en: 'Moderation is not active yet: guest wishes appear on the invitation right away.',
    },
  },
  eventPlanner: { rendered: [], storedOnly: [], hostOnly: ['enabled', 'eventName', 'coordinatorName', 'coordinatorPhone', 'notes', 'checklist'] },
  registrationForm: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  mealPreferences: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  communications: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  checkInSettings: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  seatingPlan: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  secondaryEvents: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  ticketing: { rendered: [], storedOnly: [], hostOnly: ['*'] },
  eventOperations: { rendered: ['timezone'], storedOnly: [], hostOnly: ['enabled', 'venueContactName', 'venueContactPhone', 'staffNotes', 'maxCheckInsPerMinute'] },
  whatsappTemplate: { rendered: [], storedOnly: [], hostOnly: ['whatsappTemplate'] },
} as const satisfies Record<keyof DetailConfig, SectionCapability>;

export type ContentSection = keyof typeof RENDER_CAPABILITIES;

/** Readable names for stored-only fields, used in the editor notice. Unlisted fields fall back to their key. */
const FIELD_LABELS: Record<string, Label> = {
  fontFamily: { id: 'jenis huruf', en: 'font' },
  language: { id: 'bahasa', en: 'language' },
  parents: { id: 'nama orang tua', en: 'parents' },
  photoUrl: { id: 'foto', en: 'photo' },
  instagram: { id: 'Instagram', en: 'Instagram' },
  order: { id: 'urutan anak', en: 'child order' },
  birthDate: { id: 'tanggal lahir', en: 'birth date' },
  age: { id: 'usia', en: 'age' },
  message: { id: 'pesan', en: 'message' },
  fatherName: { id: 'nama ayah', en: "father's name" },
  motherName: { id: 'nama ibu', en: "mother's name" },
  birthTime: { id: 'jam lahir', en: 'birth time' },
  birthPlace: { id: 'tempat lahir', en: 'birthplace' },
  ceremonyNote: { id: 'catatan acara', en: 'ceremony note' },
  gender: { id: 'jenis kelamin', en: 'gender' },
  birthWeight: { id: 'berat lahir', en: 'birth weight' },
  birthLength: { id: 'panjang lahir', en: 'birth length' },
  childOrder: { id: 'anak ke-', en: 'child order' },
  nameMeaning: { id: 'arti nama', en: 'name meaning' },
  prayer: { id: 'doa', en: 'prayer' },
  school: { id: 'sekolah', en: 'school' },
  circumcisionDate: { id: 'tanggal khitan', en: 'circumcision date' },
  recoveryNote: { id: 'catatan pemulihan', en: 'recovery note' },
  thanksgivingCategory: { id: 'jenis syukuran', en: 'thanksgiving type' },
  thanksgivingTitle: { id: 'judul syukuran', en: 'thanksgiving title' },
  achievement: { id: 'pencapaian', en: 'achievement' },
  eventCategory: { id: 'kategori acara', en: 'event category' },
  contactName: { id: 'nama PIC', en: 'contact name' },
  contactPhone: { id: 'telepon PIC', en: 'contact phone' },
  contactEmail: { id: 'email PIC', en: 'contact email' },
  logoUrl: { id: 'logo', en: 'logo' },
  description: { id: 'deskripsi', en: 'description' },
  dressCode: { id: 'dress code', en: 'dress code' },
  agenda: { id: 'agenda', en: 'agenda' },
  speakers: { id: 'pembicara', en: 'speakers' },
  kind: { id: 'jenis rekening', en: 'account type' },
  deadline: { id: 'batas waktu RSVP', en: 'RSVP deadline' },
  maxGuestsPerRsvp: { id: 'maksimal tamu per RSVP', en: 'max guests per RSVP' },
  layout: { id: 'tata letak galeri', en: 'gallery layout' },
  platform: { id: 'platform', en: 'platform' },
  scheduledAt: { id: 'jadwal siaran', en: 'stream time' },
  moderation: { id: 'moderasi', en: 'moderation' },
};

/** Section of the config that an editor tab edits, per event type (the profile tab differs by event type). */
export function sectionForEditorTab(tab: string, eventType: string): ContentSection | null {
  if (tab === 'couple') {
    if (eventType === 'wedding') return 'couple';
    if (eventType === 'birthday') return 'birthdayPerson';
    if (eventType === 'corporate') return 'corporateProfile';
    return 'ceremonyProfile';
  }
  if (tab === 'whatsapp') return 'whatsappTemplate';
  return tab in RENDER_CAPABILITIES ? (tab as ContentSection) : null;
}

export type StoredOnlyNotice = { wholeSection: boolean; fields: string[]; caveat?: string };

/** What the editor must tell the host about a section: fields saved but not shown to guests, and behaviour caveats. */
export function storedOnlyNotice(section: ContentSection, locale: 'id' | 'en'): StoredOnlyNotice | null {
  const capability: SectionCapability = RENDER_CAPABILITIES[section];
  const labels = [...new Set(capability.storedOnly.map((path) => {
    const leaf = path.split('.').pop() ?? path;
    return FIELD_LABELS[leaf]?.[locale] ?? leaf;
  }))];
  const wholeSection = capability.rendered.length === 0 && capability.storedOnly.length > 0;
  if (!labels.length && !capability.caveat) return null;
  return { wholeSection, fields: wholeSection ? [] : labels, caveat: capability.caveat?.[locale] };
}

