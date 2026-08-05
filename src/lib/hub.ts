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

export interface HubResult {
  ok: boolean;
  taskId?: string;
  error?: string;
}

/** Paketi Hub'a gonderir. Yapilandirma eksikse sessizce atlanir. */
export async function sendToHub(payload: HubPayload): Promise<HubResult> {
  const url = process.env.HUB_INTEGRATION_URL;
  const secret = process.env.HUB_INTEGRATION_SECRET;

  if (!url || !secret) {
    return { ok: false, error: 'Hub aktarımı yapılandırılmamış (HUB_INTEGRATION_URL / SECRET).' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-brief-secret': secret },
      body: JSON.stringify(payload),
      // Talep gonderimini bekletmemek icin makul bir ust sinir.
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, error: data?.error ?? `Hub ${response.status} döndü.` };
    }
    return { ok: true, taskId: data?.taskId };
  } catch (err: any) {
    const message = err?.name === 'TimeoutError' ? 'Hub yanıt vermedi (zaman aşımı).' : String(err?.message ?? err);
    return { ok: false, error: message };
  }
}
