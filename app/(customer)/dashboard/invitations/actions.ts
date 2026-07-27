'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import {
  NotPaidError,
  NotPublishableError,
  OwnershipError,
  publishInvitation,
  unpublishInvitation,
} from '@/lib/invitation/publish';

const LIST_PATH = '/dashboard/invitations';

function parseInvitationId(formData: FormData): number | null {
  const id = Number(formData.get('invitationId'));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Takes an invitation live.
 *
 * Ownership is resolved from the session inside the domain service, never from
 * the submitted id alone — the form field says which invitation, the session
 * says whose. A mismatch surfaces as "not found" so the action cannot be used
 * to probe which invitation ids exist.
 */
export async function publish(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const id = parseInvitationId(formData);
  if (!id) redirect(`${LIST_PATH}?error=invalid`);

  try {
    await publishInvitation(id, user.id);
  } catch (error) {
    if (error instanceof NotPublishableError) {
      redirect(`${LIST_PATH}?error=incomplete&id=${id}&why=${encodeURIComponent(error.reasons.join(' '))}`);
    }
    // Publishing is what the customer buys, so an unpaid invitation is sent to
    // checkout rather than shown an error it cannot act on.
    if (error instanceof NotPaidError) redirect(`/dashboard/invitations/${id}/checkout`);
    if (error instanceof OwnershipError) redirect(`${LIST_PATH}?error=notfound`);
    throw error;
  }

  revalidatePath(LIST_PATH);
  revalidatePath('/dashboard');
  redirect(`${LIST_PATH}?published=${id}`);
}

/** Returns an invitation to DRAFT without touching its paid active window. */
export async function unpublish(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const id = parseInvitationId(formData);
  if (!id) redirect(`${LIST_PATH}?error=invalid`);

  try {
    await unpublishInvitation(id, user.id);
  } catch (error) {
    if (error instanceof OwnershipError) redirect(`${LIST_PATH}?error=notfound`);
    throw error;
  }

  revalidatePath(LIST_PATH);
  revalidatePath('/dashboard');
  redirect(`${LIST_PATH}?unpublished=${id}`);
}
