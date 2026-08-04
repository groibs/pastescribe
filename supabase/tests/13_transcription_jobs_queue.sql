-- enqueue_job / claim_next_job / heartbeat_job / advance_job_step /
-- reserve_job_budget / complete_job / fail_job — fila de transcrição
-- (docs/DATABASE.md, docs/ARCHITECTURE.md §Fila durável).
--
-- Desenho revisado (docs/DECISIONS.md): criar o job (enqueue_job) não
-- envolve orçamento nenhum — só depois que a duração REAL é conhecida
-- (o worker chamando reserve_job_budget) é que o free é checado.
begin;
select plan(52);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

set local role service_role;

insert into public.budget_periods (envelope, period_start, period_end, cap_cents_brl)
values ('free_ai', '2026-08-01', '2026-08-31', 15000);

insert into public.workspaces (name, created_by, is_personal)
values ('Outro workspace', 'a1111111-1111-1111-1111-111111111111', false);

insert into public.media_assets (
  workspace_id, created_by, storage_key, status, declared_content_type, declared_size_bytes,
  actual_content_type, actual_size_bytes, validated_at, expires_at
) values (
  (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
  'a1111111-1111-1111-1111-111111111111', 'uploads/personal/asset-1', 'validated',
  'audio/mpeg', 1048576, 'audio/mpeg', 1048576, now(), now() + interval '1 day'
);

insert into public.media_assets (
  workspace_id, created_by, storage_key, status, declared_content_type, declared_size_bytes, expires_at
) values (
  (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
  'a1111111-1111-1111-1111-111111111111', 'uploads/personal/asset-pending', 'pending_upload',
  'audio/mpeg', 2048, now() + interval '1 day'
);

-- ---------------------------------------------------------------------
-- Fila vazia: claim não encontra nada, sem erro.
-- ---------------------------------------------------------------------
select is(
  (select public.claim_next_job('worker-1')),
  null,
  'claim_next_job com a fila vazia devolve null, sem lançar erro'
);

-- ---------------------------------------------------------------------
-- enqueue_job rejeita asset não validado / de outro workspace / combinação inválida.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'enqueue-pending',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-pending')
     ) $$,
  'P0001',
  null,
  'enfileirar um media_asset ainda não validado é rejeitado'
);

select throws_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where name = 'Outro workspace'),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'enqueue-wrong-workspace',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1')
     ) $$,
  'P0001',
  null,
  'enfileirar um media_asset que pertence a outro workspace é rejeitado'
);

select throws_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'enqueue-bad-combo',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'), 'https://example.com/v'
     ) $$,
  '22023',
  null,
  'upload com source_url também preenchido é rejeitado'
);

select throws_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111', 'carrier_pigeon', 'enqueue-bad-kind'
     ) $$,
  '22023',
  null,
  'source_kind desconhecido é rejeitado'
);

-- ---------------------------------------------------------------------
-- Enfileirar de verdade: cria job 'queued', sem orçamento nenhum ainda.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'job-low',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'), null, 0::smallint
     ) $$,
  'enfileirar com asset válido funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-low'),
  'queued',
  'job nasce em queued'
);
select is(
  (select budget_reservation_id from public.transcription_jobs where idempotency_key = 'job-low'),
  null,
  'job nasce sem nenhuma reserva de orçamento — isso só acontece depois que a duração real for conhecida'
);
select is(
  (select count(*)::int from public.job_steps js join public.transcription_jobs j on j.id = js.job_id
     where j.idempotency_key = 'job-low' and js.from_state is null and js.to_state = 'queued' and js.actor = 'web'),
  1,
  'job_steps registra a criação (web, null→queued)'
);

-- Duplo clique / retry do cliente: mesma idempotency_key não cria outro job.
select public.enqueue_job(
  (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
  'a1111111-1111-1111-1111-111111111111', 'upload', 'job-low',
  (select id from public.media_assets where storage_key = 'uploads/personal/asset-1')
) is null;
select is(
  (select count(*)::int from public.transcription_jobs where idempotency_key = 'job-low'),
  1,
  'reenviar a mesma idempotency_key não cria um segundo job'
);

select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'job-high',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'), null, 10::smallint
     ) $$,
  'segundo enfileiramento (prioridade alta) funciona'
);

