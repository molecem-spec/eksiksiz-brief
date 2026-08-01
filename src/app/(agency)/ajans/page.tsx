import RequestList from '@/components/RequestList';
import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { STATUS_META } from '@/lib/status';
import type { RequestListItem, RequestStatus } from '@/types/db';

export const metadata = { title: 'Talepler' };
export const dynamic = 'force-dynamic';

const HIGHLIGHT: RequestStatus[] = ['submitted', 'info_needed', 'in_progress', 'completed'];

const ACCENTS = [
  'from-brand-100 to-brand-50 text-brand-800',
  'from-peach-100 to-peach-50 text-peach-800',
  'from-blossom-100 to-blossom-50 text-blossom-800',
  'from-emerald-100 to-emerald-50 text-emerald-800',
];

export default async function AgencyPanelPage() {
  const { profile } = await requireAgency();
  const supabase = await createClient();

  const [{ data: requests }, { data: brands }, { data: staff }] = await Promise.all([
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
  ]);

  const list = (requests ?? []) as unknown as RequestListItem[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tüm iş talepleri</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tüm markalardan gelen talepler burada listelenir.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHT.map((status, index) => (
          <div
            key={status}
            className={`rounded-2xl border border-white/60 bg-gradient-to-br p-4 shadow-card ${ACCENTS[index]}`}
          >
            <p className="text-xs font-semibold opacity-80">{STATUS_META[status].label}</p>
            <p className="mt-1 text-3xl font-bold">
              {list.filter((request) => request.status === status).length}
            </p>
          </div>
        ))}
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
      />
    </div>
  );
}
