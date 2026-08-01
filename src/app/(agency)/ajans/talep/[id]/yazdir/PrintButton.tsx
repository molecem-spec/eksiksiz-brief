'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft-gradient px-4 py-3">
      <p className="text-sm text-slate-600">
        Yazdırma penceresinde hedef olarak <strong>PDF olarak kaydet</strong> seçeneğini kullanın.
      </p>
      <button type="button" className="btn-primary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Yazdır
      </button>
    </div>
  );
}
