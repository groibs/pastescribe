-- Persistência/conclusão/cancelamento do worker — Onda 4.2c-c.
begin;
select plan(43);

insert into auth.users (id, email)
values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

set local role service_role;

insert into public.budget_periods (envelope, period_start, period_end, cap_cents_brl)
values ('free_ai', '2026-08-01', '2026-08-31', 15000);

insert into public.media_assets (
  workspace_id, created_by, storage_key, status,
  declared_content_type, declared_size_bytes,
  actual_content_type, actual_size_bytes, validated_at, expires_at
) values (
  (select id from public.workspaces
    where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal),
  'a1111111-1111-1111-1111-111111111111',
  'uploads/personal/worker-cycle.mp4', 'validated',
  'video/mp4', 4096, 'video/mp4', 4096, now(), now() + interval '1 day'
);

-- ---------------------------------------------------------------------
-- Caminho feliz: persistência + captura + completed são uma transação.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'cycle-complete',
       (select id from public.media_assets where storage_key = 'uploads/personal/worker-cycle.mp4')
     ) $$,
  'job do ciclo completo é enfileirado'
);
select is(
  (select state from public.claim_next_job('worker-complete')),
  'acquiring_media',
  'worker reivindica o job'
);
select lives_ok(
  $$ select public.reserve_job_budget(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-complete'),
       'worker-complete', 120, 'free_ai', '2026-08-01', '2026-08-31',
       'user:alice', 5, 'budget-cycle-complete'
     ) $$,
  'worker reserva orçamento depois da duração real'
);
select throws_ok(
  $$ select public.persist_transcript_result(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-complete'),
       'worker-intruso', 'pt-br', 'ai', 'fake-transcriber-v1', 'Texto completo.',
       '[{"start_ms":0,"end_ms":1000,"text":"Texto completo."}]'::jsonb
     ) $$,
  'P0001', null,
  'worker sem lease não persiste resultado'
);
select throws_ok(
  $$ select public.persist_transcript_result(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-complete'),
       'worker-complete', 'pt-br', 'ai', 'fake-transcriber-v1', 'Texto completo.', '[]'::jsonb
     ) $$,
  '22023', null,
  'segments vazio é rejeitado'
);
select lives_ok(
  $$ select public.complete_transcription_job(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-complete'),
       'worker-complete', 'pt-br', 'ai', 'fake-transcriber-v1',
       'Primeiro bloco. Segundo bloco.',
       '[{"start_ms":0,"end_ms":1000,"text":"Primeiro bloco."},{"start_ms":1000,"end_ms":2000,"text":"Segundo bloco.","speaker_label":"Speaker 1"}]'::jsonb,
       120, 0, 6000, 0
     ) $$,
  'persistência, captura e conclusão funcionam atomicamente'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'cycle-complete'),
  'completed',
  'job termina completed'
);
select is(
  (select count(*)::int from public.transcripts t join public.transcription_jobs j on j.id = t.job_id
    where j.idempotency_key = 'cycle-complete'),
  1,
  'existe exatamente um transcript por job'
);
select is(
  (select count(*)::int from public.transcript_segments s join public.transcripts t on t.id = s.transcript_id
    join public.transcription_jobs j on j.id = t.job_id where j.idempotency_key = 'cycle-complete'),
  2,
  'todos os segmentos foram persistidos'
);
select is(
  (select string_agg(position::text, ',' order by position) from public.transcript_segments s
    join public.transcripts t on t.id = s.transcript_id
    join public.transcription_jobs j on j.id = t.job_id where j.idempotency_key = 'cycle-complete'),
  '0,1',
  'posição é derivada da ordem do array, não confiada ao cliente'
);
select is(
  (select br.status from public.budget_reservations br
    join public.transcription_jobs j on j.budget_reservation_id = br.id
    where j.idempotency_key = 'cycle-complete'),
  'captured',
  'reserva é capturada na mesma conclusão'
);
select is(
  (select count(*)::int from public.usage_ledger_entries ul
    join public.transcription_jobs j on j.budget_reservation_id = ul.budget_reservation_id
    where j.idempotency_key = 'cycle-complete'),
  1,
  'uso é registrado uma única vez'
);
select lives_ok(
  $$ select public.complete_transcription_job(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-complete'),
       'worker-complete', 'pt-br', 'ai', 'fake-transcriber-v1',
       'Conteúdo ignorado na repetição.',
       '[{"start_ms":0,"end_ms":500,"text":"Ignorado."}]'::jsonb,
       120, 0, 6000, 0
     ) $$,
  'retry da conclusão é idempotente'
);
select is(
  (select count(*)::int from public.transcripts t join public.transcription_jobs j on j.id = t.job_id
    where j.idempotency_key = 'cycle-complete'),
  1,
  'retry não duplica transcript'
);
select is(
  (select count(*)::int from public.transcript_segments s join public.transcripts t on t.id = s.transcript_id
    join public.transcription_jobs j on j.id = t.job_id where j.idempotency_key = 'cycle-complete'),
  2,
  'retry não substitui nem duplica segmentos'
);
select is(
  (select count(*)::int from public.usage_ledger_entries ul
    join public.transcription_jobs j on j.budget_reservation_id = ul.budget_reservation_id
    where j.idempotency_key = 'cycle-complete'),
  1,
  'retry não captura orçamento duas vezes'
);

