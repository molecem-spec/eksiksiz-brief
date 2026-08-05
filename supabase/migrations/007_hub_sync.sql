-- =============================================================================
-- Hub aktarimi
--
-- Talep ajansa iletildiginde 18.12 Art Hub'da bir gorev aciliyor. Hub ayri bir
-- Supabase projesinde oldugu icin baglanti foreign key ile degil, olusan
-- gorevin kimligiyle tutuluyor.
--
-- Bu alanlari yalnizca sunucu tarafindaki aktarim islemi yazar; musteri
-- kullanicisi dokunamaz (guard_request_columns).
-- =============================================================================

alter table public.requests add column if not exists hub_task_id uuid;
alter table public.requests add column if not exists hub_synced_at timestamptz;
alter table public.requests add column if not exists hub_error text;

comment on column public.requests.hub_task_id is
  '18.12 Art Hub tarafinda olusan gorevin kimligi. Bos ise aktarim yapilmadi.';

create or replace function public.guard_request_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.trusted_request_update', true), '') = 'on' then
    return new;
  end if;

  if public.is_agency() then
    return new;
  end if;

  if new.brand_id      is distinct from old.brand_id
     or new.created_by    is distinct from old.created_by
     or new.assigned_to   is distinct from old.assigned_to
     or new.agency_note   is distinct from old.agency_note
     or new.deadline      is distinct from old.deadline
     or new.submitted_at  is distinct from old.submitted_at
     or new.completed_at  is distinct from old.completed_at
     or new.status        is distinct from old.status
     or new.hub_task_id   is distinct from old.hub_task_id
     or new.hub_synced_at is distinct from old.hub_synced_at
     or new.hub_error     is distinct from old.hub_error then
    raise exception 'Bu alanlari degistirme yetkiniz yok';
  end if;

  return new;
end;
$$;
