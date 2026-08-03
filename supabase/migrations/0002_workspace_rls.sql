-- PasteScribe — RLS de identidade e workspaces
-- docs/DATABASE.md §Estratégia de RLS
--
-- Regra de ouro: deny-by-default. Como o projeto usa o novo padrão do
-- Supabase de NÃO auto-expor tabelas novas às roles da Data API
-- (auto_expose_new_tables desligado), cada tabela alcançável pelo
-- client precisa de GRANT explícito além da policy — as duas camadas
-- têm que concordar. Tabelas sem GRANT (ex.: app_settings) ficam
-- inacessíveis mesmo com RLS habilitada, só service_role chega nelas.

-- ---------------------------------------------------------------------
-- Hierarquia de papel — usada por is_workspace_member abaixo.
-- ---------------------------------------------------------------------
create or replace function public.workspace_role_rank(p_role public.workspace_role)
returns int
language sql
immutable
as $$
  select case p_role
    when 'viewer' then 1
    when 'editor' then 2
    when 'admin' then 3
    when 'owner' then 4
  end;
$$;

-- ---------------------------------------------------------------------
-- is_workspace_member — único ponto de verdade sobre pertencimento.
-- SECURITY DEFINER + search_path fixo para não ser sequestrada por uma
-- search_path maliciosa; STABLE porque não muda dentro da mesma
-- transação/statement.
-- ---------------------------------------------------------------------
create or replace function public.is_workspace_member(
  p_workspace_id uuid,
  p_min_role public.workspace_role default 'viewer'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and public.workspace_role_rank(m.role) >= public.workspace_role_rank(p_min_role)
  );
$$;

revoke all on function public.workspace_role_rank(public.workspace_role) from public;
revoke all on function public.is_workspace_member(uuid, public.workspace_role) from public;
grant execute on function public.workspace_role_rank(public.workspace_role) to anon, authenticated;
grant execute on function public.is_workspace_member(uuid, public.workspace_role) to anon, authenticated;

-- =======================================================================
-- profiles
-- =======================================================================
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Sem policy/grant de delete: exclusão de perfil segue exclusão de
-- conta (cascade a partir de auth.users), nunca DELETE direto do client.

-- =======================================================================
-- workspaces
-- =======================================================================
alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon, authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;

create policy workspaces_select_member
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id, 'viewer'));

create policy workspaces_insert_self
  on public.workspaces for insert
  to authenticated
  with check (created_by = auth.uid());

create policy workspaces_update_admin
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_member(id, 'admin'))
  with check (public.is_workspace_member(id, 'admin'));

create policy workspaces_delete_owner
  on public.workspaces for delete
  to authenticated
  using (public.is_workspace_member(id, 'owner'));

-- =======================================================================
-- workspace_members
-- =======================================================================
alter table public.workspace_members enable row level security;
revoke all on public.workspace_members from anon, authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;

create policy workspace_members_select_member
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'viewer'));

create policy workspace_members_insert_admin
  on public.workspace_members for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, 'admin'));

-- Admin não pode alterar/remover uma linha de 'owner' — transferência
-- de propriedade é um fluxo dedicado (Onda 11), nunca um UPDATE genérico.
create policy workspace_members_update_admin
  on public.workspace_members for update
  to authenticated
  using (public.is_workspace_member(workspace_id, 'admin') and role <> 'owner')
  with check (public.is_workspace_member(workspace_id, 'admin') and role <> 'owner');

create policy workspace_members_delete_admin
  on public.workspace_members for delete
  to authenticated
  using (public.is_workspace_member(workspace_id, 'admin') and role <> 'owner');

-- Qualquer membro não-owner pode sair por conta própria.
create policy workspace_members_delete_self
  on public.workspace_members for delete
  to authenticated
  using (user_id = auth.uid() and role <> 'owner');

-- =======================================================================
-- workspace_invites — só admin/owner enxerga e gerencia.
-- =======================================================================
alter table public.workspace_invites enable row level security;
revoke all on public.workspace_invites from anon, authenticated;
grant select, insert, update, delete on public.workspace_invites to authenticated;

create policy workspace_invites_select_admin
  on public.workspace_invites for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'admin'));

create policy workspace_invites_insert_admin
  on public.workspace_invites for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id, 'admin') and invited_by = auth.uid());

create policy workspace_invites_update_admin
  on public.workspace_invites for update
  to authenticated
  using (public.is_workspace_member(workspace_id, 'admin'))
  with check (public.is_workspace_member(workspace_id, 'admin'));

create policy workspace_invites_delete_admin
  on public.workspace_invites for delete
  to authenticated
  using (public.is_workspace_member(workspace_id, 'admin'));

-- =======================================================================
-- feature_flags — leitura pública (nunca guarda segredo); escrita só
-- por service_role (sem policy de insert/update/delete para client).
-- =======================================================================
alter table public.feature_flags enable row level security;
revoke all on public.feature_flags from anon, authenticated;
grant select on public.feature_flags to anon, authenticated;

create policy feature_flags_select_all
  on public.feature_flags for select
  to anon, authenticated
  using (true);

-- =======================================================================
-- app_settings — só service_role. Nenhum grant para anon/authenticated;
-- RLS habilitada como defesa em profundidade mesmo sem policy alguma.
-- =======================================================================
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
