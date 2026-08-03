-- RLS de public.workspace_invites — só admin/owner gerencia
-- docs/DATABASE.md §Estratégia de RLS
begin;
select plan(6);

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('c3333333-3333-3333-3333-333333333333', 'carol@example.com');

insert into public.workspaces (id, name, created_by)
values ('90000000-0000-0000-0000-000000000002', 'Squad 2', 'a1111111-1111-1111-1111-111111111111');

insert into public.workspace_members (workspace_id, user_id, role)
values ('90000000-0000-0000-0000-000000000002', 'c3333333-3333-3333-3333-333333333333', 'editor');

-- ---------------------------------------------------------------------
-- Como alice (owner): convida alguém
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.workspace_invites (workspace_id, email, role, token_hash, invited_by, expires_at)
     values ('90000000-0000-0000-0000-000000000002', 'novo@example.com', 'editor', 'hash-1', 'a1111111-1111-1111-1111-111111111111', now() + interval '7 days') $$,
  'alice (owner) consegue criar um convite'
);

select is(
  (select count(*)::int from public.workspace_invites where workspace_id = '90000000-0000-0000-0000-000000000002'),
  1,
  'alice enxerga o convite criado'
);

-- alice não pode criar convite se passando por outra pessoa como invited_by
select throws_ok(
  $$ insert into public.workspace_invites (workspace_id, email, role, token_hash, invited_by, expires_at)
     values ('90000000-0000-0000-0000-000000000002', 'x@example.com', 'editor', 'hash-2', 'c3333333-3333-3333-3333-333333333333', now() + interval '7 days') $$,
  '42501',
  null,
  'alice não consegue criar convite fingindo que foi carol quem convidou'
);

reset role;

-- ---------------------------------------------------------------------
-- Como carol (editor, abaixo de admin): não gerencia convites
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is(
  (select count(*)::int from public.workspace_invites where workspace_id = '90000000-0000-0000-0000-000000000002'),
  0,
  'carol (editor) não enxerga os convites — só admin/owner'
);

select throws_ok(
  $$ insert into public.workspace_invites (workspace_id, email, role, token_hash, invited_by, expires_at)
     values ('90000000-0000-0000-0000-000000000002', 'y@example.com', 'viewer', 'hash-3', 'c3333333-3333-3333-3333-333333333333', now() + interval '7 days') $$,
  '42501',
  null,
  'carol (editor) não consegue criar convite'
);

reset role;

-- ---------------------------------------------------------------------
-- Estranho fora do workspace
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values ('d4444444-4444-4444-4444-444444444444', 'dave@example.com');
set local role authenticated;
set local request.jwt.claims to '{"sub":"d4444444-4444-4444-4444-444444444444","role":"authenticated"}';

select is(
  (select count(*)::int from public.workspace_invites where workspace_id = '90000000-0000-0000-0000-000000000002'),
  0,
  'dave (fora do workspace) não enxerga nenhum convite'
);

reset role;

select * from finish();
rollback;
