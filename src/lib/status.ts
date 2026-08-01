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
    badge: 'bg-surface-100 text-slate-600 ring-surface-300',
    dot: 'bg-slate-400',
  },
  submitted: {
    label: 'Ajansa iletildi',
    clientLabel: 'Ajansa iletilenler',
    badge: 'bg-brand-50 text-brand-700 ring-brand-200',
    dot: 'bg-brand-500',
  },
  info_needed: {
    label: 'Ek bilgi bekleniyor',
    clientLabel: 'Ek bilgi bekleyenler',
    badge: 'bg-peach-50 text-peach-700 ring-peach-200',
    dot: 'bg-peach-500',
  },
  in_progress: {
    label: 'İşleme alındı',
    clientLabel: 'İşleme alınanlar',
    badge: 'bg-blossom-50 text-blossom-700 ring-blossom-200',
    dot: 'bg-blossom-500',
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
    badge: 'bg-slate-100 text-slate-500 ring-slate-300',
    dot: 'bg-slate-400',
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
  low: { label: 'Düşük', badge: 'bg-surface-100 text-slate-500 ring-surface-300' },
  normal: { label: 'Normal', badge: 'bg-surface-100 text-slate-600 ring-surface-300' },
  high: { label: 'Yüksek', badge: 'bg-peach-50 text-peach-700 ring-peach-200' },
  urgent: { label: 'Acil', badge: 'bg-blossom-100 text-blossom-700 ring-blossom-300' },
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
  deadline_set: 'Teslim tarihi belirlendi',
};

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}
