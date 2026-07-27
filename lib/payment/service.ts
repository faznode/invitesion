import 'server-only';

import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { orders, paymentEvents, payments } from '@/lib/db/schema';
import { ACTIVE_PERIOD_MONTHS, addMonths } from '@/lib/invitation/publish-rules';
import { invitations } from '@/lib/db/schema';
import { isCurrency, money, sameMoney, type Currency, type Money } from './money';
import { getProvider } from './registry';
import { railForCurrency, type ChargeHandle, type SettlementEvent } from './types';

export class OrderNotFoundError extends Error {
  constructor(reference: string) {
    super(`No order for reference ${reference}`);
    this.name = 'OrderNotFoundError';
  }
}

export class AmountMismatchError extends Error {
  constructor(expected: Money, actual: Money) {
    super(`Provider reported ${actual.amount} ${actual.currency}, order expects ${expected.amount} ${expected.currency}`);
    this.name = 'AmountMismatchError';
  }
}

/**
 * Our order reference.
 *
 * Random rather than sequential: it travels to a third party and appears in
 * customer-visible URLs, so it must not leak how many orders exist or let one
 * customer guess another's.
 */
export function newReference(): string {
  return `vne_${randomBytes(12).toString('hex')}`;
}

/**
 * Creates a PENDING order and asks the rail for something to pay with.
 *
 * The order row is written *before* contacting the provider. If the provider call
 * then fails, we are left with a pending order and no charge — recoverable, and
 * visible. The reverse order would risk a charge with no order to attach it to,
 * which is money taken for nothing.
 */
export async function createOrder({
  userId,
  invitationId,
  price,
  tier,
  description,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  userId: number;
  invitationId: number | null;
  price: Money;
  tier: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: number; reference: string; handle: ChargeHandle }> {
  const rail = railForCurrency(price.currency);
  const reference = newReference();

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      invitationId,
      tier,
      amount: price.amount,
      currency: price.currency,
      rail,
      reference,
      status: 'PENDING',
    })
    .returning();

  const provider = getProvider(rail);
  const handle = await provider.createCharge({
    reference,
    price,
    description,
    customerEmail,
    successUrl,
    cancelUrl,
  });

  if (handle.providerPaymentId || handle.expiresAt) {
    await db
      .update(orders)
      .set({ providerPaymentId: handle.providerPaymentId, expiresAt: handle.expiresAt })
      .where(eq(orders.id, order.id));
  }

  return { orderId: order.id, reference, handle };
}

export type SettleOutcome =
  | { applied: true; orderId: number; invitationActivated: boolean }
  | { applied: false; reason: 'duplicate' | 'already-final' | 'ignored' };

/**
 * Applies a settlement event exactly once.
 *
 * Idempotency has two layers, and both are needed:
 *
 *  1. `payment_events` UNIQUE(rail, event_id) — a retried *delivery* conflicts
 *     and is skipped. This is what stops a provider's retry storm from doing the
 *     work twice.
 *  2. The order's own status, re-read `FOR UPDATE` inside the transaction — this
 *     is what stops two *different* events (say a webhook and an operator
 *     confirmation) racing to pay the same order.
 *
 * Everything happens in one transaction: recording the event, moving the order,
 * writing the payment row, and activating the invitation. A partial application
 * here is the one outcome with no safe recovery — a customer charged with nothing
 * to show for it.
 */
