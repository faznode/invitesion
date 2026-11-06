import 'server-only';
import { and, asc, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { invitations, invitationVersions, mediaAssets } from '@/lib/db/schema';
import type { MediaAsset } from '@/lib/db/schema';
import { normalizeStoredConfig, prepareConfigWrite } from './content-read';
import type { DetailConfig } from './detail-config';
import { MediaReferenceError, mediaReferenceIssues } from './media-ownership';

export { MediaReferenceError } from './media-ownership';

export class OwnershipError extends Error {
  constructor(message = 'Invitation not found') {
    super(message);
    this.name = 'OwnershipError';
  }
}

/** Resolve an invitation only if it belongs to the given user. */
export async function requireOwnedInvitation(invitationId: number, userId: number) {
  const [row] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.userId, userId)))
    .limit(1);
  if (!row) throw new OwnershipError();
  return row;
}

// ── Detail config ────────────────────────────────────────────
export async function getDetailConfig(
  invitationId: number,
  userId: number,
): Promise<DetailConfig> {
  const inv = await requireOwnedInvitation(invitationId, userId);
  // Stored config may predate this schema; return the valid subset rather than throwing. The guest page's lenient read
  // (S18-Q4), so the editor shows what guests see instead of an empty config when one section fails today's rules.
  return normalizeStoredConfig(inv.config ?? {}).config;
}

export async function updateDetailConfig(
  invitationId: number,
  userId: number,
  patch: DetailConfig,
): Promise<DetailConfig> {
  const inv = await requireOwnedInvitation(invitationId, userId);
  const stored = (inv.config as Record<string, unknown> | null) ?? {};
  // S18-Q4 / D-035 (a stored condition naming a deleted question cannot block saving another section; a save of the form
  // itself is checked strictly) and D-036 (events keep their ids; new ones get fresh ids): `prepareConfigWrite`.
  const validated: DetailConfig = prepareConfigWrite(stored, patch);
  // D-040: a protected path only in this type's child-photo field, and a child photo only from this invitation.
  const mediaIssues = mediaReferenceIssues(validated, { invitationId, eventType: inv.eventType, touchedSections: Object.keys(patch) });
  if (mediaIssues.length) throw new MediaReferenceError(mediaIssues);

  await db.transaction(async (tx) => {
    await tx
      .update(invitations)
      .set({ config: validated })
      .where(eq(invitations.id, invitationId));

    const [{ value: lastNo } = { value: 0 }] = await tx
      .select({ value: max(invitationVersions.versionNo) })
      .from(invitationVersions)
      .where(eq(invitationVersions.invitationId, invitationId));

    await tx
      .update(invitationVersions)
      .set({ isLive: false })
      .where(eq(invitationVersions.invitationId, invitationId));

    await tx.insert(invitationVersions).values({
      invitationId,
      versionNo: (lastNo ?? 0) + 1,
      config: validated,
      createdBy: 'customer',
      isLive: true,
    });
  });

  return validated;
}

// ── Media ordering ───────────────────────────────────────────
export const mediaCreateSchema = z.object({
  type: z.enum(['photo', 'video', 'music']),
  url: z.string().url().max(1000),
  // Explicit 1-based order the asset arrived in (e.g. the order it was sent in
  // chat). This — never the filename/url/id — is the source of ordering truth.
  uploadSequence: z.number().int().positive(),
  source: z.enum(['web', 'chat', 'import']).default('web'),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type MediaCreateInput = z.infer<typeof mediaCreateSchema>;

export const mediaUpdateSchema = z
  .object({
    sortOrder: z.number().int().min(0).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => v.sortOrder !== undefined || v.meta !== undefined, {
    message: 'No updatable fields provided',
  });
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;

export class DuplicateSequenceError extends Error {
  constructor() {
    super('uploadSequence already exists for this invitation');
    this.name = 'DuplicateSequenceError';
  }
}

export async function listMedia(
  invitationId: number,
  userId: number,
): Promise<MediaAsset[]> {
  await requireOwnedInvitation(invitationId, userId);
  // Canonical order is the persisted sortOrder, tie-broken by insertion id.
  // Filenames and URLs are never used for ordering.
  return db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.invitationId, invitationId))
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));
}

export async function addMedia(
  invitationId: number,
  userId: number,
  input: MediaCreateInput,
): Promise<MediaAsset> {
  await requireOwnedInvitation(invitationId, userId);
  try {
    const [row] = await db
      .insert(mediaAssets)
      .values({
        invitationId,
        type: input.type,
        url: input.url,
        // sortOrder is seeded from the explicit upload sequence; a later
        // reorder can change sortOrder without losing uploadSequence.
        sortOrder: input.uploadSequence,
        uploadSequence: input.uploadSequence,
        source: input.source,
        meta: input.meta ?? null,
      })
      .returning();
    return row;
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new DuplicateSequenceError();
    throw err;
  }
}

export async function updateMedia(
  invitationId: number,
  userId: number,
  assetId: number,
  input: MediaUpdateInput,
): Promise<MediaAsset> {
  await requireOwnedInvitation(invitationId, userId);
  const patch: Partial<MediaAsset> = {};
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.meta !== undefined) patch.meta = input.meta;
  const [row] = await db
    .update(mediaAssets)
    .set(patch)
    .where(and(eq(mediaAssets.id, assetId), eq(mediaAssets.invitationId, invitationId)))
    .returning();
  if (!row) throw new OwnershipError('Media asset not found');
  return row;
}

export async function deleteMedia(
  invitationId: number,
  userId: number,
  assetId: number,
): Promise<void> {
  await requireOwnedInvitation(invitationId, userId);
  const [row] = await db
    .delete(mediaAssets)
    .where(and(eq(mediaAssets.id, assetId), eq(mediaAssets.invitationId, invitationId)))
    .returning();
  if (!row) throw new OwnershipError('Media asset not found');
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}
