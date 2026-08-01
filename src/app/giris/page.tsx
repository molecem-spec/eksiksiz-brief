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
        Gorsel paneli. Yuklenen gorsel cogunlukla kendi tipografisini ve
        logosunu tasiyan bir afis oluyor; bu yuzden kirpilmiyor ve uzerine
        yazi bindirilmiyor, butun olarak gosteriliyor.
      */}
      <section className="flex items-center justify-center bg-soft-gradient p-5 sm:p-8 lg:p-12">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="18.12 Art ekibi"
            className="max-h-[28vh] w-auto max-w-full rounded-2xl object-contain shadow-card-hover sm:max-h-[34vh] lg:max-h-[84vh] lg:rounded-3xl"
          />
        ) : (
          <div className="flex h-40 w-full max-w-md items-center justify-center rounded-2xl bg-brand-gradient shadow-glow lg:h-96 lg:rounded-3xl">
            <span className="text-4xl font-bold text-white/90 lg:text-5xl">18.12</span>
          </div>
        )}
      </section>

      {/* Metin + giris formu */}
      <section className="flex items-center justify-center bg-white px-6 py-9 sm:px-10 lg:px-14 lg:py-12">
        <div className="w-full max-w-md">
          <span className="badge bg-brand-50 text-brand-700 ring-brand-200">
            İş talebi portalı
          </span>

          <h1 className="mt-4 bg-brand-gradient bg-clip-text text-3xl font-bold leading-tight tracking-tight text-transparent sm:text-4xl">
            {settings.login_title}
          </h1>

          {paragraphs.length > 0 && (
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="card mt-7 p-6">
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

          <p className="mt-4 text-xs text-slate-500">
            Erişiminizde bir sorun varsa ajans ekibiyle iletişime geçin.
          </p>
        </div>
      </section>
    </main>
  );
}
