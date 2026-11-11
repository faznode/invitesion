/**
 * G-018 (I-31): which guest invitation page a request is for, so the root layout can give the document the invitation's
 * language (`<html lang>`). The proxy sets the header from the path it routed (and removes any copy a client sent);
 * the layout reads it back. Pure and dependency-free: the proxy imports this module.
 */
export const GUEST_ROUTE_HEADER = 'x-guest-route';

export type GuestRoute = { slug: string; guestSlug?: string };

/**
 * The header value for `/i/<slug>`, `/i/<slug>/<guest>` and `/i/<slug>/<guest>/pass` (the guest pages that render a
 * document); null for every other path, the guest page's route handlers included (`/photo/<slot>`, `/gift/qris`).
 * Segments stay as the URL carries them; `parseGuestRoute` decodes them like the router decodes `params`.
 */
export function guestRouteHeaderOf(pathname: string): string | null {
  const match = /^\/i\/([^/]+)(?:\/([^/]+)(?:\/pass)?)?\/?$/.exec(pathname);
  if (!match) return null;
  return match[2] ? `${match[1]}/${match[2]}` : match[1];
}

/** The loader's arguments from the header; null when absent or malformed (the document keeps the visitor's locale). */
export function parseGuestRoute(value: string | null | undefined): GuestRoute | null {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length > 2 || parts.some((part) => !part)) return null;
  try {
    const [slug, guestSlug] = parts.map((part) => decodeURIComponent(part));
    return guestSlug ? { slug, guestSlug } : { slug };
  } catch {
    return null;
  }
}
