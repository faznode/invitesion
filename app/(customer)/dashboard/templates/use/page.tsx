import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { createInvitation } from '@/lib/invitation/create';
import { getTemplateRowBySlug, resolveEventType } from '@/lib/invitation/template-sync';

export const dynamic = 'force-dynamic';

/**
 * Pintu masuk dari katalog publik: /dashboard/templates/use?slug=<tema>.
 *
 * Tombol “Pakai tema” di /templates dan /templates/[slug] menunjuk ke sini.
 * Middleware sudah memagari /dashboard, jadi pengunjung yang belum login
 * diarahkan ke sign-in dulu dan kembali ke URL ini setelah autentikasi —
 * pilihan temanya tidak hilang di tengah jalan.
 *
 * getTemplateRowBySlug meng-upsert baris DB dari katalog kode saat itu juga,
 * sehingga deep-link tetap bekerja meski `pnpm db:seed:templates` belum pernah
 * dijalankan di environment tersebut.
 */
export default async function UseTemplateFromCatalog({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');

  const { slug } = await searchParams;
  if (!slug) redirect('/dashboard/templates');

  const template = await getTemplateRowBySlug(slug);
  if (!template) redirect('/dashboard/templates?error=notfound');

  const eventType = resolveEventType(template.category);
  if (!eventType) redirect('/dashboard/templates?error=category');

  const invitation = await createInvitation({
    userId: user.id,
    eventType,
    templateId: template.id,
    title: template.name,
  });

  redirect(`/dashboard/invitations/${invitation.id}/edit`);
}
