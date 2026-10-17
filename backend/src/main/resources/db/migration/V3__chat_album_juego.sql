-- Chat de la pareja, álbum de fotos compartido y el juego "¿Cuánto me conoces?".

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  sender_id uuid not null references app_users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_messages_couple_created_idx on chat_messages (couple_id, created_at desc);

-- Las fotos se guardan en la base (bytea): el navegador las achica antes de
-- subirlas, así cada una pesa unos cientos de KB.
create table album_photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  uploader_id uuid not null references app_users (id) on delete cascade,
  title text check (char_length(title) <= 80),
  description text check (char_length(description) <= 500),
  content_type text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create index album_photos_couple_created_idx on album_photos (couple_id, created_at desc);

-- Cada persona responde sobre sí misma (self_choice) y adivina qué
-- respondió su pareja (guess_choice). Las preguntas viven en el frontend.
create table game_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples (id) on delete cascade,
  user_id uuid not null references app_users (id) on delete cascade,
  question_key text not null,
  self_choice smallint not null check (self_choice between 0 and 3),
  guess_choice smallint not null check (guess_choice between 0 and 3),
  created_at timestamptz not null default now(),
  unique (user_id, question_key)
);

create index game_answers_couple_idx on game_answers (couple_id);
