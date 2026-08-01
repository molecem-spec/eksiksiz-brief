import { cn } from '@/lib/utils';
import { PRIORITY_META, STATUS_META } from '@/lib/status';
import type { RequestPriority, RequestStatus } from '@/types/db';

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={cn('badge', meta.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  return <span className={cn('badge', meta.badge)}>{meta.label}</span>;
}
