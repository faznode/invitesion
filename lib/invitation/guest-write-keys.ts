import { createHash } from 'node:crypto';
import type { RsvpFlags, RsvpSubmission } from './rsvp-decision';

/**
 * W1.2 (AM-002, D-072): a guest write's `Idempotency-Key` record as the Rust writer keeps it (`services/api/src/
 * idempotency.rs`, `rsvp/http.rs`, `wishes/http.rs`): the same scope, request hash and stored answer, so a form key
 * recorded by either writer replays in the other after a flip of `BACKEND_RSVP` / `BACKEND_WISHES`. Pinned by
 * `contracts/vectors/guest-write-hashes.json` in both suites. No database here, so the vectors run without one.
 */

/** A guest write's scope: a key replays only for its own guest (E-062). */
export const guestWriteScope = (path: 'rsvp' | 'wish', guestId: number) => `${path}:guest:${guestId}`;

/** UTF-8 byte order, the order of a Rust `BTreeMap<String, _>`. */
const byUtf8 = (a: string, b: string) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));

/** A map as serde_json writes a `BTreeMap`; never `JSON.stringify` of an object, which puts integer-like keys first. */
function sortedMap<T>(record: Record<string, T>, value: (item: T) => string): string {
  const entries = Object.keys(record).sort(byUtf8).map((key) => `${JSON.stringify(key)}:${value(record[key])}`);
  return `{${entries.join(',')}}`;
}

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const nullable = (value: string | null | undefined) => JSON.stringify(value ?? null);

/** The text the Rust writer hashes for an RSVP: serde_json's `[submission, flags]`, fields in declaration order. */
export function rsvpRequestText(submission: RsvpSubmission, flags: RsvpFlags): string {
  const event = (fields: { status: string; guestCount: string | null }) =>
    `{"status":${JSON.stringify(fields.status ?? '')},"guestCount":${nullable(fields.guestCount)}}`;
  const head = `{"status":${JSON.stringify(submission.status ?? '')},"guestCount":${nullable(submission.guestCount)}`;
  const maps = `"events":${sortedMap(submission.events ?? {}, event)},"answers":${sortedMap(submission.answers ?? {}, (values) => JSON.stringify(values))}`;
  const switches = `{"maybe":${flags.maybe},"perEvent":${flags.perEvent},"inviteOnlyEvents":${flags.inviteOnlyEvents},"questions":${flags.questions}}`;
  return `[${head},${maps}},${switches}]`;
}

export const rsvpRequestHash = (submission: RsvpSubmission, flags: RsvpFlags) => sha256(rsvpRequestText(submission, flags));

/** The text the Rust writer hashes for a wish is the message as typed, as a JSON string. */
export const wishRequestHash = (message: string) => sha256(JSON.stringify(message));

/** The 200 bodies the Rust writers record (`RsvpSaved`, `WishSaved`), so either writer reads the other's replay. */
export const rsvpSavedBody = (status: string, attendingCount: number | null) => ({ status, attendingCount });
export const wishSavedBody = (id: number, isHidden: boolean) => ({ id, state: isHidden ? 'PENDING' : 'VISIBLE' });

/** A replayed wish's notice, as the Rust path reads `WishSaved.state`: `PENDING` waits for the host. */
export const replayedWishNotice = (body: unknown): 'pending' | 'saved' =>
  body && typeof body === 'object' && (body as { state?: unknown }).state === 'PENDING' ? 'pending' : 'saved';
