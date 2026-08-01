import type { ReactNode } from 'react';
import { allSections, formatAnswer, hasValue, visibleFields, type Field } from '@/lib/brief';
import { cn } from '@/lib/utils';
import type { Answers } from '@/types/db';

interface Props {
  projectType: string;
  answers: Answers;
  /** Alan basina ek eylem (ajans panelinde "eksik işaretle") */
  renderAction?: (field: Field) => ReactNode;
  /** Alan basina uyari rozeti (isaretlenmis eksik alanlar) */
  flagNoteFor?: (fieldKey: string) => string | null | undefined;
  /** Bos alanlar da gosterilsin mi */
  showEmpty?: boolean;
}

/** Brif cevaplarini bolum bolum okunur bicimde listeler. */
export default function AnswerSections({
  projectType,
  answers,
  renderAction,
  flagNoteFor,
  showEmpty = true,
}: Props) {
  const sections = allSections(projectType, answers);

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const fields = visibleFields(section, answers).filter(
          (field) => showEmpty || hasValue(answers[field.key])
        );
        if (fields.length === 0) return null;

        return (
          <section key={section.id}>
            <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
            <dl className="mt-2 divide-y divide-surface-200 overflow-hidden rounded-lg border border-surface-200 bg-white">
              {fields.map((field) => {
                const flagNote = flagNoteFor?.(field.key);
                const filled = hasValue(answers[field.key]);
                return (
                  <div
                    key={field.key}
                    className={cn(
                      'grid gap-1 px-3 py-2.5 sm:grid-cols-3',
                      flagNote !== undefined && flagNote !== null && 'bg-amber-50'
                    )}
                  >
                    <dt className="text-xs text-slate-500">
                      {field.label}
                      {field.required && !filled && (
                        <span className="ml-1 font-medium text-rose-500">eksik</span>
                      )}
                    </dt>
                    <dd className="sm:col-span-2">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            'whitespace-pre-wrap text-sm',
                            filled ? 'text-slate-800' : 'text-slate-400'
                          )}
                        >
                          {filled ? formatAnswer(answers[field.key]) : 'Belirtilmedi'}
                        </span>
                        {renderAction && <span className="no-print shrink-0">{renderAction(field)}</span>}
                      </div>
                      {flagNote !== undefined && flagNote !== null && (
                        <p className="mt-1.5 text-xs text-amber-800">
                          <span className="font-medium">Eksik olarak işaretlendi.</span>{' '}
                          {flagNote}
                        </p>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
