import { isFlagOn } from '@/lib/flags';
import { calendarEventsFromConfig } from '@/lib/invitation/calendar';
import { corporateMarkOf } from '@/lib/invitation/corporate-mark';
import type { DetailConfig } from '@/lib/invitation/detail-config';
import { eventDateParts, formatEventDate, formatEventTime } from '@/lib/invitation/event-time';
import { invitationDisplayName, invitationHeadline } from '@/lib/invitation/headline';
import { palette } from '@/lib/invitation/palettes';
import { programmeOf } from '@/lib/invitation/programme';
import { rsvpDeadlinePassed } from '@/lib/invitation/rsvp-rules';
import type { Guest, Invitation, MediaAsset } from '@/lib/db/schema';

export type GuestMessage = { id: number; name: string; message: string; createdAt: Date };

export type GuestPageProps = {
  invitation: Invitation;
  config: DetailConfig;
  guest: Guest | null;
  media: MediaAsset[];
  /** The most recent page of guestbook messages, oldest first. */
  messages: GuestMessage[];
  /** Total visible messages, so a capped list can say what it is hiding. */
  totalMessages?: number;
  hiddenMessageCount?: number;
  readOnly: boolean;
  status: { rsvp?: string; wish?: string };
};

/**
 * What every layout derives from the stored config, computed once so the legacy layout and each design family (B-030)
 * show the same data: dates in the event's own zone, the countdown rule, the calendar entry and who may respond.
 */
export function buildGuestView({ invitation, config, guest, media, readOnly }: GuestPageProps) {
  const tone = palette(config.theme?.paletteId);
  // Event-local wall clock with WIB / WITA / WIT from the saved offset, whatever zone the server runs in (B-004).
  const eventZone = config.eventOperations?.timezone;
  const formatDate = (value?: string) => formatEventDate(value, eventZone);
  const formatTime = (value?: string) => formatEventTime(value, eventZone);
  const dateParts = (value?: string) => eventDateParts(value, eventZone);
  const names = invitationHeadline(invitation.eventType, config);
  const events = config.events ?? [];
  const primaryEvent = events[0];
  // B-008: countdown and save-the-date only for a future primary event; the calendar file only exists once published.
  const renderedAt = Date.now();
  const primaryStartMs = primaryEvent?.startAt ? Date.parse(primaryEvent.startAt) : Number.NaN;
  const showCountdown = isFlagOn('GUEST_CALENDAR') && Number.isFinite(primaryStartMs) && primaryStartMs > renderedAt;
  const primaryCalendarEvent =
    showCountdown && primaryEvent && invitation.status === 'PUBLISHED'
      ? calendarEventsFromConfig({ slug: invitation.slug, displayName: invitationDisplayName(invitation.eventType, config), events: [primaryEvent] })[0]
      : undefined;
  const gallery = config.gallery?.enabled !== false ? media.filter((asset) => asset.type === 'photo') : [];
  const canRespond = Boolean(guest) && !readOnly;
  // B-027: the host's RSVP deadline closes the RSVP form only (the guestbook stays open); the action applies the same
  // rule to every POST, so a page rendered before the deadline cannot write after it.
  const rsvpDeadline = config.rsvp?.deadline;
  const rsvpClosedByDeadline = rsvpDeadlinePassed(rsvpDeadline, renderedAt);
  // Shown only when the rule reads the same value, so the page never announces a deadline the action would not enforce.
  const deadlineParts = rsvpDeadline && Number.isFinite(Date.parse(rsvpDeadline)) ? [formatDate(rsvpDeadline), formatTime(rsvpDeadline)] : [];
  const rsvpDeadlineText = deadlineParts.length === 2 && deadlineParts.every(Boolean) ? deadlineParts.join(', ') : undefined;
  const canRsvp = canRespond && !rsvpClosedByDeadline;
  // Small text drawn over a cover photo sits on an opaque page-colour chip: accent tokens clear AA on bg itself, but a
  // dark region of a 20–25 % photo can pull them to 2.8:1 (B-016, tests/palette-contrast.test.ts). No photo, no change.
  // Block-level so the chip never shares a line with the inline guest card that follows it (s15 review F6).
  const coverText = (classes: string) => (config.theme?.cover?.imageUrl ? `${classes} mx-auto block w-fit rounded-2xl ${tone.bg} px-3 py-1` : classes);
  // B-029: who invites. The corporate headline is the event name, so the organisation is shown beside it when both are
  // filled; without an event name the organisation already is the headline and is not repeated.
  const eventName = invitation.eventType === 'corporate' ? config.corporateProfile?.eventName?.trim() : undefined;
  const organisation = config.corporateProfile?.organizationName?.trim();
  const organiser = eventName && organisation && organisation !== eventName ? organisation : undefined;
  // B-029: the programme a corporate host typed, render-when-filled. Corporate invitations only, like the headline, so a
  // profile left from another event type never reaches the page; layouts read `programme`, never the stored profile.
  const programme =
    invitation.eventType === 'corporate'
      ? programmeOf({
          description: config.corporateProfile?.description,
          agenda: config.corporateProfile?.agenda,
          speakers: config.corporateProfile?.speakers,
          dressCode: config.corporateProfile?.dressCode,
          contactName: config.corporateProfile?.contactName,
          contactPhone: config.corporateProfile?.contactPhone,
          contactEmail: config.corporateProfile?.contactEmail,
        })
      : null;
  // B-029: the organiser's logo and the event category, corporate invitations only and render-when-filled (S16-L6).
  const corporateMark =
    invitation.eventType === 'corporate'
      ? corporateMarkOf({
          logoUrl: config.corporateProfile?.logoUrl,
          eventCategory: config.corporateProfile?.eventCategory,
          organisation,
        })
      : null;

  return {
    tone, formatDate, formatTime, dateParts, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, primaryCalendarEvent, gallery,
    canRespond, canRsvp, rsvpDeadlineText, rsvpClosedByDeadline, coverText, programme, organiser, corporateMark,
  };
}

export type GuestView = ReturnType<typeof buildGuestView>;
export type InvitationEvent = GuestView['events'][number];
