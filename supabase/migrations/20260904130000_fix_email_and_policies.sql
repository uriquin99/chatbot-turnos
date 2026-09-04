alter table public.usuarios drop constraint if exists usuarios_email_formato;
alter table public.usuarios
add constraint usuarios_email_formato
check (email is null or email ~* '^[^@ ]+@[^@ ]+[.][^@ ]+$');

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
