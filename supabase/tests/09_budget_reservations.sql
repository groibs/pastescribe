-- reserve_free_budget / capture_budget_reservation / release_budget_reservation
-- — cenários de custo e abuso do prompt-mestre §21.4.
begin;
select plan(21);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

set local role service_role;

insert into public.budget_periods (envelope, period_start, period_end, cap_cents_brl)
values ('free_ai', '2026-08-01', '2026-08-31', 15000);

-- ---------------------------------------------------------------------
-- Reserva dentro do teto.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.reserve_free_budget('free_ai', '2026-08-01', '2026-08-31', 'anon:hash1', 50, 'r-1') $$,
  'reserva de R$0,50 dentro do teto de R$150 passa'
);
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  50::bigint,
  'período reflete a reserva'
);

-- Duplo clique / retry: mesma idempotency_key não reserva de novo.
select public.reserve_free_budget('free_ai', '2026-08-01', '2026-08-31', 'anon:hash1', 50, 'r-1') is null;
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  50::bigint,
  'reenviar a mesma idempotency_key não reserva duas vezes'
);

-- ---------------------------------------------------------------------
-- Reserva maior que o saldo disponível (50 reservado + 20000 pedido > 15000 teto).
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.reserve_free_budget('free_ai', '2026-08-01', '2026-08-31', 'anon:hash2', 20000, 'r-toolarge') $$,
  'P0001',
  null,
  'reserva maior que o saldo disponível é rejeitada'
);
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  50::bigint,
  'tentativa rejeitada não altera o período'
);

-- ---------------------------------------------------------------------
-- Contador/orçamento indisponível (período não configurado) — nega o
-- free com erro explícito, nunca silenciosamente.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.reserve_free_budget('free_ai', '2099-01-01', '2099-01-31', 'anon:hash1', 10, 'r-noperiod') $$,
  'P0001',
  null,
  'orçamento indisponível (período não configurado) falha fechado'
);

-- ---------------------------------------------------------------------
-- Orçamento mensal encerrado.
-- ---------------------------------------------------------------------
insert into public.budget_periods (envelope, period_start, period_end, cap_cents_brl, status)
values ('ingestion', '2026-08-01', '2026-08-31', 15000, 'closed');

select throws_ok(
  $$ select public.reserve_free_budget('ingestion', '2026-08-01', '2026-08-31', 'anon:hash1', 10, 'r-closed') $$,
  'P0001',
  null,
  'orçamento encerrado (status=closed) rejeita nova reserva'
);

-- ---------------------------------------------------------------------
-- Reconciliação: captura consome o custo REAL, devolve o excedente da
-- estimativa automaticamente (reserved cai pelo estimado, não pelo capturado).
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.capture_budget_reservation(
       (select id from public.budget_reservations where idempotency_key = 'r-1'),
       30, 'gpt-4o-mini-transcribe', 100, 1000, 900, null
     ) $$,
  'captura da reserva com custo real (R$0,30 de R$0,50 estimado) funciona'
);
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  0::bigint,
  'reserved volta a zero (a reserva original de 50 foi liberada)'
);
select is(
  (select consumed_cents_brl from public.budget_periods where envelope = 'free_ai'),
  30::bigint,
  'consumed reflete o custo real (30), não o estimado (50) — excedente devolvido'
);
select is(
  (select status from public.budget_reservations where idempotency_key = 'r-1'),
  'captured',
  'reserva muda para captured'
);
select is(
  (select count(*)::int from public.usage_ledger_entries
     where budget_reservation_id = (select id from public.budget_reservations where idempotency_key = 'r-1')),
  1,
  'captura grava uma entrada em usage_ledger_entries'
);

-- Idempotência da captura: reprocessar o mesmo job (ex.: worker retry)
-- não desconta o orçamento de novo.
select public.capture_budget_reservation(
  (select id from public.budget_reservations where idempotency_key = 'r-1'),
  30, 'gpt-4o-mini-transcribe', 100, 1000, 900, null
) is null;
select is(
  (select consumed_cents_brl from public.budget_periods where envelope = 'free_ai'),
  30::bigint,
  'recapturar a mesma reserva não desconta o orçamento de novo'
);
select is(
  (select count(*)::int from public.usage_ledger_entries
     where budget_reservation_id = (select id from public.budget_reservations where idempotency_key = 'r-1')),
  1,
  'recapturar não duplica a entrada em usage_ledger_entries'
);

-- ---------------------------------------------------------------------
-- Refund de job falho: reserva liberada sem captura devolve o valor
-- integral ao período.
-- ---------------------------------------------------------------------
select public.reserve_free_budget('free_ai', '2026-08-01', '2026-08-31', 'anon:hash3', 40, 'r-2') is null;
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  40::bigint,
  'segunda reserva soma ao período'
);

select lives_ok(
  $$ select public.release_budget_reservation(
       (select id from public.budget_reservations where idempotency_key = 'r-2'), 'job_failed'
     ) $$,
  'liberar a reserva de um job que falhou funciona'
);
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  0::bigint,
  'reserved volta a zero após o refund — nada ficou preso'
);
select is(
  (select status from public.budget_reservations where idempotency_key = 'r-2'),
  'released',
  'reserva marcada como released'
);

-- Idempotência da liberação: chamar de novo não devolve duas vezes.
select public.release_budget_reservation(
  (select id from public.budget_reservations where idempotency_key = 'r-2'), 'job_failed'
) is null;
select is(
  (select reserved_cents_brl from public.budget_periods where envelope = 'free_ai'),
  0::bigint,
  'liberar de novo uma reserva já liberada não desconta nada extra (idempotente)'
);

-- Não é possível capturar uma reserva que já foi liberada.
select throws_ok(
  $$ select public.capture_budget_reservation(
       (select id from public.budget_reservations where idempotency_key = 'r-2'),
       10, 'gpt-4o-mini-transcribe', 50, 500, 500, null
     ) $$,
  'P0001',
  null,
  'não é possível capturar uma reserva que já foi liberada'
);

-- ---------------------------------------------------------------------
-- Free bloqueado (orçamento encerrado) não afeta paid: crédito pago
-- continua funcionando pelo caminho de ledger_append, independente do
-- estado de budget_periods.
-- ---------------------------------------------------------------------
insert into public.credit_accounts (workspace_id)
  select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111';
select public.ledger_append(
  (select id from public.credit_accounts limit 1), 'purchase', 100, 'paid-unaffected', null, null, '{}'::jsonb, null
) is null;
select is(
  (select balance_seconds from public.credit_accounts limit 1),
  100,
  'paid (crédito comprado) funciona mesmo com o envelope free_ai/ingestion sem saldo — caminhos são independentes'
);

reset role;
select * from finish();
rollback;
