-- RLS das tabelas de billing/ledger/orçamento/quota — todas
-- service_role-only (docs/DATABASE.md regra 4). Nenhuma tem policy;
-- o teste é que anon/authenticated não alcançam nenhuma delas, e
-- service_role (BYPASSRLS) alcança normalmente.
begin;
select plan(13);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

-- ---------------------------------------------------------------------
-- anon: nenhuma tabela nova é alcançável.
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok($$ select * from public.plans $$, '42501', null, 'anon não lê plans');
select throws_ok($$ select * from public.prices $$, '42501', null, 'anon não lê prices');
select throws_ok($$ select * from public.credit_accounts $$, '42501', null, 'anon não lê credit_accounts');
select throws_ok($$ select * from public.credit_ledger_entries $$, '42501', null, 'anon não lê credit_ledger_entries');
select throws_ok($$ select * from public.usage_ledger_entries $$, '42501', null, 'anon não lê usage_ledger_entries');
select throws_ok($$ select * from public.budget_periods $$, '42501', null, 'anon não lê budget_periods');

reset role;

-- ---------------------------------------------------------------------
-- authenticated: mesma regra — nenhum grant.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$ select * from public.budget_reservations $$, '42501', null, 'authenticated não lê budget_reservations');
select throws_ok($$ select * from public.free_tier_configs $$, '42501', null, 'authenticated não lê free_tier_configs (nem a política, só via server)');
select throws_ok($$ select * from public.quota_counters $$, '42501', null, 'authenticated não lê quota_counters');
select throws_ok($$ select * from public.quota_consumption_entries $$, '42501', null, 'authenticated não lê quota_consumption_entries');

reset role;

-- ---------------------------------------------------------------------
-- service_role: bypassa RLS, lê tudo (inclusive o seed da migration).
-- ---------------------------------------------------------------------
set local role service_role;

select is(
  (select count(*)::int from public.plans),
  3,
  'service_role lê os 3 planos seed (free/creator/pro)'
);
select is(
  (select is_purchasable from public.plans where id = 'creator'),
  false,
  'plano creator nasce não-comprável (draft até aprovação)'
);
select is(
  (select count(*)::int from public.free_tier_configs where is_active),
  3,
  'service_role lê os 3 perfis de free tier seed'
);

reset role;
select * from finish();
rollback;
