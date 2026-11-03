import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { invitations, invitationVersions, templates } from '@/lib/db/schema';
import { resolveUniqueSlug, slugify } from './slug';
import { presetConfigFromTemplateDefaults } from './template-defaults';

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
 * always has a valid starting shape. Template-owned keys (`art`) are set aside
 * before the strict schema check (B-001, ADR-O01); a default that is still
 * invalid degrades to an empty config rather than blocking creation. Version 1
 * is recorded so the revision history has an origin point to roll back to.
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
      const preset = presetConfigFromTemplateDefaults(template.defaultConfig);
      if (preset.ok) defaultConfig = preset.config as Record<string, unknown>;
      else console.warn(`[createInvitation] template ${template.id} defaults rejected: ${preset.issues.join('; ')}`);
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
