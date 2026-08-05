import { allSections, formatAnswer, hasValue, visibleFields } from '@/lib/brief';
import type { Answers } from '@/types/db';

/**
 * 18.12 Art Hub entegrasyonu.
 *
 * Hub ayri bir Supabase projesinde calisiyor; bu dosya Hub'in semasini
 * bilmiyor, yalnizca notr bir paket uretip HTTP uzerinden gonderiyor.
 * Gorevin nasil olusacagi (pano, atama, bildirim) Hub tarafinin isi.
 */

export interface HubPayload {
  ref: number;
  title: string;
  description: string;
  brandName: string;
  boardDate: string;
  priority: string;
  briefUrl: string;
  assigneeEmails: string[];
}

/** Talebin geldigi gunu Istanbul saatine gore YYYY-AA-GG olarak verir. */
export function istanbulDate(value: string | null): string {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  // en-CA bicimi zaten YYYY-MM-DD uretir.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(safe);
}

/**
 * Brif cevaplarini gorev aciklamasina donusturur.
 * Hub'daki gorevin tek basina anlasilir olmasi icin dolu alanlar duz metin
 * olarak yaziliyor; tamami zaten brief baglantisinda duruyor.
 */
export function buildDescription(answers: Answers, briefUrl: string): string {
  const lines: string[] = [];

  for (const section of allSections()) {
    const fields = visibleFields(section, answers).filter((field) =>
      hasValue(answers[field.key])
    );
    if (fields.length === 0) continue;

    lines.push(`— ${section.title} —`);
    for (const field of fields) {
      lines.push(`${field.label}: ${formatAnswer(answers[field.key])}`);
    }
    lines.push('');
  }

  lines.push(`Brifin tamamı: ${briefUrl}`);
  return lines.join('\n').trim();
}

/**
 * Entegrasyon uclarinin adresi.
 * HUB_INTEGRATION_URL taban adresi tutar (…/api/entegrasyon). Eskiden tam uc
 * adresi yaziliyordu; sonunda /brief varsa temizlenir ki iki bicim de calissin.
 */
function hubUrl(path: string): string | null {
  const raw = process.env.HUB_INTEGRATION_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/+$/, '').replace(/\/brief$/, '');
  return `${base}/${path}`;
}

async function hubFetch(
  path: string,
  init: RequestInit
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const url = hubUrl(path);
  const secret = process.env.HUB_INTEGRATION_SECRET;

  if (!url || !secret) {
    return { ok: false, error: 'Hub bağlantısı yapılandırılmamış (HUB_INTEGRATION_URL / SECRET).' };
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-brief-secret': secret },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: data?.error ?? `Hub ${response.status} döndü.` };
    }
    return { ok: true, data };
  } catch (err: any) {
    const message =
      err?.name === 'TimeoutError'
        ? 'Hub yanıt vermedi (zaman aşımı).'
        : String(err?.message ?? err);
    return { ok: false, error: message };
  }
}

export interface HubResult {
  ok: boolean;
  taskId?: string;
  error?: string;
}

/** Talebi Hub'a gorev olarak gonderir. */
export async function sendToHub(payload: HubPayload): Promise<HubResult> {
  const result = await hubFetch('brief', { method: 'POST', body: JSON.stringify(payload) });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, taskId: result.data?.taskId };
}

/** Hub'daki aktif markalari okur. Marka listesinin kaynagi Hub'dir. */
export async function fetchHubBrands(): Promise<{
  ok: boolean;
  names?: string[];
  error?: string;
}> {
  const result = await hubFetch('markalar', { method: 'GET' });
  if (!result.ok) return { ok: false, error: result.error };

  const names = (result.data?.brands ?? [])
    .map((b: any) => String(b?.name ?? '').trim())
    .filter(Boolean);

  return { ok: true, names };
}
