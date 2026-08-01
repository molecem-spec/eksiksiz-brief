import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Brand, Profile } from '@/types/db';

export interface SessionUser {
  profile: Profile;
  /** Musteri kullanicisinin yetkili oldugu markalar; ajansta tum markalar */
  brands: Brand[];
}

/** Oturum yoksa girise yonlendirir. */
export async function requireUser(): Promise<SessionUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/giris');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/giris?hata=profil');
  if (!profile.is_active) redirect('/giris?hata=pasif');

  const brandQuery =
    profile.role === 'agency'
      ? supabase.from('brands').select('*').order('name')
      : supabase
          .from('brands')
          .select('*, user_brands!inner(user_id)')
          .eq('user_brands.user_id', user.id)
          .order('name');

  const { data: brands } = await brandQuery;

  return { profile: profile as Profile, brands: (brands ?? []) as Brand[] };
}

/** Ajans paneli sayfalari icin. */
export async function requireAgency(): Promise<SessionUser> {
  const session = await requireUser();
  if (session.profile.role !== 'agency') redirect('/panel');
  return session;
}

/** Musteri paneli sayfalari icin. */
export async function requireClient(): Promise<SessionUser> {
  const session = await requireUser();
  if (session.profile.role === 'agency') redirect('/ajans');
  return session;
}
