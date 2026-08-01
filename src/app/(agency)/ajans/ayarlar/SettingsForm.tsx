'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, ImageUp, Loader2, Save, Trash2 } from 'lucide-react';
import { saveSettings } from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';
import { cn, safeFileName } from '@/lib/utils';
import type { SiteSettings } from '@/types/db';

const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  settings: SiteSettings;
  currentImageUrl: string | null;
}

export default function SettingsForm({ settings, currentImageUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState(settings.app_name);
  const [loginTitle, setLoginTitle] = useState(settings.login_title);
  const [loginIntro, setLoginIntro] = useState(settings.login_intro);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [busy, setBusy] = useState<'save' | 'upload' | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  async function handleSave() {
    setBusy('save');
    setMessage(null);
    const result = await saveSettings({ appName, loginTitle, loginIntro });
    setBusy(null);
    setMessage(
      result.ok
        ? { tone: 'ok', text: 'Ayarlar kaydedildi.' }
        : { tone: 'error', text: result.error ?? 'Kaydedilemedi.' }
    );
    if (result.ok) router.refresh();
  }

  async function handleUpload(file: File | null | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setMessage({ tone: 'error', text: 'Görsel çok büyük (en fazla 10 MB).' });
      return;
    }

    setBusy('upload');
    setMessage(null);
    const supabase = createClient();
    const path = `giris/${crypto.randomUUID()}-${safeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setBusy(null);
      setMessage({ tone: 'error', text: `Yüklenemedi: ${uploadError.message}` });
      return;
    }

    const result = await saveSettings({ appName, loginTitle, loginIntro, loginImagePath: path });
    setBusy(null);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Kaydedilemedi.' });
      return;
    }

    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setMessage({ tone: 'ok', text: 'Görsel güncellendi.' });
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  async function handleRemoveImage() {
    if (!confirm('Giriş görseli kaldırılsın mı?')) return;
    setBusy('save');
    const result = await saveSettings({ appName, loginTitle, loginIntro, loginImagePath: null });
    setBusy(null);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Kaldırılamadı.' });
      return;
    }
    setImageUrl(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <h2 className="section-title">Metinler</h2>

        <div>
          <label className="label" htmlFor="app-name">
            Portal adı (üst barda görünür)
          </label>
          <input
            id="app-name"
            className="input mt-1.5"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="login-title">
            Giriş sayfası başlığı
          </label>
          <input
            id="login-title"
            className="input mt-1.5"
            value={loginTitle}
            onChange={(e) => setLoginTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="login-intro">
            Giriş sayfası açıklaması
          </label>
          <textarea
            id="login-intro"
            rows={7}
            className="input mt-1.5"
            value={loginIntro}
            onChange={(e) => setLoginIntro(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Boş satır bırakarak paragraf ayırabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-primary" onClick={handleSave} disabled={busy !== null}>
            {busy === 'save' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Kaydet
          </button>
          <a href="/giris" target="_blank" rel="noreferrer" className="btn-secondary">
            <ExternalLink className="h-4 w-4" />
            Giriş sayfasını gör
          </a>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="section-title">Ekip fotoğrafı</h2>
        <p className="text-sm text-slate-600">
          Giriş sayfasında açıklama metninin altında gösterilir. Yatay (geniş) bir görsel en iyi
          sonucu verir. En fazla 10 MB.
        </p>

        {imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-surface-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Giriş görseli" className="max-h-72 w-full object-cover" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
          >
            {busy === 'upload' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageUp className="h-4 w-4" />
            )}
            {imageUrl ? 'Görseli değiştir' : 'Görsel yükle'}
          </button>

          {imageUrl && (
            <button
              type="button"
              className="btn-danger"
              disabled={busy !== null}
              onClick={handleRemoveImage}
            >
              <Trash2 className="h-4 w-4" />
              Kaldır
            </button>
          )}
        </div>
      </div>

      {message && (
        <p
          className={cn(
            'rounded-xl px-3 py-2 text-sm ring-1 ring-inset',
            message.tone === 'ok'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-blossom-50 text-blossom-700 ring-blossom-200'
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
