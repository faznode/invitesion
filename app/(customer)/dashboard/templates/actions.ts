'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { templates } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { createInvitation } from '@/lib/invitation/create';
import { resolveEventType } from '@/lib/invitation/template-sync';

/**
 * Turns a catalog selection into a real DRAFT invitation and sends the customer
 * straight into the editor. The invitation stays DRAFT until payment, so this
 * is deliberately free of any billing side effect.
 *
 * Kategori tema kini datang dari katalog (11 nilai, mis. 'baby-shower',
 * 'holiday-gathering'); resolveEventType memetakannya ke 6 event type inti
 * yang dipahami pipeline undangan, sekaligus tetap menerima baris seed lama.
 */
export async function useTemplate(formData: FormData) {
  const user = await getUser();
  if (!user || user.role === 'ADMIN') redirect('/sign-in');

  const templateId = Number(formData.get('templateId'));
  if (!Number.isInteger(templateId) || templateId <= 0) {
    redirect('/dashboard/templates?error=invalid');
  }

  const [template] = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
  if (!template) redirect('/dashboard/templates?error=notfound');

  const eventType = resolveEventType(template.category);
  if (!eventType) redirect('/dashboard/templates?error=category');

  const invitation = await createInvitation({
    userId: user.id,
    eventType,
    templateId: template.id,
    title: template.name,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invitations');
  redirect(`/dashboard/invitations/${invitation.id}/edit`);
}
