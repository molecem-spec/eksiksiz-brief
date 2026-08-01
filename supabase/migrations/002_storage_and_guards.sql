-- =============================================================================
-- Dosya deposu (Supabase Storage) ve kolon bazli koruma tetikleyicileri
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Talep uzerinde yalnizca ajansin degistirebilecegi alanlar
-- ----------------------------------------------------------------------------
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

  -- Ek bilgi beklenen talepte proje turu degistirilemez; yalnizca eksikler
  -- tamamlanir.
  if old.status = 'info_needed' and new.project_type is distinct from old.project_type then
    raise exception 'Ek bilgi beklenen talepte proje turu degistirilemez';
  end if;

  -- Musteri tarafi: operasyon alanlari ve kimlik alanlari sabit kalir.
  if new.company_id is distinct from old.company_id
     or new.brand_id  is distinct from old.brand_id
     or new.created_by is distinct from old.created_by
     or new.assigned_to is distinct from old.assigned_to
     or new.agency_note is distinct from old.agency_note
     or new.submitted_at is distinct from old.submitted_at
     or new.completed_at is distinct from old.completed_at
     or new.status is distinct from old.status then
    raise exception 'Bu alanlari degistirme yetkiniz yok';
  end if;

  return new;
end;
$$;

drop trigger if exists requests_guard_columns on public.requests;
create trigger requests_guard_columns
  before update on public.requests
  for each row execute function public.guard_request_columns();

-- ----------------------------------------------------------------------------
-- Storage
-- Dosya yolu bicimi: <request_id>/<uuid>-<dosya adi>
-- Erisim, talebin kendisine erisim kuraliyla ayni.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('brief-files', 'brief-files', false, 26214400) -- 25 MB
on conflict (id) do update set public = false, file_size_limit = 26214400;

-- Yol gecerli bir talep kimligiyle basliyorsa onu dondurur, aksi halde null.
create or replace function public.storage_path_request_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_first text;
begin
  v_first := split_part(p_name, '/', 1);
  if v_first !~ '^[0-9a-fA-F-]{36}$' then
    return null;
  end if;
  return v_first::uuid;
exception when others then
  return null;
end;
$$;

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

grant execute on function public.storage_path_request_id(text) to authenticated;
