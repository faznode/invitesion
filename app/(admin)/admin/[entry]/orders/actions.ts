'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { assertAuthorizedAdmin, getPrivateAdminPath } from '@/lib/auth/admin-access';
import { AmountMismatchError, OrderNotFoundError, confirmManually } from '@/lib/payment/service';

/**
 * Marks a QRIS order paid after an operator has seen the money arrive.
 *
 * This exists because QRIS without an acquirer has no settlement callback (see
 * `lib/payment/qris-provider.ts`). It routes through the same `applySettlement`
 * as a real webhook, so an operator confirmation and a provider callback cannot
 * produce different state — and the synthetic event id makes pressing the button
 * twice a no-op rather than a double activation.
 *
 * Authorisation is re-checked here, not inherited from the page: a server action
 * is its own entry point and reaching it does not require having rendered the
 * page that links to it.
 */
export async function confirmOrderPaid(formData: FormData): Promise<void> {
  const admin = assertAuthorizedAdmin(await getUser());
  const adminPath = getPrivateAdminPath() ?? '/sign-in';
  const ordersPath = `${adminPath}/orders`;

  const reference = String(formData.get('reference') || '').trim();
  if (!reference) redirect(`${ordersPath}?error=invalid`);

  try {
    const outcome = await confirmManually({
      reference,
      adminUserId: admin.id,
      note: String(formData.get('note') || '').trim() || undefined,
    });

    revalidatePath(ordersPath);
    revalidatePath(adminPath);

    if (!outcome.applied) redirect(`${ordersPath}?notice=${outcome.reason}`);
    redirect(`${ordersPath}?confirmed=${reference}`);
  } catch (error) {
    if (error instanceof OrderNotFoundError) redirect(`${ordersPath}?error=notfound`);
    if (error instanceof AmountMismatchError) redirect(`${ordersPath}?error=amount`);
    throw error;
  }
}
