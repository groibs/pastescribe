-- Shim LOCAL do schema `auth` do Supabase — SOMENTE para testar
-- migrations/RLS neste ambiente de desenvolvimento com PostgreSQL nativo
-- (docs/DECISIONS.md, 2026-08-03). NUNCA aplicar contra um projeto
-- Supabase real: lá o schema `auth` já existe, é gerenciado pela
-- plataforma (GoTrue) e este arquivo entraria em conflito.
--
-- Reproduz apenas o contrato público estável que nossas migrations
-- usam: auth.users (colunas referenciadas por FK/trigger), auth.uid(),
-- auth.role(), e os papéis anon/authenticated/service_role que o
-- PostgREST usa via SET LOCAL ROLE + SET LOCAL request.jwt.claims.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '')::text;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
-- auth.users nunca é exposta a anon/authenticated na Supabase real —
-- só service_role lê a tabela diretamente; anon/authenticated só
-- recebem auth.uid()/auth.role() (derivados do JWT), nunca a tabela.
grant select on auth.users to service_role;

-- Na Supabase real, o projeto já nasce com privilégio total do
-- service_role sobre tudo em `public` (default privileges de
-- plataforma) — BYPASSRLS ignora as POLICIES, mas não os GRANTs, então
-- isso precisa existir independentemente de RLS. Aplicado ANTES das
-- migrations para valer também nas tabelas que elas ainda vão criar.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
