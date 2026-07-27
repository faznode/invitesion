import 'server-only';

import { headers } from 'next/headers';

/**
 * Canonical public URLs for the guest-facing invitation.
 *
 * Format is locked by REBUILD-HANDOFF section 1.5:
 *   /i/:invitationSlug/:guestSlug
 *
 * The guest slug is what makes per-guest personalisation and open tracking
 * possible, so it must never be dropped when building a share link.
 */
export function guestPath(invitationSlug: string, guestSlug: string) {
  return `/i/${encodeURIComponent(invitationSlug)}/${encodeURIComponent(guestSlug)}`;
}

export function invitationPath(invitationSlug: string) {
  return `/i/${encodeURIComponent(invitationSlug)}`;
}

/**
 * Absolute origin for links that leave the app (WhatsApp, email).
 * Configured value wins; otherwise fall back to the forwarded request host so
 * local development and preview deployments still produce reachable links.
 */
export async function getPublicOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  if (!host) return '';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}

/** Normalises an Indonesian mobile number into wa.me's digits-only form. */
export function toWhatsAppNumber(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return `62${digits}`;
}
