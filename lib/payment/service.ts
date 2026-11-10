import 'server-only';

import { randomBytes } from 'node:crypto';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { backendFor } from '@/lib/backend';
import { db } from '@/lib/db/drizzle';
import { invitations, jobs, orders, paymentEvents, payments } from '@/lib/db/schema';
import { checkoutIntentHash, resolveExistingCheckout } from './checkout-key';
import { AmountMismatchError, OrderNotFoundError, RailMismatchError } from './errors';
import { money, type Money } from './money';
import { getProvider } from './registry';
import {
  PAYMENT_SETTLED_JOB,
  PAYMENT_SETTLED_MAX_ATTEMPTS,
  decideActivation,
  decideSettlement,
  orderMoney,
  paymentSettledDedupeKey,
  type Activation,
  type PaymentSettledPayload,
} from './settlement-decision';
import { settleThroughApi } from './settlement-api';
import { railForCurrency, type ChargeHandle, type SettlementEvent } from './types';

export { AmountMismatchError, OrderNotFoundError, RailMismatchError, SettlementUnconfirmedError } from './errors';

/** The checkout key was used for another intent (B-039): nothing is written, a fresh page shows the new price. */
export class CheckoutConflictError extends Error {
  constructor() {
    super('This checkout key was used for another price or theme');
    this.name = 'CheckoutConflictError';
  }
}

/** The checkout key's order failed or expired (B-039): that attempt is over, a fresh page starts a new one. */
export class CheckoutClosedError extends Error {
  constructor() {
    super("This checkout key's order is no longer payable");
    this.name = 'CheckoutClosedError';
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

export type CheckoutStart =
  | { kind: 'charge'; orderId: number; reference: string; handle: ChargeHandle; resumed: boolean }
  | { kind: 'paid'; orderId: number; reference: string };

/**
 * Creates a PENDING order and asks the rail for something to pay with.
 *
 * The order row is written *before* contacting the provider. If the provider call
 * then fails, we are left with a pending order and no charge — recoverable, and
 * visible. The reverse order would risk a charge with no order to attach it to,
 * which is money taken for nothing.
 *
 * `templateId` records which theme this order buys. Entitlement is per
 * (invitation, template), so the theme must be captured at the moment of sale —
 * reading it later from the invitation would inherit any theme switch that
 * happened in between.
 *
 * B-039: with a `checkoutKey` the insert is idempotent per (customer, invitation, key) and bound to the intent computed
 * here (`lib/payment/checkout-key.ts`). Concurrent submits under one key meet on the unique index, so exactly one order
 * is written; a submit that finds its key resumes that order's charge under the same reference, reports it paid, or
 * refuses a changed intent (`CheckoutConflictError`) or a closed attempt (`CheckoutClosedError`). The provider is called
 * outside any transaction, and its handle is stored only while the order is still PENDING.
 */
export async function createOrder({
  userId,
  invitationId,
  templateId,
  price,
  tier,
  description,
  customerEmail,
  successUrl,
  cancelUrl,
  checkoutKey = null,
}: {
  userId: number;
  invitationId: number | null;
  templateId: number | null;
  price: Money;
  tier: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  checkoutKey?: string | null;
}): Promise<CheckoutStart> {
  const rail = railForCurrency(price.currency);
  const intent = checkoutKey
    ? checkoutIntentHash({ invitationId, templateId, tier, amount: price.amount, currency: price.currency, rail })
    : null;

  const inserted = await db
    .insert(orders)
    .values({
      userId,
      invitationId,
      templateId,
      tier,
      amount: price.amount,
      currency: price.currency,
      rail,
      reference: newReference(),
      status: 'PENDING',
      checkoutKey,
      checkoutIntent: intent,
    })
    .onConflictDoNothing({
      target: [orders.userId, orders.invitationId, orders.checkoutKey],
      where: sql`${orders.checkoutKey} is not null`,
    })
    .returning({ id: orders.id, reference: orders.reference });

  let order = inserted[0];
  let resumed = false;
  if (!order) {
    // Only a keyed insert can conflict, and the conflicting row has committed by now (the insert waited for it).
    if (!checkoutKey || invitationId === null || !intent) throw new Error('an unkeyed order insert conflicted');
    const [existing] = await db
      .select({ id: orders.id, reference: orders.reference, status: orders.status, checkoutIntent: orders.checkoutIntent })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.invitationId, invitationId), eq(orders.checkoutKey, checkoutKey)))
      .limit(1);
    if (!existing) throw new Error('the conflicting checkout order is gone');
    switch (resolveExistingCheckout(existing, intent)) {
      case 'conflict':
        throw new CheckoutConflictError();
      case 'closed':
        throw new CheckoutClosedError();
      case 'paid':
        return { kind: 'paid', orderId: existing.id, reference: existing.reference };
      case 'resume':
        order = { id: existing.id, reference: existing.reference };
        resumed = true;
    }
  }

  const provider = getProvider(rail);
  const handle = await provider.createCharge({
    reference: order.reference,
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
      .where(and(eq(orders.id, order.id), eq(orders.status, 'PENDING')));
  }

  return { kind: 'charge', orderId: order.id, reference: order.reference, handle, resumed };
}

