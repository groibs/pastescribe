-- reserve_free_budget_and_enqueue / claim_next_job / heartbeat_job /
-- advance_job_step / complete_job / fail_job — fila de transcrição
-- (docs/DATABASE.md, docs/ARCHITECTURE.md §Fila durável).
begin;
select plan(37);

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
-- Enfileirar rejeita asset não validado / de outro workspace.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.reserve_free_budget_and_enqueue(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-pending'),
       'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'enqueue-pending'
     ) $$,
  'P0001',
  null,
  'enfileirar um media_asset ainda não validado é rejeitado'
);

select throws_ok(
  $$ select public.reserve_free_budget_and_enqueue(
       (select id from public.workspaces where name = 'Outro workspace'),
       'a1111111-1111-1111-1111-111111111111',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'),
       'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'enqueue-wrong-workspace'
     ) $$,
  'P0001',
  null,
  'enfileirar um media_asset que pertence a outro workspace é rejeitado'
);

-- ---------------------------------------------------------------------
-- Orçamento insuficiente: nada é criado (fail-closed, mesma transação).
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.reserve_free_budget_and_enqueue(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'),
       'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 20000, 'enqueue-too-expensive'
     ) $$,
  'P0001',
  null,
  'orçamento insuficiente rejeita o enfileiramento'
);
select is(
  (select count(*)::int from public.transcription_jobs where idempotency_key = 'enqueue-too-expensive'),
  0,
  'tentativa rejeitada por orçamento não deixou job nenhum pra trás'
);

-- ---------------------------------------------------------------------
-- Enfileirar de verdade: cria job 'queued' + budget_reservation +
-- job_steps inicial.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.reserve_free_budget_and_enqueue(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'),
       'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'job-low', 0::smallint
     ) $$,
  'enfileirar com orçamento e asset válidos funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-low'),
  'queued',
  'job nasce em queued'
);
select is(
  (select count(*)::int from public.job_steps js join public.transcription_jobs j on j.id = js.job_id
     where j.idempotency_key = 'job-low' and js.from_state is null and js.to_state = 'queued' and js.actor = 'web'),
  1,
  'job_steps registra a criação (web, null→queued)'
);

-- Duplo clique / retry do cliente: mesma idempotency_key não cria outro job.
select public.reserve_free_budget_and_enqueue(
  (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
  'a1111111-1111-1111-1111-111111111111',
  (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'),
  'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'job-low'
) is null;
select is(
  (select count(*)::int from public.transcription_jobs where idempotency_key = 'job-low'),
  1,
  'reenviar a mesma idempotency_key não cria um segundo job'
);

-- Segundo job, prioridade mais alta — deve ser reivindicado primeiro.
select lives_ok(
  $$ select public.reserve_free_budget_and_enqueue(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal = true),
       'a1111111-1111-1111-1111-111111111111',
       (select id from public.media_assets where storage_key = 'uploads/personal/asset-1'),
       'free_ai', '2026-08-01', '2026-08-31', 'user:alice', 50, 'job-high', 10::smallint
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

-- Reivindicar de novo pega o outro job (o de prioridade alta já não está mais 'queued').
select is(
  (select idempotency_key from public.transcription_jobs where id = (select public.claim_next_job('worker-2')).id),
  'job-low',
  'segundo claim pega o job restante (job-high já foi reivindicado)'
);

-- Fila vazia de novo: nenhum job 'queued' sobrou.
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
-- advance_job_step — transição intermediária dentro do pipeline.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ select public.advance_job_step(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-intruso', 'extracting_audio'
     ) $$,
  'P0001',
  null,
  'advance_job_step por um worker que não é dono do lease é rejeitado'
);
select lives_ok(
  $$ select public.advance_job_step(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-1', 'extracting_audio', 'ffprobe ok'
     ) $$,
  'advance_job_step pelo dono do lease funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-high'),
  'extracting_audio',
  'estado avançou para extracting_audio'
);
select is(
  (select count(*)::int from public.job_steps js join public.transcription_jobs j on j.id = js.job_id
     where j.idempotency_key = 'job-high' and js.from_state = 'acquiring_media' and js.to_state = 'extracting_audio'),
  1,
  'job_steps registra a transição intermediária'
);

-- ---------------------------------------------------------------------
-- complete_job — captura o orçamento e grava usage_ledger_entries.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.complete_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-high'),
       'worker-1', 'fake-provider', 30, 20, 500, 400
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
  'worker-1', 'fake-provider', 30, 20, 500, 400
) is null;
select is(
  (select count(*)::int from public.usage_ledger_entries ul join public.transcription_jobs j on j.budget_reservation_id = ul.budget_reservation_id
     where j.idempotency_key = 'job-high'),
  1,
  'recompletar um job já completed não duplica usage_ledger_entries'
);