-- ---------------------------------------------------------------------
-- Falha de validação reverte transcript, estado e orçamento.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'cycle-rollback',
       (select id from public.media_assets where storage_key = 'uploads/personal/worker-cycle.mp4')
     ) $$,
  'job de rollback é enfileirado'
);
select is((select state from public.claim_next_job('worker-rollback')), 'acquiring_media', 'job de rollback é reivindicado');
select lives_ok(
  $$ select public.reserve_job_budget(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-rollback'),
       'worker-rollback', 60, 'free_ai', '2026-08-01', '2026-08-31',
       'user:alice', 3, 'budget-cycle-rollback'
     ) $$,
  'job de rollback ganha reserva'
);
select throws_ok(
  $$ select public.complete_transcription_job(
       (select id from public.transcription_jobs where idempotency_key = 'cycle-rollback'),
       'worker-rollback', 'pt-br', 'ai', 'fake-transcriber-v1', 'Inválido.',
       '[{"start_ms":1000,"end_ms":100,"text":"Inválido."}]'::jsonb,
       60, 0, 3000, 0
     ) $$,
  '22023', null,
  'segmento com intervalo invertido derruba a transação'
);
select is(
  (select count(*)::int from public.transcripts t join public.transcription_jobs j on j.id = t.job_id
    where j.idempotency_key = 'cycle-rollback'),
  0,
  'nenhum transcript parcial permanece'
);
select is(
  (select state from public.transcription_jobs where idempotency_key = 'cycle-rollback'),
  'transcribing',
  'job continua transcribing depois do rollback'
);
select is(
  (select br.status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
    where j.idempotency_key = 'cycle-rollback'),
  'reserved',
  'reserva continua reserved depois do rollback'
);
select is(
  (select count(*)::int from public.usage_ledger_entries ul join public.transcription_jobs j
    on j.budget_reservation_id = ul.budget_reservation_id where j.idempotency_key = 'cycle-rollback'),
  0,
  'nenhum uso é capturado em conclusão inválida'
);

-- ---------------------------------------------------------------------
-- Cancelamento sem lease é imediato.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'cancel-queued',
       (select id from public.media_assets where storage_key = 'uploads/personal/worker-cycle.mp4')
     ) $$,
  'job queued para cancelamento é criado'
);
select lives_ok(
  $$ select public.request_job_cancel(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-queued'), 'usuário cancelou'
     ) $$,
  'cancelamento queued é processado imediatamente'
);
select is((select state from public.transcription_jobs where idempotency_key = 'cancel-queued'), 'cancelled', 'job queued termina cancelled');
select is(
  (select count(*)::int from public.job_steps js join public.transcription_jobs j on j.id = js.job_id
    where j.idempotency_key = 'cancel-queued' and js.to_state = 'cancelled' and js.actor = 'web'),
  1,
  'cancelamento imediato é auditado'
);

-- ---------------------------------------------------------------------
-- Cancelamento ativo: web solicita; worker confirma.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'cancel-active',
       (select id from public.media_assets where storage_key = 'uploads/personal/worker-cycle.mp4')
     ) $$,
  'job ativo para cancelamento é criado'
);
select is((select state from public.claim_next_job('worker-cancel')), 'acquiring_media', 'worker reivindica job a cancelar');
select lives_ok(
  $$ select public.request_job_cancel(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-active'), 'cancelamento durante aquisição'
     ) $$,
  'web solicita cancelamento sem roubar o lease'
);
select is((select state from public.transcription_jobs where idempotency_key = 'cancel-active'), 'cancel_requested', 'estado sinaliza cancelamento ao worker');
select is(
  (select state from public.heartbeat_job(
    (select id from public.transcription_jobs where idempotency_key = 'cancel-active'), 'worker-cancel')),
  'cancel_requested',
  'heartbeat devolve o sinal de cancelamento'
);
select throws_ok(
  $$ select public.cancel_job(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-active'), 'worker-intruso'
     ) $$,
  'P0001', null,
  'worker sem lease não finaliza cancelamento'
);
select lives_ok(
  $$ select public.cancel_job(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-active'), 'worker-cancel', 'processo interrompido'
     ) $$,
  'worker dono do lease finaliza cancelamento'
);
select is((select state from public.transcription_jobs where idempotency_key = 'cancel-active'), 'cancelled', 'job ativo termina cancelled');

-- ---------------------------------------------------------------------
-- Cancelamento depois da reserva devolve o orçamento integralmente.
-- ---------------------------------------------------------------------
select lives_ok(
  $$ select public.enqueue_job(
       (select id from public.workspaces where created_by = 'a1111111-1111-1111-1111-111111111111' and is_personal),
       'a1111111-1111-1111-1111-111111111111', 'upload', 'cancel-reserved',
       (select id from public.media_assets where storage_key = 'uploads/personal/worker-cycle.mp4')
     ) $$,
  'job com reserva para cancelamento é criado'
);
select is((select state from public.claim_next_job('worker-reserved')), 'acquiring_media', 'worker reivindica job reservado');
select lives_ok(
  $$ select public.reserve_job_budget(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-reserved'),
       'worker-reserved', 90, 'free_ai', '2026-08-01', '2026-08-31',
       'user:alice', 4, 'budget-cancel-reserved'
     ) $$,
  'reserva existe antes do cancelamento'
);
select lives_ok(
  $$ select public.request_job_cancel(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-reserved'), 'cancelar após reserva'
     ) $$,
  'cancelamento após reserva é solicitado'
);
select lives_ok(
  $$ select public.cancel_job(
       (select id from public.transcription_jobs where idempotency_key = 'cancel-reserved'), 'worker-reserved'
     ) $$,
  'worker finaliza cancelamento reservado'
);
select is((select state from public.transcription_jobs where idempotency_key = 'cancel-reserved'), 'cancelled', 'job reservado termina cancelled');
select is(
  (select br.status from public.budget_reservations br join public.transcription_jobs j on j.budget_reservation_id = br.id
    where j.idempotency_key = 'cancel-reserved'),
  'released',
  'cancelamento libera a reserva integralmente'
);

reset role;
select * from finish();
rollback;
