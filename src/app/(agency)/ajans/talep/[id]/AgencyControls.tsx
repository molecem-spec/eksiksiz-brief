'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { assignRequest, setAgencyNote, setDeadline, setStatus } from '@/app/actions/requests';
import { AGENCY_STATUS_OPTIONS, STATUS_META } from '@/lib/status';
import type { RequestStatus } from '@/types/db';

interface Props {
  requestId: string;
  status: RequestStatus;
  assignedTo: string | null;
  agencyNote: string | null;
  deadline: string | null;
  staff: { id: string; name: string }[];
}

/** Ajansin talep uzerindeki operasyon eylemleri. */
export default function AgencyControls({
  requestId,
  status,
  assignedTo,
  agencyNote,
  deadline,
  staff,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState(agencyNote ?? '');
  const [statusNote, setStatusNote] = useState('');
  const [due, setDue] = useState(deadline ?? '');
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    setError(null);
    const result = await action();
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? 'İşlem tamamlanamadı.');
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="label">Talep durumu</p>
        <div className="mt-2 grid gap-1.5">
          {AGENCY_STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              disabled={busy !== null || option === status}
              onClick={async () => {
                const ok = await run('status', () =>
                  setStatus(requestId, option, statusNote || undefined)
                );
                if (ok) setStatusNote('');
              }}
              className={
                option === status
                  ? 'flex items-center justify-between rounded-xl border border-brand-400 bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-800'
                  : 'flex items-center justify-between rounded-xl border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-50'
              }
            >
              {STATUS_META[option].label}
              {option === status && <span className="text-xs">mevcut</span>}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input mt-2"
          placeholder="Durum değişikliği notu (isteğe bağlı)"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          “Ek bilgi bekleniyor” seçildiğinde marka ekibi, işaretlediğiniz alanları düzenleyebilir.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="deadline">
          İç teslim tarihi
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="deadline"
            type="date"
            className="input"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            disabled={busy !== null}
            onClick={() => run('deadline', () => setDeadline(requestId, due || null))}
          >
            {busy === 'deadline' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Yalnızca ajans görür. Marka ekibine gösterilmez.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="assignee">
          Sorumlu ekip üyesi
        </label>
        <select
          id="assignee"
          className="input mt-1.5"
          value={assignedTo ?? ''}
          disabled={busy !== null}
          onChange={(e) => run('assign', () => assignRequest(requestId, e.target.value || null))}
        >
          <option value="">Atanmadı</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="agency-note">
          Ajans içi özet not
        </label>
        <textarea
          id="agency-note"
          rows={3}
          className="input mt-1.5"
          placeholder="Marka ekibi bu notu görmez."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          className="btn-secondary mt-2 w-full"
          disabled={busy !== null}
          onClick={() => run('note', () => setAgencyNote(requestId, note))}
        >
          {busy === 'note' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Notu kaydet
        </button>
      </div>

      {error && <p className="text-sm text-blossom-600">{error}</p>}
    </div>
  );
}
