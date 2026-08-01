import type { RequestPriority, RequestStatus } from '@/types/db';

interface StatusMeta {
  label: string;
  /** Musteri panelindeki sekme adi */
  clientLabel: string;
  badge: string;
  dot: string;
}

export const STATUS_META: Record<RequestStatus, StatusMeta> = {
  draft: {
    label: 'Taslak',
    clientLabel: 'Taslaklar',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
  },
  submitted: {
    label: 'Ajansa iletildi',
    clientLabel: 'Ajansa iletilenler',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
  },
  info_needed: {
    label: 'Ek bilgi bekleniyor',
    clientLabel: 'Ek bilgi bekleyenler',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'İşleme alındı',
    clientLabel: 'İşleme alınanlar',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
  },
  completed: {
    label: 'Tamamlandı',
    clientLabel: 'Tamamlananlar',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'İptal edildi',
    clientLabel: 'İptal edilenler',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
};

export const STATUS_ORDER: RequestStatus[] = [
  'draft',
  'submitted',
  'info_needed',
  'in_progress',
  'completed',
  'cancelled',
];

/** Ajansin bir talebi tasiyabilecegi durumlar */
export const AGENCY_STATUS_OPTIONS: RequestStatus[] = [
  'submitted',
  'info_needed',
  'in_progress',
  'completed',
  'cancelled',
];

export function statusLabel(status: RequestStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export const PRIORITY_META: Record<RequestPriority, { label: string; badge: string }> = {
  low: { label: 'Düşük', badge: 'bg-slate-100 text-slate-600 ring-slate-200' },
  normal: { label: 'Normal', badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
  high: { label: 'Yüksek', badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  urgent: { label: 'Acil', badge: 'bg-red-50 text-red-700 ring-red-200' },
};

const EVENT_LABELS: Record<string, string> = {
  created: 'Talep oluşturuldu',
  submitted: 'Talep ajansa iletildi',
  resubmitted: 'Eksikler tamamlanıp yeniden iletildi',
  status_changed: 'Durum değişti',
  comment: 'Yorum eklendi',
  internal_comment: 'İç not eklendi',
  file_added: 'Dosya eklendi',
  file_removed: 'Dosya silindi',
  field_flagged: 'Eksik alan işaretlendi',
  updated: 'Talep güncellendi',
  assigned: 'Sorumlu atandı',
};

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}
