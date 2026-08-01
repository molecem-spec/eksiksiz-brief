-- =============================================================================
-- Tek seviye marka yapisina gecis + portal ayarlari
--
-- Onceki surumde "musteri sirketi" ve "marka" olmak uzere iki seviye vardi.
-- Bu surumde marka dogrudan musteriyi temsil eder; sirket kavrami kalkti.
--
-- Ayrica:
--  * profiles.team_name : kisinin bagli oldugu ekip (or. "18.12 Art Ekibi")
--  * user_brands artik iki anlamda kullanilir:
--      - musteri kullanicisi icin: bu markayi gorebilir
--      - ajans kullanicisi icin  : bu markanin sorumlusudur
--  * requests.project_type kaldirildi; talep turu artik sorulmuyor
--  * site_settings         : giris ekrani metinleri ve gorseli
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0) Kolonlara bagimli politikalar once kaldirilir.
-- PostgreSQL, bir politika tarafindan kullanilan kolonun dusurulmesine izin
-- vermez; bu yuzden sema degisikliginden once temizleniyorlar.
-- ----------------------------------------------------------------------------

drop policy if exists profiles_select  on public.profiles;
drop policy if exists brands_select    on public.brands;
drop policy if exists requests_select  on public.requests;
drop policy if exists requests_insert  on public.requests;
drop policy if exists requests_update  on public.requests;
drop policy if exists requests_delete  on public.requests;

-- companies tablosu tamamen kalkiyor; kendi politikalari da onunla gidiyor.
drop policy if exists companies_select on public.companies;
drop policy if exists companies_write  on public.companies;

-- ----------------------------------------------------------------------------
-- 1) Sema degisiklikleri
-- ----------------------------------------------------------------------------

alter table public.profiles add column if not exists team_name text not null default '';
alter table public.profiles drop column if exists company_id;

alter table public.brands add column if not exists contact_email text;
alter table public.brands add column if not exists notes text;
alter table public.brands drop column if exists company_id;

-- Iki seviyeli yapida ayni ad farkli sirketlerde tekrarlanabiliyordu.
-- Tek seviyede marka adi benzersiz olmali; cakisma varsa migration burada
-- durur ve markalari elle birlestirmeniz gerekir.
do $$ begin
  alter table public.brands add constraint brands_name_key unique (name);
exception when duplicate_table or duplicate_object then null; end $$;

alter table public.requests drop column if exists company_id;
alter table public.requests drop column if exists project_type;

-- Teslim tarihini ajans belirler; musteri formunda sorulmaz.
comment on column public.requests.deadline is 'Ajansin belirledigi ic teslim tarihi. Musteri gormez, girmez.';

drop table if exists public.companies cascade;

-- ----------------------------------------------------------------------------
-- 2) Yardimci fonksiyonlar
-- ----------------------------------------------------------------------------

-- Kullanicinin bagli oldugu markalar
create or replace function public.my_brand_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select brand_id from public.user_brands where user_id = auth.uid();
$$;

create or replace function public.can_access_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_agency()
      or exists (
        select 1 from public.user_brands
        where user_id = auth.uid() and brand_id = p_brand_id
      );
$$;

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
      and (public.is_agency() or public.can_access_brand(r.brand_id))
  );
$$;

-- Sirket kavrami kalktigi icin bu yardimci artik gereksiz. Kendisini kullanan
-- fonksiyon ve politikalar yukarida yenilendikten sonra dusuruluyor.
drop function if exists public.my_company_id();

-- Davet yerine manuel kullanici olusturma kullanildigi icin tetikleyici
-- yalnizca e-posta ve ad bilgisini tasir.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', '')::public.user_role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) Politikalar (sirket referanslari temizleniyor)
-- ----------------------------------------------------------------------------

drop policy if exists brands_select on public.brands;
create policy brands_select on public.brands for select to authenticated
  using (public.is_agency() or public.can_access_brand(id));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_agency()
    or role = 'agency'
  );

drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests for select to authenticated
  using (public.is_agency() or public.can_access_brand(brand_id));

drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests for insert to authenticated
  with check (
    public.is_agency()
    or (
      public.can_access_brand(brand_id)
      and created_by = auth.uid()
      and status = 'draft'
    )
  );

drop policy if exists requests_update on public.requests;
create policy requests_update on public.requests for update to authenticated
  using (
    public.is_agency()
    or (public.can_access_brand(brand_id) and status in ('draft', 'info_needed'))
  )
  with check (
    public.is_agency()
    or (public.can_access_brand(brand_id) and status in ('draft', 'info_needed'))
  );

drop policy if exists requests_delete on public.requests;
create policy requests_delete on public.requests for delete to authenticated
  using (
    public.is_agency()
    or (created_by = auth.uid() and status = 'draft' and public.can_access_brand(brand_id))
  );

-- Kolon korumasi: proje turu kolonu kalktigi icin kural sadelesti.
create or replace function public.guard_request_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_agency() then
    return new;
  end if;

  if new.brand_id     is distinct from old.brand_id
     or new.created_by   is distinct from old.created_by
     or new.assigned_to  is distinct from old.assigned_to
     or new.agency_note  is distinct from old.agency_note
     or new.deadline     is distinct from old.deadline
     or new.submitted_at is distinct from old.submitted_at
     or new.completed_at is distinct from old.completed_at
     or new.status       is distinct from old.status then
    raise exception 'Bu alanlari degistirme yetkiniz yok';
  end if;

  return new;
end;
$$;

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_agency() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.email is distinct from old.email
     or new.team_name is distinct from old.team_name then
    raise exception 'Bu alanlari degistirme yetkiniz yok';
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4) Portal ayarlari (giris ekrani metinleri ve gorseli)
-- ----------------------------------------------------------------------------

create table if not exists public.site_settings (
  id           smallint primary key default 1 check (id = 1),
  app_name     text not null default '18.12 Art Brief Portalı',
  login_title  text not null default '18.12 Art Brief Portalı',
  login_intro  text not null default
    'Değerli iş ortağımız, portalımızın temel amacı, aklınızdaki vizyonu en doğru şekilde anlayabilmek ve ortaya çıkacak çalışmanın beklentilerinizi en yüksek oranda karşılamasını sağlamaktır.

Tasarım ve içerik süreçlerimizin hatasız ve tam istediğiniz gibi ilerleyebilmesi adına portal içerisindeki tüm alanları eksiksiz ve net yönlendirmelerle doldurmanızı rica ederiz.',
  login_image_path text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id) on delete set null
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Giris ekrani oturum acilmadan okunur; herkese acik okuma gerekir.
drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings for select to anon, authenticated
  using (true);

drop policy if exists site_settings_write on public.site_settings;
create policy site_settings_write on public.site_settings for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- Giris gorseli acik bir kovada tutulur (oturum acilmadan gosterilecek).
insert into storage.buckets (id, name, public, file_size_limit)
values ('site-assets', 'site-assets', true, 10485760) -- 10 MB
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists site_assets_read on storage.objects;
create policy site_assets_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists site_assets_write on storage.objects;
create policy site_assets_write on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and public.is_agency());

drop policy if exists site_assets_delete on storage.objects;
create policy site_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and public.is_agency());

grant execute on function public.my_brand_ids() to authenticated;
