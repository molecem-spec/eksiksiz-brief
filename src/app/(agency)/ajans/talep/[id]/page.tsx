import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileDown } from 'lucide-react';
import CommentThread from '@/components/CommentThread';
import FileUploader from '@/components/FileUploader';
import Timeline from '@/components/Timeline';
import { PriorityBadge, StatusBadge } from '@/components/StatusBadge';
import { requireAgency } from '@/lib/auth';
import { loadRequestDetail } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Answers } from '@/types/db';
import AgencyControls from './AgencyControls';
import FlaggableAnswers from './FlaggableAnswers';

export const metadata = { title: 'Talep detayı' };
export const dynamic = 'force-dynamic';

export default async function AgencyRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAgency();

  const detail = await loadRequestDetail(id);
  if (!detail) notFound();

  const { request, brand, creator, files, comments, flags, events } = detail;

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, email, team_name')
    .eq('role', 'agency')
    .eq('is_active', true)
    .order('full_name');

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/ajans"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tüm talepler
        </Link>

        <Link href={`/ajans/talep/${request.id}/yazdir`} className="btn-secondary" target="_blank">
          <FileDown className="h-4 w-4" />
          PDF olarak dışa aktar
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-soft-gradient px-5 py-5">
          <p className="text-xs font-medium text-slate-500">Talep no #{request.ref}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            {request.title || 'İsimsiz talep'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <span className="text-sm font-medium text-slate-600">{brand?.name}</span>
          </div>
        </div>

        <dl className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Talebi açan</dt>
            <dd className="font-medium text-slate-800">
              {creator?.full_name || creator?.email || '—'}
              {creator?.team_name && (
                <span className="ml-1 font-normal text-slate-500">· {creator.team_name}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Talep tarihi</dt>
            <dd className="font-medium text-slate-800">
              {formatDateTime(request.submitted_at ?? request.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Yayın / etkinlik tarihi</dt>
            <dd className="font-medium text-slate-800">{formatDate(request.use_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">İç teslim tarihi</dt>
            <dd className="font-medium text-slate-800">{formatDate(request.deadline)}</dd>
          </div>
        </dl>
        <p className="px-5 pb-4 text-xs text-slate-400">
          Son güncelleme: {formatDateTime(request.updated_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h2 className="section-title">Talep bilgileri</h2>
            <p className="mt-2 text-sm text-slate-500">
              Eksik veya belirsiz bulduğunuz alanın yanındaki bayrak simgesine tıklayın.
            </p>
            <div className="mt-4">
              <FlaggableAnswers
                requestId={request.id}
                answers={(request.answers ?? {}) as Answers}
                flags={flags}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Yüklenen dosyalar</h2>
            <div className="mt-4">
              <FileUploader requestId={request.id} files={files} canUpload />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Yorumlar ve iç notlar</h2>
            <p className="mt-2 text-sm text-slate-500">
              İç not olarak işaretlenen yazılar marka ekibine hiçbir şekilde gösterilmez.
            </p>
            <div className="mt-4">
              <CommentThread requestId={request.id} comments={comments} canWriteInternal />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="section-title">Operasyon</h2>
            <div className="mt-4">
              <AgencyControls
                requestId={request.id}
                status={request.status}
                assignedTo={request.assigned_to}
                agencyNote={request.agency_note}
                deadline={request.deadline}
                staff={((staff ?? []) as any[]).map((person) => ({
                  id: person.id,
                  name: person.team_name
                    ? `${person.full_name || person.email} · ${person.team_name}`
                    : person.full_name || person.email,
                }))}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Talep geçmişi</h2>
            <div className="mt-4">
              <Timeline events={events} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
