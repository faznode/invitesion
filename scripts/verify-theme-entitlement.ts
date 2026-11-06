/**
 * Database-backed proof of B-041 (s26, E-054; D-042) against a scratch database: the config writer refuses a theme the
 * invitation's package does not include, through the real catalog, checkout tier and settlement.
 *
 *   POSTGRES_URL=postgres://postgres@127.0.0.1:5433/invitesion npx tsx scripts/verify-theme-entitlement.ts
 *
 * Needs a CUSTOMER row (pnpm db:seed) and the theme catalog (pnpm db:seed:templates). Scenarios:
 * - a Standard invitation, published by a settled Standard order, cannot take a Premium palette or another catalog theme,
 *   and the refused write leaves the stored config and the version history untouched;
 * - the same invitation keeps saving other theme fields, may take another Standard palette, and refuses unknown palettes;
 * - after a settled Premium order for it, the Premium palette is accepted;
 * - an unpaid Standard draft cannot take a Premium palette (it would be charged Standard); a Premium draft can.
 * Every row it creates is removed at the end.
 */
import Module from 'node:module';

const load = (Module as unknown as { _load: (r: string, ...rest: unknown[]) => unknown })._load;
(Module as unknown as { _load: unknown })._load = function (this: unknown, request: string, ...rest: unknown[]) {
  if (request === 'server-only') return {};
  return load.call(this, request, ...rest);
};

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
}

