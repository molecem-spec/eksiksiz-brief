'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient, createClient } from '@/lib/supabase/server';
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

export async function createCompany(name: string, contactEmail: string): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (!name.trim()) return { ok: false, error: 'Şirket adı gerekli.' };

  const { error } = await supabase
    .from('companies')
    .insert({ name: name.trim(), contact_email: contactEmail.trim() || null });
  if (error) return { ok: false, error: 'Şirket oluşturulamadı.' };

  revalidatePath('/ajans/musteriler');
  return { ok: true };
}

export async function createBrand(companyId: string, name: string): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };
  if (!name.trim()) return { ok: false, error: 'Marka adı gerekli.' };

  const { error } = await supabase
    .from('brands')
    .insert({ company_id: companyId, name: name.trim() });
  if (error) {
    return {
      ok: false,
      error: error.code === '23505' ? 'Bu şirkette aynı adlı marka zaten var.' : 'Marka eklenemedi.',
    };
  }

  revalidatePath('/ajans/musteriler');
  return { ok: true };
}

export async function setCompanyActive(companyId: string, isActive: boolean): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const { error } = await supabase
    .from('companies')
    .update({ is_active: isActive })
    .eq('id', companyId);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/ajans/musteriler');
  return { ok: true };
}

export async function setBrandActive(brandId: string, isActive: boolean): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const { error } = await supabase.from('brands').update({ is_active: isActive }).eq('id', brandId);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/ajans/musteriler');
  return { ok: true };
}

/**
 * Kullaniciyi e-posta ile davet eder ve marka yetkilerini tanimlar.
 * Servis anahtari yalnizca burada, cagiranin ajans oldugu dogrulandiktan sonra
 * kullanilir.
 */
export async function inviteUser(input: {
  email: string;
  fullName: string;
  role: 'agency' | 'client';
  companyId: string | null;
  brandIds: string[];
}): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: 'E-posta gerekli.' };
  if (input.role === 'client' && !input.companyId) {
    return { ok: false, error: 'Müşteri kullanıcısı için şirket seçilmeli.' };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil; davet gönderilemiyor.',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback`,
    data: {
      full_name: input.fullName.trim(),
      role: input.role,
      company_id: input.role === 'client' ? input.companyId : null,
    },
  });

  if (error) {
    const message = String(error.message ?? '');
    if (message.toLowerCase().includes('already been registered')) {
      return { ok: false, error: 'Bu e-posta zaten kayıtlı. Kullanıcılar listesinden düzenleyin.' };
    }
    return { ok: false, error: `Davet gönderilemedi: ${message}` };
  }

  const userId = data.user?.id;
  if (!userId) return { ok: false, error: 'Kullanıcı oluşturuldu ancak kimlik alınamadı.' };

  // Tetikleyici profili olusturur; rol/sirket bilgisini yine de garanti altina al.
  await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: input.fullName.trim(),
      role: input.role,
      company_id: input.role === 'client' ? input.companyId : null,
    },
    { onConflict: 'id' }
  );

  if (input.role === 'client' && input.brandIds.length > 0) {
    await supabase
      .from('user_brands')
      .insert(input.brandIds.map((brandId) => ({ user_id: userId, brand_id: brandId })));
  }

  revalidatePath('/ajans/kullanicilar');
  return { ok: true };
}

/** Bir kullanicinin erisebilecegi markalari yeniden tanimlar. */
export async function setUserBrands(userId: string, brandIds: string[]): Promise<ActionResult> {
  const { supabase, profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  const { error: deleteError } = await supabase
    .from('user_brands')
    .delete()
    .eq('user_id', userId);
  if (deleteError) return { ok: false, error: 'Yetkiler güncellenemedi.' };

  if (brandIds.length > 0) {
    const { error } = await supabase
      .from('user_brands')
      .insert(brandIds.map((brandId) => ({ user_id: userId, brand_id: brandId })));
    if (error) return { ok: false, error: 'Marka yetkileri kaydedilemedi.' };
  }

  revalidatePath('/ajans/kullanicilar');
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

/** Kullaniciya yeni bir giris baglantisi (magic link) e-postasi gonderir. */
export async function resendInvite(email: string): Promise<ActionResult> {
  const { profile } = await requireAgencyActor();
  if (!profile) return { ok: false, error: 'Yetkiniz yok.' };

  // Oturum cerezlerine dokunmamasi icin ayri, durumsuz bir istemci kullanilir.
  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const { error } = await anon.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${appUrl}/auth/callback` },
  });

  if (error) return { ok: false, error: `Bağlantı gönderilemedi: ${error.message}` };
  return { ok: true };
}
