-- Datos que se piden al crear la cuenta: género, fecha de nacimiento (de
-- ahí sale la edad, que así no queda vieja con los años) y desde cuándo son
-- pareja. Todo nullable: las cuentas que ya existen completan el formulario
-- la próxima vez que entran.

alter table app_users
  add column gender text check (gender in ('mujer', 'hombre', 'otro')),
  add column birth_date date,
  -- Fecha de pareja que cargó esta persona antes de vincularse; al crear o
  -- unirse a la pareja pasa a couples.together_since.
  add column together_since date;

-- Compartida por los dos: cualquiera la puede corregir.
alter table couples
  add column together_since date;
