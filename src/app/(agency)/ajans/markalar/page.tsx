import { requireAgency } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Brand, Profile } from '@/types/db';
import BrandManager from './BrandManager';

export const metadata = { title: 'Markalar' };
export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  await requireAgency();
  const supabase = await createClient();

  const [{ data: brands }, { data: users }, { data: links }] = await Promise.all([
    supabase.from('brands').select('*').order('name'),
    supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
    supabase.from('user_brands').select('user_id, brand_id'),
  ]);

  const usersByBrand: Record<string, string[]> = {};
  for (const link of (links ?? []) as { user_id: string; brand_id: string }[]) {
    (usersByBrand[link.brand_id] ??= []).push(link.user_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Markalar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Her marka bir müşteridir. Marka altında hem ajans sorumlularını hem marka ekibini
          tanımlayabilirsiniz.
        </p>
      </div>

      <BrandManager
        brands={(brands ?? []) as Brand[]}
        users={(users ?? []) as Profile[]}
        usersByBrand={usersByBrand}
      />
    </div>
  );
}
