-- PasteScribe — Onda 4 fatia 4.2c-c: persistência atômica do
-- transcript, conclusão específica de transcrição e cancelamento com
-- liberação de reserva.
--
-- O worker nunca marca um transcription_job como completed antes que o
-- resultado e todos os segmentos existam. `complete_transcription_job`
-- faz persistência + captura de orçamento + transição final na mesma
-- transação Postgres.

create or replace function public.persist_transcript_result(
  p_job_id uuid,
  p_worker_id text,
  p_language text,
  p_source text,
  p_model text,
  p_text text,
  p_segments jsonb
)
returns public.transcripts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.transcription_jobs;
  v_existing public.transcripts;
  v_transcript public.transcripts;
begin
  select * into v_existing from transcripts where job_id = p_job_id;
  if found then
    return v_existing;
  end if;

  select * into v_job from transcription_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % não encontrado', p_job_id using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id
      using errcode = 'P0001';
  end if;

  if v_job.state not in ('transcribing', 'postprocessing', 'indexing') then
    raise exception 'job % em estado "%" não aceita resultado', p_job_id, v_job.state
      using errcode = 'P0001';
  end if;

  if p_language is null or char_length(btrim(p_language)) < 2 then
    raise exception 'idioma inválido' using errcode = '22023';
  end if;
  if p_source not in ('ai', 'native_captions') then
    raise exception 'source de transcript inválido' using errcode = '22023';
  end if;
  if p_source = 'ai' and (p_model is null or btrim(p_model) = '') then
    raise exception 'transcript de IA exige model' using errcode = '22023';
  end if;
  if p_text is null or btrim(p_text) = '' then
    raise exception 'texto do transcript não pode ser vazio' using errcode = '22023';
  end if;
  if jsonb_typeof(p_segments) <> 'array' or jsonb_array_length(p_segments) = 0 then
    raise exception 'segments precisa ser um array não vazio' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_segments) as item(segment)
    where jsonb_typeof(segment) <> 'object'
       or not (segment ? 'start_ms')
       or not (segment ? 'end_ms')
       or not (segment ? 'text')
       or (segment->>'start_ms') !~ '^[0-9]+$'
       or (segment->>'end_ms') !~ '^[0-9]+$'
       or (segment->>'end_ms')::integer < (segment->>'start_ms')::integer
       or jsonb_typeof(segment->'text') <> 'string'
       or btrim(segment->>'text') = ''
       or (
         segment ? 'speaker_label'
         and jsonb_typeof(segment->'speaker_label') not in ('string', 'null')
       )
  ) then
    raise exception 'segmento inválido' using errcode = '22023';
  end if;

  insert into transcripts (job_id, workspace_id, language, source, model, text)
  values (
    p_job_id,
    v_job.workspace_id,
    lower(btrim(p_language)),
    p_source,
    nullif(btrim(p_model), ''),
    p_text
  )
  returning * into v_transcript;

  insert into transcript_segments (
    transcript_id, position, start_ms, end_ms, text, speaker_label
  )
  select
    v_transcript.id,
    (ordinality - 1)::integer,
    (segment->>'start_ms')::integer,
    (segment->>'end_ms')::integer,
    segment->>'text',
    nullif(btrim(segment->>'speaker_label'), '')
  from jsonb_array_elements(p_segments) with ordinality as item(segment, ordinality);

  return v_transcript;
end;
$$;

