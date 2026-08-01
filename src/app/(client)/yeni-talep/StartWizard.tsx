'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { createDraft } from '@/app/actions/requests';
import { PROJECT_TYPES } from '@/lib/brief';
import { cn } from '@/lib/utils';

interface Props {
  brands: { id: string; name: string }[];
}

/** Sihirbazin ilk iki adimi: marka ve calisma turu. Sonrasinda taslak acilir. */
export default function StartWizard({ brands }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(brands.length === 1 ? 2 : 1);
  const [brandId, setBrandId] = useState(brands.length === 1 ? brands[0].id : '');
  const [projectType, setProjectType] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(type: string) {
    setBusy(true);
    setError(null);
    const result = await createDraft(brandId, type);
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Taslak oluşturulamadı.');
      setBusy(false);
      return;
    }
    router.push(`/yeni-talep/${result.data.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Yeni iş talebi</h1>
        <p className="mt-1 text-sm text-slate-600">
          İki kısa soruyla başlıyoruz; sonrasında talep formu açılacak.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={cn('rounded-full px-2.5 py-1', step === 1 ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
          1. Marka
        </span>
        <span className="h-px w-6 bg-surface-300" />
        <span className={cn('rounded-full px-2.5 py-1', step === 2 ? 'bg-brand-600 text-white' : 'bg-surface-100')}>
          2. Çalışma türü
        </span>
      </div>

      {step === 1 && (
        <div className="card p-6">
          <h2 className="text-base font-medium text-slate-900">Hangi marka için talep açıyorsunuz?</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {brands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => setBrandId(brand.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors',
                  brandId === brand.id
                    ? 'border-brand-600 bg-brand-50 text-brand-800'
                    : 'border-surface-300 bg-white text-slate-700 hover:border-brand-300'
                )}
              >
                {brand.name}
                {brandId === brand.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary mt-6"
            disabled={!brandId}
            onClick={() => setStep(2)}
          >
            Devam et
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6">
          <h2 className="text-base font-medium text-slate-900">
            Nasıl bir çalışma için iş talebi oluşturuyorsunuz?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Seçiminize göre size özel sorular açılacak.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                disabled={busy}
                onClick={() => {
                  setProjectType(type.key);
                  start(type.key);
                }}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left transition-colors',
                  projectType === type.key
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-surface-300 bg-white hover:border-brand-300 hover:bg-brand-50/40',
                  busy && 'opacity-60'
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">{type.label}</span>
                  {busy && projectType === type.key && (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  )}
                </span>
                {type.description && (
                  <span className="mt-0.5 block text-xs text-slate-500">{type.description}</span>
                )}
              </button>
            ))}
          </div>

          {brands.length > 1 && (
            <button
              type="button"
              className="btn-ghost mt-6"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              Marka seçimine dön
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
