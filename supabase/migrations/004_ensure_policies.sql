-- =============================================================================
-- Guvenlik tabani: RLS ve politikalarin tamaminin var oldugunu garantiler.
--
-- Neden: 001 ve 002 uzaktaki veritabaninda SQL editorunden elle calistirilmisti.
-- 003 gonderilirken bircok politika icin "does not exist, skipping" uyarisi
-- dustu; yani 001 yarim kalmis ve bazi politikalar hic olusmamis olabilir.
-- Eksik politika = o tabloda hicbir satirin gorunmemesi (RLS aciksa) demek.
--
-- Bu dosya tum politikalari mevcut (tek seviye marka) semaya gore yeniden
-- tanimlar. Tamamen idempotent; istendigi kadar calistirilabilir.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- RLS her tabloda acik olmali
-- ----------------------------------------------------------------------------
alter table public.brands              enable row level security;
alter table public.profiles            enable row level security;
alter table public.user_brands         enable row level security;
alter table public.requests            enable row level security;
alter table public.request_files       enable row level security;
alter table public.request_comments    enable row level security;
alter table public.request_field_flags enable row level security;
alter table public.request_events      enable row level security;
alter table public.site_settings       enable row level security;

-- ----------------------------------------------------------------------------
-- brands
-- ----------------------------------------------------------------------------
drop policy if exists brands_select on public.brands;
create policy brands_select on public.brands for select to authenticated
  using (public.is_agency() or public.can_access_brand(id));

drop policy if exists brands_write on public.brands;
create policy brands_write on public.brands for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- ----------------------------------------------------------------------------
-- profiles
-- Musteri kullanicisi kendi kaydini ve ajans kullanicilarini gorur (yorum
-- sahiplerinin adi icin). Baska musterilerin kullanicilarini goremez.
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_agency() or role = 'agency');

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_agency_write on public.profiles;
create policy profiles_agency_write on public.profiles for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- ----------------------------------------------------------------------------
-- user_brands
-- ----------------------------------------------------------------------------
drop policy if exists user_brands_select on public.user_brands;
create policy user_brands_select on public.user_brands for select to authenticated
  using (public.is_agency() or user_id = auth.uid());

drop policy if exists user_brands_write on public.user_brands;
create policy user_brands_write on public.user_brands for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- ----------------------------------------------------------------------------
-- requests
-- ----------------------------------------------------------------------------
drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests for select to authenticated
  using (public.is_agency() or public.can_access_brand(brand_id));

drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests for insert to authenticated
  with check (
    public.is_agency()
    or (public.can_access_brand(brand_id) and created_by = auth.uid() and status = 'draft')
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

-- ----------------------------------------------------------------------------
-- request_files
-- ----------------------------------------------------------------------------
drop policy if exists request_files_select on public.request_files;
create policy request_files_select on public.request_files for select to authenticated
  using (public.can_access_request(request_id));

drop policy if exists request_files_insert on public.request_files;
create policy request_files_insert on public.request_files for insert to authenticated
  with check (public.can_access_request(request_id) and uploaded_by = auth.uid());

drop policy if exists request_files_delete on public.request_files;
create policy request_files_delete on public.request_files for delete to authenticated
  using (public.is_agency() or (uploaded_by = auth.uid() and public.can_access_request(request_id)));

-- ----------------------------------------------------------------------------
-- request_comments
-- is_internal olanlar yalnizca ajansa gorunur.
-- ----------------------------------------------------------------------------
drop policy if exists request_comments_select on public.request_comments;
create policy request_comments_select on public.request_comments for select to authenticated
  using (public.can_access_request(request_id) and (public.is_agency() or is_internal = false));

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

-- ----------------------------------------------------------------------------
-- request_field_flags
-- ----------------------------------------------------------------------------
drop policy if exists request_field_flags_select on public.request_field_flags;
create policy request_field_flags_select on public.request_field_flags for select to authenticated
  using (public.can_access_request(request_id));

drop policy if exists request_field_flags_write on public.request_field_flags;
create policy request_field_flags_write on public.request_field_flags for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- ----------------------------------------------------------------------------
-- request_events
-- ----------------------------------------------------------------------------
drop policy if exists request_events_select on public.request_events;
create policy request_events_select on public.request_events for select to authenticated
  using (public.can_access_request(request_id) and (public.is_agency() or client_visible = true));

drop policy if exists request_events_insert on public.request_events;
create policy request_events_insert on public.request_events for insert to authenticated
  with check (public.can_access_request(request_id) and actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- site_settings
-- Giris ekrani oturum acilmadan okunur.
-- ----------------------------------------------------------------------------
drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings for select to anon, authenticated
  using (true);

drop policy if exists site_settings_write on public.site_settings;
create policy site_settings_write on public.site_settings for all to authenticated
  using (public.is_agency()) with check (public.is_agency());

-- ----------------------------------------------------------------------------
-- Storage
-- ----------------------------------------------------------------------------
drop policy if exists brief_files_select on storage.objects;
create policy brief_files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'brief-files'
    and public.can_access_request(public.storage_path_request_id(name))
  );

drop policy if exists brief_files_insert on storage.objects;
create policy brief_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'brief-files'
    and public.can_access_request(public.storage_path_request_id(name))
  );

drop policy if exists brief_files_delete on storage.objects;
create policy brief_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'brief-files'
    and public.can_access_request(public.storage_path_request_id(name))
    and (public.is_agency() or owner = auth.uid())
  );

drop policy if exists site_assets_read on storage.objects;
create policy site_assets_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists site_assets_write on storage.objects;
create policy site_assets_write on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and public.is_agency());

drop policy if exists site_assets_delete on storage.objects;
create policy site_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and public.is_agency());

-- ----------------------------------------------------------------------------
-- Kovalarin var oldugunu ve dogru ayarda olduklarini garantile
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('brief-files', 'brief-files', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

insert into storage.buckets (id, name, public, file_size_limit)
values ('site-assets', 'site-assets', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;
