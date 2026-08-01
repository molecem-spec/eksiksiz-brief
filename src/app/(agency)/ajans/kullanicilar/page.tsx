import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import UserManager from './UserManager';

export const metadata = { title: 'Kullanıcılar · Eksiksiz Brif' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { profile } = await requireAgency();
  const supabase = await createClient();

  const [{ data: users }, { data: companies }, { data: brands }, { data: links }] =
    await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('brands').select('id, name, company_id').order('name'),
      supabase.from('user_brands').select('user_id, brand_id'),
    ]);

  const brandsByUser: Record<string, string[]> = {};
  for (const link of (links ?? []) as { user_id: string; brand_id: string }[]) {
    (brandsByUser[link.user_id] ??= []).push(link.brand_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Müşteriler kendi kendilerine hesap açamaz. Kullanıcılar buradan e-posta daveti ile
          eklenir ve marka yetkileri burada belirlenir.
        </p>
      </div>

      <UserManager
        currentUserId={profile.id}
        users={(users ?? []) as any[]}
        companies={(companies ?? []) as any[]}
        brands={(brands ?? []) as any[]}
        brandsByUser={brandsByUser}
      />
    </div>
  );
}
