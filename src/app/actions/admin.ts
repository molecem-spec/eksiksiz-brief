'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/db';
import type { ActionResult } from './requests';

/** Cagiranin ajans kullanicisi oldugunu dogrular. */
async function requireAgencyActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'agency' || !profile.is_active) {
    return { supabase, profile: null };
  }
  return { supabase, profile };
}

// ---------------------------------------------------------------------------
// Markalar
// ---------------------------------------------------------------------------

export async function createBrand(
  name: string,
  contactEmail: string,
  notes: string
): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (!name.trim()) return { ok: false, error: 'Marka adı gerekli.' };

  const { error } = await supabase.from('brands').insert({
    name: name.trim(),
    contact_email: contactEmail.trim() || null,
    notes: notes.trim() || null,
  });

  if (error) {
    return {
      ok: false,
      error: error.code === '23505' ? 'Bu adda bir marka zaten var.' : 'Marka eklenemedi.',
    };
  }

  revalidatePath('/ajans/markalar');
  return { ok: true };
}

export async function updateBrand(
  brandId: string,
  input: { name: string; contactEmail: string; notes: string }
): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (!input.name.trim()) return { ok: false, error: 'Marka adı gerekli.' };

  const { error } = await supabase
    .from('brands')
    .update({
      name: input.name.trim(),
      contact_email: input.contactEmail.trim() || null,
      notes: input.notes.trim() || null,
    })
    .eq('id', brandId);

  if (error) {
    return {
      ok: false,
      error: error.code === '23505' ? 'Bu adda bir marka zaten var.' : 'Güncellenemedi.',
    };
  }

  revalidatePath('/ajans/markalar');
  return { ok: true };
}

export async function setBrandActive(brandId: string, isActive: boolean): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const { error } = await supabase.from('brands').update({ is_active: isActive }).eq('id', brandId);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/ajans/markalar');
  return { ok: true };
}

/**
 * Bir markaya bagli kisileri yeniden tanimlar.
 * Musteri kullanicisi icin "bu markayi gorebilir", ajans kullanicisi icin
 * "bu markanin sorumlusudur" anlamina gelir.
 */
export async function setBrandUsers(brandId: string, userIds: string[]): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const { error: deleteError } = await supabase
    .from('user_brands')
    .delete()
    .eq('brand_id', brandId);
  if (deleteError) return { ok: false, error: 'Atamalar güncellenemedi.' };

  if (userIds.length > 0) {
    const { error } = await supabase
      .from('user_brands')
      .insert(userIds.map((userId) => ({ user_id: userId, brand_id: brandId })));
    if (error) return { ok: false, error: 'Atamalar kaydedilemedi.' };
  }

  revalidatePath('/ajans/markalar');
  revalidatePath('/ajans/kullanicilar');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Kullanicilar
// ---------------------------------------------------------------------------

/**
 * Kullaniciyi dogrudan olusturur; e-posta daveti gonderilmez.
 * Servis anahtari yalnizca burada, cagiranin ajans oldugu dogrulandiktan sonra
 * kullanilir.
 */
export async function createUser(input: {
  email: string;
  fullName: string;
  teamName: string;
  role: UserRole;
  password: string;
  brandIds: string[];
}): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: 'E-posta gerekli.' };
  if (input.password.length < 8) return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil; kullanıcı oluşturulamıyor.',
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    // E-posta dogrulamasi beklenmez; hesabi ajans acar.
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim(), role: input.role },
  });

  if (error) {
    const message = String(error.message ?? '');
    if (message.toLowerCase().includes('already been registered')) {
      return { ok: false, error: 'Bu e-posta zaten kayıtlı.' };
    }
    return { ok: false, error: `Kullanıcı oluşturulamadı: ${message}` };
  }

  const userId = data.user?.id;
  if (!userId) return { ok: false, error: 'Kullanıcı oluşturuldu ancak kimlik alınamadı.' };

  // Tetikleyici profili aciyor; rol ve ekip bilgisini burada kesinlestiriyoruz.
  await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: input.fullName.trim(),
      team_name: input.teamName.trim(),
      role: input.role,
    },
    { onConflict: 'id' }
  );

  if (input.brandIds.length > 0) {
    await supabase
      .from('user_brands')
      .insert(input.brandIds.map((brandId) => ({ user_id: userId, brand_id: brandId })));
  }

  revalidatePath('/ajans/kullanicilar');
  revalidatePath('/ajans/markalar');
  return { ok: true };
}

export async function updateUser(
  userId: string,
  input: { fullName: string; teamName: string; role: UserRole }
): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (userId === profile.id && input.role !== 'agency') {
    return { ok: false, error: 'Kendi rolünüzü müşteriye çeviremezsiniz.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      team_name: input.teamName.trim(),
      role: input.role,
    })
    .eq('id', userId);

  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/ajans/kullanicilar');
  return { ok: true };
}

/** Bir kullanicinin bagli oldugu markalari yeniden tanimlar. */
export async function setUserBrands(userId: string, brandIds: string[]): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const { error: deleteError } = await supabase.from('user_brands').delete().eq('user_id', userId);
  if (deleteError) return { ok: false, error: 'Yetkiler güncellenemedi.' };

  if (brandIds.length > 0) {
    const { error } = await supabase
      .from('user_brands')
      .insert(brandIds.map((brandId) => ({ user_id: userId, brand_id: brandId })));
    if (error) return { ok: false, error: 'Marka yetkileri kaydedilemedi.' };
  }

  revalidatePath('/ajans/kullanicilar');
  revalidatePath('/ajans/markalar');
  return { ok: true };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (userId === profile.id) return { ok: false, error: 'Kendi hesabınızı pasifleştiremezsiniz.' };

  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/ajans/kullanicilar');
  return { ok: true };
}

/** Ajans, kullanicinin sifresini yeniden belirler. */
export async function resetUserPassword(
  userId: string,
  password: string
): Promise<ActionResult> {
  const { profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (password.length < 8) return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: `Şifre değiştirilemedi: ${error.message}` };

  return { ok: true };
}

/** Kullaniciyi tamamen siler. */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const { profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (userId === profile.id) return { ok: false, error: 'Kendi hesabınızı silemezsiniz.' };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: `Silinemedi: ${error.message}` };

  revalidatePath('/ajans/kullanicilar');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Portal ayarlari
// ---------------------------------------------------------------------------

export async function saveSettings(input: {
  appName: string;
  loginTitle: string;
  loginIntro: string;
  loginImagePath?: string | null;
}): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const payload: Record<string, unknown> = {
    id: 1,
    app_name: input.appName.trim() || '18.12 Art Brief Portalı',
    login_title: input.loginTitle.trim(),
    login_intro: input.loginIntro,
    updated_at: new Date().toISOString(),
    updated_by: profile.id,
  };
  if (input.loginImagePath !== undefined) payload.login_image_path = input.loginImagePath;

  const { error } = await supabase.from('site_settings').upsert(payload, { onConflict: 'id' });
  if (error) return { ok: false, error: 'Ayarlar kaydedilemedi.' };

  revalidatePath('/', 'layout');
  return { ok: true };
}