async function main() {
  const { and, count, eq, inArray } = await import('drizzle-orm');
  const { db, client } = await import('@/lib/db/drizzle');
  const { invitations, invitationVersions, orders, paymentEvents, payments, templates, users } = await import('@/lib/db/schema');
  const { createInvitation } = await import('@/lib/invitation/create');
  const { ThemeEntitlementError, updateDetailConfig } = await import('@/lib/invitation/service');
  const { paletteTier } = await import('@/lib/invitation/theme-entitlement');
  const { applySettlement, newReference } = await import('@/lib/payment/service');
  const { money } = await import('@/lib/payment/money');
  const { activationPrice, tierFor } = await import('@/lib/pricing');

  const [customer] = await db.select().from(users).where(eq(users.role, 'CUSTOMER')).limit(1);
  if (!customer) throw new Error('No CUSTOMER user found. Run pnpm db:seed first.');
  const catalog = await db.select({ id: templates.id, isPremium: templates.isPremium }).from(templates);
  const freeTheme = catalog.find((template) => !template.isPremium);
  const premiumTheme = catalog.find((template) => template.isPremium);
  if (!freeTheme || !premiumTheme) throw new Error('Theme catalog missing. Run pnpm db:seed:templates first.');

  const createdInvitations: number[] = [];
  const createdOrders: number[] = [];

  async function settle(invitationId: number, templateId: number, isPremium: boolean) {
    const price = activationPrice(isPremium);
    const reference = newReference();
    const [order] = await db
      .insert(orders)
      .values({ userId: customer.id, invitationId, templateId, tier: tierFor(isPremium), amount: price.amount, currency: price.currency, rail: 'qris', reference, status: 'PENDING' })
      .returning({ id: orders.id });
    createdOrders.push(order.id);
    return applySettlement({
      rail: 'qris',
      eventId: `theme-check-${reference}`,
      reference,
      providerPaymentId: null,
      status: 'PAID',
      paid: money(price.amount, price.currency),
      raw: { source: 'verify-theme-entitlement' },
    });
  }

  async function stored(invitationId: number) {
    const [row] = await db.select({ config: invitations.config }).from(invitations).where(eq(invitations.id, invitationId));
    const [{ value }] = await db.select({ value: count() }).from(invitationVersions).where(eq(invitationVersions.invitationId, invitationId));
    return { theme: ((row.config ?? {}) as { theme?: Record<string, unknown> }).theme ?? {}, versions: value };
  }

  async function attempt(invitationId: number, theme: Record<string, unknown>) {
    try {
      await updateDetailConfig(invitationId, customer.id, { theme } as never);
      return { ok: true as const };
    } catch (error) {
      if (error instanceof ThemeEntitlementError) return { ok: false as const, reasons: error.issues.map((issue) => issue.reason) };
      throw error;
    }
  }

  try {
    const standardInvitation = await createInvitation({ userId: customer.id, eventType: 'wedding', templateId: freeTheme.id, title: 'theme check standard' });
    createdInvitations.push(standardInvitation.id);
    const settled = await settle(standardInvitation.id, freeTheme.id, false);
    check('a settled Standard order publishes the Standard invitation', settled.applied && settled.invitationActivated === true);

    const before = await stored(standardInvitation.id);
    const ownPalette = String(before.theme.paletteId ?? '');
    check("the invitation starts on its catalog theme's Standard palette", paletteTier(ownPalette) === 'standard', ownPalette);

    const premiumPalette = await attempt(standardInvitation.id, { ...before.theme, paletteId: 'midnight' });
    check('published Standard → Premium palette is refused', !premiumPalette.ok && premiumPalette.reasons.includes('premium-palette'));
    const afterRefusal = await stored(standardInvitation.id);
    check('the refused write leaves the stored palette', afterRefusal.theme.paletteId === ownPalette, String(afterRefusal.theme.paletteId));
    check('the refused write adds no version', afterRefusal.versions === before.versions, `${before.versions} → ${afterRefusal.versions}`);

    const otherTheme = await attempt(standardInvitation.id, { ...before.theme, templateId: premiumTheme.id });
    check('published Standard → another catalog theme is refused', !otherTheme.ok && otherTheme.reasons.includes('theme-switch'));

    const unknown = await attempt(standardInvitation.id, { ...before.theme, paletteId: 'neon' });
    check('an unknown palette is refused', !unknown.ok && unknown.reasons.includes('unknown-palette'));

    const layoutOnly = await attempt(standardInvitation.id, { ...before.theme, familyId: 'gapura' });
    const afterLayout = await stored(standardInvitation.id);
    check('saving another theme field with the stored palette still works', layoutOnly.ok && afterLayout.theme.familyId === 'gapura');
    check('that save adds one version', afterLayout.versions === before.versions + 1, `${before.versions} → ${afterLayout.versions}`);

    const otherStandard = ownPalette === 'sage' ? 'sand' : 'sage';
    const standardSwitch = await attempt(standardInvitation.id, { ...afterLayout.theme, paletteId: otherStandard });
    check('another Standard palette is accepted', standardSwitch.ok, otherStandard);

    const upgrade = await settle(standardInvitation.id, premiumTheme.id, true);
    check('a Premium order for the same invitation settles', upgrade.applied);
    const afterUpgrade = await stored(standardInvitation.id);
    const premiumAfterOrder = await attempt(standardInvitation.id, { ...afterUpgrade.theme, paletteId: 'midnight' });
    check('with a settled Premium order the Premium palette is accepted', premiumAfterOrder.ok);

    const draft = await createInvitation({ userId: customer.id, eventType: 'wedding', templateId: freeTheme.id, title: 'theme check draft' });
    createdInvitations.push(draft.id);
    const draftTheme = (await stored(draft.id)).theme;
    const unpaid = await attempt(draft.id, { ...draftTheme, paletteId: 'gold-noir' });
    check('an unpaid Standard draft cannot take a Premium palette', !unpaid.ok && unpaid.reasons.includes('premium-palette'));

    const premiumDraft = await createInvitation({ userId: customer.id, eventType: 'wedding', templateId: premiumTheme.id, title: 'theme check premium' });
    createdInvitations.push(premiumDraft.id);
    const premiumDraftTheme = (await stored(premiumDraft.id)).theme;
    const premiumOk = await attempt(premiumDraft.id, { ...premiumDraftTheme, paletteId: 'gold-noir' });
    check('a draft on a Premium theme may take a Premium palette (checkout charges Premium)', premiumOk.ok);
  } finally {
    if (createdOrders.length) {
      await db.delete(paymentEvents).where(inArray(paymentEvents.orderId, createdOrders));
      await db.delete(payments).where(inArray(payments.orderId, createdOrders));
      await db.delete(orders).where(inArray(orders.id, createdOrders));
    }
    if (createdInvitations.length) {
      await db.delete(invitationVersions).where(inArray(invitationVersions.invitationId, createdInvitations));
      await db.delete(invitations).where(and(inArray(invitations.id, createdInvitations), eq(invitations.userId, customer.id)));
    }
    await client.end();
  }

  console.log(failures ? `\n${failures} check(s) FAILED.` : '\nverify-theme-entitlement: all checks passed');
  process.exitCode = failures ? 1 : 0;
}

main().catch((error) => {
  console.error('FAIL  unexpected error:', error);
  process.exitCode = 1;
});
