import AppShell from '@/components/AppShell';
import { requireClient } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireClient();

  const supabase = await createClient();
  const { data: company } = profile.company_id
    ? await supabase.from('companies').select('name').eq('id', profile.company_id).maybeSingle()
    : { data: null };

  return (
    <AppShell
      profile={profile}
      companyName={company?.name}
      nav={[{ href: '/panel', label: 'Taleplerim' }]}
    >
      {children}
    </AppShell>
  );
}
