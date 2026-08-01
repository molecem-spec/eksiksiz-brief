'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deriveColumns, missingRequired } from '@/lib/brief';
import type { Answers, RequestStatus } from '@/types/db';

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

async function currentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { supabase, profile };
}

/** Yeni taslak olusturur ve kimligini dondurur. */
export async function createDraft(
  brandId: string,
  projectType: string
): Promise<ActionResult<{ id: string }>> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };

  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_id')
    .eq('id', brandId)
    .maybeSingle();

  if (!brand) return { ok: false, error: 'Marka bulunamadı veya yetkiniz yok.' };

  const { data, error } = await supabase
    .from('requests')
    .insert({
      company_id: brand.company_id,
      brand_id: brand.id,
      created_by: profile.id,
      project_type: projectType,
      status: 'draft',
      answers: {},
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: 'Taslak oluşturulamadı.' };

  await supabase.from('request_events').insert({
    request_id: data.id,
    actor_id: profile.id,
    type: 'created',
    detail: { project_type: projectType },
  });

  revalidatePath('/panel');
  return { ok: true, data: { id: data.id } };
}

/** Taslak veya "ek bilgi bekleniyor" durumundaki talebin cevaplarini kaydeder. */
export async function saveAnswers(
  requestId: string,
  answers: Answers,
  projectType?: string
): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };

  const columns = deriveColumns(answers);
  const payload: Record<string, unknown> = { answers, ...columns };
  if (projectType) payload.project_type = projectType;

  const { error } = await supabase.from('requests').update(payload).eq('id', requestId);
  if (error) {
    return {
      ok: false,
      error: 'Kaydedilemedi. Talep ajansa iletilmiş olabilir; sayfayı yenileyin.',
    };
  }

  revalidatePath('/panel');
  revalidatePath(`/talep/${requestId}`);
  return { ok: true };
}

