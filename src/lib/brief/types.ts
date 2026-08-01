import type { Answers } from '@/types/db';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'number'
  | 'tel'
  | 'email'
  | 'select'
  | 'multiselect'
  | 'checkbox';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
  required?: boolean;
  /** Formda yarim genislikte gosterilsin */
  half?: boolean;
  /** Baska bir alanin degerine bagli olarak gorunur */
  showIf?: (answers: Answers) => boolean;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
}

export interface ProjectType {
  key: string;
  label: string;
  /** Etkinlik bilgileri adimini varsayilan olarak acar */
  isEvent?: boolean;
  description?: string;
  sections: Section[];
}

/** Cevabin dolu sayilip sayilmadigi */
export function hasValue(value: Answers[string]): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return String(value).trim().length > 0;
}

/** Kosula gore o an gorunur olan alanlar */
export function visibleFields(section: Section, answers: Answers): Field[] {
  return section.fields.filter((f) => !f.showIf || f.showIf(answers));
}
