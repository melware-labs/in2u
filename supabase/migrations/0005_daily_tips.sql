-- Fase D: tip diario de "Consejos" clasificado por la Edge Function
-- analyze-checkin (Gemini). Llenada exclusivamente por esa función, que usa
-- el service role — no hay policy de insert/update para `authenticated`,
-- a propósito, para que nadie pueda escribirse un tip falso.

create table public.daily_tips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  for_user_id uuid not null references auth.users (id) on delete cascade, -- quien lee el tip
  based_on_user_id uuid not null references auth.users (id) on delete cascade, -- de quién es el check-in que lo generó
  tip_key text not null, -- referencia a src/content/tips.ts
  kicker_text text not null, -- generado por Gemini, ej. "Para hoy · Raúl viene cansado hace 3 días"
  created_at timestamptz not null default now(),
  tip_date date generated always as ((created_at at time zone 'utc')::date) stored,
  unique (for_user_id, tip_date)
);

create index daily_tips_for_user_date_idx on public.daily_tips (for_user_id, tip_date desc);

alter table public.daily_tips enable row level security;

create policy "daily_tips_select_own" on public.daily_tips
  for select using (for_user_id = auth.uid());
