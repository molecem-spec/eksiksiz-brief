'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ERROR_MESSAGES: Record<string, string> = {
  profil: 'Hesabınız henüz tanımlanmamış. Lütfen ajans ekibiyle iletişime geçin.',
  pasif: 'Hesabınız pasif durumda. Lütfen ajans ekibiyle iletişime geçin.',
  baglanti: 'Giriş bağlantısı geçersiz veya süresi dolmuş.',
};

export default function LoginForm() {
  const params = useSearchParams();
  const next = params.get('devam') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    ERROR_MESSAGES[params.get('hata') ?? ''] ?? null
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      window.location.href = next;
    } catch (err: any) {
      const message = String(err?.message ?? '').toLowerCase();
      if (message.includes('invalid login credentials')) {
        setError('E-posta veya şifre hatalı.');
      } else if (message.includes('rate')) {
        setError('Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.');
      } else {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
      }
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          className="block text-[0.8125rem] font-medium text-slate-700"
          htmlFor="email"
        >
          E-posta adresi
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="mt-2 h-12 w-full rounded-xl border border-surface-300 bg-white px-4 text-[0.9375rem] text-slate-900 transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          placeholder="ad@marka.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label
          className="block text-[0.8125rem] font-medium text-slate-700"
          htmlFor="password"
        >
          Şifre
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-xl border border-surface-300 bg-white px-4 text-[0.9375rem] text-slate-900 transition-shadow focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-blossom-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-[0.9375rem] font-semibold text-white transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Giriş yap
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
