-- Invariante central: todo usuário nasce com perfil + workspace pessoal
-- + membership de owner, atomicamente (docs/DATABASE.md).
begin;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data)
values (
  'e5555555-5555-5555-5555-555555555555',
  'erin@example.com',
  '{"locale":"pt-br","full_name":"Erin"}'::jsonb
);

select is(
  (select count(*)::int from public.profiles where id = 'e5555555-5555-5555-5555-555555555555'),
  1,
  'signup cria exatamente 1 perfil'
);

select is(
  (select locale from public.profiles where id = 'e5555555-5555-5555-5555-555555555555'),
  'pt-br',
  'locale do metadata do signup é aplicado ao perfil'
);

select is(
  (select count(*)::int from public.workspaces where created_by = 'e5555555-5555-5555-5555-555555555555' and is_personal = true),
  1,
  'signup cria exatamente 1 workspace pessoal'
);

select is(
  (select name from public.workspaces where created_by = 'e5555555-5555-5555-5555-555555555555' and is_personal = true),
  'Erin',
  'nome do workspace pessoal usa o full_name do metadata quando presente'
);

select is(
  (select role from public.workspace_members m
     join public.workspaces w on w.id = m.workspace_id
     where w.created_by = 'e5555555-5555-5555-5555-555555555555' and w.is_personal = true
       and m.user_id = 'e5555555-5555-5555-5555-555555555555'),
  'owner',
  'o próprio usuário é owner do workspace pessoal'
);

-- Sem metadata: usa os defaults (locale 'en', nome genérico) sem quebrar
insert into auth.users (id, email) values ('f6666666-6666-6666-6666-666666666666', 'frank@example.com');
select is(
  (select locale from public.profiles where id = 'f6666666-6666-6666-6666-666666666666'),
  'en',
  'signup sem metadata cai no default locale en, sem erro'
);

select * from finish();
rollback;
