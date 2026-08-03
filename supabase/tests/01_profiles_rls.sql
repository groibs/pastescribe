-- RLS de public.profiles — docs/DATABASE.md §Estratégia de RLS
begin;
select plan(7);

-- Fixtures: dois usuários (dispara handle_new_user -> profile + workspace pessoal)
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('b2222222-2222-2222-2222-222222222222', 'bob@example.com');

-- ---------------------------------------------------------------------
-- Como alice
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.profiles),
  1,
  'alice só enxerga o próprio perfil, nunca o de bob'
);

select is(
  (select id from public.profiles limit 1),
  'a1111111-1111-1111-1111-111111111111'::uuid,
  'a única linha visível é a própria'
);

update public.profiles set display_name = 'Alice' where id = auth.uid();
select is(
  (select display_name from public.profiles where id = auth.uid()),
  'Alice',
  'alice consegue atualizar o próprio display_name'
);

-- Tentativa de alterar o perfil de bob não afeta nenhuma linha (RLS filtra o WHERE)
update public.profiles set display_name = 'Hacked' where id = 'b2222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.profiles where display_name = 'Hacked'),
  0,
  'alice não consegue alterar o perfil de bob'
);

-- Tentativa de inserir um perfil se passando por outro usuário viola o WITH CHECK
select throws_ok(
  $$ insert into public.profiles (id) values ('c3333333-3333-3333-3333-333333333333') $$,
  '42501',
  null,
  'alice não consegue criar perfil com id de outro usuário (RLS with check)'
);

reset role;

-- ---------------------------------------------------------------------
-- Como bob
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.profiles),
  1,
  'bob só enxerga o próprio perfil'
);

select is(
  (select display_name from public.profiles where id = auth.uid()),
  null,
  'display_name de bob não foi afetado pela tentativa de alice'
);

reset role;

select * from finish();
rollback;
