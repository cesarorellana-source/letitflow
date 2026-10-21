-- Capa 0: perfiles, espacios de trabajo y membresías, con RLS.
--
-- Principios:
--   * Toda tabla de dominio lleva workspace_id y se protege con is_member / has_role.
--   * Cada persona recibe un espacio personal al registrarse (trigger en auth.users).
--   * Los permisos se otorgan de forma explícita: se revoca todo y se concede lo mínimo.
--   * Las funciones security definer fijan search_path y califican todos los nombres.

create type public.workspace_role as enum ('viewer', 'editor', 'admin', 'owner');
-- El orden de declaración define la jerarquía: viewer < editor < admin < owner.

create type public.workspace_kind as enum ('personal', 'team', 'institution');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  kind public.workspace_kind not null default 'team',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una sola persona, un solo espacio personal.
create unique index workspaces_one_personal_per_user
  on public.workspaces (created_by)
  where kind = 'personal';

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create table public.memberships (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

-- ---------------------------------------------------------------------------
-- Funciones de autorización (usadas por las políticas RLS)
-- ---------------------------------------------------------------------------

create function public.has_role(ws uuid, min_role public.workspace_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
      and m.role >= min_role
  );
$$;

create function public.is_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(ws, 'viewer');
$$;

revoke execute on function public.has_role(uuid, public.workspace_role) from public, anon;
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.workspace_role) to authenticated, service_role;
grant execute on function public.is_member(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Alta de usuarios: perfil + espacio personal
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
      120
    )
  );

  insert into public.workspaces (name, kind, created_by)
  values ('Mi espacio', 'personal', new.id)
  returning id into ws_id;

  insert into public.memberships (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Al borrar una cuenta se elimina su espacio personal (y, en cascada, lo que contiene).
-- Los espacios de equipo no se tocan: si la persona es la única propietaria, el borrado
-- falla hasta que transfiera la propiedad (ver memberships_guard).
create function public.handle_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.workspaces
  where kind = 'personal' and created_by = old.id;
  return old;
end;
$$;

create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute function public.handle_user_deleted();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_deleted() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Crear espacios de equipo o institucionales
-- ---------------------------------------------------------------------------

create function public.create_workspace(
  ws_name text,
  ws_kind public.workspace_kind default 'team'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ws_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if ws_kind = 'personal' then
    raise exception 'personal workspaces are created at sign-up' using errcode = '22023';
  end if;

  insert into public.workspaces (name, kind, created_by)
  values (ws_name, ws_kind, uid)
  returning id into ws_id;

  insert into public.memberships (workspace_id, user_id, role)
  values (ws_id, uid, 'owner');

  return ws_id;
end;
$$;

revoke execute on function public.create_workspace(text, public.workspace_kind) from public, anon;
grant execute on function public.create_workspace(text, public.workspace_kind) to authenticated;

-- ---------------------------------------------------------------------------
-- Reglas de integridad de membresías
-- ---------------------------------------------------------------------------

create function public.memberships_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws public.workspaces;
begin
  if tg_op = 'INSERT' then
    -- Un espacio personal solo admite a su dueño.
    select * into ws from public.workspaces where id = new.workspace_id;
    if ws.kind = 'personal' and new.user_id is distinct from ws.created_by then
      raise exception 'a personal workspace cannot have other members' using errcode = '23514';
    end if;
    return new;
  end if;

  -- UPDATE o DELETE: nunca dejar un espacio sin propietario.
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from public.workspaces w where w.id = old.workspace_id)
     and not exists (
       select 1 from public.memberships m
       where m.workspace_id = old.workspace_id
         and m.role = 'owner'
         and m.user_id <> old.user_id
     )
  then
    raise exception 'a workspace must keep at least one owner' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger memberships_guard
  before insert or update or delete on public.memberships
  for each row execute function public.memberships_guard();

revoke execute on function public.memberships_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.workspaces, public.memberships from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;

-- profiles: cada persona ve el suyo y los de quienes comparten un espacio con ella.
-- (La RLS de memberships ya limita las filas visibles a los espacios propios.)
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (select 1 from public.memberships m where m.user_id = profiles.id)
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- workspaces: se crean con create_workspace(); aquí solo lectura, renombrar y borrar.
grant select on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;
grant delete on public.workspaces to authenticated;

create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_member(id));

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (public.has_role(id, 'admin'))
  with check (public.has_role(id, 'admin'));

create policy workspaces_delete on public.workspaces
  for delete to authenticated
  using (public.has_role(id, 'owner') and kind <> 'personal');

-- memberships: ver las de mis espacios; administrar siendo admin; solo un owner crea owners.
grant select, delete on public.memberships to authenticated;
grant insert (workspace_id, user_id, role) on public.memberships to authenticated;
grant update (role) on public.memberships to authenticated;

create policy memberships_select on public.memberships
  for select to authenticated
  using (public.is_member(workspace_id));

create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (
    public.has_role(workspace_id, 'admin')
    and (role <> 'owner' or public.has_role(workspace_id, 'owner'))
  );

create policy memberships_update on public.memberships
  for update to authenticated
  using (
    public.has_role(workspace_id, 'admin')
    and (role <> 'owner' or public.has_role(workspace_id, 'owner'))
  )
  with check (
    public.has_role(workspace_id, 'admin')
    and (role <> 'owner' or public.has_role(workspace_id, 'owner'))
  );

-- Salir de un espacio (user_id propio) o expulsar siendo admin (sin tocar a un owner).
create policy memberships_delete on public.memberships
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.has_role(workspace_id, 'admin')
      and (role <> 'owner' or public.has_role(workspace_id, 'owner'))
    )
  );

-- service_role (solo servidor) conserva acceso completo.
grant all on public.profiles, public.workspaces, public.memberships to service_role;
