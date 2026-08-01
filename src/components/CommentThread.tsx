'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, MessageSquare, Send } from 'lucide-react';
import { addComment } from '@/app/actions/requests';
import { cn, formatDateTime } from '@/lib/utils';

export interface CommentItem {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  author_name: string;
  author_team: string | null;
  author_role: 'agency' | 'client' | null;
}

interface Props {
  requestId: string;
  comments: CommentItem[];
  /** Ajans kullanicisi ic not yazabilir */
  canWriteInternal: boolean;
  canWrite?: boolean;
}

export default function CommentThread({
  requestId,
  comments,
  canWriteInternal,
  canWrite = true,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const result = await addComment(requestId, body, internal);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Gönderilemedi.');
      return;
    }
    setBody('');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <MessageSquare className="h-4 w-4" />
          Henüz yorum yok.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn(
                'rounded-2xl border p-3.5',
                comment.is_internal
                  ? 'border-peach-200 bg-peach-50'
                  : comment.author_role === 'agency'
                    ? 'border-brand-100 bg-brand-50/60'
                    : 'border-surface-200 bg-white'
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{comment.author_name}</span>
                {comment.author_team && (
                  <span className="text-slate-400">{comment.author_team}</span>
                )}
                {comment.author_role === 'agency' && !comment.is_internal && (
                  <span className="badge bg-brand-50 text-brand-700 ring-brand-200">Ajans</span>
                )}
                {comment.is_internal && (
                  <span className="badge bg-peach-100 text-peach-800 ring-peach-300">
                    <Lock className="h-3 w-3" />
                    İç not · müşteri göremez
                  </span>
                )}
                <span>{formatDateTime(comment.created_at)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-800">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="no-print space-y-2">
          <textarea
            rows={3}
            className="input"
            placeholder={internal ? 'Yalnızca ajansın göreceği not…' : 'Yorumunuzu yazın…'}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-3">
            {canWriteInternal && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-surface-300 text-peach-600 focus:ring-peach-500"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                />
                Ajans içi not (müşteri görmez)
              </label>
            )}
            <div className="flex-1" />
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !body.trim()}
              onClick={handleSend}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gönder
            </button>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
