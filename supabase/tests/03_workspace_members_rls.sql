-- RLS de public.workspace_members — docs/DATABASE.md §Estratégia de RLS
begin;
select plan(10);

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('b2222222-2222-2222-2222-222222222222', 'bob@example.com'),
  ('c3333333-3333-3333-3333-333333333333', 'carol@example.com');

-- Workspace de time: alice (owner) cria, adiciona bob como admin e
-- carol como editor (via superuser, simulando a rota server-side que
-- faria isso hoje — o convite completo é Onda 11).
insert into public.workspaces (id, name, created_by)
values ('90000000-0000-0000-0000-000000000001', 'Squad', 'a1111111-1111-1111-1111-111111111111');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('90000000-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'admin'),
  ('90000000-0000-0000-0000-000000000001', 'c3333333-3333-3333-3333-333333333333', 'editor');

-- ---------------------------------------------------------------------
-- Como carol (editor): só lê, não gerencia membros
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001'),
  3,
  'carol (editor) enxerga o roster completo do squad'
);

delete from public.workspace_members
  where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'b2222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'b2222222-2222-2222-2222-222222222222'),
  1,
  'carol (editor, abaixo de admin) não consegue remover o admin — RLS filtra a linha, 0 afetadas'
);

reset role;

-- ---------------------------------------------------------------------
-- Como bob (admin): gerencia membros, mas não mexe no owner
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';

update public.workspace_members set role = 'admin'
  where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'c3333333-3333-3333-3333-333333333333';
select is(
  (select role from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'c3333333-3333-3333-3333-333333333333'),
  'admin',
  'bob (admin) promove carol de editor para admin'
);

-- bob tenta rebaixar a própria alice (owner) -> policy bloqueia (role <> 'owner' no USING)
update public.workspace_members set role = 'viewer'
  where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'a1111111-1111-1111-1111-111111111111';
select is(
  (select role from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'a1111111-1111-1111-1111-111111111111'),
  'owner',
  'bob (admin) não consegue rebaixar o owner — linha permanece owner'
);

-- bob tenta remover a alice (owner) -> policy bloqueia
delete from public.workspace_members
  where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'a1111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001' and role = 'owner'),
  1,
  'bob (admin) não consegue remover o owner do workspace'
);

reset role;

-- ---------------------------------------------------------------------
-- Como carol (agora admin): sai do workspace por conta própria
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}';

delete from public.workspace_members
  where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = auth.uid();
select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = 'c3333333-3333-3333-3333-333333333333'),
  0,
  'carol consegue sair do workspace por conta própria (delete_self)'
);

reset role;

-- ---------------------------------------------------------------------
-- Como alice (owner): não pode se auto-remover pela policy de "sair"
-- (role <> 'owner' bloqueia); precisaria de transferência de propriedade.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

delete from public.workspace_members
  where workspace_id = '90000000-0000-0000-0000-000000000001' and user_id = auth.uid();
select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001' and role = 'owner'),
  1,
  'alice (owner) não consegue sair sozinha — evita workspace órfão sem owner'
);

reset role;

-- ---------------------------------------------------------------------
-- Como um estranho fora do workspace: nada visível, nada gravável
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values ('d4444444-4444-4444-4444-444444444444', 'dave@example.com');
set local role authenticated;
set local request.jwt.claims to '{"sub":"d4444444-4444-4444-4444-444444444444","role":"authenticated"}';

select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001'),
  0,
  'dave (fora do workspace) não vê nenhuma linha do roster do squad'
);

select throws_ok(
  $$ insert into public.workspace_members (workspace_id, user_id, role)
     values ('90000000-0000-0000-0000-000000000001', 'd4444444-4444-4444-4444-444444444444', 'editor') $$,
  '42501',
  null,
  'dave não consegue se auto-adicionar ao squad'
);

reset role;

-- ---------------------------------------------------------------------
-- Confirma estado final via superuser (bypassa RLS)
-- ---------------------------------------------------------------------
reset role;
select is(
  (select count(*)::int from public.workspace_members where workspace_id = '90000000-0000-0000-0000-000000000001'),
  2,
  'estado final do squad: owner (alice) + admin (bob); carol saiu, dave nunca entrou'
);

select * from finish();
rollback;
