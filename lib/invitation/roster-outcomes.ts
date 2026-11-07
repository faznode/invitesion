import type { ImportDelimiter, ImportParseError, ParsedImportRow } from './guest-import-parse';
import type { ImportPlan, RowReason } from './roster-rules';

/**
 * B-033: what every roster write ends in, whichever writer handled it (`BACKEND_ROSTER`). The TypeScript writer
 * (`roster-next.ts`) returns these directly; the Rust writer's client (`roster-api.ts`) maps the API's answers and
 * problems onto them, so call sites and pages never branch on the writer. Types only; client-safe.
 */

export type RosterOperation = 'sent' | 'checkin' | 'undo-checkin';
export type CategoryMode = 'add' | 'remove';
export type RegistrationLinkAction = 'open' | 'rotate' | 'close';
export type RegistrationDecision = 'approve' | 'reject';

/** Read in Next.js and sent with each write, as the RSVP writer sends its flags. */
export type RosterFlags = { opaqueLinks: boolean; inviteOnlyEvents: boolean };

/**
 * Every owner write can end here: not this owner's invitation or guest; a session the API knows no live customer for
 * (the dashboard's rule is sign-in); or an outcome unknown after one retry under the same idempotency key.
 */
export type OwnerRefusal = { kind: 'notfound' } | { kind: 'signin' } | { kind: 'unconfirmed' };

export type AddOutcome = { kind: 'saved'; id: number; slug: string } | { kind: 'invalid'; reason: RowReason } | { kind: 'full' } | OwnerRefusal;

export type ImportRowVerdict =
  | { status: 'ok'; slug: string }
  | { status: 'invalid'; reason: RowReason }
  | { status: 'duplicate'; of: 'roster' | 'file' };

/** An import's decision as both writers answer it, row by row in file order. */
export type ImportSummary = {
  verdicts: ImportRowVerdict[];
  ok: number;
  invalid: number;
  duplicate: number;
  refusal: ImportPlan['refusal'];
};

export type ImportOutcome =
  /** A preview: nothing was written. */
  | { kind: 'planned'; summary: ImportSummary }
  | { kind: 'imported'; batchId: string; imported: number; summary: ImportSummary }
  /** The whole import was refused (`summary.refusal`); nothing was written. */
  | { kind: 'refused'; summary: ImportSummary }
  | OwnerRefusal;

/** What the import page shows after "Pratinjau": the decoded rows beside the live writer's verdicts, or why not. */
export type ImportPreview =
  | { ok: true; rows: ParsedImportRow[]; delimiter: ImportDelimiter; header: boolean; summary: ImportSummary }
  | { ok: false; error: ImportParseError | 'notfound' | 'unconfirmed'; rowCount?: number };

/** Guests the host has not touched were deleted; any with an open, a send, an answer, a check-in or a wish are kept. */
export type UndoOutcome = { kind: 'undone'; deleted: number; kept: number } | OwnerRefusal;

export type OperationOutcome = { kind: 'saved' } | OwnerRefusal;
export type InvitedOutcome = { kind: 'saved' } | { kind: 'invalid' } | OwnerRefusal;
export type CategoryOutcome = { kind: 'saved'; changed: number } | { kind: 'invalid' } | OwnerRefusal;
export type LinkOutcome = { kind: 'saved'; token: string | null } | OwnerRefusal;

export type DecisionOutcome =
  | { kind: 'approved'; guestId: number }
  | { kind: 'rejected' }
  | { kind: 'full' }
  /** Someone with this number (or, without one, this name) is already a guest; the request stays for the host to reject. */
  | { kind: 'duplicate' }
  | { kind: 'invalid'; reason: RowReason }
  | OwnerRefusal;

/** What the registrant sees. A duplicate is `received` too, so the form never reveals who is on the list. */
export type RegistrationOutcome =
  | { kind: 'received' }
  | { kind: 'invalid'; reason: RowReason }
  | { kind: 'full' }
  | { kind: 'closed' }
  | { kind: 'busy'; retryAfter?: number }
  | { kind: 'unconfirmed'; key: string };
