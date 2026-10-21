-- Pruebas de aislamiento, roles y reglas de integridad de la capa 0.
-- Cada archivo corre en una transacción que se revierte al final.

begin;

-- Actores sintéticos (nunca datos reales).
-- ana: dueña del equipo | beto: editor | carla: viewer | dani: admin | eva: ajena a todo
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.test',   '{"full_name": "Ana Prueba"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@example.test',  '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'carla@example.test', '{"name": "Carla Prueba"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dani@example.test',  '{}'),
  ('00000000-0000-0000-0000-00000000000e', 'eva@example.test',   '{}');

-- 1. El alta crea perfil, espacio personal y membresía owner.
do $$
begin
  perform tests.check((select count(*) from public.profiles) = 5, 'cada usuario tiene perfil');
  perform tests.check(
    (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Ana Prueba',
    'el nombre sale de full_name'
  );
  perform tests.check(
    (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'Carla Prueba',
    'el nombre cae a name si no hay full_name'
  );
  perform tests.check(
    (select count(*) from public.workspaces where kind = 'personal') = 5,
    'cada usuario tiene un espacio personal'
  );
  perform tests.check(
    (select count(*) from public.memberships where role = 'owner') = 5,
    'cada usuario es owner de su espacio personal'
  );
end $$;

-- 2. Aislamiento: cada persona solo ve su espacio.
do $$
declare
  ana_ws uuid;
  eva_ws uuid;
begin
  select workspace_id into ana_ws from public.memberships where user_id = '00000000-0000-0000-0000-00000000000a';
  select workspace_id into eva_ws from public.memberships where user_id = '00000000-0000-0000-0000-00000000000e';

  perform tests.login('00000000-0000-0000-0000-00000000000a');
  perform tests.check((select count(*) from public.workspaces) = 1, 'ana ve un solo espacio');
  perform tests.check((select count(*) from public.workspaces where id = eva_ws) = 0, 'ana no ve el espacio de eva');
  perform tests.check((select count(*) from public.memberships) = 1, 'ana ve solo su membresía');
  perform tests.check((select count(*) from public.profiles) = 1, 'ana ve solo su perfil');
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-00000000000e');
  perform tests.check((select count(*) from public.workspaces where id = ana_ws) = 0, 'eva no ve el espacio de ana');
  perform tests.logout();
end $$;

-- 3. Equipo: ana crea el espacio y asigna roles.
create temp table ctx (team uuid);
grant all on ctx to public;

do $$
declare
  team uuid;
begin
  perform tests.login('00000000-0000-0000-0000-00000000000a');
  team := public.create_workspace('Equipo 1° básico');
  insert into ctx values (team);

  perform tests.check(
    (select role from public.memberships where workspace_id = team and user_id = '00000000-0000-0000-0000-00000000000a') = 'owner',
    'quien crea el equipo es owner'
  );

  insert into public.memberships (workspace_id, user_id, role) values
    (team, '00000000-0000-0000-0000-00000000000b', 'editor'),
    (team, '00000000-0000-0000-0000-00000000000c', 'viewer'),
    (team, '00000000-0000-0000-0000-00000000000d', 'admin');
  perform tests.logout();
end $$;

-- 4. Permisos por rol sobre el espacio y sus cursos.
do $$
declare
  team uuid := (select team from ctx);
begin
  -- viewer: lee, no escribe.
  perform tests.login('00000000-0000-0000-0000-00000000000c');
  perform tests.check((select count(*) from public.workspaces where id = team) = 1, 'viewer ve el equipo');
  perform tests.throws(
    format('insert into public.courses (workspace_id, name, level, school_year) values (%L, ''1°A'', ''1° básico'', 2027)', team),
    '42501', 'viewer no puede crear cursos'
  );
  perform tests.check(
    tests.affected(format('update public.workspaces set name = ''Hack'' where id = %L', team)) = 0,
    'viewer no puede renombrar el equipo'
  );
  perform tests.logout();

  -- editor: crea y edita cursos, pero no administra.
  perform tests.login('00000000-0000-0000-0000-00000000000b');
  insert into public.courses (workspace_id, name, level, school_year) values (team, '1°A', '1° básico', 2027);
  perform tests.check(
    tests.affected(format('update public.courses set name = ''1°B'' where workspace_id = %L', team)) = 1,
    'editor puede editar cursos'
  );
  perform tests.check(
    tests.affected(format('delete from public.courses where workspace_id = %L', team)) = 0,
    'editor no puede borrar cursos'
  );
  perform tests.throws(
    format('insert into public.memberships (workspace_id, user_id, role) values (%L, ''00000000-0000-0000-0000-00000000000e'', ''viewer'')', team),
    '42501', 'editor no puede invitar'
  );
  perform tests.logout();

  -- viewer ve el curso que creó el editor.
  perform tests.login('00000000-0000-0000-0000-00000000000c');
  perform tests.check((select count(*) from public.courses where workspace_id = team) = 1, 'viewer ve los cursos del equipo');
  perform tests.logout();

  -- admin: invita y borra cursos, pero no crea owners.
  perform tests.login('00000000-0000-0000-0000-00000000000d');
  insert into public.memberships (workspace_id, user_id, role) values (team, '00000000-0000-0000-0000-00000000000e', 'viewer');
  perform tests.throws(
    format('insert into public.memberships (workspace_id, user_id, role) values (%L, ''00000000-0000-0000-0000-00000000000b'', ''owner'') on conflict (workspace_id, user_id) do update set role = ''owner''', team),
    '42501', 'admin no puede crear owners'
  );
  perform tests.throws(
    format('update public.memberships set role = ''owner'' where workspace_id = %L and user_id = ''00000000-0000-0000-0000-00000000000d''', team),
    '42501', 'admin no puede ascenderse a owner'
  );
  perform tests.check(
    tests.affected(format('delete from public.courses where workspace_id = %L', team)) = 1,
    'admin puede borrar cursos'
  );
  perform tests.check(
    tests.affected(format('delete from public.memberships where workspace_id = %L and user_id = ''00000000-0000-0000-0000-00000000000a''', team)) = 0,
    'admin no puede expulsar a un owner'
  );
  perform tests.logout();

  -- eva fue invitada solo como viewer; la ajena no ve nada antes de ser invitada (ya lo es): comprobar su alcance.
  perform tests.login('00000000-0000-0000-0000-00000000000e');
  perform tests.check((select count(*) from public.workspaces) = 2, 'eva ve su espacio personal y el equipo');
  perform tests.logout();
end $$;

-- 5. Columnas protegidas: no se puede mover un curso a otro espacio ni cambiar el tipo de espacio.
do $$
declare
  team uuid := (select team from ctx);
  eva_ws uuid;
begin
  select workspace_id into eva_ws from public.memberships
   where user_id = '00000000-0000-0000-0000-00000000000e' and workspace_id <> team;

  perform tests.login('00000000-0000-0000-0000-00000000000b');
  insert into public.courses (workspace_id, name, level, school_year) values (team, '1°C', '1° básico', 2027);
  perform tests.throws(
    format('update public.courses set workspace_id = %L where name = ''1°C''', eva_ws),
    '42501', 'workspace_id de un curso es inmutable'
  );
  perform tests.throws(
    format('insert into public.courses (workspace_id, name, level, school_year) values (%L, ''X'', ''1° básico'', 2027)', eva_ws),
    '42501', 'no se puede crear cursos en un espacio ajeno'
  );
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-00000000000a');
  perform tests.throws(
    format('update public.workspaces set kind = ''personal'' where id = %L', team),
    '42501', 'el tipo de espacio es inmutable'
  );
  perform tests.logout();
end $$;

-- 6. Integridad: siempre queda un owner y el espacio personal es privado.
do $$
declare
  team uuid := (select team from ctx);
  ana_personal uuid;
begin
  select workspace_id into ana_personal from public.memberships
   where user_id = '00000000-0000-0000-0000-00000000000a' and workspace_id <> team;

  perform tests.login('00000000-0000-0000-0000-00000000000a');
  perform tests.throws(
    format('delete from public.memberships where workspace_id = %L and user_id = ''00000000-0000-0000-0000-00000000000a''', team),
    '23514', 'no se puede dejar el equipo sin owner'
  );
  perform tests.throws(
    format('update public.memberships set role = ''admin'' where workspace_id = %L and user_id = ''00000000-0000-0000-0000-00000000000a''', team),
    '23514', 'no se puede degradar al único owner'
  );
  perform tests.throws(
    format('insert into public.memberships (workspace_id, user_id, role) values (%L, ''00000000-0000-0000-0000-00000000000b'', ''viewer'')', ana_personal),
    '23514', 'el espacio personal no admite otros miembros'
  );
  perform tests.check(
    tests.affected(format('delete from public.workspaces where id = %L', ana_personal)) = 0,
    'el espacio personal no se puede borrar directamente'
  );
  perform tests.logout();
end $$;

-- 7. Nombres inválidos y espacios personales.
do $$
begin
  perform tests.login('00000000-0000-0000-0000-00000000000a');
  perform tests.throws($q$select public.create_workspace('   ')$q$, '23514', 'nombre vacío rechazado');
  perform tests.throws($q$select public.create_workspace('Mi otro espacio', 'personal')$q$, '22023', 'no se crean espacios personales a mano');
  perform tests.logout();

  perform tests.login_anon();
  perform tests.throws($q$select public.create_workspace('Anónimo')$q$, '42501', 'anon no puede crear espacios');
  perform tests.logout();
end $$;

-- 8. Un usuario anónimo no accede a nada.
do $$
begin
  perform tests.login_anon();
  perform tests.throws('select * from public.courses', '42501', 'anon no lee cursos');
  perform tests.throws('select * from public.workspaces', '42501', 'anon no lee espacios');
  perform tests.throws('select * from public.memberships', '42501', 'anon no lee membresías');
  perform tests.throws('select * from public.profiles', '42501', 'anon no lee perfiles');
  perform tests.throws('select * from public.audit_log', '42501', 'anon no lee auditoría');
  perform tests.throws('select * from public.ai_usage', '42501', 'anon no lee uso de IA');
  perform tests.logout();
end $$;

-- 9. Perfiles: solo el propio se edita; los de compañeros de espacio se ven.
do $$
declare
  team uuid := (select team from ctx);
begin
  perform tests.login('00000000-0000-0000-0000-00000000000b');
  perform tests.check(
    (select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 1,
    'beto ve el perfil de ana (comparten equipo)'
  );
  perform tests.check(
    tests.affected($q$update public.profiles set display_name = 'Beto' where id = '00000000-0000-0000-0000-00000000000b'$q$) = 1,
    'beto edita su perfil'
  );
  perform tests.check(
    tests.affected($q$update public.profiles set display_name = 'Hack' where id = '00000000-0000-0000-0000-00000000000a'$q$) = 0,
    'beto no edita el perfil de ana'
  );
  perform tests.logout();

  -- carla (viewer) y eva no comparten otro espacio salvo el equipo: ambas son del equipo.
  perform tests.login('00000000-0000-0000-0000-00000000000e');
  perform tests.check(
    (select count(*) from public.profiles) >= 2,
    'eva ve perfiles de su equipo'
  );
  perform tests.logout();
end $$;

-- 10. Borrado de cuenta: se va el espacio personal; los equipos con único owner lo impiden.
do $$
declare
  team uuid := (select team from ctx);
  carla_personal uuid;
begin
  select workspace_id into carla_personal from public.memberships
   where user_id = '00000000-0000-0000-0000-00000000000c' and workspace_id <> team;

  perform tests.login_service();
  delete from auth.users where id = '00000000-0000-0000-0000-00000000000c';
  perform tests.logout();

  perform tests.check((select count(*) from public.workspaces where id = carla_personal) = 0, 'se borra el espacio personal');
  perform tests.check((select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 0, 'se borra el perfil');
  perform tests.check(
    (select count(*) from public.memberships where user_id = '00000000-0000-0000-0000-00000000000c') = 0,
    'se borran las membresías'
  );

  perform tests.login_service();
  perform tests.throws(
    $q$delete from auth.users where id = '00000000-0000-0000-0000-00000000000a'$q$,
    '23514', 'la única propietaria de un equipo no puede borrar su cuenta sin transferirlo'
  );
  perform tests.logout();
end $$;

-- 11. Borrar un equipo (por su owner) arrastra membresías y cursos.
do $$
declare
  team uuid := (select team from ctx);
begin
  perform tests.login('00000000-0000-0000-0000-00000000000d');
  perform tests.check(
    tests.affected(format('delete from public.workspaces where id = %L', team)) = 0,
    'un admin no puede borrar el equipo'
  );
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-00000000000a');
  perform tests.check(
    tests.affected(format('delete from public.workspaces where id = %L', team)) = 1,
    'el owner puede borrar el equipo'
  );
  perform tests.logout();

  perform tests.check((select count(*) from public.memberships where workspace_id = team) = 0, 'se borran las membresías del equipo');
  perform tests.check((select count(*) from public.courses where workspace_id = team) = 0, 'se borran los cursos del equipo');
end $$;

rollback;

\echo 'OK  001_tenancy_rls'
