import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Pencil } from 'lucide-react';
import AnswerSections from '@/components/AnswerSections';
import CommentThread from '@/components/CommentThread';
import FileUploader from '@/components/FileUploader';
import Timeline from '@/components/Timeline';
import { PriorityBadge, StatusBadge } from '@/components/StatusBadge';
import { requireClient } from '@/lib/auth';
import { projectTypeLabel } from '@/lib/brief';
import { loadRequestDetail } from '@/lib/queries';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Answers } from '@/types/db';

export const metadata = { title: 'Talep detayı · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

export default async function ClientRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gonderildi?: string }>;
}) {
  const { id } = await params;
  const { gonderildi } = await searchParams;
  await requireClient();

  const detail = await loadRequestDetail(id);
  if (!detail) notFound();

  const { request, brand, files, comments, flags, events } = detail;
  const openFlags = flags.filter((flag) => !flag.resolved);
  const editable = request.status === 'draft' || request.status === 'info_needed';

  const flagNoteFor = (key: string) => {
    const flag = openFlags.find((item) => item.field_key === key);
    return flag ? (flag.note ?? '') : undefined;
  };

  return (
    <div className="space-y-6">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Taleplerime dön
      </Link>

      {gonderildi && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-medium text-emerald-900">Talebiniz ajansa iletildi</p>
            <p className="text-emerald-800">
              Ajans ekibi talebi inceleyecek. Eksik bir bilgi olursa buradan haberdar olacaksınız.
            </p>
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Talep no #{request.ref}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">
              {request.title || 'İsimsiz talep'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
              <span className="text-sm text-slate-500">
                {brand?.name} · {projectTypeLabel(request.project_type)}
              </span>
            </div>
          </div>

          {editable && (
            <Link href={`/yeni-talep/${request.id}`} className="btn-primary">
              <Pencil className="h-4 w-4" />
              {request.status === 'draft' ? 'Taslağı düzenle' : 'Eksikleri tamamla'}
            </Link>
          )}
        </div>

        <dl className="mt-5 grid gap-4 border-t border-surface-200 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Oluşturulma</dt>
            <dd className="text-slate-800">{formatDate(request.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Ajansa iletildi</dt>
            <dd className="text-slate-800">{formatDate(request.submitted_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Yayın / etkinlik tarihi</dt>
            <dd className="text-slate-800">{formatDate(request.use_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Teslim beklentisi</dt>
            <dd className="text-slate-800">{formatDate(request.deadline)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          Son güncelleme: {formatDateTime(request.updated_at)}
        </p>
      </div>

      {openFlags.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">Ajansın eklemenizi istediği bilgiler</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900">
                {openFlags.map((flag) => (
                  <li key={flag.id}>
                    <span className="font-medium">{flag.field_label || flag.field_key}</span>
                    {flag.note ? ` — ${flag.note}` : ''}
                  </li>
                ))}
              </ul>
              {request.status === 'info_needed' && (
                <Link
                  href={`/yeni-talep/${request.id}`}
                  className="btn-primary mt-3 bg-amber-600 hover:bg-amber-700"
                >
                  Eksikleri tamamla
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-base font-medium text-slate-900">Brif cevapları</h2>
            <div className="mt-4">
              <AnswerSections
                projectType={request.project_type}
                answers={(request.answers ?? {}) as Answers}
                flagNoteFor={flagNoteFor}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-medium text-slate-900">Dosyalar</h2>
            <div className="mt-4">
              <FileUploader
                requestId={request.id}
                files={files}
                canUpload={editable}
                canDelete={editable}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-medium text-slate-900">Yorumlar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ajansla bu talep hakkında buradan yazışabilirsiniz.
            </p>
            <div className="mt-4">
              <CommentThread requestId={request.id} comments={comments} canWriteInternal={false} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-base font-medium text-slate-900">Talep geçmişi</h2>
            <div className="mt-4">
              <Timeline events={events} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
