import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/** Oturum acmis kullanicinin yetkileriyle calisan istemci. RLS gecerlidir. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // Server Component icinden cagrildiginda cerez yazilamaz; middleware
            // oturumu zaten tazeliyor.
          }
        },
      },
    }
  );
}

/**
 * RLS'i atlayan yonetici istemcisi. YALNIZCA kullanici daveti gibi, cagiranin
 * ajans oldugu ayrica dogrulanmis sunucu islemlerinde kullanilir.
 */
/**
 * Anahtarin gercekten service_role olup olmadigini kabaca dogrular.
 * En sik yapilan hata anon/publishable anahtarini buraya yapistirmak; o zaman
 * Supabase admin cagrilari "User not allowed" doner ve sebebi ekranda hic
 * gorunmez.
 */
function describeKeyProblem(key: string): string | null {
  // Yeni bicim: sb_secret_... dogru, sb_publishable_... yanlis.
  if (key.startsWith('sb_publishable_')) return 'publishable (herkese acik) anahtar girilmis';
  if (key.startsWith('sb_secret_')) return null;

  // Eski bicim: JWT. Payload icindeki role claim'ine bakilir.
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload.role === 'service_role') return null;
      if (payload.role) return `"${payload.role}" anahtari girilmis`;
    } catch {
      // Cozulemiyorsa karismayalim; gercek hatayi Supabase dondursun.
    }
  }
  return null;
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Supabase → Project Settings → API Keys bölümündeki service_role (secret) anahtarını Vercel ortam değişkenlerine ekleyip yeniden deploy edin.'
    );
  }

  const problem = describeKeyProblem(key);
  if (problem) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY yanlış: ${problem}. Supabase → Project Settings → API Keys bölümünden service_role (secret) anahtarını kopyalayıp Vercel'de bu değişkeni güncelleyin ve yeniden deploy edin.`
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
