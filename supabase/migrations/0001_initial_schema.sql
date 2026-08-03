-- PasteScribe — schema inicial: identidade e workspaces
-- docs/DATABASE.md §Identidade e workspaces
--
-- Assume o schema `auth` já existente (fornecido pela plataforma
-- Supabase — auth.users, auth.uid(), papéis anon/authenticated/
-- service_role). Este arquivo NUNCA deve recriar esse schema; para
-- testes locais sem a plataforma completa, ver supabase/tests/fixtures/.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles — 1:1 com auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de usuário. Sem e-mail duplicado — o e-mail vive em auth.users.';

-- ---------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_personal boolean not null default false,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspaces is
  'Todo usuário nasce com um workspace pessoal; times são workspaces com mais membros.';

-- ---------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------
create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- ---------------------------------------------------------------------
-- workspace_invites
-- ---------------------------------------------------------------------
create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role public.workspace_role not null,
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index workspace_invites_workspace_id_idx on public.workspace_invites (workspace_id);
create index workspace_invites_email_idx on public.workspace_invites (email);

comment on table public.workspace_invites is
  'Convites pendentes. O fluxo de aceite (função pública por token) chega '
  'com a feature de equipes (Onda 11) — hoje a tabela só existe para uso '
  'administrativo interno.';

-- ---------------------------------------------------------------------
-- feature_flags — dinâmicas, servidas ao cliente (docs/FEATURE_FLAGS.md)
-- ---------------------------------------------------------------------
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

comment on table public.feature_flags is
  'Nenhuma flag aqui pode ser um segredo — leitura é pública por design.';

-- ---------------------------------------------------------------------
-- app_settings — configuração operacional interna (só service_role)
-- ---------------------------------------------------------------------
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is
  'Configuração operacional (orçamentos, políticas do free, modelos '
  'ativos). Nunca exposta ao client — só service_role.';

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.feature_flags
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Todo workspace nasce com seu criador como owner — vale tanto para o
-- workspace pessoal do signup (via handle_new_user, abaixo) quanto para
-- um workspace de time criado depois por um usuário autenticado.
-- `on conflict do nothing` só por segurança/idempotência caso algum
-- caminho futuro já tenha inserido a membership antes deste trigger.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- ---------------------------------------------------------------------
-- Todo usuário nasce com perfil + workspace pessoal (docs/DATABASE.md).
-- Roda como reação a auth.users, nunca confiando no client para criar
-- isso — é a garantia atômica de que ninguém fica sem workspace.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'locale', 'en'));

  -- dispara on_workspace_created, que adiciona new.id como owner
  insert into public.workspaces (name, is_personal, created_by)
  values (coalesce(new.raw_user_meta_data ->> 'full_name', 'Personal workspace'), true, new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
