# 18.12 Art Brief Portalı

Ajans müşterilerinin iş taleplerini eksiksiz biçimde ilettiği, çok markalı
(multi-tenant) müşteri portalı.

Tüm markalar aynı adresten giriş yapar. Her kullanıcı yalnızca kendisine yetki
verilen markaları ve o markalara ait talepleri görür. Veri ayrımı arayüzde
değil, **Supabase Row Level Security** seviyesinde uygulanır.

---

## Teknoloji

Next.js (App Router) · TypeScript · Supabase (Auth + PostgreSQL + Storage) ·
Tailwind CSS · Vercel

---

## Kurulum

### 1. Supabase projesi

Migration'lar Supabase CLI ile uygulanır:

```bash
supabase link --project-ref <proje-ref>
supabase db push
```

Dosyalar sırasıyla:

1. `001_init.sql` — tablolar, RLS, fonksiyonlar
2. `002_storage_and_guards.sql` — dosya deposu, kolon korumaları
3. `003_single_level_brands.sql` — tek seviye marka yapısına geçiş, portal ayarları
4. `004_ensure_policies.sql` — tüm RLS politikalarını garantiye alan güvenlik tabanı

> SQL editöründen elle çalıştırmak yerine `db push` kullanın. Elle çalıştırmada
> script yarıda kalırsa bir kısmı uygulanır ve fark edilmez; `db push` her
> dosyayı transaction içinde çalıştırır ve geçmişi kaydeder.
>
> Daha önce elle çalıştırdıysanız, uygulanmış olanları
> `supabase migration repair --status applied 001 002` ile işaretleyip
> `db push` yapın.

### 2. Kayıt olmayı kapatın

**Authentication → Sign In / Providers → Email**

- `Enable Email provider`: açık
- **`Allow new users to sign up`: KAPALI**

Hesaplar yalnızca ajans panelinden açılır.

**Authentication → URL Configuration**

- Site URL: portalın adresi
- Redirect URLs: `<adres>/auth/callback` ve `http://localhost:3100/auth/callback`

### 3. Ortam değişkenleri

```bash
cp .env.local.example .env.local
```

| Değişken | Nereden alınır |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role (gizli) |
| `NEXT_PUBLIC_APP_URL` | Uygulamanın adresi |

`SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucuda, kullanıcı oluşturma ve şifre
sıfırlama sırasında, çağıranın ajans kullanıcısı olduğu doğrulandıktan sonra
kullanılır. İstemciye hiçbir zaman gönderilmez.

### 4. İlk ajans kullanıcısı

**Authentication → Users → Add user** ile kendinize bir hesap açın, sonra SQL
Editor'de rolü yükseltin:

```sql
update public.profiles
   set role = 'agency', full_name = 'Adınız Soyadınız', team_name = '18.12 Art Ekibi'
 where email = 'siz@1812art.com';
