-- PasteScribe — Onda 4 fatia 4.2a: fila durável de transcrição.
-- docs/DATABASE.md §Jobs e mídia, docs/ARCHITECTURE.md §Fila durável no
-- PostgreSQL, docs/ROADMAP.md (Onda 4).
--
-- Fora de escopo desta migration (decisões em docs/DECISIONS.md):
-- - source_kind = 'url' / media_sources — não existe adapter de
--   plataforma nenhum ainda (Onda 8); só upload (Onda 4.1) é real
--   hoje. O check constraint de source_kind trava em 'upload' até a
--   migration que adicionar media_sources também alargar isso.
-- - job_attempts — job_steps já audita cada transição (ator, de→para,
--   timestamp); uma tabela separada por tentativa não tem consumidor
--   real ainda além do que job_steps + retry_count já cobrem.
-- - reap de leases expirados (worker morto sem chamar fail_job) — não
--   existe scheduler/cron no projeto ainda; heartbeat_job/claim_next_job
--   cobrem o caminho feliz, mas um job travado numa etapa ativa com
--   lease vencido fica preso até um operador intervir ou uma fatia
--   futura adicionar um sweeper.

-- ---------------------------------------------------------------------
-- transcription_jobs — a fila e o estado. Estados em
-- packages/contracts/src/job-states.ts (única fonte canônica; o worker
-- Python porta a mesma máquina, já que não pode importar TS direto).
-- ---------------------------------------------------------------------
create table public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  source_kind text not null default 'upload' check (source_kind in ('upload')),
  media_asset_id uuid not null references public.media_assets (id),
  state text not null default 'queued' check (state in (
    'created', 'validating', 'awaiting_user_confirmation', 'queued',
    'resolving_metadata', 'fetching_captions', 'acquiring_media',
    'extracting_audio', 'normalizing_audio', 'transcribing', 'diarizing',
    'postprocessing', 'indexing', 'completed', 'failed',
    'cancel_requested', 'cancelled', 'expired'
  )),
  priority smallint not null default 0,
  idempotency_key text not null unique,
  lease_owner text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 3 check (max_retries >= 0),
  next_attempt_at timestamptz not null default now(),
  dead_letter boolean not null default false,
  cancel_requested_at timestamptz,
  budget_reservation_id uuid references public.budget_reservations (id),
  error_code text,
  error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transcription_jobs_workspace_idx on public.transcription_jobs (workspace_id, created_at);

-- Fila de claim: só jobs "queued" e já no horário (next_attempt_at),
-- ordenados por prioridade e chegada. Índice parcial — a tabela cresce
-- com jobs terminais que nunca voltam a ser candidatos a claim.
create index transcription_jobs_claimable_idx
  on public.transcription_jobs (priority desc, next_attempt_at)
  where state = 'queued' and dead_letter = false;

create index transcription_jobs_lease_idx on public.transcription_jobs (lease_owner)
  where lease_owner is not null;

create trigger set_updated_at before update on public.transcription_jobs
  for each row execute function public.set_updated_at();

comment on table public.transcription_jobs is
  'Fila durável em Postgres — claim via FOR UPDATE SKIP LOCKED (claim_next_job). source_kind trava em upload até media_sources existir (Onda 8+).';

-- ---------------------------------------------------------------------
-- job_steps — transições auditáveis. from_state nulo só na criação
-- (não existe "de onde veio" antes do primeiro estado).
-- ---------------------------------------------------------------------
create table public.job_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.transcription_jobs (id) on delete cascade,
  from_state text,
  to_state text not null,
  actor text not null check (actor in ('web', 'worker', 'admin')),
  detail text,
  created_at timestamptz not null default now()
);

create index job_steps_job_idx on public.job_steps (job_id, created_at);

comment on table public.job_steps is
  'Append-only — histórico de transições de estado por job, nunca update/delete.';
