/**
 * RSVP attendance rule (B-007, QA-005).
 *
 * `guests.guest_count` is the host's allowance for one personal link. Before B-007 the RSVP action wrote the answer
 * into that column, so "decline" set it to 0 and a later "confirm" was capped at 1. The answer now lives in
 * `attending_count` and the allowance is only ever read.
 */
export const RSVP_STATUSES = ['CONFIRMED', 'DECLINED'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export function isRsvpStatus(value: string): value is RsvpStatus {
  return (RSVP_STATUSES as readonly string[]).includes(value);
}

/** People attending for an answer: 0 on decline, otherwise the requested number clamped to 1…allowance. */
export function rsvpAttendance(status: RsvpStatus, requested: number, allowance: number): number {
  if (status === 'DECLINED') return 0;
  const cap = Number.isInteger(allowance) && allowance > 0 ? allowance : 1;
  const wanted = Number.isFinite(requested) ? Math.trunc(requested) : 1;
  return Math.min(Math.max(wanted, 1), cap);
}

/**
 * RSVP window (B-027). `rsvp.deadline` is an instant saved with the host's offset (detail-config), so the comparison is
 * zone-independent; only its display uses the event's wall clock (B-004). Closed from the deadline instant on. A missing
 * or unreadable deadline never closes RSVP (the lenient read path already drops a section that fails the schema).
 */
export function rsvpDeadlinePassed(deadline: string | undefined, now: number): boolean {
  if (!deadline) return false;
  const at = Date.parse(deadline);
  return Number.isFinite(at) && now >= at;
}

export type RsvpClosedReason = 'disabled' | 'deadline';

/** Why an RSVP write must be refused for this config at `now`, or null. The action applies it to every POST. */
export function rsvpClosedReason(rsvp: { enabled?: boolean; deadline?: string } | undefined, now: number): RsvpClosedReason | null {
  if (rsvp?.enabled === false) return 'disabled';
  if (rsvpDeadlinePassed(rsvp?.deadline, now)) return 'deadline';
  return null;
}

/** What the RSVP form should preselect: the last answer when the guest is attending, else the full allowance. */
export function rsvpDefaultCount(guest: { guestCount: number; attendingCount: number | null }): number {
  const allowance = guest.guestCount > 0 ? guest.guestCount : 1;
  if (guest.attendingCount && guest.attendingCount > 0) return Math.min(guest.attendingCount, allowance);
  return allowance;
}
