-- Fase C: eventos de calendario compartido. Sin sync real de Google Calendar
-- todavía — el toggle "Google Calendar" en la pantalla "Nuevo evento" solo
-- guarda la intención (google_sync_enabled); la escritura real contra la API
-- de Google queda para la segunda mitad de la Fase C.

create table public.couple_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- 'solo_yo': solo lo ve quien lo creó. 'los_dos': lo ve toda la pareja.
  visibility text not null default 'los_dos' check (visibility in ('solo_yo', 'los_dos')),
  google_sync_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint couple_events_dates_valid check (ends_at >= starts_at)
);

create index couple_events_couple_range_idx on public.couple_events (couple_id, starts_at);

alter table public.couple_events enable row level security;

-- Cada quien ve sus propios eventos (cualquier visibilidad) y los eventos
-- "los_dos" de la pareja. Nunca ve un evento "solo_yo" ajeno.
create policy "couple_events_select_own_or_shared" on public.couple_events
  for select using (
    exists (
      select 1 from public.couples c
      where c.id = couple_events.couple_id
        and (c.member_one = auth.uid() or c.member_two = auth.uid())
    )
    and (owner_id = auth.uid() or visibility = 'los_dos')
  );

create policy "couple_events_insert_own" on public.couple_events
  for insert with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.couples c
      where c.id = couple_events.couple_id
        and (c.member_one = auth.uid() or c.member_two = auth.uid())
    )
  );

create policy "couple_events_update_own" on public.couple_events
  for update using (owner_id = auth.uid());

create policy "couple_events_delete_own" on public.couple_events
  for delete using (owner_id = auth.uid());
