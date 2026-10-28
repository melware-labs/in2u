-- Preguntas nuevas del juego "¿Cuánto me conoces?". Las primeras 20 viven en
-- el frontend; cuando una persona las termina, se genera un lote de 10 más para
-- la pareja (con Gemini o, si no hay key o falla, de un banco de reserva).
create table game_questions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  question_key text not null unique,
  batch integer not null,
  position smallint not null,
  -- Las opciones van separadas por saltos de línea (siempre son 4).
  text_es text not null,
  options_es text not null,
  text_en text not null,
  options_en text not null,
  source text not null,
  created_at timestamptz not null default now(),
  unique (couple_id, batch, position)
);