-- ---------------------------------------------------------------------
-- claim_next_job respeita prioridade (job-high antes de job-low).
-- ---------------------------------------------------------------------
select is(
  (select idempotency_key from public.transcription_jobs where id = (select public.claim_next_job('worker-1')).id),
  'job-high',
  'claim_next_job reivindica o job de prioridade mais alta primeiro'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-high'),
  'acquiring_media',
  'claim avança o estado de queued para acquiring_media (fonte é upload)'
);
select ok(
  (select lease_owner = 'worker-1' and lease_expires_at is not null and heartbeat_at is not null
     from public.transcription_jobs where idempotency_key = 'job-high'),
  'claim registra lease_owner/lease_expires_at/heartbeat_at'
);
select is(
  (select count(*)::int from public.job_steps js join public.transcription_jobs j on j.id = js.job_id
     where j.idempotency_key = 'job-high' and js.from_state = 'queued' and js.to_state = 'acquiring_media' and js.actor = 'worker'),
  1,
  'job_steps registra a transição de claim (worker, queued→acquiring_media)'
);

select is(
  (select idempotency_key from public.transcription_jobs where id = (select public.claim_next_job('worker-2')).id),
  'job-low',
  'segundo claim pega o job restante (job-high já foi reivindicado)'
);

select is(
  (select public.claim_next_job('worker-3')),
  null,
  'depois dos dois claims, a fila não tem mais nada pra reivindicar'
);

-- ---------------------------------------------------------------------
-- heartbeat_job — só o dono do lease renova.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.heartbeat_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-intruso'
     ) $$,
  'P0001',
  null,
  'heartbeat de um worker que não é dono do lease é rejeitado'
);
select lives_ok(
  $$ select public.heartbeat_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-1', 600
     ) $$,
  'heartbeat do dono do lease renova normalmente'
);

-- ---------------------------------------------------------------------
-- reserve_job_budget — job-high cabe no free: reserva e segue pra
-- transcribing. Duração só é conhecida agora (nunca antes).
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.reserve_job_budget(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'),
       'worker-intruso', 120, 'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'budget-job-high'
     ) $$,
  'P0001',
  null,
  'reserve_job_budget por um worker que não é dono do lease é rejeitado'
);

select lives_ok(
  $$ select public.reserve_job_budget(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'),
       'worker-1', 120, 'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'budget-job-high'
     ) $$,
  'reserve_job_budget cabendo no free funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-high'),
  'transcribing',
  'job avança direto pra transcribing quando o orçamento cabe'
);
select is(
  (select duration_seconds from public.transcription_jobs where idempotency_key = 'job-high'),
  120,
  'duration_seconds grava a duração real recebida do worker'
);
select isnt(
  (select budget_reservation_id from public.transcription_jobs where idempotency_key = 'job-high'),
  null,
  'job-high ganhou uma reserva de orçamento de verdade'
);

-- Idempotência: chamar de novo (já em transcribing) não refaz nada.
select public.reserve_job_budget(
  (select id from public.transcription_jobs where idempotency_key = 'job-high'),
  'worker-1', 999, 'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'budget-job-high'
) is null;
select is(
  (select duration_seconds from public.transcription_jobs where idempotency_key = 'job-high'),
  120,
  'chamar reserve_job_budget de novo num job já transcribing é idempotente (não sobrescreve com 999)'
);

-- ---------------------------------------------------------------------
-- reserve_job_budget — job-low excede o teto do free: vai pra
-- awaiting_user_confirmation, sem cobrar ninguém (checkout pago não
-- existe ainda), solta o lease.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.reserve_job_budget(
       (select id from public.transcription_jobs where idempotency_key = 'job-low'),
       'worker-2', 36000, 'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 20000, 'budget-job-low'
     ) $$,
  'reserve_job_budget excedendo o free não lança erro pro chamador — resolve pro estado de confirmação'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-low'),
  'awaiting_user_confirmation',
  'job-low vai pra awaiting_user_confirmation por exceder o teto do free'
);
select is(
  (select error_code from public.transcription_jobs where idempotency_key = 'job-low'),
  'exceeds_free_tier',
  'error_code explica o motivo'
);
select is(
  (select lease_owner from public.transcription_jobs where idempotency_key = 'job-low'),
  null,
  'lease é solto — o worker não tem mais o que fazer aqui até existir fluxo pago'
);
select is(
  (select duration_seconds from public.transcription_jobs where idempotency_key = 'job-low'),
  36000,
  'duration_seconds é gravada mesmo quando excede o free — a informação não se perde'
);
select is(
  (select count(*)::int from public.budget_reservations where idempotency_key = 'budget-job-low'),
  0,
  'nenhuma reserva de orçamento foi criada pro job que excedeu o teto'
);

-- ---------------------------------------------------------------------
-- advance_job_step — transição intermediária dentro do pipeline
-- (job-high já está em transcribing, com lease do worker-1).
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.advance_job_step(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-intruso', 'postprocessing'
     ) $$,
  'P0001',
  null,
  'advance_job_step por um worker que não é dono do lease é rejeitado'
);
select lives_ok(
  $$ select public.advance_job_step(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-1', 'postprocessing', 'transcrição ok'
     ) $$,
  'advance_job_step pelo dono do lease funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-high'),
  'postprocessing',
  'estado avançou para postprocessing'
);
select is(
  (select count(*)::int from public.job_steps js join public.transcription_jobs j on j.id = js.job_id
     where j.idempotency_key = 'job-high' and js.from_state = 'transcribing' and js.to_state = 'postprocessing'),
  1,
  'job_steps registra a transição intermediária'
);