```

Bundan sonraki tüm kullanıcıları panelden ekleyebilirsiniz.

### 5. Çalıştırma

```bash
npm install
npm run dev
```

---

## Kullanım

### Ajans

| Sayfa | Ne yapılır |
| --- | --- |
| **Talepler** | Tüm markalardan gelen talepler; durum, sorumlu, iç teslim tarihi, eksik alan işaretleme |
| **Markalar** | Marka ekleme/düzenleme; her markaya ajans sorumluları ve marka ekibi atama |
| **Kullanıcılar** | Kullanıcı oluşturma (şifreyi siz belirlersiniz), rol/ekip düzenleme, şifre sıfırlama |
| **Portal ayarları** | Giriş sayfası başlığı, açıklama metni ve **ekip fotoğrafı** yükleme |

### Marka (müşteri)

1. E-posta + şifre ile giriş yapar
2. `Yeni iş talebi oluştur` → marka seçer → 9 soruluk formu doldurur
3. Taslak kaydeder, sonra devam eder; zorunlu alanlar tamamlanınca ajansa iletir
4. Ajans ek bilgi isterse yalnızca işaretlenen alanları düzenleyip yeniden iletir

Herkes üst bardaki anahtar simgesinden kendi şifresini değiştirebilir.

### Marka arayüzünü görmek

1. `Kullanıcılar` → `Yeni kullanıcı ekle`
2. Rol: **Marka kullanıcısı**, bir marka seçin, şifreyi üretin
3. Tarayıcıda **gizli pencere** açıp o hesapla girin

Aynı tarayıcıda iki oturum tutulamaz; gizli pencere en pratik yol.

---

## Veri modeli

| Tablo | Açıklama |
| --- | --- |
| `brands` | Marka = müşteri. Tek seviye. |
| `profiles` | `auth.users` karşılığı; rol (`agency` / `client`) ve `team_name` |
| `user_brands` | Kullanıcı ↔ marka bağı. Müşteride "erişebilir", ajansta "sorumludur" |
| `requests` | İş talebi; tüm cevaplar `answers` (jsonb) içinde |
| `request_files` | Yüklenen dosyaların kaydı |
| `request_comments` | Yorumlar; `is_internal` olanlar markaya kapalı |
| `request_field_flags` | Ajansın "bu alan eksik" işaretleri |
| `request_events` | Talep geçmişi |
| `site_settings` | Giriş sayfası metinleri ve görseli |

Talep durumları: `draft` → `submitted` → `info_needed` / `in_progress` →
`completed` (veya `cancelled`).

Tarihler:

- **Talep tarihi** — otomatik (ajansa iletilme anı)
- **Yayın / etkinlik tarihi** — marka girer
- **İç teslim tarihi** — yalnızca ajans girer ve görür

### Güvenlik notları

- Müşteri kullanıcısı yalnızca `user_brands` üzerinden yetkilendirildiği
  markaların taleplerini görür.
- İletilmiş talep müşteri tarafından değiştirilemez (`requests_update` politikası
  yalnızca `draft` ve `info_needed` durumlarına izin verir).
- `status`, `assigned_to`, `agency_note`, `deadline` gibi alanlar müşteri
  tarafından değiştirilemez (`guard_request_columns` tetikleyicisi).
- Kullanıcı kendi rolünü veya ekibini değiştiremez (`guard_profile_privileges`).
- Talep dosyaları özel bir kovada; erişim `<talep_id>/...` yol desenine ve
  `can_access_request()` kuralına bağlı, indirme kısa ömürlü imzalı bağlantıyla.
- Giriş görseli ayrı, herkese açık bir kovada (`site-assets`) tutulur; yazma
  yalnızca ajansa açıktır.
- `info_needed` durumunda alan bazlı kilit arayüzdedir; veritabanı talep
  bazında yetki verir.

---

## Talep formunu değiştirmek

Sorular kod içinde veri olarak tanımlıdır; yeni alan eklemek migration
gerektirmez (cevaplar `answers` jsonb'de tutulur).

| Dosya | İçerik |
| --- | --- |
| `src/lib/brief/common.ts` | 9 ana soru (`BRIEF_SECTION`) ve ek bilgiler (`EXTRA_SECTION`) |
| `src/lib/brief/index.ts` | Adım kurgusu, zorunluluk denetimi, kolon türetme |
| `src/lib/brief/types.ts` | Alan tipleri |

Bir alan eklemek:

```ts
{
  key: 'benzersiz_anahtar',
  label: 'Soru metni',
  type: 'textarea',      // text | textarea | date | time | number | tel | email | select | multiselect | checkbox
  required: true,
  half: true,            // yarım genişlik
  help: 'Yönlendirme metni',
  showIf: (a) => a['baska_alan'] === 'Evet',  // koşullu gösterim
}
```

---

## Deploy (Vercel)

1. Repoyu Vercel'e bağlayın
2. Environment Variables'a dört değişkeni girin
3. Domain'i ekleyin ve Supabase → Authentication → URL Configuration'da tanımlayın

---

## Bu sürümde olmayanlar

- E-posta bildirimi (yeni talep / durum değişikliği için)
- PDF, tarayıcının "PDF olarak kaydet" özelliğiyle alınır; sunucu tarafında PDF
  üretimi yoktur
- Talep şablonları, tekrarlayan talepler
- Marka tarafında raporlama
