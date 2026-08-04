-- PasteScribe — funções atômicas da fila de transcrição.
-- docs/DATABASE.md §Funções SQL atômicas, docs/ARCHITECTURE.md §Fila
-- durável no PostgreSQL / §Reserva de orçamento antes de qualquer job
-- gratuito.
--
-- Mesmas garantias das funções de 0005_billing_ledger_budget_functions:
-- SECURITY DEFINER, search_path fixo, idempotentes onde faz sentido,
-- travam a linha relevante com FOR UPDATE, falham fechado. Executáveis
-- só por service_role — web chama via admin client (service_role),
-- worker também usa service_role (nunca chave anon/authenticated).

-- ---------------------------------------------------------------------
-- reserve_free_budget_and_enqueue — reserve_free_budget + criação do
-- job na mesma transação (docs/ARCHITECTURE.md, sequência de 5 passos:
-- estimar, validar orçamento, validar quota — feito pela camada
-- chamadora via consume_quota antes de chegar aqui, política de
-- bucket/janela ainda não decidida —, reservar, enfileirar). Falhou
-- reserve_free_budget → nada é criado (fail-closed, mesma transação).
-- Idempotente por idempotency_key (mesmo valor usado na reserva e no
-- job — 1:1 entre eles, sem risco de colisão entre tabelas).
-- ---------------------------------------------------------------------
create or replace function public.reserve_free_budget_and_enqueue(
  p_workspace_id uuid,
  p_created_by uuid,
  p_media_asset_id uuid,
  p_envelope text,
  p_period_start date,
  p_period_end date,
  p_identity_key text,
  p_estimated_cost_cents_brl bigint,
  p_idempotency_key text,
  p_priority smallint default 0,
  p_max_retries integer default 3,
  p_budget_expires_in_seconds integer default 900
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.transcription_jobs;
  v_asset public.media_assets;
  v_reservation public.budget_reservations;
  v_job public.transcription_jobs;
begin
  select * into v_existing from transcription_jobs where idempotency_key = p_idempotency_key;
  if found then
    return v_existing;
  end if;

  select * into v_asset from media_assets where id = p_media_asset_id and workspace_id = p_workspace_id for update;
  if not found then
    raise exception 'media_asset % não encontrado no workspace %', p_media_asset_id, p_workspace_id
      using errcode = 'P0001';
  end if;
  if v_asset.status <> 'validated' then
    raise exception 'media_asset % não está validado (está "%")', p_media_asset_id, v_asset.status
      using errcode = 'P0001';
  end if;

  v_reservation := public.reserve_free_budget(
    p_envelope, p_period_start, p_period_end, p_identity_key,
    p_estimated_cost_cents_brl, p_idempotency_key, p_budget_expires_in_seconds
  );

  insert into transcription_jobs (
    workspace_id, created_by, source_kind, media_asset_id, state,
    priority, idempotency_key, budget_reservation_id, next_attempt_at, max_retries
  ) values (
    p_workspace_id, p_created_by, 'upload', p_media_asset_id, 'queued',
    p_priority, p_idempotency_key, v_reservation.id, now(), p_max_retries
  ) returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor)
    values (v_job.id, null, 'queued', 'web');

  return v_job;
end;
$$;

revoke all on function public.reserve_free_budget_and_enqueue(uuid, uuid, uuid, text, date, date, text, bigint, text, smallint, integer, integer) from public;
grant execute on function public.reserve_free_budget_and_enqueue(uuid, uuid, uuid, text, date, date, text, bigint, text, smallint, integer, integer) to service_role;