export async function applySettlement(event: SettlementEvent): Promise<SettleOutcome> {
  return db.transaction(async (tx) => {
    // Layer 1: has this exact delivery been seen?
    const recorded = await tx
      .insert(paymentEvents)
      .values({ rail: event.rail, eventId: event.eventId, status: event.status, rawPayload: event.raw as object })
      .onConflictDoNothing({ target: [paymentEvents.rail, paymentEvents.eventId] })
      .returning({ id: paymentEvents.id });

    if (recorded.length === 0) return { applied: false, reason: 'duplicate' };

    // Layer 2: lock the order so concurrent settlement attempts serialise.
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.reference, event.reference))
      .limit(1)
      .for('update');

    if (!order) throw new OrderNotFoundError(event.reference);

    await tx.update(paymentEvents).set({ orderId: order.id }).where(eq(paymentEvents.id, recorded[0].id));

    if (order.status !== 'PENDING') return { applied: false, reason: 'already-final' };

    if (event.status !== 'PAID') {
      await tx.update(orders).set({ status: event.status }).where(eq(orders.id, order.id));
      return { applied: true, orderId: order.id, invitationActivated: false };
    }

    // Never trust the reported amount without checking it. A provider webhook is
    // authenticated, but authentication says who sent it — not that it agrees
    // with what we asked for.
    if (event.paid) {
      const currency: Currency = isCurrency(order.currency) ? order.currency : 'IDR';
      const expected = money(order.amount, currency);
      if (!sameMoney(expected, event.paid)) throw new AmountMismatchError(expected, event.paid);
    }

    const paidAt = new Date();
    await tx
      .update(orders)
      .set({
        status: 'PAID',
        paidAt,
        providerPaymentId: event.providerPaymentId ?? order.providerPaymentId,
      })
      .where(eq(orders.id, order.id));

    await tx.insert(payments).values({
      orderId: order.id,
      provider: event.rail,
      transactionId: event.providerPaymentId,
      status: 'PAID',
      rawPayload: event.raw as object,
    });

    const invitationActivated = await activateInvitation(tx, order.invitationId, paidAt);
    return { applied: true, orderId: order.id, invitationActivated };
  });
}

/**
 * Payment is what makes an invitation live.
 *
 * Only ever moves a DRAFT forward, and never resets an existing window — a
 * customer who pays for a second thing on an already-published invitation must
 * not have their remaining active period restarted or shortened.
 */
async function activateInvitation(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invitationId: number | null,
  paidAt: Date,
): Promise<boolean> {
  if (!invitationId) return false;

  const [invitation] = await tx
    .select({ id: invitations.id, status: invitations.status, publishedAt: invitations.publishedAt, expiresAt: invitations.expiresAt })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1)
    .for('update');

  if (!invitation || invitation.status === 'PUBLISHED') return false;

  const publishedAt = invitation.publishedAt ?? paidAt;
  await tx
    .update(invitations)
    .set({
      status: 'PUBLISHED',
      publishedAt,
      expiresAt: invitation.expiresAt ?? addMonths(publishedAt, ACTIVE_PERIOD_MONTHS),
    })
    .where(eq(invitations.id, invitation.id));

  return true;
}

/**
 * Operator confirmation for rails that cannot deliver a callback.
 *
 * Routed through the same `applySettlement` as a webhook so the two paths cannot
 * diverge — an admin confirming a QRIS transfer and Stripe reporting a charge
 * must produce identical state. The synthetic event id makes the confirmation
 * itself idempotent: pressing the button twice conflicts on the second press.
 */
export async function confirmManually({
  reference,
  adminUserId,
  note,
}: {
  reference: string;
  adminUserId: number;
  note?: string;
}): Promise<SettleOutcome> {
  const [order] = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  if (!order) throw new OrderNotFoundError(reference);

  const currency: Currency = isCurrency(order.currency) ? order.currency : 'IDR';

  return applySettlement({
    rail: order.rail === 'stripe' ? 'stripe' : 'qris',
    eventId: `manual:${reference}`,
    reference,
    providerPaymentId: order.providerPaymentId ?? null,
    status: 'PAID',
    paid: money(order.amount, currency),
    raw: { source: 'manual-confirmation', adminUserId, note: note ?? null, at: new Date().toISOString() },
  });
}

/**
 * Whether this invitation has been paid for.
 *
 * The entitlement check for publishing. Asked of the orders table rather than
 * tracked as a flag on the invitation, so there is exactly one place where "has
 * this been bought" can be true and no second copy to drift.
 */
export async function hasPaidOrder(invitationId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.invitationId, invitationId), eq(orders.status, 'PAID')))
    .limit(1);
  return Boolean(row);
}

/**
 * Invitation ids this user has paid for.
 *
 * One query for a whole list, so rendering N cards does not mean N round trips.
 */
export async function paidInvitationIds(userId: number): Promise<Set<number>> {
  const rows = await db
    .select({ invitationId: orders.invitationId })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'PAID')));
  return new Set(rows.map((row) => row.invitationId).filter((id): id is number => id !== null));
}

/** Orders awaiting operator confirmation, newest first. */
export async function pendingManualOrders(limit = 50) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.status, 'PENDING'), eq(orders.rail, 'qris')))
    .orderBy(sql`${orders.createdAt} desc`)
    .limit(limit);
}
