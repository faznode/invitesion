/**
 * Server-side feature flags without a vendor: `FLAG_<NAME>=on|off` (also 1/0, true/false) overrides the default.
 * Defaults: additive guest-page features ship on; changes to how links are minted ship off until the owner opts in.
 * Rollback for a flagged backlog item = set its variable to `off` and redeploy.
 */
const DEFAULTS = {
  /** B-008: countdown and add-to-calendar on guest pages. */
  GUEST_CALENDAR: true,
  /** B-011: new guests receive an opaque link token instead of a name-derived slug. */
  OPAQUE_GUEST_LINKS: false,
  /** B-027: guests may answer "mungkin" (maybe). Off hides the choice and refuses it; stored answers stay readable. */
  RSVP_MAYBE: true,
  /** B-027 (D-034): the host's custom questions in the RSVP form. Off hides them and stores no answers; stored ones stay. */
  RSVP_QUESTIONS: true,
  /**
   * B-027 slice 2c (D-036): an answer per event once the host switches it on for two or more events. Off restores the
   * single answer exactly as before, and the stored per-event answers are neither read nor written.
   */
  RSVP_PER_EVENT: true,
  /**
   * D-037: events a host marks invite-only are shown only to the guests invited to them. Off shows every event to every
   * guest exactly as before; stored invitations (`guests.invited_event_ids`) are neither read nor written.
   */
  INVITE_ONLY_EVENTS: true,
  /**
   * B-009 (D-045): the host's background music, with the "Buka Undangan" cover that starts it on the guest's tap. Off
   * renders every page exactly as before; the stored music settings are neither read nor removed.
   */
  GUEST_MUSIC: true,
  /**
   * F-02 (D-041 (3)): a new invitation starts on the design family chosen for its event type. Off starts new invitations
   * on the legacy layout exactly as before; invitations already created keep whatever layout they have.
   */
  DEFAULT_FAMILY: true,
} as const;

export type FlagName = keyof typeof DEFAULTS;

export function isFlagOn(name: FlagName, env: Record<string, string | undefined> = process.env): boolean {
  const raw = env[`FLAG_${name}`]?.trim().toLowerCase();
  if (raw === 'on' || raw === '1' || raw === 'true') return true;
  if (raw === 'off' || raw === '0' || raw === 'false') return false;
  return DEFAULTS[name];
}
