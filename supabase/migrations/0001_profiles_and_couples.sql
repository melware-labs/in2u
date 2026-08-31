-- Fase A: perfiles + vínculo de pareja por código de invitación.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  member_one uuid not null references auth.users (id) on delete cascade,
  member_two uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint couples_members_distinct check (member_two is null or member_one <> member_two)
);

create index couples_member_one_idx on public.couples (member_one);
create index couples_member_two_idx on public.couples (member_two);

alter table public.profiles enable row level security;
alter table public.couples enable row level security;

-- profiles: cada quien ve y edita únicamente su propio perfil.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- couples: solo lectura para quienes ya son parte de esa pareja específica.
create policy "couples_select_member" on public.couples
  for select using (auth.uid() = member_one or auth.uid() = member_two);

-- Crear una pareja nueva: solo como member_one (quien la crea).
create policy "couples_insert_creator" on public.couples
  for insert with check (auth.uid() = member_one);

-- No hay policy de UPDATE: unirse a una pareja existente pasa por la función
-- join_couple() de abajo, para no tener que abrir UPDATE a cualquier usuario
-- autenticado sobre una tabla con datos de pareja.

-- Crea automáticamente la fila de profiles cuando alguien se registra
-- (login con Google trae nombre/foto en los metadatos del usuario).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Une al usuario autenticado a la pareja dueña del código de invitación.
-- SECURITY DEFINER: corre con permisos elevados para poder actualizar la fila
-- sin necesitar una policy de UPDATE abierta a cualquier usuario autenticado.
-- El código de 6 caracteres es, en la práctica, el mecanismo de autorización.
create function public.join_couple(code text)
returns public.couples
language plpgsql
security definer set search_path = public
as $$
declare
  result public.couples;
begin
  update public.couples
  set member_two = auth.uid()
  where invite_code = upper(trim(code))
    and member_two is null
    and member_one <> auth.uid()
  returning * into result;

  if result.id is null then
    raise exception 'Código inválido o ya utilizado.';
  end if;

  return result;
end;
$$;

grant execute on function public.join_couple(text) to authenticated;
