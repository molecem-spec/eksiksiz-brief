import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = { title: 'Giriş · Eksiksiz Brif' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Eksiksiz Brif</h1>
          <p className="mt-2 text-sm text-brand-200">
            İş taleplerinizi buradan oluşturur ve takip edersiniz.
          </p>
        </div>

        <div className="card p-6">
          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-brand-300">
          Hesaplar ajans tarafından tanımlanır. Erişiminiz yoksa ajans ekibiyle iletişime geçin.
        </p>
      </div>
    </main>
  );
}
