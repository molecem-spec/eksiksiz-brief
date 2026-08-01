import { notFound } from 'next/navigation';
import AnswerSections from '@/components/AnswerSections';
import { requireAgency } from '@/lib/auth';
import { projectTypeLabel } from '@/lib/brief';
import { loadRequestDetail } from '@/lib/queries';
import { PRIORITY_META, statusLabel } from '@/lib/status';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Answers } from '@/types/db';
import PrintButton from './PrintButton';

export const metadata = { title: 'Talep dökümü · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

/** Yazdirma / PDF ciktisi. Tarayicinin "PDF olarak kaydet" secenegi kullanilir. */
export default async function PrintRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAgency();

  const detail = await loadRequestDetail(id);
  if (!detail) notFound();

  const { request, brand, company, creator, files, comments } = detail;
  const publicComments = comments.filter((comment) => !comment.is_internal);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PrintButton />

      <header className="border-b border-surface-300 pb-4">
        <p className="text-xs text-slate-500">Eksiksiz Brif · Talep no #{request.ref}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {request.title || 'İsimsiz talep'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {company?.name} · {brand?.name} · {projectTypeLabel(request.project_type)}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Item label="Durum" value={statusLabel(request.status)} />
        <Item label="Öncelik" value={PRIORITY_META[request.priority].label} />
        <Item label="Talebi açan" value={creator?.full_name || creator?.email || '—'} />
        <Item label="Oluşturulma" value={formatDate(request.created_at)} />
        <Item label="Ajansa iletilme" value={formatDateTime(request.submitted_at)} />
        <Item label="Yayın / etkinlik tarihi" value={formatDate(request.use_date)} />
        <Item label="İstenen teslim tarihi" value={formatDate(request.deadline)} />
      </dl>

      <AnswerSections
        projectType={request.project_type}
        answers={(request.answers ?? {}) as Answers}
        showEmpty={false}
      />

      <section>
        <h3 className="text-sm font-semibold text-slate-800">Yüklenen dosyalar</h3>
        {files.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">Dosya yok.</p>
        ) : (
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            {files.map((file) => (
              <li key={file.id}>
                {file.file_name} <span className="text-slate-500">({file.category})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {publicComments.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-800">Yazışmalar</h3>
          <ul className="mt-2 space-y-2">
            {publicComments.map((comment) => (
              <li key={comment.id} className="rounded border border-surface-200 p-2 text-sm">
                <p className="text-xs text-slate-500">
                  {comment.author_name} · {formatDateTime(comment.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{comment.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-surface-300 pt-3 text-xs text-slate-400">
        Bu döküm {formatDateTime(new Date().toISOString())} tarihinde oluşturuldu. Ajans içi notlar
        bu çıktıya dahil edilmez.
      </footer>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
