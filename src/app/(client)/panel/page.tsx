import Link from 'next/link';
import { AlertCircle, Plus, Sparkles } from 'lucide-react';
import RequestList from '@/components/RequestList';
import { requireClient } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { RequestListItem } from '@/types/db';

export const metadata = { title: 'Taleplerim' };
export const dynamic = 'force-dynamic';

export default async function ClientPanelPage() {
  const { profile, brands } = await requireClient();
  const supabase = await createClient();

  // RLS zaten sinirliyor; sorgu yine de yetkili markalarla daraltiliyor.
  const brandIds = brands.map((b) => b.id);

  const { data } = brandIds.length
    ? await supabase
        .from('requests')
        .select('*, brand:brands(id, name)')
        .in('brand_id', brandIds)
        .order('updated_at', { ascending: false })
    : { data: [] };

  const requests = ((data ?? []) as any[]).map((r) => ({ ...r, assignee: null })) as RequestListItem[];
  const infoNeeded = requests.filter((r) => r.status === 'info_needed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Merhaba{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {brands.length > 0
              ? `Markalarınız: ${brands.map((b) => b.name).join(' · ')}`
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
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-peach-500" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold">Marka yetkiniz bulunmuyor</p>
            <p className="mt-0.5 text-slate-600">
              Talep oluşturabilmeniz için ajans ekibinin size en az bir marka tanımlaması gerekiyor.
            </p>
          </div>
        </div>
      )}

      {requests.length === 0 && brands.length > 0 && (
        <div className="card overflow-hidden">
          <div className="bg-soft-gradient px-6 py-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-brand-500" />
            <p className="mt-3 text-base font-semibold text-slate-800">
              İlk talebinizi oluşturalım
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              Kısa bir formla ne istediğinizi anlatın; ne kadar net olursa, işi o kadar hızlı ve
              istediğiniz gibi teslim ederiz.
            </p>
            <Link href="/yeni-talep" className="btn-primary mt-5">
              <Plus className="h-4 w-4" />
              Yeni iş talebi oluştur
            </Link>
          </div>
        </div>
      )}

      {infoNeeded.length > 0 && (
        <div className="rounded-2xl border border-peach-200 bg-peach-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-peach-600" />
            <div>
              <p className="text-sm font-semibold text-peach-900">
                {infoNeeded.length} talep için ajans ek bilgi bekliyor
              </p>
              <ul className="mt-2 space-y-1">
                {infoNeeded.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/talep/${request.id}`}
                      className="text-sm font-semibold text-peach-900 underline underline-offset-2 hover:text-peach-700"
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

      {requests.length > 0 && (
        <RequestList
          requests={requests}
          role={profile.role}
          detailBase="/talep"
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        />
      )}
    </div>
  );
}
