'use client';

import { Check, Lock } from 'lucide-react';
import type { Field } from '@/lib/brief';
import type { Answers } from '@/types/db';
import { cn } from '@/lib/utils';

interface Props {
  field: Field;
  value: Answers[string];
  onChange: (value: Answers[string]) => void;
  /** Ajans bu alani "eksik" olarak isaretlediyse gosterilecek not */
  flagNote?: string | null;
  disabled?: boolean;
  /** Gonderim denemesinden sonra bos zorunlu alanlari isaretle */
  showError?: boolean;
}

export default function FieldInput({
  field,
  value,
  onChange,
  flagNote,
  disabled,
  showError,
}: Props) {
  const id = `field-${field.key}`;

  if (field.type === 'checkbox') {
    return (
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 sm:col-span-2',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          checked={value === true}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <span className="text-sm font-medium text-slate-800">{field.label}</span>
          {field.help && <span className="mt-0.5 block text-xs text-slate-500">{field.help}</span>}
        </span>
      </label>
    );
  }

  const invalid = showError && field.required && !hasContent(value);

  return (
    <div className={cn(field.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
      <label className="label" htmlFor={id}>
        {field.label}
        {field.required && <span className="ml-1 text-blossom-500">*</span>}
        {disabled && <Lock className="ml-1.5 inline h-3 w-3 text-slate-400" />}
      </label>

      {field.help && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{field.help}</p>
      )}

      {flagNote !== undefined && flagNote !== null && (
        <p className="mt-2 rounded-md bg-peach-50 px-2.5 py-1.5 text-xs text-peach-800 ring-1 ring-inset ring-peach-200">
          <span className="font-medium">Ajans notu:</span> {flagNote || 'Bu alanı tamamlayın.'}
        </p>
      )}

      <div className="mt-2">{renderControl()}</div>
      {invalid && <p className="mt-1.5 text-xs text-blossom-600">Bu alan zorunlu.</p>}
    </div>
  );

  function renderControl() {
    const base = cn('input', invalid && 'border-blossom-300 focus:border-blossom-500');

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            rows={field.rows ?? 4}
            className={base}
            placeholder={field.placeholder}
            disabled={disabled}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            id={id}
            className={base}
            disabled={disabled}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Seçiniz</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect': {
        const list = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2.5">
            {(field.options ?? []).map((option) => {
              const active = list.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      active ? list.filter((v) => v !== option) : [...list, option]
                    )
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-surface-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {option}
                </button>
              );
            })}
          </div>
        );
      }

      default:
        return (
          <input
            id={id}
            type={field.type}
            className={base}
            placeholder={field.placeholder}
            disabled={disabled}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  }
}

function hasContent(value: Answers[string]) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return String(value).trim().length > 0;
}
