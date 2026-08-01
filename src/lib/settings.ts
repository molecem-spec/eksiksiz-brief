import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/db';

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  app_name: '18.12 Art Brief Portalı',
  login_title: '18.12 Art Brief Portalı',
  login_intro:
    'Değerli iş ortağımız, portalımızın temel amacı, aklınızdaki vizyonu en doğru şekilde anlayabilmek ve ortaya çıkacak çalışmanın beklentilerinizi en yüksek oranda karşılamasını sağlamaktır.\n\nTasarım ve içerik süreçlerimizin hatasız ve tam istediğiniz gibi ilerleyebilmesi adına portal içerisindeki tüm alanları eksiksiz ve net yönlendirmelerle doldurmanızı rica ederiz.',
  login_image_path: null,
  updated_at: new Date().toISOString(),
  updated_by: null,
};

/** Portal ayarlari. Kayit yoksa varsayilanlar doner. */
export async function loadSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  return (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
}

/** site-assets kovasi acik oldugu icin dogrudan genel adres uretilir. */
export function publicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/site-assets/${path}`;
}
