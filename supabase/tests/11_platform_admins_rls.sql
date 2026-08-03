-- RLS de public.platform_admins (só service_role) + seed dos kill
-- switches globais — docs/DATABASE.md regra 6, docs/AI_CALL_MATRIX.md.
begin;
select plan(7);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

-- ---------------------------------------------------------------------
-- Kill switches nascem desligados (fallback seguro).
-- ---------------------------------------------------------------------
set local role service_role;
select is(
  (select enabled from public.feature_flags where key = 'openai_enabled'),
  false,
  'openai_enabled nasce desligado'
);
select is(
  (select enabled from public.feature_flags where key = 'free_ai_enabled'),
  false,
  'free_ai_enabled nasce desligado'
);
reset role;

-- ---------------------------------------------------------------------
-- anon/authenticated não alcançam platform_admins de jeito nenhum —
-- nem pra ler se alguém é admin (isso é decidido só no server, com
-- service_role, nunca via RLS no client).
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select throws_ok(
  $$ select * from public.platform_admins $$,
  '42501',
  null,
  'anon não lê platform_admins'
);
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ select * from public.platform_admins $$,
  '42501',
  null,
  'authenticated não lê platform_admins (nem o próprio status de admin)'
);
select throws_ok(
  $$ insert into public.platform_admins (user_id) values ('a1111111-1111-1111-1111-111111111111') $$,
  '42501',
  null,
  'authenticated não consegue se auto-promover a admin'
);
reset role;

-- ---------------------------------------------------------------------
-- service_role: bypassa RLS, único caminho real de gerenciar admins.
-- ---------------------------------------------------------------------
set local role service_role;
select lives_ok(
  $$ insert into public.platform_admins (user_id) values ('a1111111-1111-1111-1111-111111111111') $$,
  'service_role consegue conceder platform admin'
);
select is(
  (select count(*)::int from public.platform_admins where user_id = 'a1111111-1111-1111-1111-111111111111'),
  1,
  'alice aparece como platform admin'
);
reset role;

select * from finish();
rollback;