/** Talebi ajansa iletir. Zorunlu alanlar eksikse engellenir. */
export async function submitRequest(requestId: string): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };

  const { data: request } = await supabase
    .from('requests')
    .select('id, project_type, answers')
    .eq('id', requestId)
    .maybeSingle();

  if (!request) return { ok: false, error: 'Talep bulunamadı.' };

  const missing = missingRequired(request.project_type, (request.answers ?? {}) as Answers);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Zorunlu alanlar eksik: ${missing.map((m) => m.field.label).join(', ')}`,
    };
  }

  const { error } = await supabase.rpc('submit_request', { p_request_id: requestId });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel');
  revalidatePath('/ajans');
  revalidatePath(`/talep/${requestId}`);
  return { ok: true };
}

/** Musteri kendi taslagini siler. */
export async function deleteDraft(requestId: string): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };

  const { error } = await supabase.from('requests').delete().eq('id', requestId);
  if (error) return { ok: false, error: 'Taslak silinemedi.' };

  revalidatePath('/panel');
  return { ok: true };
}

/** Yorum ekler. is_internal yalnizca ajans kullanicisi icin gecerlidir. */
export async function addComment(
  requestId: string,
  body: string,
  isInternal: boolean
): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };
  if (!body.trim()) return { ok: false, error: 'Yorum boş olamaz.' };

  const internal = isInternal && profile.role === 'agency';

  const { error } = await supabase.from('request_comments').insert({
    request_id: requestId,
    author_id: profile.id,
    body: body.trim(),
    is_internal: internal,
  });
  if (error) return { ok: false, error: 'Yorum eklenemedi.' };

  await supabase.from('request_events').insert({
    request_id: requestId,
    actor_id: profile.id,
    type: internal ? 'internal_comment' : 'comment',
    client_visible: !internal,
  });

  revalidatePath(`/talep/${requestId}`);
  revalidatePath(`/ajans/talep/${requestId}`);
  return { ok: true };
}

/** Ajans: talep durumunu degistirir. */
export async function setStatus(
  requestId: string,
  status: RequestStatus,
  note?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_request_status', {
    p_request_id: requestId,
    p_status: status,
    p_note: note ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/ajans');
  revalidatePath('/panel');
  revalidatePath(`/ajans/talep/${requestId}`);
  revalidatePath(`/talep/${requestId}`);
  return { ok: true };
}

/** Ajans: sorumlu kisi atar. */
export async function assignRequest(
  requestId: string,
  userId: string | null
): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile || profile.role !== 'agency') return { ok: false, error: 'Yetkiniz yok.' };

  const { error } = await supabase
    .from('requests')
    .update({ assigned_to: userId })
    .eq('id', requestId);
  if (error) return { ok: false, error: 'Atama yapılamadı.' };

  await supabase.from('request_events').insert({
    request_id: requestId,
    actor_id: profile.id,
    type: 'assigned',
    detail: { assigned_to: userId },
    client_visible: false,
  });

  revalidatePath('/ajans');
  revalidatePath(`/ajans/talep/${requestId}`);
  return { ok: true };
}

/** Ajans: ic ozet notunu gunceller (musteriye kapali). */
export async function setAgencyNote(requestId: string, note: string): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile || profile.role !== 'agency') return { ok: false, error: 'Yetkiniz yok.' };

  const { error } = await supabase
    .from('requests')
    .update({ agency_note: note })
    .eq('id', requestId);
  if (error) return { ok: false, error: 'Not kaydedilemedi.' };

  revalidatePath(`/ajans/talep/${requestId}`);
  return { ok: true };
}

/** Ajans: bir alani eksik/belirsiz olarak isaretler. */
export async function flagField(
  requestId: string,
  fieldKey: string,
  fieldLabel: string,
  note: string
): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile || profile.role !== 'agency') return { ok: false, error: 'Yetkiniz yok.' };

  const { error } = await supabase.from('request_field_flags').insert({
    request_id: requestId,
    field_key: fieldKey,
    field_label: fieldLabel,
    note: note.trim() || null,
    created_by: profile.id,
  });
  if (error) return { ok: false, error: 'İşaretlenemedi.' };

  await supabase.from('request_events').insert({
    request_id: requestId,
    actor_id: profile.id,
    type: 'field_flagged',
    detail: { field: fieldLabel },
  });

  revalidatePath(`/ajans/talep/${requestId}`);
  revalidatePath(`/talep/${requestId}`);
  return { ok: true };
}

/** Ajans: eksik alan isaretini kaldirir. */
export async function removeFlag(flagId: string, requestId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('request_field_flags').delete().eq('id', flagId);
  if (error) return { ok: false, error: 'İşaret kaldırılamadı.' };

  revalidatePath(`/ajans/talep/${requestId}`);
  revalidatePath(`/talep/${requestId}`);
  return { ok: true };
}

/** Yuklenen dosyanin kaydini olusturur (dosya Storage'a istemciden yuklenir). */
export async function registerFile(input: {
  requestId: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  category: string;
}): Promise<ActionResult<{ id: string }>> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };

  const { data, error } = await supabase
    .from('request_files')
    .insert({
      request_id: input.requestId,
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      category: input.category,
      uploaded_by: profile.id,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: 'Dosya kaydedilemedi.' };

  await supabase.from('request_events').insert({
    request_id: input.requestId,
    actor_id: profile.id,
    type: 'file_added',
    detail: { file_name: input.fileName },
  });

  revalidatePath(`/talep/${input.requestId}`);
  revalidatePath(`/ajans/talep/${input.requestId}`);
  return { ok: true, data: { id: data.id } };
}

/** Dosyayi hem depodan hem kayittan siler. */
export async function deleteFile(fileId: string, requestId: string): Promise<ActionResult> {
  const { supabase, profile } = await currentProfile();
  if (!profile) return { ok: false, error: 'Oturum bulunamadı.' };

  const { data: file } = await supabase
    .from('request_files')
    .select('storage_path, file_name')
    .eq('id', fileId)
    .maybeSingle();

  if (!file) return { ok: false, error: 'Dosya bulunamadı.' };

  const { error } = await supabase.from('request_files').delete().eq('id', fileId);
  if (error) return { ok: false, error: 'Dosya silinemedi.' };

  await supabase.storage.from('brief-files').remove([file.storage_path]);
  await supabase.from('request_events').insert({
    request_id: requestId,
    actor_id: profile.id,
    type: 'file_removed',
    detail: { file_name: file.file_name },
  });

  revalidatePath(`/talep/${requestId}`);
  revalidatePath(`/ajans/talep/${requestId}`);
  return { ok: true };
}
