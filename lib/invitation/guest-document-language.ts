import 'server-only';
import { headers } from 'next/headers';
import { guestLanguageOf, type GuestLanguage } from './guest-copy';
import { GUEST_ROUTE_HEADER, parseGuestRoute } from './guest-route';
import { loadPublicInvitation } from './public';

/**
 * G-018 (I-31): the document language of a guest invitation page, its invitation's language; null for every other page
 * (they keep the visitor's locale) and for an unknown or unpublished invitation (the page answers 404 itself).
 *
 * The loader is wrapped in React `cache()` (B-014 step 1) and is called here with exactly the arguments the page and its
 * metadata use, so the root layout adds no database query to the guest request; no cookie is set either.
 */
export async function guestDocumentLanguage(): Promise<GuestLanguage | null> {
  const route = parseGuestRoute((await headers()).get(GUEST_ROUTE_HEADER));
  if (!route) return null;
  try {
    const data = route.guestSlug ? await loadPublicInvitation(route.slug, route.guestSlug) : await loadPublicInvitation(route.slug);
    return data ? guestLanguageOf(data.config.settings?.language) : null;
  } catch {
    // The page reports its own failure; the document language falls back rather than replacing the page with an error.
    return null;
  }
}
