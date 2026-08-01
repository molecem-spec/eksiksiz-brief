import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import CompanyManager from './CompanyManager';

export const metadata = { title: 'Müşteriler ve markalar · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  await requireAgency();
  const supabase = await createClient();

  const [{ data: companies }, { data: brands }, { data: profiles }] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
    supabase.from('profiles').select('id, company_id').eq('role', 'client'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Müşteriler ve markalar
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Her müşteri şirketinin birden fazla markası olabilir. Kullanıcı yetkileri marka bazında
          verilir.
        </p>
      </div>

      <CompanyManager
        companies={(companies ?? []) as any[]}
        brands={(brands ?? []) as any[]}
        userCounts={countByCompany((profiles ?? []) as any[])}
      />
    </div>
  );
}

function countByCompany(profiles: { company_id: string | null }[]) {
  const counts: Record<string, number> = {};
  for (const profile of profiles) {
    if (!profile.company_id) continue;
    counts[profile.company_id] = (counts[profile.company_id] ?? 0) + 1;
  }
  return counts;
}
