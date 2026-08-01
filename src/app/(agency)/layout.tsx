import AppShell from '@/components/AppShell';
import { requireAgency } from '@/lib/auth';

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAgency();

  return (
    <AppShell
      profile={profile}
      nav={[
        { href: '/ajans', label: 'Talepler' },
        { href: '/ajans/musteriler', label: 'Müşteriler ve markalar' },
        { href: '/ajans/kullanicilar', label: 'Kullanıcılar' },
      ]}
    >
      {children}
    </AppShell>
  );
}
