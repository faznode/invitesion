'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { templates } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { getLocale } from '@/lib/locale-server';
import { OwnershipError, requireOwnedInvitation } from '@/lib/invitation/service';
import { getPublicOrigin } from '@/lib/invitation/public-url';
import { activationPrice, currencyForLocale, tierFor } from '@/lib/pricing';
import { createOrder, hasPaidOrder } from '@/lib/payment/service';
import { ProviderError } from '@/lib/payment/types';

/**
 * Starts payment for an invitation.
 *
 * The price is computed **server-side** from the template tier and the resolved
 * locale. Nothing about the amount comes from the form: a client that could post
 * its own price could buy a premium invitation for one rupiah.
 *
 * The rail follows from the currency (IDR → QRIS, otherwise Stripe), so a
 * customer can never be quoted in one currency and charged on a rail that
 * settles in another.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const invitationId = Number(formData.get('invitationId'));
  if (!Number.isInteger(invitationId) || invitationId <= 0) redirect('/dashboard/invitations?error=invalid');

  let invitation;
  try {
    invitation = await requireOwnedInvitation(invitationId, user.id);
  } catch (error) {
    if (error instanceof OwnershipError) redirect('/dashboard/invitations?error=notfound');
    throw error;
  }

  if (invitation.status === 'PUBLISHED') {
    redirect('/dashboard/invitations?notice=already-published');
  }

  const checkoutPath = `/dashboard/invitations/${invitationId}/checkout`;

  // Entitlement is per (invitation, theme). If the current theme has already
  // been paid for, there is nothing to sell — surface the paid state instead of
  // charging the same pair twice.
  if (await hasPaidOrder(invitationId, invitation.templateId)) {
    redirect(`${checkoutPath}?paid=1`);
  }

  // Tier comes from the template the customer picked, not from the request.
  let isPremium = false;
  if (invitation.templateId) {
    const [template] = await db
      .select({ isPremium: templates.isPremium })
      .from(templates)
      .where(eq(templates.id, invitation.templateId))
      .limit(1);
    isPremium = template?.isPremium ?? false;
  }

  const locale = await getLocale();
  const currency = currencyForLocale(locale === 'en' ? 'en' : 'id');
  const price = activationPrice(isPremium, currency);
  const origin = await getPublicOrigin();

  try {
    const { reference } = await createOrder({
      userId: user.id,
      invitationId,
      templateId: invitation.templateId ?? null,
      price,
      tier: tierFor(isPremium),
      description: `Aktivasi undangan /${invitation.slug}`,
      customerEmail: user.email,
      successUrl: `${origin}${checkoutPath}?paid=1`,
      cancelUrl: `${origin}${checkoutPath}?cancelled=1`,
    });
    redirect(`${checkoutPath}?ref=${reference}`);
  } catch (error) {
    if (error instanceof ProviderError) {
      // A rail that is not configured is an operator problem, not the customer's.
      // Say so plainly instead of showing a generic failure.
      console.error('[checkout] payment rail unavailable', error);
      redirect(`${checkoutPath}?error=rail`);
    }
    throw error;
  }
}
