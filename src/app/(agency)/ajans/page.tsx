import RequestList from '@/components/RequestList';
import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { STATUS_META } from '@/lib/status';
import type { RequestListItem, RequestStatus } from '@/types/db';

export const metadata = { title: 'Talepler · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

const HIGHLIGHT: RequestStatus[] = ['submitted', 'info_needed', 'in_progress', 'completed'];

export default async function AgencyPanelPage() {
  const { profile } = await requireAgency();
  const supabase = await createClient();

  const [{ data: requests }, { data: companies }, { data: brands }, { data: staff }] =
    await Promise.all([
      supabase
        .from('requests')
        .select(
          'id, ref, company_id, brand_id, created_by, title, project_type, status, priority, use_date, deadline, answers, assigned_to, agency_note, submitted_at, completed_at, created_at, updated_at, brand:brands(id, name), company:companies(id, name), assignee:profiles!requests_assigned_to_fkey(id, full_name)'
        )
        // Musteri taslaklari ajans listesini kirletmesin.
        .neq('status', 'draft')
        .order('updated_at', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('brands').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'agency').order('full_name'),
    ]);

  const list = (requests ?? []) as unknown as RequestListItem[];

  const counts = HIGHLIGHT.map((status) => ({
    status,
    count: list.filter((request) => request.status === status).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tüm iş talepleri</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tüm müşteri şirketlerinden gelen talepler burada listelenir.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ status, count }) => (
          <div key={status} className="card p-4">
            <p className="text-xs text-slate-500">{STATUS_META[status].label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      <RequestList
        requests={list}
        role={profile.role}
        detailBase="/ajans/talep"
        brands={(brands ?? []) as { id: string; name: string }[]}
        companies={(companies ?? []) as { id: string; name: string }[]}
        assignees={((staff ?? []) as any[]).map((person) => ({
          id: person.id,
          name: person.full_name || 'İsimsiz',
        }))}
      />
    </div>
  );
}
