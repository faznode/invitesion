import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { invitations, invitationVersions, templates } from '@/lib/db/schema';
import { detailConfigSchema } from './detail-config';
import { resolveUniqueSlug, slugify } from './slug';

export const EVENT_TYPES = ['wedding', 'birthday', 'aqiqah', 'tasyakuran', 'khitanan', 'corporate'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

async function invitationSlugTaken(candidate: string) {
  const [row] = await db.select({ id: invitations.id }).from(invitations).where(eq(invitations.slug, candidate)).limit(1);
  return Boolean(row);
}

/**
 * Creates a DRAFT invitation for a customer.
 *
 * The template's `defaultConfig` seeds the invitation config so the renderer
 * always has a valid starting shape; an invalid or missing default degrades to
 * an empty config rather than blocking creation. Version 1 is recorded so the
 * revision history has an origin point to roll back to.
 */
export async function createInvitation({
  userId,
  eventType,
  templateId,
  title,
}: {
  userId: number;
  eventType: EventType;
  templateId?: number | null;
  title?: string;
}) {
  let defaultConfig: Record<string, unknown> = {};
  let resolvedTemplateId: number | null = null;

  if (templateId) {
    const [template] = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
    if (template) {
      resolvedTemplateId = template.id;
      const parsed = detailConfigSchema.safeParse(template.defaultConfig ?? {});
      if (parsed.success) defaultConfig = parsed.data as Record<string, unknown>;
    }
  }

  const slug = await resolveUniqueSlug(slugify(title || eventType, eventType), invitationSlugTaken);

  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .insert(invitations)
      .values({ userId, templateId: resolvedTemplateId, slug, eventType, config: defaultConfig, status: 'DRAFT' })
      .returning();

    await tx.insert(invitationVersions).values({
      invitationId: invitation.id,
      versionNo: 1,
      config: defaultConfig,
      createdBy: 'customer',
      isLive: true,
    });

    return invitation;
  });
}
