-- =============================================================================
-- Bildirimler
--
-- Ajans kullanicilarina yeni talep, yeniden iletilen talep ve marka yorumu
-- geldiginde bildirim uretilir. Kayitlar tetikleyicilerle olusur; kullanici
-- yalnizca kendi bildirimlerini gorur ve okundu isaretleyebilir.
-- =============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  request_id uuid references public.requests(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

-- Kullanici yalnizca kendi bildirimlerine erisir. Insert politikasi yok:
-- kayitlar yalnizca asagidaki security definer tetikleyicilerle olusur.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Talep ajansa iletildiginde
-- ----------------------------------------------------------------------------
create or replace function public.notify_agency_on_submit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand text;
  v_resubmit boolean;
begin
  if new.status <> 'submitted' or old.status is not distinct from new.status then
    return new;
  end if;

  v_resubmit := old.status = 'info_needed';
  select name into v_brand from public.brands where id = new.brand_id;

  insert into public.notifications (user_id, type, title, body, request_id)
  select
    p.id,
    case when v_resubmit then 'request_resubmitted' else 'request_submitted' end,
    case when v_resubmit then 'Eksikler tamamlandı: ' else 'Yeni iş talebi: ' end
      || coalesce(nullif(new.title, ''), 'İsimsiz talep'),
    coalesce(v_brand, 'Marka bilinmiyor'),
    new.id
  from public.profiles p
  where p.role = 'agency' and p.is_active;

  return new;
end;
$$;

drop trigger if exists requests_notify_agency on public.requests;
create trigger requests_notify_agency
  after update on public.requests
  for each row execute function public.notify_agency_on_submit();

-- ----------------------------------------------------------------------------
-- Marka kullanicisi yorum yazdiginda
-- ----------------------------------------------------------------------------
create or replace function public.notify_agency_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
  v_title text;
begin
  -- Ajans ici notlar ve ajansin kendi yorumlari bildirim uretmez.
  if new.is_internal then
    return new;
  end if;

  select role, full_name into v_role, v_name
    from public.profiles where id = new.author_id;

  if v_role is distinct from 'client' then
    return new;
  end if;

  select title into v_title from public.requests where id = new.request_id;

  insert into public.notifications (user_id, type, title, body, request_id)
  select
    p.id,
    'client_comment',
    coalesce(nullif(v_name, ''), 'Marka ekibi') || ' yorum yazdı',
    coalesce(nullif(v_title, ''), 'İsimsiz talep'),
    new.request_id
  from public.profiles p
  where p.role = 'agency' and p.is_active;

  return new;
end;
$$;

drop trigger if exists request_comments_notify_agency on public.request_comments;
create trigger request_comments_notify_agency
  after insert on public.request_comments
  for each row execute function public.notify_agency_on_comment();

-- ----------------------------------------------------------------------------
-- Canli iletim (Supabase Realtime)
-- ----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
