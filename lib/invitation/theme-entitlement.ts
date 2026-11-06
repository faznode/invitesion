/**
 * Server-side theme entitlement for config writes (B-041, D-042). Pure rules; the database lookup of the invitation's
 * tier lives in `service.ts`.
 *
 * Checkout charges by the tier of the invitation's catalog theme (`invitations.template_id` → `templates.is_premium`),
 * while guests see `config.theme.paletteId` (content contract: `templateId` is host-only and never rendered). Without a
 * check, a Standard invitation could take a Premium palette through the config PATCH, before or after paying.
 *
 * Rules, applied only to fields a write changes, so saving any other part of a stored config never fails:
 * - `paletteId` must be a registered palette, and a Premium palette needs a Premium entitlement. A palette is Premium
 *   when no free catalog theme uses it. The fallback palette is never Premium: a page without a palette renders it.
 * - `templateId` may only name the invitation's own catalog theme (or be cleared). Switching themes is B-036.
 */
import type { Tier } from '../pricing';
import { paletteIds } from './palettes';
import { invitationTemplates } from './templates';

/** What every guest page renders when its palette is missing or unknown (`palette()` in palettes.ts). */
export const FALLBACK_PALETTE_ID = 'ivory';

const STANDARD_PALETTES = new Set<string>([
  FALLBACK_PALETTE_ID,
  ...invitationTemplates.filter((template) => template.tier === 'free').map((template) => template.paletteId),
]);
const REGISTERED_PALETTES = new Set<string>(paletteIds);

/** The tier a palette needs, or null for an id the palette registry does not know. */
export function paletteTier(paletteId: string): Tier | null {
  if (!REGISTERED_PALETTES.has(paletteId)) return null;
  return STANDARD_PALETTES.has(paletteId) ? 'standard' : 'premium';
}

export type ThemeFields = { templateId?: number; paletteId?: string };

/** The theme fields of a stored config, read leniently: stored JSON may predate today's schema. */
export function storedThemeFields(config: unknown): ThemeFields {
  const theme = (config as { theme?: unknown } | null)?.theme;
  if (!theme || typeof theme !== 'object') return {};
  const { templateId, paletteId } = theme as Record<string, unknown>;
  return {
    templateId: typeof templateId === 'number' ? templateId : undefined,
    paletteId: typeof paletteId === 'string' ? paletteId : undefined,
  };
}

/** Fields a write sets to a new value. A cleared field is not a change that needs an entitlement. */
export function changedThemeFields(stored: ThemeFields, next: ThemeFields | undefined): ThemeFields {
  const changed: ThemeFields = {};
  if (next?.templateId !== undefined && next.templateId !== stored.templateId) changed.templateId = next.templateId;
  if (next?.paletteId !== undefined && next.paletteId !== stored.paletteId) changed.paletteId = next.paletteId;
  return changed;
}

export type ThemeEntitlement = {
  /** 'premium' when the invitation's own theme is Premium or a PAID Premium order exists for it. */
  tier: Tier;
  /** The invitation's catalog theme (`invitations.template_id`), or null for a blank invitation. */
  templateId: number | null;
};

export type ThemeIssue = {
  path: 'theme.templateId' | 'theme.paletteId';
  reason: 'theme-switch' | 'unknown-palette' | 'premium-palette';
};

/** Whether the changed fields need the database lookup of the invitation's tier. */
export function needsTierLookup(changed: ThemeFields): boolean {
  return changed.paletteId !== undefined && paletteTier(changed.paletteId) === 'premium';
}

export function themeChangeIssues(changed: ThemeFields, entitlement: ThemeEntitlement): ThemeIssue[] {
  const issues: ThemeIssue[] = [];
  if (changed.templateId !== undefined && changed.templateId !== entitlement.templateId) {
    issues.push({ path: 'theme.templateId', reason: 'theme-switch' });
  }
  if (changed.paletteId !== undefined) {
    const tier = paletteTier(changed.paletteId);
    if (tier === null) issues.push({ path: 'theme.paletteId', reason: 'unknown-palette' });
    else if (tier === 'premium' && entitlement.tier !== 'premium') issues.push({ path: 'theme.paletteId', reason: 'premium-palette' });
  }
  return issues;
}

export class ThemeEntitlementError extends Error {
  constructor(readonly issues: ThemeIssue[]) {
    super(`Theme not included in this invitation: ${issues.map((issue) => `${issue.path} (${issue.reason})`).join(', ')}`);
    this.name = 'ThemeEntitlementError';
  }
}
