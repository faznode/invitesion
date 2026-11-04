import type { DetailConfig } from './detail-config';
import { safeImageSrc } from './image-url';

type EventCategory = NonNullable<NonNullable<DetailConfig['corporateProfile']>['eventCategory']>;

/**
 * B-029: guest-facing names of the corporate event categories, the same words the editor offers the host. `other` has
 * no label on purpose: "Lainnya" tells a guest nothing, so the page shows no category at all.
 */
export const EVENT_CATEGORY_LABELS: Record<Exclude<EventCategory, 'other'>, string> = {
  gathering: 'Gathering',
  product_launch: 'Peluncuran produk',
  seminar: 'Seminar',
  conference: 'Konferensi',
  webinar: 'Webinar',
  gala_award: 'Gala / Award',
  rups: 'RUPS',
  training: 'Pelatihan',
};

export type CorporateMark = { logo?: { src: string; alt: string }; category?: string };

/**
 * Logo and category of a corporate invitation, render-when-filled: null when neither would show. The logo is an upload
 * or an http(s) URL (`safeImageSrc`); any other stored scheme renders nothing.
 */
export function corporateMarkOf(input: { logoUrl?: string; eventCategory?: EventCategory; organisation?: string }): CorporateMark | null {
  const src = safeImageSrc(input.logoUrl);
  const category = input.eventCategory && input.eventCategory !== 'other' ? EVENT_CATEGORY_LABELS[input.eventCategory] : undefined;
  if (!src && !category) return null;
  const organisation = input.organisation?.trim();
  return {
    logo: src ? { src, alt: organisation ? `Logo ${organisation}` : 'Logo penyelenggara' } : undefined,
    category,
  };
}
