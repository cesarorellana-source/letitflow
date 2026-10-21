-- Capa 0: cursos. Es la primera tabla de dominio y fija el patrón de tenencia
-- que seguirán las demás: workspace_id + políticas con is_member / has_role.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  level text not null check (char_length(btrim(level)) between 1 and 40),
  school_year integer not null check (school_year between 2000 and 2100),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, school_year, name)
);

create index courses_workspace_idx on public.courses (workspace_id);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

revoke all on public.courses from anon, authenticated;
grant select, delete on public.courses to authenticated;
grant insert (workspace_id, name, level, school_year) on public.courses to authenticated;
grant update (name, level, school_year, archived_at) on public.courses to authenticated;

alter table public.courses enable row level security;

create policy courses_select on public.courses
  for select to authenticated
  using (public.is_member(workspace_id));

create policy courses_insert on public.courses
  for insert to authenticated
  with check (
    public.has_role(workspace_id, 'editor')
    and created_by = (select auth.uid())
  );

create policy courses_update on public.courses
  for update to authenticated
  using (public.has_role(workspace_id, 'editor'))
  with check (public.has_role(workspace_id, 'editor'));

create policy courses_delete on public.courses
  for delete to authenticated
  using (public.has_role(workspace_id, 'admin'));

grant all on public.courses to service_role;
