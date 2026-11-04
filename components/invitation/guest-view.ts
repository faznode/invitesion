import { isFlagOn } from '@/lib/flags';
import { calendarEventsFromConfig } from '@/lib/invitation/calendar';
import type { DetailConfig } from '@/lib/invitation/detail-config';
import { eventDateParts, formatEventDate, formatEventTime } from '@/lib/invitation/event-time';
import { invitationDisplayName, invitationHeadline } from '@/lib/invitation/headline';
import { palette } from '@/lib/invitation/palettes';
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

  return { tone, formatDate, formatTime, dateParts, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, primaryCalendarEvent, gallery, canRespond };
}

export type GuestView = ReturnType<typeof buildGuestView>;
export type InvitationEvent = GuestView['events'][number];
