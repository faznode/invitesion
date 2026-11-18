import { getUser } from '@/lib/db/queries';

import { assertAuthorizedAdmin } from '@/lib/auth/admin-access';
export default async function ActivityPage() {
  assertAuthorizedAdmin(await getUser());

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Aktivitas</h1>
      <p className="text-muted-foreground">Belum ada aktivitas.</p>
    </section>
  );
}
