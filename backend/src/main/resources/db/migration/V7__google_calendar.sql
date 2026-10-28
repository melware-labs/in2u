-- Vinculación opcional con Google Calendar (una cuenta de Google por persona).
-- Los tokens van cifrados con AES-GCM (clave GOOGLE_TOKEN_KEY, solo en el servidor):
-- si alguien lee la base, no puede usar el calendario de nadie.
create table google_calendar_links (
  user_id uuid primary key references app_users (id) on delete cascade,
  google_email text,
  refresh_token_enc text not null,
  access_token_enc text,
  access_token_expires_at timestamptz,
  connected_at timestamptz not null default now()
);

-- Copia de cada evento de in2u en el Google Calendar de cada persona que lo ve
-- (quien lo creó y, si es "los_dos", su pareja). Sirve para borrarla después.
-- Sin clave foránea a couple_events a propósito: la fila tiene que seguir ahí
-- cuando el evento ya se borró, para saber qué copia borrar en Google.
create table google_event_copies (
  event_id uuid not null,
  user_id uuid not null references app_users (id) on delete cascade,
  google_event_id text not null,
  primary key (event_id, user_id)
);

create index google_event_copies_user_idx on google_event_copies (user_id);
