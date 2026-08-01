import AppShell from '@/components/AppShell';
import { requireAgency } from '@/lib/auth';
import { loadSettings } from '@/lib/settings';

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAgency();
  const settings = await loadSettings();

  return (
    <AppShell
      profile={profile}
      appName={settings.app_name}
      subline={profile.team_name || null}
      nav={[
        { href: '/ajans', label: 'Talepler' },
        { href: '/ajans/markalar', label: 'Markalar' },
        { href: '/ajans/kullanicilar', label: 'Kullanıcılar' },
        { href: '/ajans/ayarlar', label: 'Portal ayarları' },
      ]}
    >
      {children}
    </AppShell>
  );
}
