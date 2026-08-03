-- PasteScribe — funções atômicas de quota/orçamento/créditos.
-- docs/DATABASE.md §Funções SQL atômicas, pastescribe-ai-cost-governance.
--
-- Todas: SECURITY DEFINER, search_path fixo, idempotentes via
-- idempotency_key único (duplo clique/retry devolve o mesmo resultado
-- em vez de duplicar), travam a linha relevante com FOR UPDATE
-- (concorrência não estoura limite nem gasta orçamento duas vezes),
-- falham fechado (RAISE EXCEPTION) em vez de permitir silenciosamente.
-- Executáveis só por service_role — nenhum caller client ainda
-- (docs/DATABASE.md: default é service_role, exceção é caso a caso).

-- ---------------------------------------------------------------------
-- consume_quota — contador durável com janela. `bucket`/`window_key`
-- são opacos ao banco (ex.: 'anon:<hash>', 'user:<uuid>', janela
-- 'YYYY-MM-DD' ou 'lifetime') — a política de quem é bucket/janela
-- vive na camada chamadora (free_tier_configs / app_settings), nunca
-- aqui.
-- ---------------------------------------------------------------------
create or replace function public.consume_quota(
  p_bucket text,
  p_window text,
  p_units integer,
  p_limit integer,
  p_idempotency_key text,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns public.quota_counters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_entry public.quota_consumption_entries;
  v_counter public.quota_counters;
begin
  if p_units <= 0 then
    raise exception 'p_units deve ser positivo' using errcode = '22023';
  end if;
  if p_limit < 0 then
    raise exception 'p_limit não pode ser negativo' using errcode = '22023';
  end if;

  select * into v_existing_entry
    from quota_consumption_entries
    where idempotency_key = p_idempotency_key;
  if found then
    select * into v_counter from quota_counters where id = v_existing_entry.quota_counter_id;
    return v_counter;
  end if;

  insert into quota_counters (bucket, window_key)
    values (p_bucket, p_window)
    on conflict (bucket, window_key) do nothing;

  select * into v_counter
    from quota_counters
    where bucket = p_bucket and window_key = p_window
    for update;

  if v_counter.consumed_units + p_units > p_limit then
    raise exception 'quota excedida para bucket % janela % (consumido % + % > limite %)',
      p_bucket, p_window, v_counter.consumed_units, p_units, p_limit
      using errcode = 'P0001';
  end if;

  update quota_counters
    set consumed_units = consumed_units + p_units, updated_at = now()
    where id = v_counter.id
    returning * into v_counter;

  insert into quota_consumption_entries (
    quota_counter_id, units, idempotency_key, reference_type, reference_id
  ) values (
    v_counter.id, p_units, p_idempotency_key, p_reference_type, p_reference_id
  );

  return v_counter;
end;
$$;

revoke all on function public.consume_quota(text, text, integer, integer, text, text, uuid) from public;
grant execute on function public.consume_quota(text, text, integer, integer, text, text, uuid) to service_role;

-- ---------------------------------------------------------------------
-- ledger_append — lançamento de crédito idempotente. Saldo em
-- credit_accounts é cache mutado só aqui, nunca por UPDATE direto.
-- ---------------------------------------------------------------------
create or replace function public.ledger_append(
  p_credit_account_id uuid,
  p_kind text,
  p_amount_seconds integer,
  p_idempotency_key text,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_created_by uuid default null
)
returns public.credit_ledger_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.credit_ledger_entries;
  v_account public.credit_accounts;
  v_new_balance integer;
  v_entry public.credit_ledger_entries;
begin
  if p_amount_seconds = 0 then
    raise exception 'p_amount_seconds não pode ser zero' using errcode = '22023';
  end if;

  select * into v_existing from credit_ledger_entries where idempotency_key = p_idempotency_key;
  if found then
    return v_existing;
  end if;

  select * into v_account from credit_accounts where id = p_credit_account_id for update;
  if not found then
    raise exception 'credit account % não encontrada', p_credit_account_id using errcode = 'P0001';
  end if;

  v_new_balance := v_account.balance_seconds + p_amount_seconds;
  if v_new_balance < 0 then
    raise exception 'saldo insuficiente na conta % (saldo % + lançamento % < 0)',
      p_credit_account_id, v_account.balance_seconds, p_amount_seconds
      using errcode = 'P0001';
  end if;

  update credit_accounts
    set balance_seconds = v_new_balance, updated_at = now()
    where id = p_credit_account_id;

  insert into credit_ledger_entries (
    credit_account_id, kind, amount_seconds, balance_after_seconds,
    reference_type, reference_id, idempotency_key, metadata, created_by
  ) values (
    p_credit_account_id, p_kind, p_amount_seconds, v_new_balance,
    p_reference_type, p_reference_id, p_idempotency_key, p_metadata, p_created_by
  ) returning * into v_entry;

  return v_entry;
end;
$$;

revoke all on function public.ledger_append(uuid, text, integer, text, text, uuid, jsonb, uuid) from public;
grant execute on function public.ledger_append(uuid, text, integer, text, text, uuid, jsonb, uuid) to service_role;

-- ---------------------------------------------------------------------
-- reserve_free_budget — reserva atômica contra um budget_period. Não
-- inclui a criação do job (transcription_jobs só existe na Onda 4);
-- `reserve_free_budget_and_enqueue` do docs/DATABASE.md chega então,
-- envolvendo esta função dentro da mesma transação da criação do job.
-- ---------------------------------------------------------------------
create or replace function public.reserve_free_budget(
  p_envelope text,
  p_period_start date,
  p_period_end date,
  p_identity_key text,
  p_estimated_cost_cents_brl bigint,
  p_idempotency_key text,
  p_expires_in_seconds integer default 900
)
returns public.budget_reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.budget_reservations;
  v_period public.budget_periods;
  v_reservation public.budget_reservations;
begin
  if p_estimated_cost_cents_brl <= 0 then
    raise exception 'p_estimated_cost_cents_brl deve ser positivo' using errcode = '22023';
  end if;

  select * into v_existing from budget_reservations where idempotency_key = p_idempotency_key;
  if found then
    return v_existing;
  end if;

  select * into v_period
    from budget_periods
    where envelope = p_envelope and period_start = p_period_start and period_end = p_period_end
    for update;

  if not found then
    raise exception 'orçamento % (%..%) não configurado', p_envelope, p_period_start, p_period_end
      using errcode = 'P0001';
  end if;

  if v_period.status <> 'open' then
    raise exception 'orçamento % está encerrado', p_envelope using errcode = 'P0001';
  end if;

  if v_period.reserved_cents_brl + v_period.consumed_cents_brl + p_estimated_cost_cents_brl > v_period.cap_cents_brl then
    raise exception 'orçamento insuficiente no envelope % (reservado % + consumido % + pedido % > teto %)',
      p_envelope, v_period.reserved_cents_brl, v_period.consumed_cents_brl, p_estimated_cost_cents_brl, v_period.cap_cents_brl
      using errcode = 'P0001';
  end if;

  update budget_periods
    set reserved_cents_brl = reserved_cents_brl + p_estimated_cost_cents_brl, updated_at = now()
    where id = v_period.id;

  insert into budget_reservations (
    budget_period_id, identity_key, estimated_cost_cents_brl, idempotency_key, expires_at
  ) values (
    v_period.id, p_identity_key, p_estimated_cost_cents_brl, p_idempotency_key,
    now() + make_interval(secs => p_expires_in_seconds)
  ) returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke all on function public.reserve_free_budget(text, date, date, text, bigint, text, integer) from public;
grant execute on function public.reserve_free_budget(text, date, date, text, bigint, text, integer) to service_role;

-- ---------------------------------------------------------------------
-- capture_budget_reservation — reconciliação: move a reserva de
-- "reserved" pra "captured", desloca reserved->consumed no período
-- pelo custo REAL (não o estimado — excedente é devolvido de graça,
-- já que reserved cai pelo valor originalmente reservado, não pelo
-- capturado), e registra o uso real em usage_ledger_entries.
-- Idempotente por reservation_id (chave fixa 'capture:<id>').
-- ---------------------------------------------------------------------
create or replace function public.capture_budget_reservation(
  p_reservation_id uuid,
  p_actual_cost_cents_brl bigint,
  p_model text,
  p_seconds_processed integer,
  p_estimated_cost_micros_usd bigint,
  p_actual_cost_micros_usd bigint,
  p_workspace_id uuid default null
)
returns public.usage_ledger_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.budget_reservations;
  v_idempotency_key text;
  v_existing public.usage_ledger_entries;
  v_usage public.usage_ledger_entries;
begin
  if p_actual_cost_cents_brl < 0 then
    raise exception 'p_actual_cost_cents_brl não pode ser negativo' using errcode = '22023';
  end if;

  v_idempotency_key := 'capture:' || p_reservation_id::text;

  select * into v_existing from usage_ledger_entries where idempotency_key = v_idempotency_key;
  if found then
    return v_existing;
  end if;

  select * into v_reservation from budget_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reserva % não encontrada', p_reservation_id using errcode = 'P0001';
  end if;

  if v_reservation.status <> 'reserved' then
    raise exception 'reserva % não está em "reserved" (está "%")', p_reservation_id, v_reservation.status
      using errcode = 'P0001';
  end if;

  update budget_periods
    set reserved_cents_brl = greatest(0, reserved_cents_brl - v_reservation.estimated_cost_cents_brl),
        consumed_cents_brl = consumed_cents_brl + p_actual_cost_cents_brl,
        updated_at = now()
    where id = v_reservation.budget_period_id;

  update budget_reservations
    set status = 'captured', captured_cost_cents_brl = p_actual_cost_cents_brl, updated_at = now()
    where id = p_reservation_id;

  insert into usage_ledger_entries (
    budget_reservation_id, workspace_id, origin, model, seconds_processed,
    estimated_cost_micros_usd, actual_cost_micros_usd,
    estimated_cost_cents_brl, actual_cost_cents_brl, idempotency_key
  ) values (
    p_reservation_id, p_workspace_id, 'free', p_model, p_seconds_processed,
    p_estimated_cost_micros_usd, p_actual_cost_micros_usd,
    v_reservation.estimated_cost_cents_brl, p_actual_cost_cents_brl, v_idempotency_key
  ) returning * into v_usage;

  return v_usage;
end;
$$;

revoke all on function public.capture_budget_reservation(uuid, bigint, text, integer, bigint, bigint, uuid) from public;
grant execute on function public.capture_budget_reservation(uuid, bigint, text, integer, bigint, bigint, uuid) to service_role;

-- ---------------------------------------------------------------------
-- release_budget_reservation — libera uma reserva sem consumir
-- orçamento (job falhou antes de gastar, ou expirou sem uso). Devolve
-- o valor reservado ao período. Idempotente: chamar de novo numa
-- reserva já não-'reserved' só devolve o estado atual, sem re-liberar.
-- ---------------------------------------------------------------------
create or replace function public.release_budget_reservation(
  p_reservation_id uuid,
  p_reason text default 'released'
)
returns public.budget_reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.budget_reservations;
  v_status text;
begin
  select * into v_reservation from budget_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reserva % não encontrada', p_reservation_id using errcode = 'P0001';
  end if;

  if v_reservation.status <> 'reserved' then
    return v_reservation;
  end if;

  update budget_periods
    set reserved_cents_brl = greatest(0, reserved_cents_brl - v_reservation.estimated_cost_cents_brl),
        updated_at = now()
    where id = v_reservation.budget_period_id;

  v_status := case when p_reason = 'expired' then 'expired' else 'released' end;

  update budget_reservations
    set status = v_status, updated_at = now()
    where id = p_reservation_id
    returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke all on function public.release_budget_reservation(uuid, text) from public;
grant execute on function public.release_budget_reservation(uuid, text) to service_role;
