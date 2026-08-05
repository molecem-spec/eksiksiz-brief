'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { syncRequestToHub } from '@/app/actions/hub';
import { formatDateTime } from '@/lib/utils';

interface Props {
  requestId: string;
  hubTaskId: string | null;
  hubSyncedAt: string | null;
  hubError: string | null;
  /** Taslak talepler henüz aktarılmaz */
  submitted: boolean;
}

/** Talebin Hub'a aktarim durumu ve yeniden deneme. */
export default function HubSyncPanel({
  requestId,
  hubTaskId,
  hubSyncedAt,
  hubError,
  submitted,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setMessage(null);
    const result = await syncRequestToHub(requestId);
    setBusy(false);
    setMessage(result.ok ? 'Görev oluşturuldu.' : (result.error ?? 'Aktarılamadı.'));
    router.refresh();
  }

  if (!submitted) {
    return <p className="text-sm text-slate-500">Talep iletildiğinde Hub’a görev olarak düşer.</p>;
  }

  return (
    <div className="space-y-3">
      {hubTaskId ? (
        <p className="flex items-start gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Hub’da görev oluşturuldu.
            {hubSyncedAt && (
              <span className="block text-xs text-slate-500">{formatDateTime(hubSyncedAt)}</span>
            )}
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 text-sm text-peach-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Henüz Hub’a aktarılmadı.
            {hubError && <span className="block text-xs text-slate-500">{hubError}</span>}
          </span>
        </p>
      )}

      <button type="button" className="btn-secondary w-full" disabled={busy} onClick={retry}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {hubTaskId ? 'Yeniden aktar' : 'Hub’a aktar'}
      </button>

      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
