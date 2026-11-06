import 'server-only';

import { randomUUID } from 'node:crypto';
import { ApiProblem, apiConfigFromEnv, apiPostTo } from '@/lib/api/client';
import type { HostRsvpStatus } from './rsvp-events';
import type { RsvpFlags, RsvpSubmission } from './rsvp-decision';

/**
 * R-03: the Rust writer's side of the RSVP call sites (`BACKEND_RSVP=rust`; `next` stays the default). The guest action
 * and the dashboard pick exactly one writer per call and never fall back to the other: a fallback after a timeout could
 * write a second time for a request the first writer already committed. Refusals come back as problems and map to the
 * same notices the TypeScript writer gives; anything else (transport, 5xx) propagates like a database error would.
 */

/** What the guest page says after an RSVP, whichever writer handled it (`?rsvp=`). */
export type GuestRsvpOutcome =
  | { kind: 'saved' }
  | { kind: 'closed' }
  | { kind: 'invalid' }
  | { kind: 'events'; eventId: string }
  | { kind: 'answers'; questionId: string }
  /** B-013: too many writes for this link or address; nothing was written. */
  | { kind: 'busy' };

/** A key minted for one rendered RSVP form, as sent back in its hidden field. */
export const RSVP_KEY_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

/** "." and ".." would be normalised away by URL parsing, and an empty segment names no route: no such link. */
const addressable = (segment: string) => segment !== '' && segment !== '.' && segment !== '..';

function guestOutcome(error: ApiProblem): GuestRsvpOutcome | null {
  switch (error.code) {
    case 'rsvp.link_not_found':
    case 'rsvp.closed':
      return { kind: 'closed' };
    case 'rsvp.status_invalid':
      return { kind: 'invalid' };
    case 'rsvp.event_answer_missing':
      return error.extras.eventId ? { kind: 'events', eventId: error.extras.eventId } : { kind: 'invalid' };
    case 'rsvp.answer_invalid':
      return error.extras.questionId ? { kind: 'answers', questionId: error.extras.questionId } : { kind: 'invalid' };
    case 'rate_limit.exceeded':
      return { kind: 'busy' };
    default:
      return null;
  }
}

export async function writeGuestRsvpThroughApi(
  input: {
    slug: string;
    guestSlug: string;
    submission: RsvpSubmission;
    flags: RsvpFlags;
    /** The guest's public address, for the per-address limit; hashed by the API and never stored. */
    clientIp?: string | null;
    /** The key the rendered form carried; a double submit of one form then writes once. */
    idempotencyKey?: string | null;
  },
  env: Record<string, string | undefined> = process.env,
): Promise<GuestRsvpOutcome> {
  if (!addressable(input.slug) || !addressable(input.guestSlug)) return { kind: 'closed' };
  const config = apiConfigFromEnv(env);
  const body = { submission: input.submission, flags: input.flags, ...(input.clientIp && { clientIp: input.clientIp }) };
  const params = { slug: input.slug, guest: input.guestSlug };
  const post = (idempotencyKey: string | null | undefined) =>
    apiPostTo(config, '/v1/guest-links/{slug}/{guest}/rsvp', params, body, { idempotencyKey });
  try {
    await post(input.idempotencyKey);
    return { kind: 'saved' };
  } catch (error) {
    if (!(error instanceof ApiProblem)) throw error;
    // The form's key with a different answer is a new submission (an old page brought back and changed): send it once
    // more under a fresh key rather than refuse what the guest chose.
    if (error.code === 'idempotency.key_reused') {
      try {
        await post(randomUUID());
        return { kind: 'saved' };
      } catch (retryError) {
        if (!(retryError instanceof ApiProblem)) throw retryError;
        const outcome = guestOutcome(retryError);
        if (outcome) return outcome;
        throw retryError;
      }
    }
    const outcome = guestOutcome(error);
    if (outcome) return outcome;
    throw error;
  }
}

/** What the dashboard says after a host override (`?error=`), or null when it was saved. */
export type HostRsvpOutcome = { kind: 'saved' } | { kind: 'invalid' } | { kind: 'notfound' };

export async function writeHostRsvpThroughApi(
  input: {
    invitationId: number;
    guestId: number;
    status: HostRsvpStatus;
    eventId?: string;
    flags: { perEvent: boolean; inviteOnlyEvents: boolean };
    /** The signed-in owner's session token (Clerk); the API verifies it and resolves the owner from the database. */
    ownerToken: string;
  },
  env: Record<string, string | undefined> = process.env,
): Promise<HostRsvpOutcome> {
  try {
    await apiPostTo(
      apiConfigFromEnv(env),
      '/v1/invitations/{invitation}/guests/{guest}/rsvp-override',
      { invitation: input.invitationId, guest: input.guestId },
      { status: input.status, flags: input.flags, ...(input.eventId !== undefined && { eventId: input.eventId }) },
      { ownerToken: input.ownerToken },
    );
    return { kind: 'saved' };
  } catch (error) {
    if (!(error instanceof ApiProblem)) throw error;
    if (error.code === 'rsvp.override_invalid') return { kind: 'invalid' };
    if (error.code === 'invitation_or_guest.not_found') return { kind: 'notfound' };
    throw error;
  }
}
