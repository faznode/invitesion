/**
 * Paths for invitation pages, free of server-only imports so client components (the editor) can use them too.
 *
 * Guest-facing format is locked by REBUILD-HANDOFF section 1.5: /i/:invitationSlug/:guestSlug. The guest slug is
 * what makes per-guest personalisation and open tracking possible, so it must never be dropped from a share link.
 */
export function guestPath(invitationSlug: string, guestSlug: string) {
  return `/i/${encodeURIComponent(invitationSlug)}/${encodeURIComponent(guestSlug)}`;
}

export function invitationPath(invitationSlug: string) {
  return `/i/${encodeURIComponent(invitationSlug)}`;
}

/**
 * Side routes of a published invitation (B-008, B-010). Their last segment contains a dot, which no guest slug can
 * (every slug generator emits `[a-z0-9-]` only), so they can never shadow a guest page at `/i/<slug>/<guestSlug>`.
 */
export function invitationCalendarPath(invitationSlug: string) {
  return `${invitationPath(invitationSlug)}/calendar.ics`;
}

export function invitationPreviewImagePath(invitationSlug: string) {
  return `${invitationPath(invitationSlug)}/og.png`;
}

/**
 * The owner's preview of an invitation in any status (B-005): the same renderer guests get, behind the owner's
 * session, without view tracking. Public `/i/<slug>` refuses drafts, so the editor links here instead.
 */
export function ownerPreviewPath(invitationId: number) {
  return `/preview/${encodeURIComponent(String(invitationId))}`;
}
