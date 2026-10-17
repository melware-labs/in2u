-- Esquema de in2u portado desde supabase/migrations/0001-0005.
--
-- Diferencias con la versión de Supabase:
--  * No hay RLS ni auth.users: la autorización vive en los servicios de
--    Spring (cada consulta filtra por el usuario de la sesión). Lo que antes
--    era una policy ahora es un chequeo en Java con su test.
--  * `app_users` reemplaza a auth.users + profiles (una sola tabla).
--  * Las fechas "del día" (checkin_date, tip_date) son columnas normales que
--    calcula el backend con la zona horaria de cada usuario, en vez de
--    columnas generadas en UTC: así un check-in a las 22 h en América no cae
--    en el día siguiente.

create table app_users (
  id uuid primary key default gen_random_uuid(),
  -- `sub` del proveedor de login (Google). Prefijo "dev:" para el login de
  -- desarrollo (ver DevLoginController).
  auth_subject text not null unique,
  email text,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  member_one uuid not null references app_users (id) on delete cascade,
  member_two uuid references app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint couples_members_distinct check (member_two is null or member_one <> member_two)
);

create index couples_member_one_idx on couples (member_one);
create index couples_member_two_idx on couples (member_two);

create table mood_checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  user_id uuid not null references app_users (id) on delete cascade,
  -- 1=Mal 2=Bajón 3=Cansada 4=Normal 5=Bien 6=De diez.
  mood smallint not null check (mood between 1 and 6),
  note text,
  checkin_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index mood_checkins_couple_date_idx on mood_checkins (couple_id, checkin_date desc);

create table daily_tips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  for_user_id uuid not null references app_users (id) on delete cascade, -- quien lee el tip
  based_on_user_id uuid not null references app_users (id) on delete cascade, -- de quién es el check-in
  tip_key text not null,
  kicker_text text not null,
  -- Sugerencia concreta para hoy, escrita según el ánimo (IA o reglas).
  advice_text text not null,
  -- 'gemini' o 'reglas' (respaldo sin IA cuando no hay API key o falla).
  source text not null,
  tip_date date not null,
  created_at timestamptz not null default now(),
  unique (for_user_id, tip_date)
);

create table couple_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  owner_id uuid not null references app_users (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- 'solo_yo': solo lo ve quien lo creó. 'los_dos': lo ve toda la pareja.
  visibility text not null default 'los_dos' check (visibility in ('solo_yo', 'los_dos')),
  google_sync_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint couple_events_dates_valid check (ends_at >= starts_at)
);

create index couple_events_couple_range_idx on couple_events (couple_id, starts_at);

-- Ciclo: dato sensible. La pareja nunca lee estas tablas directo; solo
-- recibe el resumen recortado según partner_visibility (servicio de ciclo).
create table cycle_settings (
  user_id uuid primary key references app_users (id) on delete cascade,
  average_cycle_length_days smallint not null default 29 check (average_cycle_length_days between 20 and 45),
  average_period_length_days smallint not null default 5 check (average_period_length_days between 1 and 10),
  partner_visibility text not null default 'nada' check (partner_visibility in ('nada', 'avisos', 'fase_y_avisos')),
  updated_at timestamptz not null default now()
);

create table cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users (id) on delete cascade,
  start_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index cycle_periods_user_date_idx on cycle_periods (user_id, start_date desc);

create table cycle_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users (id) on delete cascade,
  log_date date not null,
  symptoms text[] not null default '{}'
    check (symptoms <@ array['dolor', 'sangrado', 'sin_energia', 'antojos', 'insomnio']::text[]),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);
