import { getUser } from '@/lib/db/queries';
import { getLocale } from '@/lib/locale-server';
import { CustomerShell } from './customer-shell';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [locale, user] = await Promise.all([getLocale(), getUser()]);
  return <CustomerShell locale={locale} user={user}>{children}</CustomerShell>;
}
