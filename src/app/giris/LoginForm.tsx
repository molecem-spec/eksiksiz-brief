'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'magic' | 'password';

const ERROR_MESSAGES: Record<string, string> = {
  profil: 'Hesabınız henüz tanımlanmamış. Lütfen ajans ekibiyle iletişime geçin.',
  pasif: 'Hesabınız pasif durumda. Lütfen ajans ekibiyle iletişime geçin.',
  baglanti: 'Giriş bağlantısı geçersiz veya süresi dolmuş. Yeniden deneyin.',
};

export default function LoginForm() {
  const params = useSearchParams();
  const next = params.get('devam') ?? '/';
  const initialError = ERROR_MESSAGES[params.get('hata') ?? ''] ?? null;

  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    try {
      if (mode === 'magic') {
        const origin =
          process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? window.location.origin;
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            // Hesap yalnizca ajans tarafindan olusturulur; magic link yeni
            // kullanici yaratmasin.
            shouldCreateUser: false,
            emailRedirectTo: `${origin}/auth/callback?devam=${encodeURIComponent(next)}`,
          },
        });
        if (authError) throw authError;
        setSent(true);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        window.location.href = next;
      }
    } catch (err: any) {
      const message = String(err?.message ?? '');
      if (message.includes('Signups not allowed') || message.includes('User not found')) {
        setError('Bu e-posta adresi sistemde tanımlı değil.');
      } else if (message.includes('Invalid login credentials')) {
        setError('E-posta veya şifre hatalı.');
      } else if (message.toLowerCase().includes('rate')) {
        setError('Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.');
      } else {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
          <Mail className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="mt-4 text-lg font-medium text-slate-900">Giriş bağlantısı gönderildi</h2>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{email}</span> adresine tek kullanımlık bir
          giriş bağlantısı yolladık. Bağlantı kısa süre içinde geçerliliğini yitirir.
        </p>
        <button
          type="button"
          className="btn-ghost mt-4"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
        >
          Farklı bir adres kullan
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          E-posta adresi
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input mt-1"
          placeholder="ad@sirket.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {mode === 'password' && (
        <div>
          <label className="label" htmlFor="password">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === 'magic' ? (
          <Mail className="h-4 w-4" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        {mode === 'magic' ? 'Giriş bağlantısı gönder' : 'Giriş yap'}
      </button>

      <button
        type="button"
        className="w-full text-center text-sm text-slate-500 hover:text-brand-700"
        onClick={() => {
          setMode(mode === 'magic' ? 'password' : 'magic');
          setError(null);
        }}
      >
        {mode === 'magic' ? 'Şifreyle giriş yap' : 'E-posta bağlantısıyla giriş yap'}
      </button>
    </form>
  );
}
