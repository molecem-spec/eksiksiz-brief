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
        Gorsel paneli. Yuklenen gorsel genelde kendi logosunu ve tipografisini
        tasiyan bir afis oldugu icin kirpilmiyor, uzerine yazi bindirilmiyor;
        karakteri arkasindaki dekoratif renk lekeleri veriyor.
      */}
      <section className="relative flex items-center justify-center overflow-hidden bg-soft-gradient p-6 sm:p-10 lg:p-12">
        {/* Dekoratif zemin */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-72 w-72 animate-float rounded-full bg-blossom-200/55 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 animate-float-slow rounded-full bg-peach-200/55 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200/45 blur-3xl" />
        </div>

        <div className="relative animate-rise-in">
          {/* Gorselin arkasindaki renkli parilti */}
          <div
            aria-hidden
            className="absolute -inset-4 rounded-[2.25rem] bg-brand-gradient opacity-25 blur-2xl"
          />

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="18.12 Art ekibi"
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
        {/* Sag panelde de hafif bir renk izi kalsin */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl"
        />

        <div className="relative w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="h-1 w-9 rounded-full bg-brand-gradient" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              İş talebi portalı
            </span>
          </div>

          <h1 className="mt-4 bg-brand-gradient bg-clip-text text-4xl font-bold leading-[1.08] tracking-tight text-transparent lg:text-[2.9rem]">
            {settings.login_title}
          </h1>

          {paragraphs.length > 0 && (
            <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600 lg:mt-5 lg:space-y-3 lg:text-[15px]">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {/* Degrade kenarlikli form karti */}
          <div className="mt-6 rounded-2xl bg-brand-gradient p-px shadow-card-hover lg:mt-8">
            <div className="rounded-[calc(1rem-1px)] bg-white p-6">
              <h2 className="text-base font-bold text-slate-900">Giriş yapın</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Hesabınız ajans tarafından tanımlanır.
              </p>

              <div className="mt-5">
                <Suspense fallback={<div className="h-48" />}>
                  <LoginForm />
                </Suspense>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Erişiminizde bir sorun varsa ajans ekibiyle iletişime geçin.
          </p>
        </div>
      </section>
    </main>
  );
}
