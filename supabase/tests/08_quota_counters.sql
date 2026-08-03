-- consume_quota — contador durável por bucket+janela (docs/DATABASE.md,
-- pastescribe-ai-cost-governance §2 passo 3).
begin;
select plan(9);

set local role service_role;

-- ---------------------------------------------------------------------
-- Consumo dentro do limite.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.consume_quota('anon:hash1', '2026-08-03', 20, 45, 'q-1') $$,
  'primeiro consumo (20s de 45s) passa'
);

select is(
  (select consumed_units from public.quota_counters where bucket = 'anon:hash1' and window_key = '2026-08-03'),
  20,
  'contador reflete o consumo'
);

-- ---------------------------------------------------------------------
-- Idempotência: duplo clique/retry com a mesma chave não soma de novo
-- (a mesma chamada exata repetida não pode custar duas vezes).
-- ---------------------------------------------------------------------
select public.consume_quota('anon:hash1', '2026-08-03', 20, 45, 'q-1') is null;
select is(
  (select consumed_units from public.quota_counters where bucket = 'anon:hash1' and window_key = '2026-08-03'),
  20,
  'reenviar a mesma idempotency_key não soma de novo'
);

-- ---------------------------------------------------------------------
-- Segunda chamada real (chave nova) que ainda cabe no limite.
-- ---------------------------------------------------------------------
select public.consume_quota('anon:hash1', '2026-08-03', 20, 45, 'q-2') is null;
select is(
  (select consumed_units from public.quota_counters where bucket = 'anon:hash1' and window_key = '2026-08-03'),
  40,
  'segunda chamada real soma ao contador (20 + 20 = 40)'
);

-- ---------------------------------------------------------------------
-- Fail-closed: estourar o limite (40 + 20 > 45) é rejeitado — e o
-- contador NÃO se move (mesma verificação que protege contra duas
-- instâncias concorrentes: quem trava a linha primeiro decide).
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.consume_quota('anon:hash1', '2026-08-03', 20, 45, 'q-3') $$,
  'P0001',
  null,
  'consumo que estoura o limite (40+20 > 45) é rejeitado'
);
select is(
  (select consumed_units from public.quota_counters where bucket = 'anon:hash1' and window_key = '2026-08-03'),
  40,
  'contador permanece em 40 após a tentativa rejeitada — nada vazou'
);

-- ---------------------------------------------------------------------
-- Janela diferente = contador independente (bucket igual, window
-- diferente não compartilha consumo).
-- ---------------------------------------------------------------------
select public.consume_quota('anon:hash1', '2026-08-04', 10, 45, 'q-4') is null;
select is(
  (select consumed_units from public.quota_counters where bucket = 'anon:hash1' and window_key = '2026-08-04'),
  10,
  'janela nova começa do zero, independente da janela anterior'
);

-- ---------------------------------------------------------------------
-- Identidade "verificada" com janela 'lifetime' (degustação única, não
-- renovável — docs/AI_COST_MODEL.md §4).
-- ---------------------------------------------------------------------
select public.consume_quota('user:a1111111-1111-1111-1111-111111111111', 'lifetime', 180, 180, 'q-5') is null;
select throws_ok(
  $$ select public.consume_quota('user:a1111111-1111-1111-1111-111111111111', 'lifetime', 1, 180, 'q-6') $$,
  'P0001',
  null,
  'degustação única esgotada nunca renova sozinha (janela lifetime)'
);

-- ---------------------------------------------------------------------
-- authenticated não alcança a função nem quota_counters diretamente.
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ select public.consume_quota('anon:hash1', '2026-08-03', 1, 45, 'q-hack') $$,
  '42501',
  null,
  'authenticated não tem EXECUTE em consume_quota'
);

reset role;
select * from finish();
rollback;
