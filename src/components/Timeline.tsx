import { Lock } from 'lucide-react';
import { eventLabel, statusLabel } from '@/lib/status';
import { formatDateTime } from '@/lib/utils';
import type { RequestEvent, RequestStatus } from '@/types/db';

export interface TimelineItem extends RequestEvent {
  actor_name: string;
}

/** Talebin durum ve islem gecmisi. */
export default function Timeline({ events }: { events: TimelineItem[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Henüz bir hareket yok.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-surface-200 pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-brand-gradient ring-4 ring-white" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{eventLabel(event.type)}</p>
            {!event.client_visible && (
              <span className="badge bg-peach-50 text-peach-800 ring-peach-200">
                <Lock className="h-3 w-3" />
                Ajans içi
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {event.actor_name} · {formatDateTime(event.created_at)}
          </p>
          {event.type === 'status_changed' && event.detail?.to && (
            <p className="mt-0.5 text-xs text-slate-600">
              {event.detail.from ? `${statusLabel(event.detail.from as RequestStatus)} → ` : ''}
              {statusLabel(event.detail.to as RequestStatus)}
              {event.detail.note ? ` · ${event.detail.note}` : ''}
            </p>
          )}
          {event.type === 'field_flagged' && event.detail?.field && (
            <p className="mt-0.5 text-xs text-slate-600">{String(event.detail.field)}</p>
          )}
          {(event.type === 'file_added' || event.type === 'file_removed') &&
            event.detail?.file_name && (
              <p className="mt-0.5 text-xs text-slate-600">{String(event.detail.file_name)}</p>
            )}
        </li>
      ))}
    </ol>
  );
}
