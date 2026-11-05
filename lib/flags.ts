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
} as const;

export type FlagName = keyof typeof DEFAULTS;

export function isFlagOn(name: FlagName, env: Record<string, string | undefined> = process.env): boolean {
  const raw = env[`FLAG_${name}`]?.trim().toLowerCase();
  if (raw === 'on' || raw === '1' || raw === 'true') return true;
  if (raw === 'off' || raw === '0' || raw === 'false') return false;
  return DEFAULTS[name];
}