-- heartbeat/advance num job terminal são rejeitados.
select throws_ok(
  $$ select public.heartbeat_job((select id from public.transcription_jobs where idempotency_key = 'job-high'), 'worker-1') $$,
  'P0001',
  null,
  'heartbeat num job já completed é rejeitado'
);

-- ---------------------------------------------------------------------
-- fail_job — retry com backoff até esgotar tentativas, depois
-- dead-letter + libera a reserva de orçamento.
-- ---------------------------------------------------------------------
select is(
  (select max_retries from public.transcription_jobs where idempotency_key = 'job-low'),
  3,
  'job-low nasceu com max_retries padrão (3)'
);

select lives_ok(
  $$ select public.fail_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-low'), 'worker-2', 'ffmpeg_crash', 'exit code 1'
     ) $$,
  'primeira falha de job-low (ainda com tentativas sobrando) funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-low'),
  'queued',
  'primeira falha volta o job pra queued (retry)'
);
select is(
  (select status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
     where j.idempotency_key = 'job-low'),
  'reserved',
  'reserva de orçamento continua reservada — ainda não esgotou as tentativas'
);

-- Reivindica e falha de novo, até esgotar (max_retries=3 → 3ª falha é definitiva).
-- O backoff da 1ª falha empurra next_attempt_at pro futuro (produção
-- de verdade) — o teste simula o tempo passar adiantando a coluna
-- direto, já que pgTAP não tem como esperar de verdade.
update public.transcription_jobs set next_attempt_at = now() where idempotency_key = 'job-low';
select public.claim_next_job('worker-2', '{}', 1) is null;
select public.fail_job((select id from public.transcription_jobs where idempotency_key = 'job-low'), 'worker-2', 'ffmpeg_crash') is null;
update public.transcription_jobs set next_attempt_at = now() where idempotency_key = 'job-low';
select public.claim_next_job('worker-2', '{}', 1) is null;

select lives_ok(
  $$ select public.fail_job(
       (select id from public.transcription_jobs where idempotency_key = 'job-low'), 'worker-2', 'ffmpeg_crash', 'terceira e última'
     ) $$,
  'terceira falha (tentativas esgotadas) funciona'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-low'),
  'failed',
  'job termina em failed depois de esgotar as tentativas'
);
select is(
  (select dead_letter from public.transcription_jobs where idempotency_key = 'job-low'),
  true,
  'job marcado como dead_letter'
);
select is(
  (select status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
     where j.idempotency_key = 'job-low'),
  'released',
  'reserva de orçamento foi liberada — refund integral, ninguém paga por job que nunca terminou'
);

-- Idempotência: falhar de novo um job já failed não lança erro nem re-libera.
select public.fail_job(
  (select id from public.transcription_jobs where idempotency_key = 'job-low'), 'worker-2', 'ffmpeg_crash'
) is null;
select is(
  (select state from public.transcription_jobs where idempotency_key = 'job-low'),
  'failed',
  'falhar de novo um job já failed é idempotente (continua failed)'
);

reset role;
select * from finish();
rollback;
