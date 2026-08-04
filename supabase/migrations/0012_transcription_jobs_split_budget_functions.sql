-- PasteScribe — funções da fila revisadas (Onda 4 fatia 4.2a,
-- correção). `reserve_free_budget_and_enqueue` some — reservar
-- orçamento no instante de criar o job presumia que a duração já era
-- conhecida ali, o que nunca é verdade nem pra upload nem pra link
-- (docs/DECISIONS.md). No lugar entram duas funções com
-- responsabilidades separadas:
--
-- - enqueue_job: cria o job (grátis, sem orçamento nenhum envolvido —
--   é trabalho determinístico);
-- - reserve_job_budget: chamada pelo worker só depois que a duração
--   REAL é conhecida (ffprobe pra upload; metadata da plataforma pra
--   link) — cabe no free -> reserva e segue pra transcribing; excede
--   o free -> vai pra awaiting_user_confirmation (sem cobrar ninguém,
--   já que checkout pago ainda não existe — Onda 9).

drop function if exists public.reserve_free_budget_and_enqueue(uuid, uuid, uuid, text, date, date, text, bigint, text, smallint, integer, integer);

-- ---------------------------------------------------------------------
-- enqueue_job — cria o job em 'queued', sem orçamento. Idempotente por
-- idempotency_key. Valida o asset (workspace certo + validado) pra
-- upload; pra url só confere consistência básica de parâmetros — sem
-- SSRF/normalização/adapter ainda, e nenhuma rota real chama isto com
-- source_kind='url' hoje (Onda 8 constrói o resto).
-- ---------------------------------------------------------------------
create or replace function public.enqueue_job(
  p_workspace_id uuid,
  p_created_by uuid,
  p_source_kind text,
  p_idempotency_key text,
  p_media_asset_id uuid default null,
  p_source_url text default null,
  p_priority smallint default 0,
  p_max_retries integer default 3
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.transcription_jobs;
  v_asset public.media_assets;
  v_job public.transcription_jobs;
begin
  select * into v_existing from transcription_jobs where idempotency_key = p_idempotency_key;
  if found then
    return v_existing;
  end if;

  if p_source_kind = 'upload' then
    if p_media_asset_id is null or p_source_url is not null then
      raise exception 'source_kind=upload exige media_asset_id e nenhum source_url' using errcode = '22023';
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
  elsif p_source_kind = 'url' then
    if p_source_url is null or p_media_asset_id is not null then
      raise exception 'source_kind=url exige source_url e nenhum media_asset_id' using errcode = '22023';
    end if;
  else
    raise exception 'source_kind % desconhecido', p_source_kind using errcode = '22023';
  end if;

  insert into transcription_jobs (
    workspace_id, created_by, source_kind, media_asset_id, source_url, state,
    priority, idempotency_key, next_attempt_at, max_retries
  ) values (
    p_workspace_id, p_created_by, p_source_kind, p_media_asset_id, p_source_url, 'queued',
    p_priority, p_idempotency_key, now(), p_max_retries
  ) returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor)
    values (v_job.id, null, 'queued', 'web');

  return v_job;
end;
$$;

revoke all on function public.enqueue_job(uuid, uuid, text, text, uuid, text, smallint, integer) from public;
grant execute on function public.enqueue_job(uuid, uuid, text, text, uuid, text, smallint, integer) to service_role;

-- ---------------------------------------------------------------------
-- reserve_job_budget — chamada pelo worker assim que a duração REAL é
-- conhecida (nunca antes). Sucesso: grava duration_seconds, reserva o
-- orçamento free, avança pra 'transcribing'. Orçamento insuficiente
-- (qualquer motivo — teto, período fechado/inexistente): grava
-- duration_seconds mesmo assim, vai pra 'awaiting_user_confirmation',
-- solta o lease (o worker não tem mais o que fazer com este job até
-- existir um fluxo pago que o retome — Onda 9, "A confirmar").
-- Idempotente: já resolvido (transcribing ou awaiting_user_confirmation)
-- devolve o job como está, sem refazer nada.
-- ---------------------------------------------------------------------
create or replace function public.reserve_job_budget(
  p_job_id uuid,
  p_worker_id text,
  p_duration_seconds integer,
  p_envelope text,
  p_period_start date,
  p_period_end date,
  p_identity_key text,
  p_estimated_cost_cents_brl bigint,
  p_idempotency_key text,
  p_budget_expires_in_seconds integer default 900
)
returns public.transcription_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
  v_from_state text;
  v_reservation public.budget_reservations;
begin
  if p_duration_seconds < 0 then
    raise exception 'p_duration_seconds não pode ser negativo' using errcode = '22023';
  end if;

  select * into v_job from transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % não encontrado', p_job_id using errcode = 'P0001';
  end if;

  if v_job.state in ('transcribing', 'awaiting_user_confirmation') then
    return v_job;
  end if;

  if v_job.state in ('completed', 'failed', 'cancelled', 'expired') then
    raise exception 'job % já está em estado terminal ("%")', p_job_id, v_job.state using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id using errcode = 'P0001';
  end if;

  v_from_state := v_job.state;

  begin
    v_reservation := public.reserve_free_budget(
      p_envelope, p_period_start, p_period_end, p_identity_key,
      p_estimated_cost_cents_brl, p_idempotency_key, p_budget_expires_in_seconds
    );

    update transcription_jobs
      set duration_seconds = p_duration_seconds,
          budget_reservation_id = v_reservation.id,
          state = 'transcribing',
          updated_at = now()
      where id = p_job_id
      returning * into v_job;

    insert into job_steps (job_id, from_state, to_state, actor, detail)
      values (p_job_id, v_from_state, 'transcribing', 'worker', 'orçamento reservado');
  exception
    when sqlstate 'P0001' then
      update transcription_jobs
        set duration_seconds = p_duration_seconds,
            state = 'awaiting_user_confirmation',
            error_code = 'exceeds_free_tier',
            error_detail = sqlerrm,
            lease_owner = null,
            lease_expires_at = null,
            updated_at = now()
        where id = p_job_id
        returning * into v_job;

      insert into job_steps (job_id, from_state, to_state, actor, detail)
        values (p_job_id, v_from_state, 'awaiting_user_confirmation', 'worker', sqlerrm);
  end;

  return v_job;
end;
$$;

revoke all on function public.reserve_job_budget(uuid, text, integer, text, date, date, text, bigint, text, integer) from public;
grant execute on function public.reserve_job_budget(uuid, text, integer, text, date, date, text, bigint, text, integer) to service_role;

-- ---------------------------------------------------------------------
-- claim_next_job — agora com ramo por source_kind: upload vai direto
-- pra acquiring_media (buscar do storage); url vai pra
-- resolving_metadata primeiro (nenhuma rota cria job url ainda, mas o
-- ramo já existe pronto pra quando existir).
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

  v_next_state := case v_job.source_kind
    when 'upload' then 'acquiring_media'
    when 'url' then 'resolving_metadata'
  end;

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