-- ---------------------------------------------------------------------
-- claim_next_job — FOR UPDATE SKIP LOCKED sobre a fila de "queued" já
-- no horário, ordenada por prioridade e chegada. `p_capabilities` é
-- aceito para casar com a assinatura já documentada em
-- docs/DATABASE.md, mas ainda não filtra nada — só existe um tipo de
-- worker hoje, sem capacidades diferenciadas pra rotear.
-- ---------------------------------------------------------------------
create or replace function public.claim_next_job(
  p_worker_id text,
  p_capabilities text[] default '{}',
  p_lease_seconds integer default 300
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_job public.transcription_jobs;
  v_next_state text;
begin
  select id into v_job_id
    from transcription_jobs
    where state = 'queued' and dead_letter = false and next_attempt_at <= now()
    order by priority desc, next_attempt_at asc, created_at asc
    for update skip locked
    limit 1;

  if v_job_id is null then
    return null;
  end if;

  select * into v_job from transcription_jobs where id = v_job_id;

  -- Só 'upload' existe hoje (ver comentário de escopo em 0008); quando
  -- source_kind='url' existir, esta função ganha o outro ramo.
  v_next_state := 'acquiring_media';

  update transcription_jobs
    set state = v_next_state,
        lease_owner = p_worker_id,
        lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        heartbeat_at = now(),
        updated_at = now()
    where id = v_job_id
    returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor, detail)
    values (v_job_id, 'queued', v_next_state, 'worker', 'claimed by ' || p_worker_id);

  return v_job;
end;
$$;

revoke all on function public.claim_next_job(text, text[], integer) from public;
grant execute on function public.claim_next_job(text, text[], integer) to service_role;

