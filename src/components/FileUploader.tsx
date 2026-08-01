'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { deleteFile, registerFile } from '@/app/actions/requests';
import { FILE_CATEGORIES } from '@/lib/brief';
import { createClient } from '@/lib/supabase/client';
import { formatBytes, formatDateTime, safeFileName } from '@/lib/utils';
import type { RequestFile } from '@/types/db';

const MAX_BYTES = 25 * 1024 * 1024;

interface Props {
  requestId: string;
  files: RequestFile[];
  /** Yukleme kapaliysa yalnizca listeleme yapilir */
  canUpload: boolean;
  canDelete?: boolean;
  onChanged?: () => void;
}

export default function FileUploader({
  requestId,
  files,
  canUpload,
  canDelete = true,
  onChanged,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(FILE_CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState(files);

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();

    try {
      for (const file of Array.from(selected)) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name} çok büyük (en fazla 25 MB).`);
          continue;
        }

        // Yol talep kimligiyle basliyor; Storage politikasi buna gore izin veriyor.
        const path = `${requestId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('brief-files')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          setError(`${file.name} yüklenemedi: ${uploadError.message}`);
          continue;
        }

        const result = await registerFile({
          requestId,
          storagePath: path,
          fileName: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size,
          category,
        });

        if (!result.ok || !result.data) {
          setError(result.error ?? 'Dosya kaydedilemedi.');
          await supabase.storage.from('brief-files').remove([path]);
          continue;
        }

        setList((prev) => [
          ...prev,
          {
            id: result.data!.id,
            request_id: requestId,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
            category,
            uploaded_by: null,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      onChanged?.();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDownload(file: RequestFile) {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from('brief-files')
      .createSignedUrl(file.storage_path, 60, { download: file.file_name });

    if (signError || !data) {
      setError('Dosya bağlantısı oluşturulamadı.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleDelete(file: RequestFile) {
    if (!confirm(`"${file.file_name}" silinsin mi?`)) return;
    setBusy(true);
    const result = await deleteFile(file.id, requestId);
    if (!result.ok) setError(result.error ?? 'Silinemedi.');
    else setList((prev) => prev.filter((f) => f.id !== file.id));
    setBusy(false);
    onChanged?.();
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="rounded-xl border-2 border-dashed border-surface-300 bg-surface-50 p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="text-sm">
              <span className="label">Dosya türü</span>
              <select
                className="input mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {FILE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dosya seç
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <p className="mt-3 text-xs text-slate-500">
            Logo, kurumsal kimlik, referans görsel, ürün/mekân fotoğrafı, menü, etkinlik programı,
            PDF, Word, sunum ve benzeri dosyaları yükleyebilirsiniz. Dosya başına en fazla 25 MB.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz dosya yüklenmedi.</p>
      ) : (
        <ul className="divide-y divide-surface-200 overflow-hidden rounded-xl border border-surface-200 bg-white">
          {list.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-4 py-3">
              <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{file.file_name}</p>
                <p className="text-xs text-slate-500">
                  {file.category}
                  {file.size_bytes ? ` · ${formatBytes(file.size_bytes)}` : ''} ·{' '}
                  {formatDateTime(file.created_at)}
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost px-2"
                title="İndir"
                onClick={() => handleDownload(file)}
              >
                <Download className="h-4 w-4" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  className="btn-ghost px-2 text-rose-600 hover:bg-rose-50"
                  title="Sil"
                  disabled={busy}
                  onClick={() => handleDelete(file)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
