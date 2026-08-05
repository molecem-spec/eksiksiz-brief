'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { startDraft } from '@/app/actions/requests';
import { cn } from '@/lib/utils';

/**
 * Talep olusturmayi baslatir. Bir musteri hesabi tek bir markaya bagli
 * oldugundan marka secimi sorulmaz; taslak dogrudan acilir ve forma gidilir.
 * Hesaba birden fazla marka tanimliysa secim ekranina yonlendirilir.
 */
export default function NewRequestButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const result = await startDraft();

    if (!result.ok || !result.data) {
      setError(result.error ?? 'Talep başlatılamadı.');
      setBusy(false);
      return;
    }
    if (result.data.needsChoice) {
      router.push('/yeni-talep');
      return;
    }
    router.push(`/yeni-talep/${result.data.id}`);
  }

  return (
    <div>
      <button
        type="button"
        className={cn('btn-primary', className)}
        disabled={busy}
        onClick={start}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Yeni iş talebi oluştur
      </button>

      {error && <p className="mt-2 text-sm text-blossom-600">{error}</p>}
    </div>
  );
}
