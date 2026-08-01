'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MIN_LENGTH = 8;

export default function PasswordForm() {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Şifre en az ${MIN_LENGTH} karakter olmalı.`);
      return;
    }
    if (password !== repeat) {
      setError('İki şifre birbiriyle aynı değil.');
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(
        updateError.message.includes('should be different')
          ? 'Yeni şifre eskisiyle aynı olamaz.'
          : 'Şifre değiştirilemedi. Lütfen tekrar deneyin.'
      );
      return;
    }

    setPassword('');
    setRepeat('');
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-inset ring-emerald-200">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Şifreniz güncellendi
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Bir sonraki girişinizde yeni şifrenizi kullanın.
        </p>
        <button type="button" className="btn-ghost mt-2" onClick={() => setDone(false)}>
          Yeniden değiştir
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="new-password">
          Yeni şifre
        </label>
        <input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          className="input mt-1.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">En az {MIN_LENGTH} karakter.</p>
      </div>

      <div>
        <label className="label" htmlFor="repeat-password">
          Yeni şifre (tekrar)
        </label>
        <input
          id="repeat-password"
          type="password"
          required
          autoComplete="new-password"
          className="input mt-1.5"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-blossom-50 px-3 py-2 text-sm text-blossom-700 ring-1 ring-inset ring-blossom-200">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Şifreyi güncelle
      </button>
    </form>
  );
}
