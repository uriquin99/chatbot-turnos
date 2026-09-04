create extension if not exists pgcrypto;

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  apellido text not null check (char_length(trim(apellido)) between 1 and 80),
  email text,
  telefono text not null,
  session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usuarios_telefono_unico unique (telefono),
  constraint usuarios_email_formato check (email is null or email ~* '^[^@ ]+@[^@ ]+[.][^@ ]+$')
);

create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete restrict,
  fecha date not null,
  hora time not null,
  estado text not null default 'confirmado' check (estado in ('pendiente', 'confirmado', 'cancelado')),
  servicio text not null default 'Turno general',
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint turnos_evento_google_unico unique (google_event_id),
  constraint turnos_horario_usuario_unico unique (usuario_id, fecha, hora)
);

create index turnos_fecha_hora_idx on public.turnos (fecha, hora);
create index turnos_estado_idx on public.turnos (estado);

create or replace function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger usuarios_actualizar_updated_at
before update on public.usuarios
for each row execute function public.actualizar_updated_at();

create trigger turnos_actualizar_updated_at
before update on public.turnos
for each row execute function public.actualizar_updated_at();

alter table public.usuarios enable row level security;
alter table public.turnos enable row level security;

create policy "Backend administra usuarios"
on public.usuarios
for all
to service_role
using (true)
with check (true);

create policy "Backend administra turnos"
on public.turnos
for all
to service_role
using (true)
with check (true);

revoke all on table public.usuarios from anon, authenticated;
revoke all on table public.turnos from anon, authenticated;
grant all on table public.usuarios to service_role;
grant all on table public.turnos to service_role;

comment on table public.usuarios is 'Personas que reservan turnos mediante el chatbot.';
comment on table public.turnos is 'Turnos confirmados y su vínculo con Google Calendar.';
