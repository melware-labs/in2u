-- Fase B: check-in de ánimo, uno por día, visible en tiempo real para la pareja.

-- La RLS de profiles (Fase A) solo dejaba ver el perfil propio. Para mostrar
-- el nombre/avatar de la pareja en la UI (card de ánimo, etc.) hace falta
-- poder leer también el perfil de quien comparte couple_id.
create policy "profiles_select_partner" on public.profiles
  for select using (
    exists (
      select 1 from public.couples c
      where (c.member_one = auth.uid() and c.member_two = profiles.id)
         or (c.member_two = auth.uid() and c.member_one = profiles.id)
    )
  );

create table public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 1=Mal 2=Bajón 3=Cansada 4=Normal 5=Bien 6=De diez (orden de la pantalla de check-in).
  mood smallint not null check (mood between 1 and 6),
  note text,
  created_at timestamptz not null default now(),
  -- Columna generada para poder tener "un check-in por día" como constraint
  -- real de la base, no una regla que dependa de que el cliente se porte bien.
  checkin_date date generated always as ((created_at at time zone 'utc')::date) stored,
  unique (user_id, checkin_date)
);

create index mood_checkins_couple_id_idx on public.mood_checkins (couple_id);

alter table public.mood_checkins enable row level security;

-- Cualquiera de los dos miembros de la pareja puede ver los check-ins de esa pareja.
create policy "mood_checkins_select_couple" on public.mood_checkins
  for select using (
    exists (
      select 1 from public.couples c
      where c.id = mood_checkins.couple_id
        and (c.member_one = auth.uid() or c.member_two = auth.uid())
    )
  );

-- Solo se puede insertar el propio check-in, y solo en una pareja de la que se es miembro.
create policy "mood_checkins_insert_own" on public.mood_checkins
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.couples c
      where c.id = mood_checkins.couple_id
        and (c.member_one = auth.uid() or c.member_two = auth.uid())
    )
  );

-- Actualizar el check-in del día (upsert desde el cliente vía on conflict).
create policy "mood_checkins_update_own" on public.mood_checkins
  for update using (user_id = auth.uid());

-- Habilita Realtime (postgres_changes) para esta tabla.
alter publication supabase_realtime add table public.mood_checkins;
