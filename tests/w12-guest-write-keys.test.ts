// W1.2 (AM-002, D-072): the default RSVP and wish writers honour the form's key like the Rust writer. Here: the request
// hashes and stored answers against the shared vectors (services/api/tests/guest_write_hash_vectors.rs runs the same
// file against the Rust types), a control showing a naive serialiser misses them, and source-order pins: the replay comes
// before the limiter and the decision, and the key, the product row and the analytics row share one transaction. The
// database behaviour (concurrent twins, replay across writers, an injected failure) runs in the verify scripts.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  guestWriteScope,
  replayedWishNotice,
  rsvpRequestHash,
  rsvpRequestText,
  rsvpSavedBody,
  wishRequestHash,
  wishSavedBody,
} from '../lib/invitation/guest-write-keys';
import type { RsvpFlags, RsvpSubmission } from '../lib/invitation/rsvp-decision';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
type Vectors = {
  rsvp: { name: string; submission: RsvpSubmission; flags: RsvpFlags; canonical: string; expect: string }[];
  wish: { name: string; message: string; canonical: string; expect: string }[];
  saved: { rsvp: { status: string; attendingCount: number | null }[]; wish: { id: number; state: string }[] };
};
const vectors = JSON.parse(source('contracts/vectors/guest-write-hashes.json')) as Vectors;
const ACTIONS = 'app/i/[slug]/actions.ts';

test('RSVP request hashes: the Rust writer\'s canonical text and SHA-256, case by case', () => {
  for (const entry of vectors.rsvp) {
    assert.equal(rsvpRequestText(entry.submission, entry.flags), entry.canonical, entry.name);
    assert.equal(rsvpRequestHash(entry.submission, entry.flags), entry.expect, entry.name);
  }
});

test('wish request hashes: the message as typed, as a JSON string', () => {
  for (const entry of vectors.wish) assert.equal(wishRequestHash(entry.message), entry.expect, entry.name);
});

test('control: JSON.stringify of the submission misses the byte-order cases, so the vectors catch a naive serialiser', () => {
  const naive = (entry: Vectors['rsvp'][number]) => createHash('sha256').update(JSON.stringify([entry.submission, entry.flags])).digest('hex');
  const missed = vectors.rsvp.filter((entry) => naive(entry) !== entry.expect).map((entry) => entry.name);
  assert.ok(missed.some((name) => name.startsWith('per event')), 'integer-like event ids are hoisted by a JS object');
  assert.ok(missed.some((name) => name.startsWith('answers')), 'keys beyond the BMP sort differently in UTF-16');
});

test('stored answers and scopes are the Rust writer\'s', () => {
  for (const body of vectors.saved.rsvp) assert.deepEqual(rsvpSavedBody(body.status, body.attendingCount), body);
  assert.deepEqual(wishSavedBody(7, false), vectors.saved.wish[0]);
  assert.deepEqual(wishSavedBody(8, true), vectors.saved.wish[1]);
  assert.equal(replayedWishNotice({ id: 8, state: 'PENDING' }), 'pending');
  assert.equal(replayedWishNotice({ id: 7, state: 'VISIBLE' }), 'saved');
  assert.equal(replayedWishNotice(null), 'saved');
  assert.equal(guestWriteScope('rsvp', 42), 'rsvp:guest:42');
  assert.equal(guestWriteScope('wish', 42), 'wish:guest:42');
  const rust = source('services/api/src/rsvp/http.rs') + source('services/api/src/wishes/http.rs');
  assert.match(rust, /let scope = format!\("rsvp:guest:\{guest_id\}"\);/);
  assert.match(rust, /let scope = format!\("wish:guest:\{guest_id\}"\);/);
  assert.match(rust, /request_hash\(&\(&request\.submission, &request\.flags\)\)/);
  assert.match(rust, /request_hash\(&request\.message\)/);
});

/** An exported server action's default (`next`) branch: after the Rust branch closes, up to the next declaration. */
function defaultBranch(text: string, name: string): string {
  const start = text.indexOf(`export async function ${name}(`);
  if (start < 0) return '';
  const next = text.slice(start + 1).search(/\n(?:export |async function |function |\/\*\*)/);
  const action = next < 0 ? text.slice(start) : text.slice(start, start + 1 + next);
  const rust = action.indexOf("=== 'rust') {");
  const end = rust < 0 ? -1 : action.indexOf('\n  }\n', rust);
  return end < 0 ? '' : action.slice(end);
}

const inOrder = (text: string, needles: string[]) => {
  const at = needles.map((needle) => text.indexOf(needle));
  const missing = needles.filter((_, i) => at[i] < 0);
  if (missing.length) return missing.map((needle) => `missing ${needle}`);
  return at.slice(1).flatMap((position, i) => (position > at[i] ? [] : [`${needles[i + 1]} before ${needles[i]}`]));
};

