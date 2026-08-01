import { Suspense } from 'react';
import { loadSettings, publicAssetUrl } from '@/lib/settings';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Giriş' };

export default async function LoginPage() {
  const settings = await loadSettings();
  const imageUrl = publicAssetUrl(settings.login_image_path);

  return (
    <main className="min-h-screen bg-soft-gradient">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_minmax(0,420px)] lg:gap-16 lg:px-8">
        {/* Tanitim */}
        <section className="order-2 lg:order-1">
          <span className="badge hidden bg-white/70 text-brand-700 ring-brand-200 lg:inline-flex">
            İş talebi portalı
          </span>

          {/* Buyuk baslik masaustunde solda; mobilde formun ustunde gosterilir. */}
          <h1 className="mt-4 hidden bg-brand-gradient bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent sm:text-5xl lg:block">
            {settings.login_title}
          </h1>

          <div className="mt-5 max-w-xl space-y-4 text-[15px] leading-relaxed text-slate-600">
            {settings.login_intro.split('\n').map((paragraph, index) =>
              paragraph.trim() ? <p key={index}>{paragraph}</p> : null
            )}
          </div>

          {imageUrl && (
            <div className="mt-8 overflow-hidden rounded-3xl border border-white/70 shadow-card-hover">
              {/* Ajans panelinden yuklenen ekip gorseli */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Ekip fotoğrafı"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </section>

        {/* Giris formu */}
        <section className="order-1 lg:order-2">
          <div className="mb-6 text-center lg:hidden">
            <h1 className="bg-brand-gradient bg-clip-text text-3xl font-bold leading-tight tracking-tight text-transparent">
              {settings.login_title}
            </h1>
          </div>

          <div className="card p-6 sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">Giriş yapın</h2>
            <p className="mt-1 text-sm text-slate-500">
              Hesabınız ajans tarafından tanımlanır.
            </p>

            <div className="mt-5">
              <Suspense fallback={<div className="h-48" />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Erişiminizde bir sorun varsa ajans ekibiyle iletişime geçin.
          </p>
        </section>
      </div>
    </main>
  );
}
