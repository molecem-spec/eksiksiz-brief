'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { assignRequest, setAgencyNote, setStatus } from '@/app/actions/requests';
import { AGENCY_STATUS_OPTIONS, STATUS_META } from '@/lib/status';
import type { RequestStatus } from '@/types/db';

interface Props {
  requestId: string;
  status: RequestStatus;
  assignedTo: string | null;
  agencyNote: string | null;
  staff: { id: string; name: string }[];
}

/** Ajansin talep uzerindeki operasyon eylemleri. */
export default function AgencyControls({
  requestId,
  status,
  assignedTo,
  agencyNote,
  staff,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState(agencyNote ?? '');
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(next: RequestStatus) {
    setBusy('status');
    setError(null);
    const result = await setStatus(requestId, next, statusNote || undefined);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? 'Durum değiştirilemedi.');
      return;
    }
    setStatusNote('');
    router.refresh();
  }

  async function changeAssignee(userId: string) {
    setBusy('assign');
    setError(null);
    const result = await assignRequest(requestId, userId || null);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? 'Atama yapılamadı.');
      return;
    }
    router.refresh();
  }

  async function saveNote() {
    setBusy('note');
    setError(null);
    const result = await setAgencyNote(requestId, note);
    setBusy(null);
    if (!result.ok) setError(result.error ?? 'Not kaydedilemedi.');
    else router.refresh();
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
              onClick={() => changeStatus(option)}
              className={
                option === status
                  ? 'flex items-center justify-between rounded-lg border border-brand-600 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800'
                  : 'flex items-center justify-between rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-50'
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
          “Ek bilgi bekleniyor” seçildiğinde müşteri, işaretlediğiniz alanları düzenleyebilir.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="assignee">
          Sorumlu ekip üyesi
        </label>
        <select
          id="assignee"
          className="input mt-1"
          value={assignedTo ?? ''}
          disabled={busy !== null}
          onChange={(e) => changeAssignee(e.target.value)}
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
          className="input mt-1"
          placeholder="Müşteri bu notu görmez."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          className="btn-secondary mt-2 w-full"
          disabled={busy !== null}
          onClick={saveNote}
        >
          {busy === 'note' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Notu kaydet
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
