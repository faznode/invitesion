/**
 * Which implementation writes a migrated data domain (ADR-A2; masterplan 09 §8.3 and §8.8): `BACKEND_<DOMAIN>=next|rust`.
 * Every domain defaults to `next` until its slice has passed the rollout gates, and rollback is setting the variable
 * back to `next`. Callers use exactly one writer per call and never fall back to the other one on failure: a fallback
 * after a timeout could become a second writer for a request the first one already committed.
 */
const DEFAULTS = {
  /** R-02: invitation opens (`analytics_events` VIEW rows, `guests.opened_*`). */
  VIEWS: 'next',
  /**
   * R-03: RSVP answers, the guest's and the host's override (`guests.rsvp_status`, `attending_count`, `rsvp_answers`,
   * `rsvp_event_answers`, and the RSVP `analytics_events` row).
   */
  RSVP: 'next',
  /**
   * R-04: wishes and their moderation (`guest_messages`: the guest's wish with its GUESTBOOK `analytics_events` row, the
   * host's show / hide / delete and reply).
   */
  WISHES: 'next',
} as const satisfies Record<string, Backend>;

export type Backend = 'next' | 'rust';
export type BackendDomain = keyof typeof DEFAULTS;

/** An unknown value selects the domain's default, never the other writer. */
export function backendFor(domain: BackendDomain, env: Record<string, string | undefined> = process.env): Backend {
  const raw = env[`BACKEND_${domain}`]?.trim().toLowerCase();
  return raw === 'rust' || raw === 'next' ? raw : DEFAULTS[domain];
}
