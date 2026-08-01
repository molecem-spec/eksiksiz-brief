import type { ReactNode } from 'react';
import { allSections, formatAnswer, hasValue, visibleFields, type Field } from '@/lib/brief';
import { cn } from '@/lib/utils';
import type { Answers } from '@/types/db';

interface Props {
  answers: Answers;
  /** Alan basina ek eylem (ajans panelinde "eksik işaretle") */
  renderAction?: (field: Field) => ReactNode;
  /** Alan basina uyari notu (isaretlenmis eksik alanlar) */
  flagNoteFor?: (fieldKey: string) => string | null | undefined;
  /** Bos alanlar da gosterilsin mi */
  showEmpty?: boolean;
}

/** Brif cevaplarini bolum bolum okunur bicimde listeler. */
export default function AnswerSections({
  answers,
  renderAction,
  flagNoteFor,
  showEmpty = true,
}: Props) {
  return (
    <div className="space-y-6">
      {allSections().map((section) => {
        const fields = visibleFields(section, answers).filter(
          (field) => showEmpty || hasValue(answers[field.key])
        );
        if (fields.length === 0) return null;

        return (
          <section key={section.id}>
            <h3 className="section-title text-sm">{section.title}</h3>
            <dl className="mt-2.5 divide-y divide-surface-200 overflow-hidden rounded-2xl border border-surface-200 bg-white">
              {fields.map((field) => {
                const flagNote = flagNoteFor?.(field.key);
                const flagged = flagNote !== undefined && flagNote !== null;
                const filled = hasValue(answers[field.key]);
                return (
                  <div
                    key={field.key}
                    className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3', flagged && 'bg-peach-50')}
                  >
                    <dt className="text-xs font-medium text-slate-500">
                      {field.label}
                      {field.required && !filled && (
                        <span className="ml-1 font-semibold text-blossom-600">eksik</span>
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
                        {renderAction && (
                          <span className="no-print shrink-0">{renderAction(field)}</span>
                        )}
                      </div>
                      {flagged && (
                        <p className="mt-1.5 text-xs text-peach-800">
                          <span className="font-semibold">Eksik olarak işaretlendi.</span> {flagNote}
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
