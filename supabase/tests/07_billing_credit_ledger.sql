-- ledger_append — créditos pagos (docs/DATABASE.md, pastescribe-ai-cost-governance).
begin;
select plan(12);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');
-- handle_new_user já criou o workspace pessoal de alice; pega o id dele.
insert into public.credit_accounts (workspace_id)
  select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111';

set local role service_role;

-- ---------------------------------------------------------------------
-- Compra: crédito positivo aumenta o saldo e grava o balance_after.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.ledger_append(
       (select id from public.credit_accounts limit 1),
       'purchase', 6000, 'purchase-1', 'purchase', null, '{}'::jsonb, null
     ) $$,
  'compra de 6000s (100min) de créditos é registrada'
);

select is(
  (select balance_seconds from public.credit_accounts limit 1),
  6000,
  'saldo reflete a compra'
);

-- ---------------------------------------------------------------------
-- Consumo (kind=capture — crédito pago gasto num job): reduz saldo;
-- balance_after bate com o esperado.
-- ---------------------------------------------------------------------
select public.ledger_append(
  (select id from public.credit_accounts limit 1),
  'capture', -120, 'capture-1', 'job', null, '{}'::jsonb, null
) is null;
select is(
  (select balance_seconds from public.credit_accounts limit 1),
  5880,
  'consumo de 120s reduz o saldo corretamente'
);

select is(
  (select balance_after_seconds from public.credit_ledger_entries where idempotency_key = 'capture-1'),
  5880,
  'lançamento grava o saldo resultante (auditoria sem depender só do cache)'
);

-- ---------------------------------------------------------------------
-- Idempotência: mesma idempotency_key não duplica o lançamento nem
-- move o saldo de novo (duplo clique / retry de rede).
-- ---------------------------------------------------------------------
select public.ledger_append(
  (select id from public.credit_accounts limit 1),
  'capture', -120, 'capture-1', 'job', null, '{}'::jsonb, null
) is null;
select is(
  (select balance_seconds from public.credit_accounts limit 1),
  5880,
  'reenviar a mesma idempotency_key não desconta de novo'
);
select is(
  (select count(*)::int from public.credit_ledger_entries where idempotency_key = 'capture-1'),
  1,
  'reenviar a mesma idempotency_key não cria um segundo lançamento'
);

-- ---------------------------------------------------------------------
-- Fail-closed: saldo insuficiente nunca deixa a conta negativa.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.ledger_append(
       (select id from public.credit_accounts limit 1),
       'capture', -999999, 'capture-overspend', 'job', null, '{}'::jsonb, null
     ) $$,
  'P0001',
  null,
  'consumo maior que o saldo é rejeitado (nunca fica negativo)'
);
select is(
  (select balance_seconds from public.credit_accounts limit 1),
  5880,
  'saldo permanece inalterado após a tentativa rejeitada'
);

-- ---------------------------------------------------------------------
-- Conta inexistente / valor zero — erros explícitos, não silêncio.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.ledger_append(
       '00000000-0000-0000-0000-000000000000'::uuid,
       'grant', 100, 'grant-nowhere', null, null, '{}'::jsonb, null
     ) $$,
  'P0001',
  null,
  'conta de crédito inexistente falha explicitamente'
);

select throws_ok(
  $$ select public.ledger_append(
       (select id from public.credit_accounts limit 1),
       'adjust', 0, 'adjust-zero', null, null, '{}'::jsonb, null
     ) $$,
  '22023',
  null,
  'amount_seconds = 0 é rejeitado (lançamento sem efeito não faz sentido)'
);

-- ---------------------------------------------------------------------
-- anon/authenticated não alcançam a função nem as tabelas — só
-- service_role (docs/DATABASE.md: default é service_role).
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ select * from public.credit_accounts $$,
  '42501',
  null,
  'authenticated não tem GRANT para ler credit_accounts'
);

select throws_ok(
  $$ select public.ledger_append(
       '00000000-0000-0000-0000-000000000000'::uuid, 'grant', 1, 'x', null, null, '{}'::jsonb, null
     ) $$,
  '42501',
  null,
  'authenticated não tem EXECUTE em ledger_append'
);

reset role;
select * from finish();
rollback;
