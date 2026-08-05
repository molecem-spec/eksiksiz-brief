'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { buildDescription, istanbulDate, sendToHub } from '@/lib/hub';
import type { Answers } from '@/types/db';
import type { ActionResult } from './requests';

/**
 * Talebi 18.12 Art Hub'a gorev olarak aktarir.
 *
 * Yonetici istemcisi kullaniliyor cunku islem talep iletildikten hemen sonra,
 * musteri kullanicisinin oturumunda calisiyor; o kullanici kendi talebini
 * artik guncelleyemez ve markanin ajans sorumlularini okuyamaz. Islem
 * yalnizca sunucu tarafindan, kendi akisimiz icinden cagriliyor.
 *
 * Idempotent: Hub tarafi ayni talep numarasi icin ikinci gorev acmaz.
 */
export async function syncRequestToHub(requestId: string): Promise<ActionResult> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Yönetici istemcisi kurulamadı.' };
  }

  const { data: request } = await admin
    .from('requests')
    .select('*, brand:brands(id, name)')
    .eq('id', requestId)
    .maybeSingle();

  if (!request) return { ok: false, error: 'Talep bulunamadı.' };

  // Markanin ajans sorumlulari: Hub'da gorev bu kisilerin panosuna duser.
  const { data: links } = await admin
    .from('user_brands')
    .select('profiles!inner(email, role, is_active)')
    .eq('brand_id', request.brand_id);

  const assigneeEmails = ((links ?? []) as any[])
    .map((row) => row.profiles)
    .filter((p) => p && p.role === 'agency' && p.is_active)
    .map((p) => String(p.email));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const briefUrl = `${appUrl}/ajans/talep/${requestId}`;

  const result = await sendToHub({
    ref: request.ref,
    title: request.title || 'İsimsiz talep',
    description: buildDescription((request.answers ?? {}) as Answers, briefUrl),
    brandName: (request as any).brand?.name ?? '',
    boardDate: istanbulDate(request.submitted_at ?? request.created_at),
    priority: request.priority,
    briefUrl,
    assigneeEmails,
  });

  await admin
    .from('requests')
    .update({
      hub_task_id: result.ok ? (result.taskId ?? null) : null,
      hub_synced_at: result.ok ? new Date().toISOString() : null,
      hub_error: result.ok ? null : (result.error ?? 'Bilinmeyen hata'),
    })
    .eq('id', requestId);

  revalidatePath(`/ajans/talep/${requestId}`);

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
