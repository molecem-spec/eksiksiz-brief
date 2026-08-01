# Eksiksiz Brif

Ajans müşterilerinin iş taleplerini eksiksiz biçimde ilettiği, çok müşterili
(multi-tenant) müşteri portalı.

Tüm müşteriler aynı adresten giriş yapar (`brief.1812art.com` gibi). Her kullanıcı
yalnızca kendisine yetki verilen markaları ve o markalara ait talepleri görür.
Veri ayrımı arayüzde değil, **Supabase Row Level Security** seviyesinde uygulanır.

---

## Teknoloji

Next.js (App Router) · TypeScript · Supabase (Auth + PostgreSQL + Storage) ·
Tailwind CSS · Vercel

---

## Kurulum

### 1. Supabase projesi

[supabase.com](https://supabase.com) üzerinde yeni bir proje açın (bölge:
Frankfurt önerilir).

**SQL Editor**'de sırasıyla şu dosyaları çalıştırın:

1. `supabase/migrations/001_init.sql` — tablolar, RLS politikaları, fonksiyonlar
2. `supabase/migrations/002_storage_and_guards.sql` — dosya deposu ve kolon korumaları

### 2. Kayıt olmayı kapatın

**Authentication → Sign In / Providers → Email**

- `Enable Email provider`: açık
- `Confirm email`: açık
- **`Allow new users to sign up`: KAPALI**

Bu kritik: müşteriler kendi kendilerine hesap açamamalı. Hesaplar yalnızca ajans
panelinden davetle oluşturulur.

**Authentication → URL Configuration**

- Site URL: `https://brief.1812art.com`
- Redirect URLs: `https://brief.1812art.com/auth/callback` ve
  `http://localhost:3000/auth/callback`

### 3. Ortam değişkenleri

`.env.local.example` dosyasını `.env.local` olarak kopyalayıp doldurun:

```bash
cp .env.local.example .env.local
```

| Değişken | Nereden alınır |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role (gizli) |
| `NEXT_PUBLIC_APP_URL` | Uygulamanın adresi |

`SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucuda, kullanıcı daveti sırasında ve
çağıranın ajans kullanıcısı olduğu doğrulandıktan sonra kullanılır. Asla
istemciye gönderilmez.

### 4. İlk ajans kullanıcısı

Sistemde henüz kimse yokken davet gönderecek bir ajans kullanıcısı gerekir.

**Authentication → Users → Add user** ile kendinize bir hesap açın, sonra SQL
Editor'de rolü yükseltin:

```sql
update public.profiles
   set role = 'agency', full_name = 'Adınız Soyadınız'
 where email = 'siz@1812art.com';
```

### 5. Çalıştırma

```bash
npm install
npm run dev
```

---

## Kullanım akışı

**Ajans:**

1. `Müşteriler ve markalar` → müşteri şirketi ve markalarını ekleyin
2. `Kullanıcılar` → müşteri kullanıcısını davet edin, erişeceği markaları seçin
3. `Talepler` → gelen talepleri inceleyin, eksik alanları bayrakla işaretleyin,
   talebi `Ek bilgi bekleniyor` durumuna alın

**Müşteri:**

1. E-postasına gelen bağlantıyla giriş yapar
2. `Yeni iş talebi oluştur` → marka → çalışma türü → adım adım form
3. Taslak kaydeder, sonra devam eder, zorunlu alanlar tamamlanınca ajansa iletir
4. Ajans ek bilgi isterse yalnızca işaretlenen alanları düzenleyip yeniden iletir

---

## Veri modeli

| Tablo | Açıklama |
| --- | --- |
| `companies` | Müşteri şirketi (tenant) |
| `brands` | Şirkete bağlı markalar |
| `profiles` | `auth.users` karşılığı; rol ve şirket bilgisi |
| `user_brands` | Kullanıcı ↔ marka yetkisi (çok-a-çok) |
| `requests` | İş talebi; tüm brif cevapları `answers` (jsonb) içinde |
| `request_files` | Yüklenen dosyaların kaydı |
| `request_comments` | Yorumlar; `is_internal` olanlar müşteriye kapalı |
| `request_field_flags` | Ajansın "bu alan eksik" işaretleri |
| `request_events` | Talep geçmişi |

Talep durumları: `draft` → `submitted` → `info_needed` / `in_progress` →
`completed` (veya `cancelled`).

### Güvenlik notları

- Müşteri kullanıcısı yalnızca `company_id`'si eşleşen **ve** `user_brands`
  üzerinden yetkilendirildiği markaların taleplerini görür.
- İletilmiş talep müşteri tarafından değiştirilemez (`requests_update` politikası
  yalnızca `draft` ve `info_needed` durumlarına izin verir).
- `assigned_to`, `agency_note`, `status`, `submitted_at` gibi operasyon alanları
  müşteri tarafından değiştirilemez (`guard_request_columns` tetikleyicisi).
- Kullanıcı kendi rolünü veya şirketini değiştiremez
  (`guard_profile_privileges` tetikleyicisi).
- Dosyalar özel bir Storage kovasında tutulur; erişim `<talep_id>/...` yol
  desenine ve `can_access_request()` kuralına bağlıdır. İndirme, kısa ömürlü
  imzalı bağlantıyla yapılır.
- `info_needed` durumunda arayüz yalnızca işaretlenmiş alanları düzenlemeye açar.
  Veritabanı bu durumda alan bazında değil, talep bazında yetki verir.

---

## Brif formunu genişletmek

Sorular kod içinde veri olarak tanımlıdır; yeni alan eklemek için arayüze
dokunmaya gerek yoktur.

| Dosya | İçerik |
| --- | --- |
| `src/lib/brief/common.ts` | Tüm taleplerde sorulan temel bilgiler, tasarım yönlendirmeleri, format/ölçü alanları |
| `src/lib/brief/event.ts` | Etkinlik bilgileri bölümü |
| `src/lib/brief/projectTypes.ts` | 15 proje türü ve türe özel sorular |
| `src/lib/brief/index.ts` | Adım kurgusu, zorunluluk denetimi, kolon türetme |

Bir alan eklemek için ilgili `fields` dizisine yeni bir nesne yazmak yeterli:

```ts
{
  key: 'benzersiz_anahtar',
  label: 'Soru metni',
  type: 'textarea',      // text | textarea | date | time | number | tel | email | select | multiselect | checkbox
  required: true,
  half: true,            // yarım genişlik
  showIf: (a) => a['baska_alan'] === 'Evet',  // koşullu gösterim
}
```

Cevaplar `requests.answers` içinde anahtar → değer olarak tutulduğu için yeni
alan eklemek migration gerektirmez.

---

## Deploy (Vercel)

1. Repoyu Vercel'e bağlayın
2. Environment Variables bölümüne `.env.local` içindeki dört değişkeni girin
3. Domain olarak `brief.1812art.com` ekleyin
4. Supabase → Authentication → URL Configuration'da bu adresi tanımlayın

---

## Bu sürümde olmayanlar

- E-posta bildirimi (yeni talep / durum değişikliği için)
- PDF çıktısı tarayıcının "PDF olarak kaydet" özelliğiyle alınır; sunucu
  tarafında PDF üretimi yoktur
- Talep şablonları ve tekrarlayan talepler
- Müşteri tarafında raporlama
