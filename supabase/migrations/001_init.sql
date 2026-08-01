-- =============================================================================
-- Eksiksiz Brif - temel sema
-- Cok musterili (multi-tenant) musteri portali.
-- Veri ayrimi hem uygulamada hem de RLS seviyesinde uygulanir.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tipler
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('agency', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum (
    'draft',        -- Taslak (yalnizca musteri gorur)
    'submitted',    -- Ajansa iletildi
    'info_needed',  -- Ek bilgi bekleniyor
    'in_progress',  -- Isleme alindi
    'completed',    -- Tamamlandi
    'cancelled'     -- Iptal edildi
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Tablolar
-- ----------------------------------------------------------------------------

-- Musteri sirketi (tenant)
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact_email text,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Bir sirkete bagli markalar
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- auth.users karsiligi profil kaydi
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  phone       text,
  role        public.user_role not null default 'client',
  company_id  uuid references public.companies(id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Kullanici <-> marka yetkisi (cok-a-cok)
create table if not exists public.user_brands (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  brand_id  uuid not null references public.brands(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);

-- Is talepleri
create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  ref           bigint generated always as identity, -- insanin okuyabilecegi talep no
  company_id    uuid not null references public.companies(id) on delete cascade,
  brand_id      uuid not null references public.brands(id) on delete restrict,
  created_by    uuid references public.profiles(id) on delete set null,

  title         text not null default '',
  project_type  text not null default '',
  status        public.request_status not null default 'draft',
  priority      public.request_priority not null default 'normal',

  -- Filtre/siralama icin ayrilan alanlar (formdan turetilir)
  use_date      date,   -- yayin / etkinlik / kullanim tarihi
  deadline      date,   -- tasarim veya metin teslim beklentisi

  -- Tum brif cevaplari alan anahtari -> deger seklinde burada tutulur
  answers       jsonb not null default '{}'::jsonb,

  assigned_to   uuid references public.profiles(id) on delete set null,
  agency_note   text,   -- kisa ic ozet; musteriye hicbir zaman gosterilmez

  submitted_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists requests_company_idx  on public.requests (company_id);
create index if not exists requests_brand_idx    on public.requests (brand_id);
create index if not exists requests_status_idx   on public.requests (status);
create index if not exists requests_created_idx  on public.requests (created_at desc);
create index if not exists requests_assigned_idx on public.requests (assigned_to);

-- Yuklenen dosyalar (Storage'daki nesnenin kaydi)
create table if not exists public.request_files (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.requests(id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  category     text not null default 'diger',
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists request_files_request_idx on public.request_files (request_id);

-- Yorumlar. is_internal = true olanlar yalnizca ajansa gorunur.
create table if not exists public.request_comments (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null,
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists request_comments_request_idx on public.request_comments (request_id);

-- Ajansin "bu alan eksik/belirsiz" isaretleri
create table if not exists public.request_field_flags (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  field_key   text not null,
  field_label text not null default '',
  note        text,
  resolved    boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists request_field_flags_request_idx on public.request_field_flags (request_id);

-- Talep gecmisi
create table if not exists public.request_events (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  type        text not null,
  detail      jsonb not null default '{}'::jsonb,
  -- Ajans ici hareketler musteriye kapali tutulabilir
  client_visible boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists request_events_request_idx on public.request_events (request_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Yardimci fonksiyonlar
-- RLS politikalari profiles tablosunu okumak zorunda; sonsuz dongu olusmamasi
-- icin bu fonksiyonlar security definer olarak calisir.
-- ----------------------------------------------------------------------------

create or replace function public.is_agency()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agency' and is_active
  );
$$;

create or replace function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles
  where id = auth.uid() and is_active;
$$;

-- Kullanicinin yetkili oldugu marka mi?
create or replace function public.can_access_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_agency()
      or exists (
        select 1
        from public.user_brands ub
        join public.brands b on b.id = ub.brand_id
        where ub.user_id = auth.uid()
          and ub.brand_id = p_brand_id
          and b.company_id = public.my_company_id()
      );
$$;

-- Talebe erisim: ajans her seyi gorur, musteri yalnizca kendi sirketi +
-- yetkili oldugu marka.
create or replace function public.can_access_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.requests r
    where r.id = p_request_id
      and (
        public.is_agency()
        or (r.company_id = public.my_company_id() and public.can_access_brand(r.brand_id))
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- Yeni kullanici -> profil kaydi
-- Davet sirasinda user_metadata icine role / company_id / full_name yazilir.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', '')::public.user_role, 'client'),
    nullif(new.raw_user_meta_data->>'company_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at otomatigi
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_touch_updated_at on public.requests;
create trigger requests_touch_updated_at
  before update on public.requests
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.companies           enable row level security;
alter table public.brands              enable row level security;
alter table public.profiles            enable row level security;
alter table public.user_brands         enable row level security;
alter table public.requests            enable row level security;
alter table public.request_files       enable row level security;
alter table public.request_comments    enable row level security;
alter table public.request_field_flags enable row level security;
alter table public.request_events      enable row level security;

-- companies -------------------------------------------------------------
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select to authenticated
  using (public.is_agency() or id = public.my_company_id());

drop policy if exists companies_write on public.companies;
create policy companies_write on public.companies for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- brands ----------------------------------------------------------------
drop policy if exists brands_select on public.brands;
create policy brands_select on public.brands for select to authenticated
  using (public.is_agency() or public.can_access_brand(id));

drop policy if exists brands_write on public.brands;
create policy brands_write on public.brands for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- profiles --------------------------------------------------------------
-- Musteri kullanicisi: kendi kaydi, ayni sirketteki kullanicilar ve yorum
-- sahiplerini gorebilmek icin ajans kullanicilarinin adlari.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_agency()
    or role = 'agency'
    or (company_id is not null and company_id = public.my_company_id())
  );

-- Kullanici kendi adini/telefonunu guncelleyebilir. Rol, sirket ve aktiflik
-- degisimi asagidaki tetikleyici ile engellenir (yetki yukseltmeye karsi).
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_agency_write on public.profiles;
create policy profiles_agency_write on public.profiles for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ajans kullanicisi her alani degistirebilir; digerleri yalnizca kendi
  -- iletisim bilgilerini.
  if public.is_agency() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.company_id is distinct from old.company_id
     or new.is_active is distinct from old.is_active
     or new.email is distinct from old.email then
    raise exception 'Bu alanlari degistirme yetkiniz yok';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- user_brands -----------------------------------------------------------
drop policy if exists user_brands_select on public.user_brands;
create policy user_brands_select on public.user_brands for select to authenticated
  using (public.is_agency() or user_id = auth.uid());

drop policy if exists user_brands_write on public.user_brands;
create policy user_brands_write on public.user_brands for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- requests --------------------------------------------------------------
drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests for select to authenticated
  using (
    public.is_agency()
    or (company_id = public.my_company_id() and public.can_access_brand(brand_id))
  );

-- Musteri yalnizca kendi sirketi ve yetkili oldugu marka adina, taslak olarak
-- talep acabilir.
drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests for insert to authenticated
  with check (
    public.is_agency()
    or (
      company_id = public.my_company_id()
      and public.can_access_brand(brand_id)
      and created_by = auth.uid()
      and status = 'draft'
    )
  );

-- Musteri yalnizca taslak veya "ek bilgi bekleniyor" durumundaki talebini
-- duzenleyebilir; iletilmis talep kilitlidir.
drop policy if exists requests_update on public.requests;
create policy requests_update on public.requests for update to authenticated
  using (
    public.is_agency()
    or (
      company_id = public.my_company_id()
      and public.can_access_brand(brand_id)
      and status in ('draft', 'info_needed')
    )
  )
  with check (
    public.is_agency()
    or (
      company_id = public.my_company_id()
      and public.can_access_brand(brand_id)
      and status in ('draft', 'info_needed')
    )
  );

drop policy if exists requests_delete on public.requests;
create policy requests_delete on public.requests for delete to authenticated
  using (
    public.is_agency()
    or (created_by = auth.uid() and status = 'draft' and company_id = public.my_company_id())
  );

-- request_files ---------------------------------------------------------
drop policy if exists request_files_select on public.request_files;
create policy request_files_select on public.request_files for select to authenticated
  using (public.can_access_request(request_id));

drop policy if exists request_files_insert on public.request_files;
create policy request_files_insert on public.request_files for insert to authenticated
  with check (public.can_access_request(request_id) and uploaded_by = auth.uid());

drop policy if exists request_files_delete on public.request_files;
create policy request_files_delete on public.request_files for delete to authenticated
  using (public.is_agency() or (uploaded_by = auth.uid() and public.can_access_request(request_id)));

-- request_comments ------------------------------------------------------
drop policy if exists request_comments_select on public.request_comments;
create policy request_comments_select on public.request_comments for select to authenticated
  using (
    public.can_access_request(request_id)
    and (public.is_agency() or is_internal = false)
  );

drop policy if exists request_comments_insert on public.request_comments;
create policy request_comments_insert on public.request_comments for insert to authenticated
  with check (
    public.can_access_request(request_id)
    and author_id = auth.uid()
    and (public.is_agency() or is_internal = false)
  );

drop policy if exists request_comments_delete on public.request_comments;
create policy request_comments_delete on public.request_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_agency());

-- request_field_flags ---------------------------------------------------
drop policy if exists request_field_flags_select on public.request_field_flags;
create policy request_field_flags_select on public.request_field_flags for select to authenticated
  using (public.can_access_request(request_id));

-- Isaret koyma/kaldirma yalnizca ajansta. Musteri tarafinda cozulme
-- submit_request() fonksiyonu icinde olur.
drop policy if exists request_field_flags_write on public.request_field_flags;
create policy request_field_flags_write on public.request_field_flags for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- request_events --------------------------------------------------------
drop policy if exists request_events_select on public.request_events;
create policy request_events_select on public.request_events for select to authenticated
  using (
    public.can_access_request(request_id)
    and (public.is_agency() or client_visible = true)
  );

drop policy if exists request_events_insert on public.request_events;
create policy request_events_insert on public.request_events for insert to authenticated
  with check (public.can_access_request(request_id) and actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Islem fonksiyonlari
-- ----------------------------------------------------------------------------

-- Musteri talebi ajansa iletir. Isaretli eksik alanlar cozuldu isaretlenir.
create or replace function public.submit_request(p_request_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests;
  v_is_resubmit boolean;
begin
  select * into v_request from public.requests where id = p_request_id;
  if not found then
    raise exception 'Talep bulunamadi';
  end if;

  if not public.can_access_request(p_request_id) then
    raise exception 'Bu talep icin yetkiniz yok';
  end if;

  if v_request.status not in ('draft', 'info_needed') then
    raise exception 'Bu talep su anda duzenlenemez';
  end if;

  v_is_resubmit := v_request.status = 'info_needed';

  update public.requests
     set status = 'submitted',
         submitted_at = coalesce(submitted_at, now())
   where id = p_request_id
  returning * into v_request;

  update public.request_field_flags
     set resolved = true, resolved_at = now()
   where request_id = p_request_id and resolved = false;

  insert into public.request_events (request_id, actor_id, type, detail, client_visible)
  values (
    p_request_id,
    auth.uid(),
    case when v_is_resubmit then 'resubmitted' else 'submitted' end,
    jsonb_build_object('status', 'submitted'),
    true
  );

  return v_request;
end;
$$;

-- Ajans talep durumunu degistirir.
create or replace function public.set_request_status(
  p_request_id uuid,
  p_status public.request_status,
  p_note text default null
)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests;
  v_old public.request_status;
begin
  if not public.is_agency() then
    raise exception 'Bu islem icin yetkiniz yok';
  end if;

  select status into v_old from public.requests where id = p_request_id;
  if not found then
    raise exception 'Talep bulunamadi';
  end if;

  update public.requests
     set status = p_status,
         completed_at = case when p_status = 'completed' then now() else completed_at end
   where id = p_request_id
  returning * into v_request;

  insert into public.request_events (request_id, actor_id, type, detail, client_visible)
  values (
    p_request_id,
    auth.uid(),
    'status_changed',
    jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note),
    true
  );

  return v_request;
end;
$$;

grant execute on function public.submit_request(uuid) to authenticated;
grant execute on function public.set_request_status(uuid, public.request_status, text) to authenticated;
grant execute on function public.is_agency() to authenticated;
grant execute on function public.my_company_id() to authenticated;
grant execute on function public.can_access_brand(uuid) to authenticated;
grant execute on function public.can_access_request(uuid) to authenticated;
