'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { createDraft } from '@/app/actions/requests';
import { cn } from '@/lib/utils';

interface Props {
  brands: { id: string; name: string }[];
}

/** Sihirbazin ilk adimi: marka secimi. Sonrasinda taslak acilir. */
export default function StartWizard({ brands }: Props) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(brands.length === 1 ? brands[0].id : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!brandId) return;
    setBusy(true);
    setError(null);
    const result = await createDraft(brandId);
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yeni iş talebi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Önce hangi marka için talep açtığınızı seçin.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="section-title">Marka seçimi</h2>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {brands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => setBrandId(brand.id)}
              className={cn(
                'flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition-all',
                brandId === brand.id
                  ? 'border-brand-400 bg-brand-50 text-brand-800 shadow-card'
                  : 'border-surface-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50'
              )}
            >
              {brand.name}
              {brandId === brand.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-blossom-50 px-3 py-2 text-sm text-blossom-700 ring-1 ring-inset ring-blossom-200">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn-primary mt-6"
          disabled={!brandId || busy}
          onClick={start}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Devam et
        </button>
      </div>
    </div>
  );
}
