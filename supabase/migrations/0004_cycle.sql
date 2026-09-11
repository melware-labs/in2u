-- Fase E: ciclo menstrual. Dato sensible — las tres tablas crudas
-- (cycle_settings, cycle_periods, cycle_daily_logs) NO tienen ninguna
-- policy de select para la pareja, a propósito: una policy tipo "select si
-- sos partner" seguiría devolviendo filas reales (fecha exacta de último
-- período, síntomas día a día) al cliente de la pareja vía la API REST
-- estándar de PostgREST. El único canal hacia la pareja es
-- get_partner_cycle_summary() más abajo: confirma el vínculo, calcula la
-- fase dentro de Postgres, y devuelve solo el subconjunto que corresponde
-- al nivel de privacidad elegido — nunca toca cycle_daily_logs.

create table public.cycle_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  average_cycle_length_days smallint not null default 29 check (average_cycle_length_days between 20 and 45),
  average_period_length_days smallint not null default 5 check (average_period_length_days between 1 and 10),
  -- 'nada': la pareja no ve nada. 'avisos': señal genérica sin fase ni
  -- fechas. 'fase_y_avisos': card completa (fase, día del ciclo, próximo
  -- período).
  partner_visibility text not null default 'nada' check (partner_visibility in ('nada', 'avisos', 'fase_y_avisos')),
  updated_at timestamptz not null default now()
);

create table public.cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index cycle_periods_user_date_idx on public.cycle_periods (user_id, start_date desc);

create table public.cycle_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  -- 'dolor' | 'sangrado' | 'sin_energia' | 'antojos' | 'insomnio'
  symptoms text[] not null default '{}'
    check (symptoms <@ array['dolor', 'sangrado', 'sin_energia', 'antojos', 'insomnio']::text[]),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.cycle_settings enable row level security;
alter table public.cycle_periods enable row level security;
alter table public.cycle_daily_logs enable row level security;

create policy "cycle_settings_select_own" on public.cycle_settings for select using (user_id = auth.uid());
create policy "cycle_settings_insert_own" on public.cycle_settings for insert with check (user_id = auth.uid());
create policy "cycle_settings_update_own" on public.cycle_settings for update using (user_id = auth.uid());

create policy "cycle_periods_select_own" on public.cycle_periods for select using (user_id = auth.uid());
create policy "cycle_periods_insert_own" on public.cycle_periods for insert with check (user_id = auth.uid());
create policy "cycle_periods_delete_own" on public.cycle_periods for delete using (user_id = auth.uid());

create policy "cycle_daily_logs_select_own" on public.cycle_daily_logs for select using (user_id = auth.uid());
create policy "cycle_daily_logs_insert_own" on public.cycle_daily_logs for insert with check (user_id = auth.uid());
create policy "cycle_daily_logs_update_own" on public.cycle_daily_logs for update using (user_id = auth.uid());

-- Fórmula de fase — mantener sincronizada a mano con computeCyclePhase() en
-- src/lib/cycle.ts (esa copia la usa la propia dueña sobre sus filas
-- crudas, ya permitidas por RLS normal; esta copia SQL es la única que la
-- función de resumen usa para no mandar nunca datos crudos al cliente de
-- la pareja). Proporciones del mock (menstrual:folicular:ovulación:lútea =
-- 5:8:4:12 sobre un ciclo de 29 días) escaladas a la duración configurada.
create or replace function public.compute_cycle_phase(
  p_last_period_start date,
  p_cycle_length int,
  p_period_length int,
  p_as_of date default current_date
) returns jsonb
language sql
stable
as $$
  with base as (
    select
      p_cycle_length as cycle_length,
      p_period_length as period_length,
      greatest(p_cycle_length - p_period_length, 1) as remaining,
      ((p_as_of - p_last_period_start) % p_cycle_length + p_cycle_length) % p_cycle_length as day_of_cycle_0
  ),
  phases as (
    select
      cycle_length, period_length, day_of_cycle_0,
      round(remaining * 8.0 / 24) as folicular_days,
      round(remaining * 4.0 / 24) as ovulacion_days
    from base
  )
  select jsonb_build_object(
    'day_of_cycle', day_of_cycle_0 + 1,
    'cycle_length', cycle_length,
    'phase', case
      when day_of_cycle_0 < period_length then 'menstrual'
      when day_of_cycle_0 < period_length + folicular_days then 'folicular'
      when day_of_cycle_0 < period_length + folicular_days + ovulacion_days then 'ovulacion'
      else 'lutea'
    end,
    'next_period_date', p_last_period_start + (((p_as_of - p_last_period_start) / cycle_length) + 1) * cycle_length,
    'days_until_next_period', cycle_length - day_of_cycle_0,
    'fertile_window_start', p_last_period_start + (period_length + folicular_days),
    'fertile_window_end', p_last_period_start + (period_length + folicular_days + ovulacion_days)
  )
  from phases;
$$;

-- Único punto de acceso de la pareja al ciclo.
create or replace function public.get_partner_cycle_summary(p_owner_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_is_partner boolean;
  v_settings public.cycle_settings;
  v_last_period date;
  v_phase jsonb;
begin
  select exists (
    select 1 from public.couples c
    where (c.member_one = auth.uid() and c.member_two = p_owner_id)
       or (c.member_two = auth.uid() and c.member_one = p_owner_id)
  ) into v_is_partner;

  if not v_is_partner then
    raise exception 'No autorizado.';
  end if;

  select * into v_settings from public.cycle_settings where user_id = p_owner_id;

  if v_settings is null or v_settings.partner_visibility = 'nada' then
    return jsonb_build_object('visibility', 'nada');
  end if;

  select start_date into v_last_period
  from public.cycle_periods where user_id = p_owner_id
  order by start_date desc limit 1;

  if v_last_period is null then
    return jsonb_build_object('visibility', v_settings.partner_visibility, 'has_data', false);
  end if;

  v_phase := public.compute_cycle_phase(
    v_last_period, v_settings.average_cycle_length_days, v_settings.average_period_length_days
  );

  if v_settings.partner_visibility = 'avisos' then
    -- Señal genérica: sin fase, sin día, sin fechas — solo si conviene
    -- cuidarla un poco más estos días (tramos menstrual/lútea).
    return jsonb_build_object(
      'visibility', 'avisos',
      'has_data', true,
      'care_mode', (v_phase ->> 'phase') in ('menstrual', 'lutea')
    );
  end if;

  return jsonb_build_object(
    'visibility', 'fase_y_avisos',
    'has_data', true,
    'phase', v_phase ->> 'phase',
    'day_of_cycle', (v_phase ->> 'day_of_cycle')::int,
    'cycle_length', (v_phase ->> 'cycle_length')::int,
    'next_period_date', v_phase ->> 'next_period_date',
    'days_until_next_period', (v_phase ->> 'days_until_next_period')::int
  );
end;
$$;

grant execute on function public.get_partner_cycle_summary(uuid) to authenticated;
