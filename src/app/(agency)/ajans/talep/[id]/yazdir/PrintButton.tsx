'use client';

import { useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';

/**
 * Sayfa acilinca yazdirma penceresini kendiliginden acar; boylece "PDF olarak
 * indir" dugmesi tek adimda sonuclanir. Kullanici iptal ederse asagidaki
 * dugmeyle tekrar deneyebilir.
 */
export default function PrintButton() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Yazi tipleri ve gorseller yerlesene kadar kisa bir bekleme.
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft-gradient px-4 py-3">
      <p className="text-sm text-slate-600">
        Yazdırma penceresinde hedef olarak <strong>PDF olarak kaydet</strong> seçeneğini seçin.
      </p>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Yeniden yazdır
      </button>
    </div>
  );
}
