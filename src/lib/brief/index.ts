import type { Answers, RequestPriority } from '@/types/db';
import {
  BRIEF_SECTION,
  EXTRA_SECTION,
  TITLE_KEY,
  USE_DATE_KEY,
  PRIORITY_KEY,
} from './common';
import { hasValue, visibleFields, type Field, type Section } from './types';

export * from './types';
export * from './common';

export type StepId = 'marka' | 'brif' | 'ek' | 'dosyalar' | 'kontrol';

export interface Step {
  id: StepId;
  title: string;
  /** Soru bolumleri; marka/dosya/kontrol adimlarinda bos kalir */
  sections: Section[];
}

/** Form adimlari. Talep turu sorulmadigi icin herkes ayni akisi gorur. */
export function buildSteps(): Step[] {
  return [
    { id: 'marka', title: 'Marka', sections: [] },
    { id: 'brif', title: 'Talep bilgileri', sections: [BRIEF_SECTION] },
    { id: 'ek', title: 'Ek bilgiler', sections: [EXTRA_SECTION] },
    { id: 'dosyalar', title: 'Dosyalar', sections: [] },
    { id: 'kontrol', title: 'Kontrol ve gönderim', sections: [] },
  ];
}

/** Talebin tum soru bolumleri (detay ekrani ve dokum icin) */
export function allSections(): Section[] {
  return [BRIEF_SECTION, EXTRA_SECTION];
}

export interface MissingField {
  stepId: StepId;
  stepTitle: string;
  field: Field;
}

/** Ajansa iletmeye engel olan bos zorunlu alanlar */
export function missingRequired(answers: Answers): MissingField[] {
  const missing: MissingField[] = [];
  for (const step of buildSteps()) {
    for (const section of step.sections) {
      for (const field of visibleFields(section, answers)) {
        if (field.required && !hasValue(answers[field.key])) {
          missing.push({ stepId: step.id, stepTitle: step.title, field });
        }
      }
    }
  }
  return missing;
}

/** Bir adimda eksik zorunlu alan sayisi */
export function stepMissingCount(step: Step, answers: Answers): number {
  return step.sections.reduce(
    (total, section) =>
      total +
      visibleFields(section, answers).filter((f) => f.required && !hasValue(answers[f.key])).length,
    0
  );
}

/** Alan anahtarindan etiket bulur (eksik alan isaretleri ve gecmis icin) */
export function fieldLabel(key: string): string {
  for (const section of allSections()) {
    const field = section.fields.find((f) => f.key === key);
    if (field) return field.label;
  }
  return key;
}

const PRIORITY_BY_LABEL: Record<string, RequestPriority> = {
  Düşük: 'low',
  Normal: 'normal',
  Yüksek: 'high',
  Acil: 'urgent',
};

/**
 * Cevaplardan filtre/siralama kolonlarini turetir.
 * answers her zaman kaynak dogrudur; kolonlar yalnizca listeleme icindir.
 */
export function deriveColumns(answers: Answers) {
  const text = (key: string) => {
    const value = answers[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };
  return {
    title: text(TITLE_KEY) ?? 'İsimsiz talep',
    use_date: text(USE_DATE_KEY),
    priority: PRIORITY_BY_LABEL[String(answers[PRIORITY_KEY] ?? '')] ?? ('normal' as RequestPriority),
  };
}

/** Insanin okuyabilecegi cevap metni */
export function formatAnswer(value: Answers[string]): string {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  return String(value);
}
