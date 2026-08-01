'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Loader2, X } from 'lucide-react';
import AnswerSections from '@/components/AnswerSections';
import { flagField, removeFlag } from '@/app/actions/requests';
import type { Field } from '@/lib/brief';
import type { Answers, RequestFieldFlag } from '@/types/db';

interface Props {
  requestId: string;
  projectType: string;
  answers: Answers;
  flags: RequestFieldFlag[];
}

/**
 * Brif cevaplarini gosterir ve her alanin yanina "eksik isaretle" eylemi ekler.
 * Isaretlenen alanlar musteri tarafinda yeniden duzenlenebilir hale gelir.
 */
export default function FlaggableAnswers({ requestId, projectType, answers, flags }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Field | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openFlags = flags.filter((flag) => !flag.resolved);
  const flagFor = (key: string) => openFlags.find((flag) => flag.field_key === key);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    const result = await flagField(requestId, editing.key, editing.label, note);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'İşaretlenemedi.');
      return;
    }
    setEditing(null);
    setNote('');
    router.refresh();
  }

  async function clear(flagId: string) {
    setBusy(true);
    await removeFlag(flagId, requestId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {openFlags.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            {openFlags.length} alan eksik olarak işaretlendi
          </p>
          <ul className="mt-2 space-y-1">
            {openFlags.map((flag) => (
              <li key={flag.id} className="flex items-center gap-2 text-sm text-amber-900">
                <span className="flex-1">
                  <span className="font-medium">{flag.field_label}</span>
                  {flag.note ? ` — ${flag.note}` : ''}
                </span>
                <button
                  type="button"
                  className="rounded p-1 hover:bg-amber-100"
                  title="İşareti kaldır"
                  disabled={busy}
                  onClick={() => clear(flag.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            Müşterinin bu alanları düzenleyebilmesi için talebi “Ek bilgi bekleniyor” durumuna alın.
          </p>
        </div>
      )}

      <AnswerSections
        projectType={projectType}
        answers={answers}
        flagNoteFor={(key) => {
          const flag = flagFor(key);
          return flag ? (flag.note ?? '') : undefined;
        }}
        renderAction={(field) =>
          flagFor(field.key) ? null : (
            <button
              type="button"
              className="rounded p-1 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
              title="Bu alanı eksik olarak işaretle"
              onClick={() => {
                setEditing(field);
                setNote('');
              }}
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )
        }
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-medium text-slate-900">Eksik alan işareti</h3>
            <p className="mt-1 text-sm text-slate-600">{editing.label}</p>

            <label className="label mt-4" htmlFor="flag-note">
              Müşteriye iletilecek not
            </label>
            <textarea
              id="flag-note"
              rows={3}
              className="input mt-1"
              placeholder="Örn. Etkinliğin bitiş saatini ve kontenjanı da yazar mısınız?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Vazgeç
              </button>
              <button type="button" className="btn-primary" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                İşaretle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