export type SettleOutcome =
  | { applied: true; orderId: number; invitationActivated: boolean }
  | { applied: false; reason: 'duplicate' | 'already-final' | 'ignored' };

/**
 * The Next.js settlement writer (`BACKEND_PAYMENT=next`, the default): applies a settlement event exactly once. Callers
 * go through `settle`, which selects this writer or the Rust one (`lib/payment/settlement-api.ts`).
 *
 * Idempotency has two layers, and both are needed:
 *
 *  1. `payment_events` UNIQUE(rail, event_id) — a retried *delivery* conflicts
 *     and is skipped. This is what stops a provider's retry storm from doing the
 *     work twice.
 *  2. The order's own status, re-read `FOR UPDATE` inside the transaction and
 *     moved only by a conditional update (`where status = 'PENDING'`) — this is
 *     what stops two *different* events (say a webhook and an operator
 *     confirmation) racing to pay the same order.
 *
 * Everything happens in one transaction: recording the event, moving the order,
 * writing the payment row, activating the invitation and writing the entitlement
 * outbox row. A partial application here is the one outcome with no safe
 * recovery — a customer charged with nothing to show for it. What each event does
 * is `decideSettlement` (lib/payment/settlement-decision.ts), shared with the Rust
 * writer through `contracts/vectors/payment-settlement.json`.
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

    // Decided without the invitation first: only a payment reads (and locks) it. A provider webhook is
    // authenticated, but authentication says who sent it — not that it agrees with what we asked for, so the
    // rail and the amount are checked against the order before anything moves.
    const paidAt = new Date();
    const decision = decideSettlement({ recorded: true, event, order, invitation: null, paidAt });
    switch (decision.outcome) {
      case 'duplicate':
      case 'unknown_order':
        throw new Error(`unreachable settlement decision ${decision.outcome}`);
      case 'rail_mismatch':
        throw new RailMismatchError(event.rail, order.rail);
      case 'amount_unverifiable':
      case 'amount_mismatch':
        throw new AmountMismatchError(orderMoney(order), event.paid);
      case 'already_final':
        return { applied: false, reason: 'already-final' };
      case 'closed': {
        const closed = await tx
          .update(orders)
          .set({ status: decision.status })
          .where(and(eq(orders.id, order.id), eq(orders.status, 'PENDING')))
          .returning({ id: orders.id });
        if (closed.length !== 1) throw new Error('the locked order was not pending');
        return { applied: true, orderId: order.id, invitationActivated: false };
      }
      case 'paid':
        break;
    }

    const moved = await tx
      .update(orders)
      .set({
        status: 'PAID',
        paidAt,
        providerPaymentId: event.providerPaymentId ?? order.providerPaymentId,
      })
      .where(and(eq(orders.id, order.id), eq(orders.status, 'PENDING')))
      .returning({ id: orders.id });
    if (moved.length !== 1) throw new Error('the locked order was not pending');

    const [payment] = await tx
      .insert(payments)
      .values({
        orderId: order.id,
        provider: event.rail,
        transactionId: event.providerPaymentId,
        status: 'PAID',
        rawPayload: event.raw as object,
      })
      .returning({ id: payments.id });

    const activation = await activateInvitation(tx, order, paidAt);

    // The entitlement outbox row (09 §8.6), one per order, in this transaction (services/api/src/payment/outbox.rs).
    const payload: PaymentSettledPayload = {
      orderId: order.id,
      paymentId: payment.id,
      invitationId: order.invitationId,
      templateId: order.templateId,
      activation: activation.kind,
    };
    await tx
      .insert(jobs)
      .values({
        kind: PAYMENT_SETTLED_JOB,
        payload,
        dedupeKey: paymentSettledDedupeKey(order.id),
        runAt: paidAt,
        maxAttempts: PAYMENT_SETTLED_MAX_ATTEMPTS,
      })
      .onConflictDoNothing({ target: [jobs.kind, jobs.dedupeKey] });

    return { applied: true, orderId: order.id, invitationActivated: activation.kind === 'activated' };
  });
}

/**
 * Payment is what makes an invitation live.
 *
 * Only ever moves an unpublished invitation forward, and never resets an existing
 * window — a customer who pays for a second thing on an already-published invitation
 * must not have their remaining active period restarted or shortened.
 *
 * The payment buys the theme recorded on the order. If the invitation switched
 * to a different theme while the charge was in flight, settling the old order
 * must not publish the new theme for free: the entitlement is recorded, and
 * publishing waits until the themes agree again (or the new theme is paid for).
 * Orders without a recorded theme (pre-`template_id` rows) keep the old
 * behaviour and activate unconditionally.
 *
 * B-031 (D-063): a deleted invitation, in its window or purged, is never
 * activated. The money is recorded all the same (the caller has already moved
 * the order to PAID and written the payment); a restore brings the invitation
 * back exactly as it was, and publishing then finds the PAID order. The row lock
 * serialises this with the deletion, which takes the same lock: a deletion that
 * commits first makes this read find nothing.
 */