-- ---------------------------------------------------------------------
-- complete_job — captura o orçamento e grava usage_ledger_entries.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.complete_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'),
       'worker-1', 'fake-provider', 120, 20, 500, 400
     ) $$,
  'complete_job funciona pro dono do lease'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-high'),
  'completed',
  'job termina em completed'
);
select is(
  (select status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
     where j.idempotency_key = 'job-high'),
  'captured',
  'complete_job capturou a reserva de orçamento'
);
select is(
  (select count(*)::int from public.usage_ledger_entries ul join public.transcription_jobs j on j.budget_reservation_id = ul.budget_reservation_id
     where j.idempotency_key = 'job-high'),
  1,
  'complete_job grava exatamente uma entrada em usage_ledger_entries'
);

-- Idempotência: recompletar não recaptura nem duplica a entrada de uso.
select public.complete_job(
  (select id from public.transcription_jobs where idempotency_key = 'job-high'),
  'worker-1', 'fake-provider', 120, 20, 500, 400
) is null;
select is(
  (select count(*)::int from public.usage_ledger_entries ul join public.transcription_jobs j on j.budget_reservation_id = ul.budget_reservation_id
     where j.idempotency_key = 'job-high'),
  1,
  'recompletar um job já completed não duplica usage_ledger_entries'
);

select throws_ok(
  $$ select public.heartbeat_job((select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-1') $$,
  'P0001',
  null,
  'heartbeat num job já completed é rejeitado'
);

-- ---------------------------------------------------------------------
-- fail_job — job que JÁ tinha orçamento reservado, falha até esgotar
-- as tentativas: dead_letter + refund integral da reserva.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'job-retry',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1')
     ) $$,
  'terceiro enfileiramento (pra testar retry/dead-letter) funciona'
);
select public.claim_next_job('worker-3') is null;
select public.reserve_job_budget(
  (select id from public.transcription_jobs where idempotency_key = 'job-retry'),
  'worker-3', 60, 'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 20, 'budget-job-retry'
) is null;
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-retry'),
  'transcribing',
  'job-retry também conseguiu reservar orçamento antes de começar a falhar'
);

select is(
  (select max_retries from public.transcription_jobs where idempotency_key = 'job-retry'),
  3,
  'job-retry nasceu com max_retries padrão (3)'
);

select lives_ok(
  $$ select public.fail_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-retry'), 'worker-3', 'openai_timeout', 'timeout na chamada'
     ) $$,
  'primeira falha de job-retry (ainda com tentativas sobrando) funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-retry'),
  'queued',
  'primeira falha volta o job pra queued (retry)'
);
select is(
  (select status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
     where j.idempotency_key = 'job-retry'),
  'reserved',
  'reserva de orçamento continua reservada — ainda não esgotou as tentativas'
);

-- Simula o tempo passar (o backoff real empurra next_attempt_at pro
-- futuro — pgTAP não espera de verdade) e esgota as tentativas.
update public.transcription_jobs set next_attempt_at = now() where idempotency_key = 'job-retry';
select public.claim_next_job('worker-3', '{}', 1) is null;
select public.fail_job((select id from public.transcription_jobs where idempotency_key = 'job-retry'), 'worker-3', 'openai_timeout') is null;
update public.transcription_jobs set next_attempt_at = now() where idempotency_key = 'job-retry';
select public.claim_next_job('worker-3', '{}', 1) is null;

select lives_ok(
  $$ select public.fail_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-retry'), 'worker-3', 'openai_timeout', 'terceira e última'
     ) $$,
  'terceira falha (tentativas esgotadas) funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-retry'),
  'failed',
  'job termina em failed depois de esgotar as tentativas'
);
select is(
  (select dead_letter from public.transcription_jobs where idempotency_key = 'job-retry'),
  true,
  'job marcado como dead_letter'
);
select is(
  (select status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
     where j.idempotency_key = 'job-retry'),
  'released',
  'reserva de orçamento foi liberada — refund integral, ninguém paga por job que nunca terminou'
);

-- Idempotência: falhar de novo um job já failed não lança erro nem re-libera.
select public.fail_job(
  (select id from public.transcription_jobs where idempotency_key = 'job-retry'), 'worker-3', 'openai_timeout'
) is null;
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-retry'),
  'failed',
  'falhar de novo um job já failed é idempotente (continua failed)'
);

reset role;
select * from finish();
rollback;
