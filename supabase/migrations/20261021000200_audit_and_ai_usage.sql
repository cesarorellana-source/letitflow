-- Capa 0: registro de auditoría (solo inserción) y uso de IA.

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
-- Sin claves foráneas a propósito: el rastro sobrevive al borrado del espacio o de la cuenta
-- y solo contiene identificadores opacos y metadatos mínimos (nunca datos de estudiantes).

create table public.audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  actor_id uuid,
  action text not null check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$' and char_length(action) <= 80),
  entity_type text check (entity_type is null or char_length(entity_type) <= 60),
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb
    check (jsonb_typeof(meta) = 'object' and pg_column_size(meta) <= 4096),
  created_at timestamptz not null default now()
);

create index audit_log_workspace_created_idx on public.audit_log (workspace_id, created_at desc);

-- Append-only. La purga por retención debe activar app.audit_purge de forma explícita.
create function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and current_setting('app.audit_purge', true) = 'on' then
    return old;
  end if;
  raise exception 'audit_log is append-only' using errcode = 'P0001';
end;
$$;

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();

revoke all on public.audit_log from anon, authenticated;
grant select, insert on public.audit_log to authenticated;
revoke usage on sequence public.audit_log_id_seq from anon, authenticated;
grant usage on sequence public.audit_log_id_seq to authenticated;

alter table public.audit_log enable row level security;

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (public.has_role(workspace_id, 'admin'));

create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (
    public.is_member(workspace_id)
    and actor_id = (select auth.uid())
  );

grant all on public.audit_log to service_role;
grant usage on sequence public.audit_log_id_seq to service_role;

-- ---------------------------------------------------------------------------
-- ai_usage
-- ---------------------------------------------------------------------------
-- Solo el servidor (service_role) registra uso: así nadie puede falsear su consumo
-- para eludir el tope mensual.

create table public.ai_usage (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  task text not null check (char_length(task) between 1 and 80),
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 80),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  status text not null default 'ok' check (status in ('ok', 'error', 'blocked')),
  created_at timestamptz not null default now()
);

create index ai_usage_workspace_created_idx on public.ai_usage (workspace_id, created_at desc);

revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

alter table public.ai_usage enable row level security;

-- Admins ven todo el consumo del espacio; el resto, solo el propio.
create policy ai_usage_select on public.ai_usage
  for select to authenticated
  using (
    public.has_role(workspace_id, 'admin')
    or (public.is_member(workspace_id) and user_id = (select auth.uid()))
  );

grant all on public.ai_usage to service_role;
grant usage on sequence public.ai_usage_id_seq to service_role;
