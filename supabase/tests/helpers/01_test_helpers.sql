-- Utilidades de prueba. Se aplican después de las migraciones.

create schema tests;
grant usage on schema tests to public;

-- Simula una sesión autenticada (como PostgREST: rol authenticated + claim sub).
create function tests.login(uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end;
$$;

create function tests.login_service()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  execute 'set local role service_role';
end;
$$;

create function tests.login_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end;
$$;

create function tests.logout()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create function tests.check(cond boolean, msg text)
returns void
language plpgsql
as $$
begin
  if cond is not true then
    raise exception 'FALLÓ: %', msg;
  end if;
end;
$$;

-- Ejecuta una sentencia y exige que falle con el SQLSTATE indicado.
create function tests.throws(q text, expected_state text, msg text)
returns void
language plpgsql
as $$
begin
  begin
    execute q;
  exception when others then
    if sqlstate = expected_state then
      return;
    end if;
    raise exception 'FALLÓ: % (se esperaba %, llegó % - %)', msg, expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'FALLÓ: % (se esperaba error %, pero la sentencia tuvo éxito)', msg, expected_state;
end;
$$;

-- Ejecuta una sentencia y devuelve las filas afectadas (la RLS filtra en silencio).
create function tests.affected(q text)
returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on all functions in schema tests to public;
