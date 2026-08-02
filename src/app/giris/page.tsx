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
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
      {/*
        Gorsel paneli. Yuklenen afis zaten renkli ve kendi tipografisini
        tasiyor; cevresi bilerek sessiz ve koyu tutuldu ki tek renk kaynagi
        gorselin kendisi olsun. Degrade, parilti veya bulanik leke yok.
      */}
      <section className="relative flex items-center justify-center overflow-hidden bg-brand-950 px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        {/* Eserin uzerine dusen isik: duz zeminde asili degil, aydinlatilmis
            hissi versin diye cok hafif bir radyal parlaklik. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(255,255,255,0.09),transparent_70%)]"
        />

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="relative max-h-[26vh] w-auto max-w-full rounded-xl object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:max-h-[32vh] lg:max-h-[80vh]"
          />
        ) : (
          <span className="relative text-5xl font-semibold tracking-tight text-white/25 lg:text-7xl">
            18.12
          </span>
        )}
      </section>

      {/* Icerik ve giris */}
      <section className="flex items-center bg-white px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div className="w-full max-w-[26rem]">
          <h1 className="text-pretty text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.025em] text-slate-900 lg:text-[2.5rem]">
            {settings.login_title}
          </h1>

          {paragraphs.length > 0 && (
            <div className="mt-5 space-y-3 text-[0.9375rem] leading-[1.65] text-slate-500">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {/* Ince ayrac: kart yerine tek bir cizgi yeterli. */}
          <hr className="my-9 border-surface-200" />

          <Suspense fallback={<div className="h-56" />}>
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-[0.8125rem] leading-relaxed text-slate-400">
            Hesaplar ajans tarafından tanımlanır. Erişiminizde bir sorun varsa ajans ekibiyle
            iletişime geçin.
          </p>
        </div>
      </section>
    </main>
  );
}
