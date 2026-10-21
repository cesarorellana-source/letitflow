-- Pruebas de audit_log (solo inserción) y ai_usage (solo escribe el servidor).

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'beto@example.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'eva@example.test');

create temp table ctx (team uuid);
grant all on ctx to public;

-- Equipo de ana: beto es editor. eva queda fuera.
do $$
declare
  team uuid;
begin
  perform tests.login('00000000-0000-0000-0000-0000000000a1');
  team := public.create_workspace('Equipo auditoría');
  insert into ctx values (team);
  insert into public.memberships (workspace_id, user_id, role)
  values (team, '00000000-0000-0000-0000-0000000000b1', 'editor');
  perform tests.logout();
end $$;

-- audit_log: insertar propio, no suplantar, no leer sin ser admin, no modificar ni borrar.
do $$
declare
  team uuid := (select team from ctx);
begin
  perform tests.login('00000000-0000-0000-0000-0000000000b1');
  insert into public.audit_log (workspace_id, actor_id, action, entity_type, meta)
  values (team, '00000000-0000-0000-0000-0000000000b1', 'course.create', 'course', '{"origin": "test"}');

  perform tests.throws(
    format('insert into public.audit_log (workspace_id, actor_id, action) values (%L, ''00000000-0000-0000-0000-0000000000a1'', ''course.create'')', team),
    '42501', 'no se puede registrar acciones a nombre de otra persona'
  );
  perform tests.throws(
    'insert into public.audit_log (workspace_id, actor_id, action) values (''00000000-0000-0000-0000-0000000000ff'', ''00000000-0000-0000-0000-0000000000b1'', ''course.create'')',
    '42501', 'no se puede registrar en un espacio ajeno'
  );
  perform tests.throws(
    format('insert into public.audit_log (workspace_id, actor_id, action) values (%L, ''00000000-0000-0000-0000-0000000000b1'', ''Acción Inválida'')', team),
    '23514', 'el formato de action se valida'
  );
  perform tests.check(
    (select count(*) from public.audit_log) = 0,
    'un editor no lee la auditoría'
  );
  perform tests.throws('update public.audit_log set action = ''x.y''', '42501', 'authenticated no actualiza auditoría');
  perform tests.throws('delete from public.audit_log', '42501', 'authenticated no borra auditoría');
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-0000000000a1');
  perform tests.check(
    (select count(*) from public.audit_log where workspace_id = team) = 1,
    'la owner (admin o más) lee la auditoría'
  );
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-0000000000c1');
  perform tests.check((select count(*) from public.audit_log) = 0, 'eva no ve auditoría ajena');
  perform tests.logout();

  -- Ni el servidor puede borrar sin activar la purga explícita.
  perform tests.login_service();
  perform tests.throws('delete from public.audit_log', 'P0001', 'service_role tampoco borra sin purga explícita');
  perform tests.throws('update public.audit_log set action = ''x.y''', 'P0001', 'service_role tampoco modifica');
  perform set_config('app.audit_purge', 'on', true);
  perform tests.check(tests.affected('delete from public.audit_log') = 1, 'la purga por retención sí puede borrar');
  perform tests.logout();
end $$;

-- ai_usage: solo el servidor escribe; cada persona ve lo suyo; admin ve todo.
do $$
declare
  team uuid := (select team from ctx);
begin
  perform tests.login('00000000-0000-0000-0000-0000000000b1');
  perform tests.throws(
    format('insert into public.ai_usage (workspace_id, user_id, task, provider, model) values (%L, ''00000000-0000-0000-0000-0000000000b1'', ''lesson.generate'', ''claude'', ''m'')', team),
    '42501', 'authenticated no puede registrar uso de IA'
  );
  perform tests.logout();

  perform tests.login_service();
  insert into public.ai_usage (workspace_id, user_id, task, provider, model, input_tokens, output_tokens, cost_usd)
  values
    (team, '00000000-0000-0000-0000-0000000000b1', 'lesson.generate', 'claude', 'm', 100, 200, 0.01),
    (team, '00000000-0000-0000-0000-0000000000a1', 'lesson.generate', 'claude', 'm', 300, 400, 0.02);
  perform tests.throws(
    format('insert into public.ai_usage (workspace_id, task, provider, model, cost_usd) values (%L, ''t'', ''p'', ''m'', -1)', team),
    '23514', 'el costo negativo se rechaza'
  );
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-0000000000b1');
  perform tests.check((select count(*) from public.ai_usage) = 1, 'un editor ve solo su propio uso');
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-0000000000a1');
  perform tests.check((select count(*) from public.ai_usage) = 2, 'la owner ve todo el uso del espacio');
  perform tests.logout();

  perform tests.login('00000000-0000-0000-0000-0000000000c1');
  perform tests.check((select count(*) from public.ai_usage) = 0, 'eva no ve uso ajeno');
  perform tests.logout();
end $$;

rollback;

\echo 'OK  002_audit_and_ai_usage'
