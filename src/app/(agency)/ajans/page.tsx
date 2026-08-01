import RequestList from '@/components/RequestList';
import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { RequestListItem } from '@/types/db';

export const metadata = { title: 'Talepler' };
export const dynamic = 'force-dynamic';

export default async function AgencyPanelPage() {
  const { profile } = await requireAgency();
  const supabase = await createClient();

  const [{ data: requests }, { data: brands }, { data: staff }, { data: myBrands }] =
    await Promise.all([
      supabase
        .from('requests')
        .select(
          '*, brand:brands(id, name), assignee:profiles!requests_assigned_to_fkey(id, full_name)'
        )
        // Musteri taslaklari ajans listesini kirletmesin.
        .neq('status', 'draft')
        .order('updated_at', { ascending: false }),
      supabase.from('brands').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'agency').order('full_name'),
      // Kullanicinin sorumlu oldugu markalar; "Sorumlu olduklarım" gorunumu icin.
      supabase.from('user_brands').select('brand_id').eq('user_id', profile.id),
    ]);

  const list = (requests ?? []) as unknown as RequestListItem[];
  const myBrandIds = ((myBrands ?? []) as { brand_id: string }[]).map((row) => row.brand_id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">İş talepleri</h1>
        <p className="text-sm text-slate-500">{list.length} talep</p>
      </div>

      <RequestList
        requests={list}
        role={profile.role}
        detailBase="/ajans/talep"
        brands={(brands ?? []) as { id: string; name: string }[]}
        assignees={((staff ?? []) as any[]).map((person) => ({
          id: person.id,
          name: person.full_name || 'İsimsiz',
        }))}
        myBrandIds={myBrandIds}
      />
    </div>
  );
}
