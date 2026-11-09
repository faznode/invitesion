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
  /**
   * B-019 (I-28): a public upload queues WebP variants (made by the Rust jobs), and the design families offer them in a
   * `srcset` (the lite ladder under `Save-Data: on`). Off queues nothing and renders every image as its original exactly
   * as before; stored variants are neither read nor removed.
   */
  IMAGE_VARIANTS: true,
  /**
   * B-033: the host's guest import (a paste from a spreadsheet or a CSV file, previewed, then written as one batch that
   * can be undone). Off hides the import and refuses it; imported guests stay.
   */
  GUEST_IMPORT: true,
  /**
   * B-033: self-registration links (`/daftar/<token>`) and the host's queue of requests. Off until the owner opts in:
   * the public form collects names and numbers, and its privacy notice waits on B-021's owner-approved text. Off closes
   * every link (404) and hides the queue; stored requests stay.
   */
  SELF_REGISTRATION: false,
  /**
   * B-035: the editor saves by itself shortly after the host stops typing and shows the invitation beside the fields (the
   * owner preview, reloaded after each save). Off until the owner's signed-in check with real keys (06 rollout; DA-01):
   * off is the manual "Simpan" button and the preview in a new tab, exactly as before. Every save carries the loaded
   * version either way, so a stale tab is refused instead of overwriting another tab's edits.
   */
  EDITOR_AUTOSAVE: false,
  /**
   * B-037 (I-08): the catalog's "Pakai tema" opens the wizard (`/buat/<tema>`): names, date and theme, rendered by the real
   * invitation renderer before anything is stored, and saved as a draft after sign-in. Off until the owner's signed-in
   * check with real keys (DA-01: the sign-in and sign-up round trip that must keep the typed draft): off is the old path,
   * exactly as before (sign in, then an empty draft from the theme), and `/buat/*` answers 404.
   */
  CREATION_WIZARD: false,
  /**
   * B-024 (I-01 / I-27, D-056): the guest pass (a signed QR on the guest's personal link, `/i/<slug>/<guest>/pass`) and
   * the host's scanner (`/dashboard/invitations/<id>/checkin`, camera or a handheld scanner, an offline queue, the
   * greeting screen and a manual fallback). Each invitation still opts in (`config.checkInSettings.enabled`). Off: no
   * pass, no scanner, and every pass is inert (the check-in route answers 404); stored check-ins are kept.
   */
  GUEST_PASS: false,
  /**
   * G-044 (D-057): co-hosts and ushers. The owner makes a join link for one role on the invitation's team page
   * (`/dashboard/invitations/<id>/team`); a signed-in customer accepts it at `/gabung/<token>`. A co-host works on the
   * guest list, check-in, wishes and insights; an usher only at the check-in desk. Off until the owner's signed-in check
   * with real keys (DA-01 item 8): off, the team page and the join links answer 404 and every member is refused at the
   * next request, so the invitation is owner-only again; stored grants are kept.
   */
  TEAM_ACCESS: false,
  /**
   * G-045 (D-058): the owner's day-of logs, `/dashboard/invitations/<id>/logs`: seating tables and each guest's table and
   * seat, souvenirs handed out, and a gift log, with CSV exports. Owner-only (no member role holds it). Never read by a
   * guest page, a public payload or the check-in desk. Off: the page, its actions and its exports answer 404 and the
   * manage centre shows seating as before; stored rows are kept and return when it is switched back on.
   */
  HOST_LOGS: false,
} as const;

export type FlagName = keyof typeof DEFAULTS;

export function isFlagOn(name: FlagName, env: Record<string, string | undefined> = process.env): boolean {
  const raw = env[`FLAG_${name}`]?.trim().toLowerCase();
  if (raw === 'on' || raw === '1' || raw === 'true') return true;
  if (raw === 'off' || raw === '0' || raw === 'false') return false;
  return DEFAULTS[name];
}
