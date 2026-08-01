import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-medium text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-sm text-slate-600">
          Aradığınız sayfa yok ya da bu içeriği görme yetkiniz bulunmuyor.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Panele dön
        </Link>
      </div>
    </main>
  );
}
