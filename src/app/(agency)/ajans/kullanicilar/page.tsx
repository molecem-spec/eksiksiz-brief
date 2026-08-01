import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Brand, Profile } from '@/types/db';
import UserManager from './UserManager';

export const metadata = { title: 'Kullanıcılar' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { profile } = await requireAgency();
  const supabase = await createClient();

  const [{ data: users }, { data: brands }, { data: links }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('brands').select('*').order('name'),
    supabase.from('user_brands').select('user_id, brand_id'),
  ]);

  const brandsByUser: Record<string, string[]> = {};
  for (const link of (links ?? []) as { user_id: string; brand_id: string }[]) {
    (brandsByUser[link.user_id] ??= []).push(link.brand_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Hesapları buradan siz açarsınız; e-posta daveti gitmez. Şifreyi oluşturduğunuz kişiye
          kendiniz iletirsiniz, kişi panelden değiştirebilir.
        </p>
      </div>

      <UserManager
        currentUserId={profile.id}
        users={(users ?? []) as Profile[]}
        brands={(brands ?? []) as Brand[]}
        brandsByUser={brandsByUser}
      />
    </div>
  );
}
