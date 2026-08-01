import Link from 'next/link';
import { Plus, AlertCircle } from 'lucide-react';
import RequestList from '@/components/RequestList';
import { requireClient } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { RequestListItem } from '@/types/db';

export const metadata = { title: 'Taleplerim · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

export default async function ClientPanelPage() {
  const { profile, brands } = await requireClient();
  const supabase = await createClient();

  // RLS zaten sinirliyor; yine de acikca yetkili markalarla daraltiyoruz.
  const brandIds = brands.map((b) => b.id);

  const { data } = brandIds.length
    ? await supabase
        .from('requests')
        .select(
          'id, ref, company_id, brand_id, created_by, title, project_type, status, priority, use_date, deadline, answers, assigned_to, agency_note, submitted_at, completed_at, created_at, updated_at, brand:brands(id, name)'
        )
        .in('brand_id', brandIds)
        .order('updated_at', { ascending: false })
    : { data: [] };

  const requests = ((data ?? []) as any[]).map((r) => ({
    ...r,
    company: null,
    assignee: null,
  })) as RequestListItem[];

  const infoNeeded = requests.filter((r) => r.status === 'info_needed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Taleplerim</h1>
          <p className="mt-1 text-sm text-slate-600">
            {brands.length > 0
              ? `Yetkili olduğunuz markalar: ${brands.map((b) => b.name).join(', ')}`
              : 'Henüz size bir marka yetkisi tanımlanmamış.'}
          </p>
        </div>

        {brands.length > 0 && (
          <Link href="/yeni-talep" className="btn-primary">
            <Plus className="h-4 w-4" />
            Yeni iş talebi oluştur
          </Link>
        )}
      </div>

      {brands.length === 0 && (
        <div className="card flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm text-slate-700">
            <p className="font-medium">Marka yetkiniz bulunmuyor</p>
            <p className="mt-0.5 text-slate-600">
              Talep oluşturabilmeniz için ajans ekibinin size en az bir marka tanımlaması gerekiyor.
            </p>
          </div>
        </div>
      )}

      {infoNeeded.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {infoNeeded.length} talep için ajans ek bilgi bekliyor
              </p>
              <ul className="mt-2 space-y-1">
                {infoNeeded.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/talep/${request.id}`}
                      className="text-sm font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
                    >
                      #{request.ref} · {request.title || 'İsimsiz talep'}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <RequestList
        requests={requests}
        role={profile.role}
        detailBase="/talep"
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
