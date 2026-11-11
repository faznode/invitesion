import { isFlagOn } from '@/lib/flags';
import type { DetailConfig } from './detail-config';
import { visibleEvents } from './event-eligibility';
import { formatEventDate } from './event-time';
import { GUEST_DATE_LOCALE, GUEST_OG_LOCALE, guestCopy, guestLanguageOf } from './guest-copy';
import { invitationDisplayName } from './headline';
import { paletteHex } from './palettes';
import { invitationPreviewImagePath } from './public-path';

/**
 * Link-preview image for WhatsApp and other unfurlers (B-010). One image per invitation, never per guest: guest names
 * stay out of it because the same image is cached and shown to everyone the link is forwarded to.
 * The URL carries a hash of exactly what the image shows, so an edit produces a new URL instead of a stale cached card.
 */
/** The event types the card names; every other type reads "Undangan" (G-018: in the invitation's language). */
const LABELLED_EVENT_TYPES = new Set(['wedding', 'birthday', 'corporate']);

export const PREVIEW_IMAGE_SIZE = { width: 1200, height: 630 } as const;

function clip(value: string, max: number) {
  const chars = [...value];
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : value;
}

/**
 * Glyphs of the font next/og bundles (Noto Sans, latin subset). For anything else next/og fetches glyphs at render
 * time from Google Fonts / jsDelivr with the characters in the query string — that would send parts of customers'
 * names to a third party — and it draws Arabic without bidi shaping. Such names stay out of the image (the label and
 * date remain); the unfurler still shows them in og:title, which it renders itself.
 */
const BUNDLED_FONT_TEXT = /^[\u0020-\u007E\u00A0-\u00FF\u2010-\u2027\u2030-\u203A]*$/;

/**
 * G-018: the card speaks the invitation's language (`settings.language`, Indonesian by default). An Indonesian card's
 * model, and so its version hash, is exactly what it was before G-018, so no cached card is invalidated by the change.
 */
export function previewImageModel(eventType: string, config: DetailConfig, inviteOnlyOn = isFlagOn('INVITE_ONLY_EVENTS')) {
  const copy = guestCopy(guestLanguageOf(config.settings?.language));
  const name = clip(invitationDisplayName(eventType, config, copy.invitation), 48);
  // D-037: the card is shown to anyone the link reaches, so its date is the first open event's, never an invite-only one.
  const [firstOpenEvent] = visibleEvents(config.events, { kind: 'public' }, inviteOnlyOn);
  return {
    label: (LABELLED_EVENT_TYPES.has(eventType) ? copy.kickers[eventType] : undefined) ?? copy.invitation,
    name,
    imageName: BUNDLED_FONT_TEXT.test(name) ? name : null,
    date: formatEventDate(firstOpenEvent?.startAt, config.eventOperations?.timezone, GUEST_DATE_LOCALE[guestLanguageOf(config.settings?.language)]),
    colors: paletteHex(config.theme?.paletteId),
  };
}

export type PreviewImageModel = ReturnType<typeof previewImageModel>;

/** FNV-1a (32-bit) of the model: stable, dependency-free, enough to bust caches. */
export function previewImageVersion(model: PreviewImageModel): string {
  const text = JSON.stringify(model);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** Open Graph + Twitter metadata for a published invitation page (both the general and the personal link). */
export function invitationShareMetadata(invitation: { slug: string; eventType: string }, config: DetailConfig) {
  const model = previewImageModel(invitation.eventType, config);
  const title = config.settings?.title?.trim() || `${model.label} ${model.name}`;
  const description = config.settings?.openingCopy?.trim() || undefined;
  const url = `${invitationPreviewImagePath(invitation.slug)}?v=${previewImageVersion(model)}`;
  const image = { url, ...PREVIEW_IMAGE_SIZE, alt: `${model.label} ${model.name}` };
  return {
    description,
    openGraph: { title, description, type: 'website' as const, locale: GUEST_OG_LOCALE[guestLanguageOf(config.settings?.language)], images: [image] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [url] },
  };
}
