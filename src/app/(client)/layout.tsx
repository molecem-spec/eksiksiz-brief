import AppShell from '@/components/AppShell';
import { requireClient } from '@/lib/auth';
import { loadSettings } from '@/lib/settings';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { profile, brands } = await requireClient();
  const settings = await loadSettings();

  // Ust barda kisinin ekibi, yoksa yetkili oldugu markalar gosterilir.
  const subline = profile.team_name || brands.map((brand) => brand.name).join(', ') || null;

  return (
    <AppShell
      profile={profile}
      appName={settings.app_name}
      subline={subline}
      nav={[{ href: '/panel', label: 'Taleplerim' }]}
    >
      {children}
    </AppShell>
  );
}
