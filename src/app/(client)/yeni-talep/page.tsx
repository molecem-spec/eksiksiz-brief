import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireClient } from '@/lib/auth';
import StartWizard from './StartWizard';

export const metadata = { title: 'Yeni iş talebi · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  const session = await requireClient();
  // Kapatilmis markalar icin yeni talep acilamaz; eski talepler listede kalir.
  const brands = session.brands.filter((brand) => brand.is_active);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" />
        Taleplerime dön
      </Link>

      {brands.length === 0 ? (
        <div className="card p-6">
          <h1 className="text-lg font-medium text-slate-900">Marka yetkiniz bulunmuyor</h1>
          <p className="mt-2 text-sm text-slate-600">
            Talep oluşturabilmeniz için ajans ekibinin size en az bir marka tanımlaması gerekiyor.
          </p>
        </div>
      ) : (
        <StartWizard brands={brands.map((b) => ({ id: b.id, name: b.name }))} />
      )}
    </div>
  );
}
