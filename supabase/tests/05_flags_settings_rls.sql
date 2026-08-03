-- RLS de public.feature_flags (leitura pública) e public.app_settings
-- (só service_role) — docs/FEATURE_FLAGS.md, docs/DATABASE.md
begin;
select plan(8);

-- Chave própria de teste — não colide com os kill switches reais
-- (openai_enabled/free_ai_enabled), seedados por 0006_platform_admins.sql.
insert into public.feature_flags (key, enabled, description)
values ('test_kill_switch', false, 'flag de teste — RLS de feature_flags');

insert into public.app_settings (key, value)
values ('free_budget_brl', '150'::jsonb);

-- ---------------------------------------------------------------------
-- anon: lê flags, não lê app_settings
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is(
  (select enabled from public.feature_flags where key = 'test_kill_switch'),
  false,
  'anon consegue ler feature_flags (nunca é segredo)'
);

select throws_ok(
  $$ select * from public.app_settings $$,
  '42501',
  null,
  'anon não tem nem GRANT para ler app_settings'
);

select throws_ok(
  $$ update public.feature_flags set enabled = true where key = 'test_kill_switch' $$,
  '42501',
  null,
  'anon não consegue escrever em feature_flags — só leitura'
);

reset role;

-- ---------------------------------------------------------------------
-- authenticated: mesma regra de leitura de flags, sem acesso a settings
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.feature_flags where key = 'test_kill_switch'),
  1,
  'authenticated também lê feature_flags'
);

select throws_ok(
  $$ select * from public.app_settings $$,
  '42501',
  null,
  'authenticated não tem GRANT para ler app_settings'
);

select throws_ok(
  $$ insert into public.feature_flags (key, enabled) values ('hack', true) $$,
  '42501',
  null,
  'authenticated não consegue criar/alterar feature_flags'
);

reset role;

-- ---------------------------------------------------------------------
-- service_role: bypassa RLS, lê e escreve tudo
-- ---------------------------------------------------------------------
set local role service_role;

select is(
  (select value from public.app_settings where key = 'free_budget_brl'),
  '150'::jsonb,
  'service_role lê app_settings normalmente (bypassrls)'
);

update public.feature_flags set enabled = true where key = 'test_kill_switch';
select is(
  (select enabled from public.feature_flags where key = 'test_kill_switch'),
  true,
  'service_role consegue ligar/desligar um kill switch'
);

reset role;

select * from finish();
rollback;
