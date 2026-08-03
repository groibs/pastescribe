-- RLS de public.workspaces — docs/DATABASE.md §Estratégia de RLS
begin;
select plan(9);

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('b2222222-2222-2222-2222-222222222222', 'bob@example.com');

-- Cada um já tem 1 workspace pessoal (via trigger de signup).

-- ---------------------------------------------------------------------
-- Como alice: cria um workspace de time
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.workspaces (name, created_by) values ('Time da Alice', 'a1111111-1111-1111-1111-111111111111') $$,
  'alice cria um workspace de time para si mesma'
);

select is(
  (select count(*)::int from public.workspaces),
  2,
  'alice enxerga o workspace pessoal + o novo workspace de time (não o de bob)'
);

select is(
  (select role from public.workspace_members
    where workspace_id = (select id from public.workspaces where name = 'Time da Alice')
      and user_id = 'a1111111-1111-1111-1111-111111111111'),
  'owner',
  'o trigger on_workspace_created torna alice owner do workspace recém-criado'
);

-- Tentativa de criar workspace se passando por outra pessoa viola o WITH CHECK
select throws_ok(
  $$ insert into public.workspaces (name, created_by) values ('Falso', 'b2222222-2222-2222-2222-222222222222') $$,
  '42501',
  null,
  'alice não consegue criar workspace atribuindo created_by a outra pessoa'
);

-- alice (owner) pode renomear seu workspace de time
update public.workspaces set name = 'Renomeado' where name = 'Time da Alice';
select is(
  (select count(*)::int from public.workspaces where name = 'Renomeado'),
  1,
  'alice (owner/admin) consegue renomear o próprio workspace de time'
);

reset role;

-- ---------------------------------------------------------------------
-- Como bob: não é membro do workspace de time da alice
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.workspaces),
  1,
  'bob só enxerga o próprio workspace pessoal'
);

select is(
  (select count(*)::int from public.workspaces where name = 'Renomeado'),
  0,
  'bob não enxerga o workspace de time da alice'
);

-- bob tenta renomear o workspace da alice (nem sequer visível) -> 0 linhas afetadas
update public.workspaces set name = 'Invadido' where name = 'Renomeado';
select is(
  (select count(*)::int from public.workspaces where name = 'Invadido'),
  0,
  'bob não consegue alterar workspace do qual não é membro'
);

-- bob não é owner do próprio workspace pessoal? é sim — mas não pode deletar o de alice
select is(
  (select count(*)::int from public.workspaces),
  1,
  'estado de bob permanece consistente após tentativa de invasão'
);

reset role;

select * from finish();
rollback;
