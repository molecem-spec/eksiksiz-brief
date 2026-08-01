'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Plus, Tag } from 'lucide-react';
import {
  createBrand,
  createCompany,
  setBrandActive,
  setCompanyActive,
} from '@/app/actions/admin';
import { cn } from '@/lib/utils';
import type { Brand, Company } from '@/types/db';

interface Props {
  companies: Company[];
  brands: Brand[];
  userCounts: Record<string, number>;
}

export default function CompanyManager({ companies, brands, userCounts }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandDrafts, setBrandDrafts] = useState<Record<string, string>>({});

  async function addCompany() {
    setBusy(true);
    setError(null);
    const result = await createCompany(name, email);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Eklenemedi.');
      return;
    }
    setName('');
    setEmail('');
    setShowNew(false);
    router.refresh();
  }

  async function addBrand(companyId: string) {
    const value = brandDrafts[companyId]?.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    const result = await createBrand(companyId, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Marka eklenemedi.');
      return;
    }
    setBrandDrafts((prev) => ({ ...prev, [companyId]: '' }));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" />
          Yeni müşteri şirketi
        </button>
      </div>

      {showNew && (
        <div className="card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="company-name">
                Şirket adı
              </label>
              <input
                id="company-name"
                className="input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn. Restoran Grubu"
              />
            </div>
            <div>
              <label className="label" htmlFor="company-email">
                İletişim e-postası (isteğe bağlı)
              </label>
              <input
                id="company-email"
                type="email"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>
              Vazgeç
            </button>
            <button type="button" className="btn-primary" onClick={addCompany} disabled={busy || !name.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ekle
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {companies.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Henüz müşteri şirketi eklenmemiş.
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => {
            const companyBrands = brands.filter((brand) => brand.company_id === company.id);
            return (
              <div key={company.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{company.name}</p>
                      <p className="text-xs text-slate-500">
                        {companyBrands.length} marka · {userCounts[company.id] ?? 0} kullanıcı
                        {company.contact_email ? ` · ${company.contact_email}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={cn('btn text-xs', company.is_active ? 'btn-secondary' : 'btn-primary')}
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await setCompanyActive(company.id, !company.is_active);
                      setBusy(false);
                      router.refresh();
                    }}
                  >
                    {company.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {companyBrands.map((brand) => (
                    <span
                      key={brand.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ring-1 ring-inset',
                        brand.is_active
                          ? 'bg-surface-50 text-slate-700 ring-surface-300'
                          : 'bg-surface-100 text-slate-400 line-through ring-surface-200'
                      )}
                    >
                      <Tag className="h-3 w-3" />
                      {brand.name}
                      <button
                        type="button"
                        className="ml-1 text-xs text-slate-400 hover:text-slate-700"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          await setBrandActive(brand.id, !brand.is_active);
                          setBusy(false);
                          router.refresh();
                        }}
                      >
                        {brand.is_active ? 'kapat' : 'aç'}
                      </button>
                    </span>
                  ))}
                  {companyBrands.length === 0 && (
                    <span className="text-sm text-slate-400">Henüz marka eklenmemiş.</span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    className="input"
                    placeholder="Yeni marka adı"
                    value={brandDrafts[company.id] ?? ''}
                    onChange={(e) =>
                      setBrandDrafts((prev) => ({ ...prev, [company.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addBrand(company.id);
                    }}
                  />
                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    disabled={busy || !brandDrafts[company.id]?.trim()}
                    onClick={() => addBrand(company.id)}
                  >
                    <Plus className="h-4 w-4" />
                    Marka ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
