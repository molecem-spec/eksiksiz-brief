-- =============================================================================
-- Duzeltme: musteri talebi ajansa iletemiyordu
--
-- Belirti: "Ajansa ilet" -> "Bu alanlari degistirme yetkiniz yok"
--
-- Sebep: submit_request() security definer oldugu icin RLS'i atliyor, ancak
-- BEFORE UPDATE tetikleyicileri her kosulda calisir. guard_request_columns
-- icindeki auth.uid() hala musteri kullanicisini gosterdiginden is_agency()
-- false donuyor ve fonksiyonun kendi yaptigi status/submitted_at degisikligi
-- "musteri degistirmis" gibi gorunup engelleniyordu.
--
-- Cozum: guvenilir fonksiyonlar guncelleme sirasinda islem-yerel (transaction
-- local) bir bayrak set eder; tetikleyici bu bayragi gorunce izin verir.
-- Bayrak yalnizca bu fonksiyonlarin icinde ve yalnizca o islem suresince
-- gecerlidir; istemci PostgREST uzerinden bu ayari kendisi yapamaz.
-- =============================================================================

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

-- ----------------------------------------------------------------------------
-- Musteri talebi ajansa iletir.
-- ----------------------------------------------------------------------------
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

  -- Yetki kontrolu yukarida yapildi; kolon korumasi bu guncellemeyi
  -- engellemesin.
  perform set_config('app.trusted_request_update', 'on', true);

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

  perform set_config('app.trusted_request_update', 'off', true);

  return v_request;
end;
$$;

-- ----------------------------------------------------------------------------
-- Ajans talep durumunu degistirir.
-- ----------------------------------------------------------------------------
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

  perform set_config('app.trusted_request_update', 'on', true);

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

  perform set_config('app.trusted_request_update', 'off', true);

  return v_request;
end;
$$;

grant execute on function public.submit_request(uuid) to authenticated;
grant execute on function public.set_request_status(uuid, public.request_status, text) to authenticated;