async function activateInvitation(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  order: { invitationId: number | null; templateId: number | null },
  paidAt: Date,
): Promise<Activation> {
  const invitationId = order.invitationId;
  if (invitationId === null) return decideActivation(order, null, paidAt);

  const [invitation] = await tx
    .select({ id: invitations.id, status: invitations.status, templateId: invitations.templateId, publishedAt: invitations.publishedAt, expiresAt: invitations.expiresAt })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)))
    .limit(1)
    .for('update');

  // A deleted (unfound) row reads as not live and is left as it is.
  const activation = decideActivation(order, invitation ?? null, paidAt);
  if (activation.kind !== 'activated') return activation;

  const activated = await tx
    .update(invitations)
    .set({ status: 'PUBLISHED', publishedAt: activation.publishedAt, expiresAt: activation.expiresAt })
    .where(and(eq(invitations.id, invitationId), isNull(invitations.deletedAt), ne(invitations.status, 'PUBLISHED')))
    .returning({ id: invitations.id });
  if (activated.length !== 1) throw new Error('the locked invitation changed');
  return activation;
}

/**
 * Operator confirmation for rails that cannot deliver a callback.
 *
 * Routed through the same settlement as a webhook (`settle`, whichever writer
 * `BACKEND_PAYMENT` selects) so the two paths cannot diverge — an admin confirming
 * a QRIS transfer and Stripe reporting a charge must produce identical state. The
 * synthetic event id makes the confirmation itself idempotent: pressing the button
 * twice conflicts on the second press. The caller has authorized the administrator.
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

  const due = orderMoney(order);
  return settle({
    rail: order.rail === 'stripe' ? 'stripe' : 'qris',
    eventId: `manual:${reference}`,
    reference,
    providerPaymentId: order.providerPaymentId ?? null,
    status: 'PAID',
    paid: money(due.amount, due.currency),
    raw: { source: 'manual-confirmation', adminUserId, note: note ?? null, at: new Date().toISOString() },
  });
}

/**
 * B-039: the one settlement entry point (the webhook route, the administrator's confirmation). Exactly one writer per
 * call, selected by `BACKEND_PAYMENT` (`lib/backend.ts`, default `next`), and never a fallback to the other: after an
 * unknown outcome the Rust writer retries once under its key and then reports `SettlementUnconfirmedError`.
 */
export async function settle(event: SettlementEvent, env: Record<string, string | undefined> = process.env): Promise<SettleOutcome> {
  return backendFor('PAYMENT', env) === 'rust' ? settleThroughApi(event, env) : applySettlement(event);
}

/**
 * Whether this invitation has been paid for.
 *
 * The entitlement check for publishing. Asked of the orders table rather than
 * tracked as a flag on the invitation, so there is exactly one place where "has
 * this been bought" can be true and no second copy to drift.
 *
 * Entitlement is per (invitation, theme). When `templateId` is passed, only a
 * PAID order for that same theme counts — switching themes means paying the
 * full price again. Orders created before themes were recorded (`template_id`
 * NULL) are grandfathered: they were sold as "this invitation", so they stay
 * valid for whatever theme the invitation currently uses.
 */
export async function hasPaidOrder(invitationId: number, templateId?: number | null): Promise<boolean> {
  const rows = await db
    .select({ templateId: orders.templateId })
    .from(orders)
    .where(and(eq(orders.invitationId, invitationId), eq(orders.status, 'PAID')));
  if (rows.length === 0) return false;
  if (templateId === undefined) return true;
  return rows.some((row) => row.templateId === null || row.templateId === templateId);
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