-- ---------------------------------------------------------------------
-- heartbeat_job — renova o lease. Só o worker dono do lease pode
-- renovar (fail-closed se outro worker tentar, ou se o job já
-- terminou).
-- ---------------------------------------------------------------------
create or replace function public.heartbeat_job(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
begin
  select * into v_job from transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % não encontrado', p_job_id using errcode = 'P0001';
  end if;

  if v_job.state in ('completed', 'failed', 'cancelled', 'expired') then
    raise exception 'job % já está em estado terminal ("%")', p_job_id, v_job.state using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id using errcode = 'P0001';
  end if;

  update transcription_jobs
    set lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        heartbeat_at = now(),
        updated_at = now()
    where id = p_job_id
    returning * into v_job;

  return v_job;
end;
$$;

revoke all on function public.heartbeat_job(uuid, text, integer) from public;
grant execute on function public.heartbeat_job(uuid, text, integer) to service_role;

-- ---------------------------------------------------------------------
-- advance_job_step — transição intermediária dentro do pipeline (ex.:
-- acquiring_media→extracting_audio→...→indexing). Sem contenção real
-- (só o worker dono do lease chama isso), então não precisa de
-- FOR UPDATE SKIP LOCKED — precisa é confirmar que quem está chamando
-- ainda é o dono do lease. Validação completa do grafo de transições
-- (packages/contracts) é responsabilidade do worker antes de chamar;
-- aqui só garante lease válido + estado não-terminal + enum válido
-- (via check constraint da coluna).
-- ---------------------------------------------------------------------
create or replace function public.advance_job_step(
  p_job_id uuid,
  p_worker_id text,
  p_to_state text,
  p_detail text default null
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
  v_from_state text;
begin
  select * into v_job from transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % não encontrado', p_job_id using errcode = 'P0001';
  end if;

  if v_job.state in ('completed', 'failed', 'cancelled', 'expired') then
    raise exception 'job % já está em estado terminal ("%")', p_job_id, v_job.state using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id using errcode = 'P0001';
  end if;

  v_from_state := v_job.state;

  update transcription_jobs
    set state = p_to_state, heartbeat_at = now(), updated_at = now()
    where id = p_job_id
    returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor, detail)
    values (p_job_id, v_from_state, p_to_state, 'worker', p_detail);

  return v_job;
end;
$$;

revoke all on function public.advance_job_step(uuid, text, text, text) from public;
grant execute on function public.advance_job_step(uuid, text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- complete_job — transição final para 'completed' + reconciliação de
-- orçamento (capture_budget_reservation) + usage_ledger_entries.
-- Idempotente: chamar de novo num job já completed devolve o mesmo
-- resultado sem recapturar orçamento (capture_budget_reservation já é
-- idempotente por reservation_id).
-- ---------------------------------------------------------------------
create or replace function public.complete_job(
  p_job_id uuid,
  p_worker_id text,
  p_model text,
  p_seconds_processed integer,
  p_actual_cost_cents_brl bigint,
  p_estimated_cost_micros_usd bigint,
  p_actual_cost_micros_usd bigint
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
  v_from_state text;
begin
  select * into v_job from transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % não encontrado', p_job_id using errcode = 'P0001';
  end if;

  if v_job.state = 'completed' then
    return v_job;
  end if;

  if v_job.state in ('failed', 'cancelled', 'expired') then
    raise exception 'job % já está em estado terminal ("%"), não pode completar', p_job_id, v_job.state
      using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id using errcode = 'P0001';
  end if;

  v_from_state := v_job.state;

  perform public.capture_budget_reservation(
    v_job.budget_reservation_id, p_actual_cost_cents_brl, p_model, p_seconds_processed,
    p_estimated_cost_micros_usd, p_actual_cost_micros_usd, v_job.workspace_id
  );

  update transcription_jobs
    set state = 'completed', lease_owner = null, lease_expires_at = null, updated_at = now()
    where id = p_job_id
    returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor)
    values (p_job_id, v_from_state, 'completed', 'worker');

  return v_job;
end;
$$;

revoke all on function public.complete_job(uuid, text, text, integer, bigint, bigint, bigint) from public;
grant execute on function public.complete_job(uuid, text, text, integer, bigint, bigint, bigint) to service_role;

-- ---------------------------------------------------------------------
-- fail_job — se ainda há tentativas (retry_count < max_retries), volta
-- pra 'queued' com backoff exponencial (30s * 2^tentativa, teto 900s);
-- senão vira 'failed' definitivo + dead_letter + libera a reserva de
-- orçamento (release_budget_reservation, idempotente). Idempotente:
-- chamar de novo num job já terminal devolve o estado atual sem mexer
-- de novo.
-- ---------------------------------------------------------------------
create or replace function public.fail_job(
  p_job_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_detail text default null
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
  v_from_state text;
  v_next_retry_count integer;
  v_backoff_seconds integer;
begin
  select * into v_job from transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % não encontrado', p_job_id using errcode = 'P0001';
  end if;

  if v_job.state in ('completed', 'failed', 'cancelled', 'expired') then
    return v_job;
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id using errcode = 'P0001';
  end if;

  v_from_state := v_job.state;
  v_next_retry_count := v_job.retry_count + 1;

  if v_next_retry_count < v_job.max_retries then
    v_backoff_seconds := least(30 * power(2, v_job.retry_count)::int, 900);

    update transcription_jobs
      set state = 'queued',
          retry_count = v_next_retry_count,
          next_attempt_at = now() + make_interval(secs => v_backoff_seconds),
          lease_owner = null,
          lease_expires_at = null,
          error_code = p_error_code,
          error_detail = p_error_detail,
          updated_at = now()
      where id = p_job_id
      returning * into v_job;

    insert into job_steps (job_id, from_state, to_state, actor, detail)
      values (p_job_id, v_from_state, 'queued', 'worker', coalesce(p_error_detail, p_error_code));

    return v_job;
  end if;

  update transcription_jobs
    set state = 'failed',
        retry_count = v_next_retry_count,
        dead_letter = true,
        lease_owner = null,
        lease_expires_at = null,
        error_code = p_error_code,
        error_detail = p_error_detail,
        updated_at = now()
    where id = p_job_id
    returning * into v_job;

  if v_job.budget_reservation_id is not null then
    perform public.release_budget_reservation(v_job.budget_reservation_id, 'failed');
  end if;

  insert into job_steps (job_id, from_state, to_state, actor, detail)
    values (p_job_id, v_from_state, 'failed', 'worker', coalesce(p_error_detail, p_error_code));

  return v_job;
end;
$$;

revoke all on function public.fail_job(uuid, text, text, text) from public;
grant execute on function public.fail_job(uuid, text, text, text) to service_role;
