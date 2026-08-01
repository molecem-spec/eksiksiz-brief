import type { Answers, RequestPriority } from '@/types/db';
import {
  BASE_SECTION,
  DESIGN_SECTION,
  FORMAT_SECTION,
  EVENT_FLAG_KEY,
  TITLE_KEY,
  USE_DATE_KEY,
  DEADLINE_KEY,
  PRIORITY_KEY,
} from './common';
import { EVENT_SECTION } from './event';
import { PROJECT_TYPE_MAP, PROJECT_TYPES } from './projectTypes';
import { hasValue, visibleFields, type Field, type Section } from './types';

export * from './types';
export * from './common';
export { EVENT_SECTION } from './event';
export { PROJECT_TYPES, PROJECT_TYPE_MAP, projectTypeLabel } from './projectTypes';

export type StepId =
  | 'marka'
  | 'tur'
  | 'temel'
  | 'ozel'
  | 'etkinlik'
  | 'tasarim'
  | 'formatlar'
  | 'dosyalar'
  | 'kontrol';

export interface Step {
  id: StepId;
  title: string;
  /** Soru bolumleri; marka/tur/dosya/kontrol adimlarinda bos kalir */
  sections: Section[];
}

/** Talep bir etkinlik iceriyor mu? */
export function isEventRequest(projectType: string, answers: Answers): boolean {
  if (PROJECT_TYPE_MAP[projectType]?.isEvent) return true;
  return answers[EVENT_FLAG_KEY] === true;
}

/** Secilen proje turune gore form adimlari */
export function buildSteps(projectType: string, answers: Answers): Step[] {
  const type = PROJECT_TYPE_MAP[projectType];
  const steps: Step[] = [
    { id: 'marka', title: 'Marka', sections: [] },
    { id: 'tur', title: 'Çalışma türü', sections: [] },
    { id: 'temel', title: 'Temel bilgiler', sections: [BASE_SECTION] },
  ];

  if (type && type.sections.length > 0) {
    steps.push({ id: 'ozel', title: type.label, sections: type.sections });
  }

  if (isEventRequest(projectType, answers)) {
    steps.push({ id: 'etkinlik', title: 'Etkinlik bilgileri', sections: [EVENT_SECTION] });
  }

  steps.push(
    { id: 'tasarim', title: 'Tasarım yönlendirmeleri', sections: [DESIGN_SECTION] },
    { id: 'formatlar', title: 'Mecra ve ölçüler', sections: [FORMAT_SECTION] },
    { id: 'dosyalar', title: 'Dosyalar', sections: [] },
    { id: 'kontrol', title: 'Kontrol ve gönderim', sections: [] }
  );

  return steps;
}

/** Talebin tum soru bolumleri (detay ekrani ve PDF icin) */
export function allSections(projectType: string, answers: Answers): Section[] {
  return buildSteps(projectType, answers).flatMap((s) => s.sections);
}

export interface MissingField {
  stepId: StepId;
  stepTitle: string;
  field: Field;
}

/** Ajansa iletmeye engel olan bos zorunlu alanlar */
export function missingRequired(projectType: string, answers: Answers): MissingField[] {
  const missing: MissingField[] = [];
  for (const step of buildSteps(projectType, answers)) {
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

/** Bir adimda eksik zorunlu alan var mi? */
export function stepMissingCount(step: Step, answers: Answers): number {
  return step.sections.reduce(
    (total, section) =>
      total +
      visibleFields(section, answers).filter((f) => f.required && !hasValue(answers[f.key])).length,
    0
  );
}

/** Alan anahtarindan etiket bulur (eksik alan isaretleri ve gecmis icin) */
export function fieldLabel(projectType: string, answers: Answers, key: string): string {
  for (const section of allSections(projectType, answers)) {
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
    deadline: text(DEADLINE_KEY),
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

export const PROJECT_TYPE_KEYS = PROJECT_TYPES.map((t) => t.key);
