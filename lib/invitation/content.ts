import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { backendFor } from '@/lib/backend';
import { db } from '@/lib/db/drizzle';
import { invitations, invitationVersions } from '@/lib/db/schema';
import * as api from './content-api';
import * as next from './content-next';
import { normalizeStoredConfig, prepareConfigWrite } from './content-read';
import type { Tier } from '@/lib/pricing';
import type { ContentWriteOutcome } from './content-rules';
import type { DetailConfig } from './detail-config';

/**
 * B-035: the one entry for the editor's content writes. `BACKEND_CONTENT` (default `next`) selects exactly one writer
 * per call; the branch for `rust` returns its own outcome, so the TypeScript writer is never reached as a fallback (a
 * fallback after a timeout could be a second writer for a save the first already committed).
 *
 * The facade owns the content contract (the merge and the strict schema, S18-Q4, D-035, D-036), prepared from the config
 * and version it read in one statement. Each writer re-checks that version under the invitation's row lock before it
 * writes, so a config prepared from anything but the stored one is refused, never stored.
 */

type Env = Record<string, string | undefined>;

/** The signed-in host: the local user id for the TypeScript writer, the session token for the Rust writer. */
export type ContentCaller = { userId: number; ownerToken: () => Promise<string | null> };

export type ContentSaveOutcome = Exclude<ContentWriteOutcome, { kind: 'saved' }> | { kind: 'saved'; version: number; config: DetailConfig };

export type ContentState = {
  /** As stored (the write path's base); readers show `normalizeStoredConfig(config).config`. */
  config: Record<string, unknown>;
  eventType: string;
  /** `max(invitation_versions.version_no)`, 0 for an invitation without a version row. */
  version: number;
};

/** The owner's invitation config with its version as one statement, so the two always belong together. */
export function contentStateQuery(invitationId: number, userId: number) {
  return db
    .select({
      config: invitations.config,
      eventType: invitations.eventType,
      // The id is bound, not correlated: drizzle leaves columns unqualified in a single-table select, so `= ${invitations.id}`
      // would compare with the subquery's own `invitation_versions.id` and load a wrong version (found in s32).
      version: sql<number>`coalesce((select max(${invitationVersions.versionNo}) from ${invitationVersions} where ${invitationVersions.invitationId} = ${invitationId}), 0)`.mapWith(Number),
    })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.userId, userId)))
    .limit(1);
}

export async function loadContentState(invitationId: number, userId: number): Promise<ContentState | null> {
  const [row] = await contentStateQuery(invitationId, userId);
  if (!row) return null;
  return { config: (row.config as Record<string, unknown> | null) ?? {}, eventType: row.eventType, version: row.version };
}

/** What the editor loads and the detail API's GET answers: the lenient read (S18-Q4) and the version it belongs to. */
export async function loadEditorContent(invitationId: number, userId: number): Promise<{ config: DetailConfig; version: number } | null> {
  const state = await loadContentState(invitationId, userId);
  return state ? { config: normalizeStoredConfig(state.config).config, version: state.version } : null;
}

/**
 * B-036: the tier the owner's theme writes are entitled to, for the editor's theme picker (which themes it offers as
 * free switches and which it marks for an upgrade). The writers look it up again under the row lock, so this read only
 * shapes the choices; the server decides. Null when the invitation is not this owner's.
 */
export async function loadThemeTier(invitationId: number, userId: number): Promise<Tier | null> {
  const [row] = await db
    .select({ templateId: invitations.templateId })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.userId, userId)))
    .limit(1);
  return row ? next.themeTierOf(db, invitationId, row.templateId) : null;
}

/**
 * Saves the sections in `patch`. `expectedVersion` is the version the editor loaded (or last saved): a different stored
 * version is a conflict and nothing is written. Without it (a page loaded before B-035) the save is prepared from the
 * version read here, which the writer still checks under the lock.
 */
export async function saveInvitationContent(
  caller: ContentCaller,
  input: { invitationId: number; patch: DetailConfig; expectedVersion?: number | null },
  env: Env = process.env,
): Promise<ContentSaveOutcome> {
  const state = await loadContentState(input.invitationId, caller.userId);
  if (!state) return { kind: 'notfound' };
  if (input.expectedVersion != null && input.expectedVersion !== state.version) {
    return { kind: 'conflict', currentVersion: state.version };
  }
  // S18-Q4 / D-035 (a stored condition naming a deleted question cannot block saving another section; a save of the form
  // itself is checked strictly) and D-036 (events keep their ids; new ones get fresh ids): `prepareConfigWrite`.
  const validated: DetailConfig = prepareConfigWrite(state.config, input.patch);
  const request = { invitationId: input.invitationId, baseVersion: state.version, config: validated, touchedSections: Object.keys(input.patch) };

  let outcome: ContentWriteOutcome;
  if (backendFor('CONTENT', env) === 'rust') {
    const ownerToken = await caller.ownerToken();
    outcome = ownerToken ? await api.writeContentThroughApi({ ...request, ownerToken }, env) : { kind: 'signin' };
  } else {
    outcome = await next.writeContentNext({ ...request, userId: caller.userId });
  }
  return outcome.kind === 'saved' ? { kind: 'saved', version: outcome.version, config: validated } : outcome;
}
