import { notFound, redirect } from 'next/navigation';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { getUser } from '@/lib/db/queries';
import { invitationAccess } from '@/lib/invitation/members-db';

/**
 * W2.1 (AM-010): the access decision for every invitation page, taken above this segment's loading state. Once a
 * Suspense fallback streams, Next.js has committed to 200, so the redirects and another account's private 404 must be
 * decided here to keep their real status. Administrators go to their console, as the editor already sends them; each
 * page still checks its own capability.
 */
export default async function InvitationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');
  const id = Number((await params).id);
  if (!Number.isInteger(id) || !(await invitationAccess(user.id, id))) notFound();
  return children;
}
