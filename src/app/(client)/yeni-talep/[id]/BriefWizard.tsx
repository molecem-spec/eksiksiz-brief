'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import FieldInput from '@/components/FieldInput';
import FileUploader from '@/components/FileUploader';
import { deleteDraft, saveAnswers, submitRequest } from '@/app/actions/requests';
import {
  buildSteps,
  formatAnswer,
  hasValue,
  missingRequired,
  stepMissingCount,
  visibleFields,
  type StepId,
} from '@/lib/brief';
import { cn } from '@/lib/utils';
import type { Answers, BriefRequest, RequestFieldFlag, RequestFile } from '@/types/db';

interface Props {
  request: BriefRequest & { brand: { id: string; name: string } | null };
  initialAnswers: Answers;
  files: RequestFile[];
  flags: RequestFieldFlag[];
}

export default function BriefWizard({ request, initialAnswers, files, flags }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [index, setIndex] = useState(request.status === 'info_needed' ? 1 : 0);
  const [busy, setBusy] = useState<'save' | 'submit' | 'delete' | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  /** info_needed durumunda yalnizca ajansin isaretledigi alanlar acilir. */
  const restrictedToFlags = request.status === 'info_needed';
  const flagByKey = useMemo(() => new Map(flags.map((flag) => [flag.field_key, flag])), [flags]);

  const steps = useMemo(() => buildSteps(), []);
  const step = steps[Math.min(index, steps.length - 1)];
  const missing = useMemo(() => missingRequired(answers), [answers]);
  const progress = Math.round(((index + 1) / steps.length) * 100);

  function update(key: string, value: Answers[string]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function fieldDisabled(key: string) {
    return restrictedToFlags && !flagByKey.has(key);
  }

  async function persist(): Promise<boolean> {
    const result = await saveAnswers(request.id, answers);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Kaydedilemedi.' });
      return false;
    }
    return true;
  }

  async function handleSave() {
    setBusy('save');
    const ok = await persist();
    if (ok) setMessage({ tone: 'ok', text: 'Taslak kaydedildi.' });
    setBusy(null);
  }

  async function goTo(next: number) {
    setMessage(null);
    setBusy('save');
    await persist();
    setBusy(null);
    setIndex(Math.max(0, Math.min(next, steps.length - 1)));
    setShowErrors(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    if (missing.length > 0) {
      setShowErrors(true);
      setMessage({
        tone: 'error',
        text: `Zorunlu alanlar eksik: ${missing.map((m) => m.field.label).join(', ')}`,
      });
      return;
    }
    setBusy('submit');
    if (!(await persist())) {
      setBusy(null);
      return;
    }
    const result = await submitRequest(request.id);
    setBusy(null);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Gönderilemedi.' });
      return;
    }
    router.push(`/talep/${request.id}?gonderildi=1`);
  }

  async function handleDelete() {
    if (!confirm('Bu taslak silinsin mi? Bu işlem geri alınamaz.')) return;
    setBusy('delete');
    const result = await deleteDraft(request.id);
    setBusy(null);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Silinemedi.' });
      return;
    }
    router.push('/panel');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/panel"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Taleplerime dön
        </Link>
        <span className="text-xs text-slate-400">Talep no #{request.ref}</span>
      </div>

      {restrictedToFlags && (
        <div className="rounded-2xl border border-peach-200 bg-peach-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-peach-600" />
            <div className="text-sm">
              <p className="font-semibold text-peach-900">Ajans bu talepte ek bilgi bekliyor</p>
              <p className="mt-0.5 text-peach-800">
                Yalnızca aşağıda işaretlenen alanları düzenleyebilirsiniz. Tamamladıktan sonra
                talebi yeniden iletin.
              </p>
              {flags.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-peach-900">
                  {flags.map((flag) => (
                    <li key={flag.id}>
                      <span className="font-semibold">{flag.field_label || flag.field_key}</span>
                      {flag.note ? ` — ${flag.note}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ilerleme */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-800">
            Adım {index + 1} / {steps.length} · {step.title}
          </span>
          <span className="text-slate-500">%{progress}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-200">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {steps.map((item, i) => {
            const missingHere = stepMissingCount(item, answers);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                  i === index
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 text-slate-600 hover:bg-brand-50'
                )}
              >
                {item.title}
                {missingHere > 0 && i !== index && (
                  <span className="ml-1 text-blossom-500">•</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Adim icerigi */}
      <div className="card p-5 sm:p-6">
        {step.id === 'marka' && (
          <div>
            <h2 className="section-title">Marka</h2>
            <p className="mt-2 text-sm text-slate-600">
              Bu talep <span className="font-semibold text-slate-800">{request.brand?.name}</span>{' '}
              markası için oluşturuluyor.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Markayı değiştirmek isterseniz bu taslağı silip yeni bir talep başlatın.
            </p>
          </div>
        )}

        {step.sections.map((section) => (
          <section key={section.id}>
            <h2 className="section-title">{section.title}</h2>
            {section.description && (
              <p className="mt-2 text-sm text-slate-600">{section.description}</p>
            )}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {visibleFields(section, answers).map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={answers[field.key] ?? null}
                  onChange={(value) => update(field.key, value)}
                  flagNote={flagByKey.get(field.key)?.note ?? undefined}
                  disabled={fieldDisabled(field.key)}
                  showError={showErrors}
                />
              ))}
            </div>
          </section>
        ))}

        {step.id === 'dosyalar' && (
          <div>
            <h2 className="section-title">Dosyalar</h2>
            <p className="mt-2 text-sm text-slate-600">
              Logo, kurumsal kimlik, referans görsel, ürün ve mekân fotoğrafları, menü, etkinlik
              programı gibi dosyaları buraya ekleyin.
            </p>
            <div className="mt-4">
              <FileUploader requestId={request.id} files={files} canUpload />
            </div>
          </div>
        )}

        {step.id === 'kontrol' && (
          <ReviewStep
            answers={answers}
            brandName={request.brand?.name ?? '—'}
            missing={missing}
            onJump={(stepId) => {
              const target = steps.findIndex((s) => s.id === stepId);
              if (target >= 0) goTo(target);
            }}
          />
        )}
      </div>

      {message && (
        <p
          className={cn(
            'rounded-xl px-3 py-2 text-sm ring-1 ring-inset',
            message.tone === 'ok'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-blossom-50 text-blossom-700 ring-blossom-200'
          )}
        >
          {message.text}
        </p>
      )}

      {/* Alt eylemler */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-surface-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <button
          type="button"
          className="btn-secondary"
          disabled={index === 0 || busy !== null}
          onClick={() => goTo(index - 1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </button>

        <button type="button" className="btn-secondary" disabled={busy !== null} onClick={handleSave}>
          {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Taslağı kaydet
        </button>

        <div className="flex-1" />

        {request.status === 'draft' && (
          <button
            type="button"
            className="btn-danger"
            disabled={busy !== null}
            onClick={handleDelete}
            title="Taslağı sil"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Taslağı sil</span>
          </button>
        )}

        {index < steps.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            disabled={busy !== null}
            onClick={() => goTo(index + 1)}
          >
            İleri
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={busy !== null}
            onClick={handleSubmit}
          >
            {busy === 'submit' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {restrictedToFlags ? 'Eksikleri gönder' : 'Ajansa ilet'}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  answers,
  brandName,
  missing,
  onJump,
}: {
  answers: Answers;
  brandName: string;
  missing: ReturnType<typeof missingRequired>;
  onJump: (stepId: StepId) => void;
}) {
  const steps = buildSteps().filter((s) => s.sections.length > 0);

  return (
    <div>
      <h2 className="section-title">Cevaplarınızı kontrol edin</h2>
      <p className="mt-2 text-sm text-slate-600">
        Ajansa ilettikten sonra cevaplar kilitlenir; değişiklik için ajans alanı yeniden açmalıdır.
      </p>

      <div className="mt-4 rounded-2xl bg-soft-gradient p-4 text-sm">
        <p className="text-xs text-slate-500">Marka</p>
        <p className="font-semibold text-slate-800">{brandName}</p>
      </div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-2xl border border-blossom-200 bg-blossom-50 p-4">
          <p className="text-sm font-semibold text-blossom-800">
            {missing.length} zorunlu alan eksik. Talep bu haliyle iletilemez.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blossom-700">
            {missing.map((item) => (
              <li key={item.field.key}>
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-blossom-900"
                  onClick={() => onJump(item.stepId)}
                >
                  {item.stepTitle} · {item.field.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {steps.map((step) =>
          step.sections.map((section) => (
            <section key={section.id}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700 hover:underline"
                  onClick={() => onJump(step.id)}
                >
                  Düzenle
                </button>
              </div>
              <dl className="mt-2 divide-y divide-surface-200 rounded-2xl border border-surface-200">
                {visibleFields(section, answers).map((field) => (
                  <div key={field.key} className="grid gap-1 px-3.5 py-2.5 sm:grid-cols-3">
                    <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                    <dd
                      className={cn(
                        'whitespace-pre-wrap text-sm sm:col-span-2',
                        hasValue(answers[field.key]) ? 'text-slate-800' : 'text-slate-400'
                      )}
                    >
                      {hasValue(answers[field.key])
                        ? formatAnswer(answers[field.key])
                        : field.required
                          ? 'Eksik'
                          : 'Belirtilmedi'}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