function pins(actions: string) {
  const rsvp = defaultBranch(actions, 'submitRsvp');
  const wish = defaultBranch(actions, 'submitGuestMessage');
  return {
    rsvpOrder: inOrder(rsvp, ['await openInvitationFor(', 'await lookupIdempotent(db, rsvpScope, rsvpKey, rsvpHash', "await guestWriteRefusal('rsvp'", 'decideGuestRsvp(', 'db.transaction(']),
    rsvpReplay: [
      ...inOrder(rsvp, ["if (rsvpPrior.kind === 'replay') rsvpSaved(slug, guestSlug);", "if (rsvpPrior.kind === 'mismatch') rsvpKey = randomUUID();"]),
      ...(rsvp.includes("isRsvpFormKey(formRsvpKey) ? formRsvpKey : randomUUID()") ? [] : ['the form key is not read']),
    ],
    rsvpTransaction: [
      // The Rust writer's lock order: the guest's row (`for update`), then the key, then the writes.
      ...inOrder(rsvp, ['db.transaction(async (tx) => {', ".for('update');", 'await recordIdempotent(tx, rsvpScope, key, rsvpHash, 200, rsvpSavedBody(status, attendingCount)', 'await tx.update(guests)', 'await tx.insert(analyticsEvents)']),
      ...(/\bdb\.(?:update|insert)\(/.test(rsvp) ? ['a write outside the transaction'] : []),
    ],
    wishOrder: inOrder(wish, ['await openInvitationFor(', 'await lookupIdempotent(db, wishScope, wishKey, wishHash', "await guestWriteRefusal('wish'", 'decideGuestWish(', 'db.transaction(']),
    wishReplay: [
      ...inOrder(wish, ["if (wishPrior.kind === 'replay') wishAnswered(slug, guestSlug, replayedWishNotice(wishPrior.body));", "if (wishPrior.kind === 'mismatch') wishKey = randomUUID();"]),
      ...(wish.includes('isFormKey(formWishKey) ? formWishKey : randomUUID()') ? [] : ['the form key is not read']),
    ],
    wishTransaction: [
      ...inOrder(wish, ['db.transaction(async (tx) => {', '.insert(guestMessages)', 'await tx.insert(analyticsEvents)', 'await recordIdempotent(tx, wishScope, key, wishHash, 200, wishSavedBody(wish.id, decision.isHidden)', 'tx.rollback()']),
      ...(/\bdb\.(?:update|insert)\(/.test(wish) ? ['a write outside the transaction'] : []),
    ],
    twins: [
      ...(/if \(\(await lookupIdempotent\(db, rsvpScope, rsvpKey, rsvpHash, new Date\(\)\)\)\.kind === 'replay'\) rsvpSaved\(slug, guestSlug\);\n\s+\/\/ .*\n\s+await commitRsvp\(randomUUID\(\)\);/.test(rsvp) ? [] : ['rsvp: a lost race does not replay the twin']),
      ...(/if \(twin\.kind === 'replay'\) wishAnswered\(slug, guestSlug, replayedWishNotice\(twin\.body\)\);\n\s+\/\/ .*\n\s+await commitWish\(randomUUID\(\)\);/.test(wish) ? [] : ['wish: a lost race does not replay the twin']),
    ],
  };
}

const failing = (result: Record<string, string[]>) => Object.keys(result).filter((name) => result[name].length > 0);

test('order: replay, then the limits, then the decision, then one transaction for the key, the row and the analytics row', () => {
  const result = pins(source(ACTIONS));
  assert.deepEqual(failing(result), [], JSON.stringify(result));
});

test('mutation controls: each pin fails on its own mutation and only there', () => {
  const actions = source(ACTIONS);
  const mutate = (from: string, to: string) => {
    assert.ok(actions.includes(from), `the mutation target exists: ${from}`);
    return actions.replace(from, to);
  };
  const limiterFirst = mutate(
    "  const rsvpPrior = await lookupIdempotent(db, rsvpScope, rsvpKey, rsvpHash, new Date());\n",
    "  await guestWriteRefusal('rsvp', context.guest.id);\n  const rsvpPrior = await lookupIdempotent(db, rsvpScope, rsvpKey, rsvpHash, new Date());\n",
  );
  assert.deepEqual(failing(pins(limiterFirst)), ['rsvpOrder']);
  assert.deepEqual(failing(pins(mutate('await tx.update(guests)', 'await db.update(guests)'))), ['rsvpTransaction']);
  assert.deepEqual(failing(pins(mutate(".where(eq(guests.id, context.guest.id)).for('update');", '.where(eq(guests.id, context.guest.id));'))), ['rsvpTransaction']);
  assert.deepEqual(failing(pins(mutate("if (wishPrior.kind === 'mismatch') wishKey = randomUUID();", ''))), ['wishReplay']);
  assert.deepEqual(failing(pins(mutate('wishSavedBody(wish.id, decision.isHidden)', '{ id: wish.id }'))), ['wishTransaction']);
  assert.deepEqual(failing(pins(mutate("if (twin.kind === 'replay') wishAnswered(slug, guestSlug, replayedWishNotice(twin.body));", ''))), ['twins']);
});