revoke all on function public.persist_transcript_result(uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.persist_transcript_result(uuid, text, text, text, text, text, jsonb) to service_role;

create or replace function public.complete_transcription_job(
  p_job_id uuid,
  p_worker_id text,
  p_language text,
  p_source text,
  p_model text,
  p_text text,
  p_segments jsonb,
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
    if not exists (select 1 from transcripts where job_id = p_job_id) then
      raise exception 'job % completed sem transcript persistido', p_job_id
        using errcode = 'P0001';
    end if;
    return v_job;
  end if;

  if v_job.state in ('failed', 'cancel_requested', 'cancelled', 'expired') then
    raise exception 'job % em estado terminal/incompatível "%"', p_job_id, v_job.state
      using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id
      using errcode = 'P0001';
  end if;

  if v_job.budget_reservation_id is null then
    raise exception 'job % não possui reserva de orçamento', p_job_id using errcode = 'P0001';
  end if;

  v_from_state := v_job.state;

  perform public.persist_transcript_result(
    p_job_id, p_worker_id, p_language, p_source, p_model, p_text, p_segments
  );

  perform public.capture_budget_reservation(
    v_job.budget_reservation_id,
    p_actual_cost_cents_brl,
    p_model,
    p_seconds_processed,
    p_estimated_cost_micros_usd,
    p_actual_cost_micros_usd,
    v_job.workspace_id
  );

  update transcription_jobs
    set state = 'completed',
        lease_owner = null,
        lease_expires_at = null,
        heartbeat_at = now(),
        error_code = null,
        error_detail = null,
        updated_at = now()
    where id = p_job_id
    returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor, detail)
  values (p_job_id, v_from_state, 'completed', 'worker', 'transcript persistido');

  return v_job;
end;
$$;

revoke all on function public.complete_transcription_job(uuid, text, text, text, text, text, jsonb, integer, bigint, bigint, bigint) from public;
grant execute on function public.complete_transcription_job(uuid, text, text, text, text, text, jsonb, integer, bigint, bigint, bigint) to service_role;

create or replace function public.request_job_cancel(
  p_job_id uuid,
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

  if v_job.state in ('completed', 'failed', 'cancelled', 'expired', 'cancel_requested') then
    return v_job;
  end if;

  v_from_state := v_job.state;

  if v_job.lease_owner is null then
    if v_job.budget_reservation_id is not null then
      perform public.release_budget_reservation(v_job.budget_reservation_id, 'cancelled');
    end if;

    update transcription_jobs
      set state = 'cancelled',
          cancel_requested_at = coalesce(cancel_requested_at, now()),
          lease_owner = null,
          lease_expires_at = null,
          updated_at = now()
      where id = p_job_id
      returning * into v_job;

    insert into job_steps (job_id, from_state, to_state, actor, detail)
    values (p_job_id, v_from_state, 'cancelled', 'web', p_detail);

    return v_job;
  end if;

  update transcription_jobs
    set state = 'cancel_requested',
        cancel_requested_at = coalesce(cancel_requested_at, now()),
        updated_at = now()
    where id = p_job_id
    returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor, detail)
  values (p_job_id, v_from_state, 'cancel_requested', 'web', p_detail);

  return v_job;
end;
$$;

revoke all on function public.request_job_cancel(uuid, text) from public;
grant execute on function public.request_job_cancel(uuid, text) to service_role;

create or replace function public.cancel_job(
  p_job_id uuid,
  p_worker_id text,
  p_detail text default null
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

  if v_job.state = 'cancelled' then
    return v_job;
  end if;

  if v_job.state <> 'cancel_requested' then
    raise exception 'job % não está com cancelamento solicitado (estado "%")', p_job_id, v_job.state
      using errcode = 'P0001';
  end if;

  if v_job.lease_owner is distinct from p_worker_id then
    raise exception 'job % não está sob lease de %', p_job_id, p_worker_id
      using errcode = 'P0001';
  end if;

  if v_job.budget_reservation_id is not null then
    perform public.release_budget_reservation(v_job.budget_reservation_id, 'cancelled');
  end if;

  update transcription_jobs
    set state = 'cancelled',
        lease_owner = null,
        lease_expires_at = null,
        heartbeat_at = now(),
        updated_at = now()
    where id = p_job_id
    returning * into v_job;

  insert into job_steps (job_id, from_state, to_state, actor, detail)
  values (p_job_id, 'cancel_requested', 'cancelled', 'worker', p_detail);

  return v_job;
end;
$$;

revoke all on function public.cancel_job(uuid, text, text) from public;
grant execute on function public.cancel_job(uuid, text, text) to service_role;
