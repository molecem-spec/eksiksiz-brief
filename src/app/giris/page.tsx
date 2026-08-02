import { Suspense } from 'react';
import { loadSettings, publicAssetUrl } from '@/lib/settings';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Giriş' };

export default async function LoginPage() {
  const settings = await loadSettings();
  const imageUrl = publicAssetUrl(settings.login_image_path);

  const paragraphs = settings.login_intro
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/*
        Gorsel paneli. Afis kendi tipografisini tasidigi icin kirpilmiyor ve
        uzerine yazi bindirilmiyor; karakteri arkasindaki yumusak renk
        lekelerinden geliyor.
      */}
      <section className="relative flex items-center justify-center overflow-hidden bg-soft-gradient p-6 sm:p-10 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-72 w-72 animate-float rounded-full bg-blossom-200/55 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 animate-float-slow rounded-full bg-peach-200/55 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200/45 blur-3xl" />
        </div>

        <div className="relative animate-rise-in">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-[2.25rem] bg-brand-gradient opacity-25 blur-2xl"
          />

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="relative max-h-[28vh] w-auto max-w-full rounded-2xl object-contain shadow-card-hover ring-1 ring-white/70 sm:max-h-[34vh] lg:max-h-[80vh] lg:rounded-3xl"
            />
          ) : (
            <div className="relative flex h-44 w-full max-w-md items-center justify-center rounded-2xl bg-brand-gradient shadow-glow lg:h-96 lg:rounded-3xl">
              <span className="text-4xl font-bold tracking-tight text-white/90 lg:text-6xl">
                18.12
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Metin + giris formu */}
      <section className="relative flex items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-10 lg:px-16 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl"
        />

        <div className="relative w-full max-w-[26rem]">
          {/* Baslikta degrade yok: sayfadaki tek vurgu giris dugmesi. */}
          <h1 className="text-pretty text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.025em] text-slate-900 lg:text-[2.5rem]">
            {settings.login_title}
          </h1>

          {paragraphs.length > 0 && (
            <div className="mt-5 space-y-3 text-[0.9375rem] leading-[1.65] text-slate-500">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-surface-200 bg-white p-6 shadow-card-hover">
            <Suspense fallback={<div className="h-56" />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-5 text-[0.8125rem] leading-relaxed text-slate-400">
            Hesaplar ajans tarafından tanımlanır. Erişiminizde bir sorun varsa ajans ekibiyle
            iletişime geçin.
          </p>
        </div>
      </section>
    </main>
  );
}
