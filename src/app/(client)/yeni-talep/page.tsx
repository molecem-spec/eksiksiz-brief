import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NewRequestButton from '@/components/NewRequestButton';
import { requireClient } from '@/lib/auth';
import StartWizard from './StartWizard';

export const metadata = { title: 'Yeni iş talebi' };
export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  const session = await requireClient();
  // Kapatilmis markalar icin yeni talep acilamaz; eski talepler listede kalir.
  const brands = session.brands.filter((brand) => brand.is_active);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Taleplerime dön
      </Link>

      {brands.length === 0 ? (
        <div className="card p-6">
          <h1 className="section-title">Marka yetkiniz bulunmuyor</h1>
          <p className="mt-2 text-sm text-slate-600">
            Talep oluşturabilmeniz için ajans ekibinin size bir marka tanımlaması gerekiyor.
          </p>
        </div>
      ) : brands.length === 1 ? (
        /*
          Olagan durum: hesap tek bir markaya bagli, secim sorulmuyor.
          Bu ekrana yalnizca adres cubugundan dogrudan gelinirse dusulur.
        */
        <div className="card p-6">
          <h1 className="section-title">Yeni iş talebi</h1>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{brands[0].name}</span> markası için
            talep formunu açalım.
          </p>
          <div className="mt-5">
            <NewRequestButton />
          </div>
        </div>
      ) : (
        // Birden fazla marka tanimliysa hangisi oldugu sorulur.
        <StartWizard brands={brands.map((b) => ({ id: b.id, name: b.name }))} />
      )}
    </div>
  );
}
