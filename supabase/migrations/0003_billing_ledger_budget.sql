-- PasteScribe — Onda 3 fatia 3.1: planos/preços, créditos (ledger
-- append-only), orçamento free (períodos/reservas) e quota durável.
-- docs/DATABASE.md §Planos e billing / §Créditos, uso e orçamento,
-- docs/AI_COST_MODEL.md, docs/ROADMAP.md (Onda 3).
--
-- Fora de escopo desta migration (decisões em docs/DECISIONS.md):
-- - billing_customers/subscriptions/payment_events (fatia 3.3, junto
--   com o provider de billing fake);
-- - abuse_signals/abuse_events (sem lógica de abuso real ainda para
--   escrever neles);
-- - reserve_free_budget_and_enqueue completo (depende de
--   transcription_jobs, que só existe na Onda 4) — esta migration
--   entrega reserve_free_budget (só orçamento+quota), que a versão
--   completa vai envolver quando o job existir.

-- ---------------------------------------------------------------------
-- plans / prices — catálogo controlado pelo servidor. `is_purchasable`
-- é o kill switch real: preços podem existir como draft sem que a
-- compra esteja liberada (docs/PASTESCRIBE_MONETIZATION.md — números
-- ainda não aprovados).
-- ---------------------------------------------------------------------
create table public.plans (
  id text primary key,
  name text not null,
  description text,
  is_purchasable boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prices (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null references public.plans (id) on delete cascade,
  billing_interval text not null check (billing_interval in ('monthly', 'yearly')),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  amount_cents integer not null check (amount_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plan_id, billing_interval, currency)
);

create trigger set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

-- Catálogo draft — mesmos números ilustrativos já usados em
-- packages/i18n (pricing page). Nenhum é comprável ainda.
insert into public.plans (id, name, description, is_purchasable, sort_order) values
  ('free', 'Free', 'Para uso ocasional', false, 0),
  ('creator', 'Creator', 'Para criadores de conteúdo', false, 1),
  ('pro', 'Pro', 'Para profissionais e equipes', false, 2);

insert into public.prices (plan_id, billing_interval, currency, amount_cents) values
  ('free', 'monthly', 'usd', 0),
  ('free', 'yearly', 'usd', 0),
  ('creator', 'monthly', 'usd', 1900),
  ('creator', 'yearly', 'usd', 1500),
  ('pro', 'monthly', 'usd', 4900),
  ('pro', 'yearly', 'usd', 3900);

-- ---------------------------------------------------------------------
-- credit_accounts / credit_ledger_entries — créditos pagos (pacotes,
-- assinatura). Saldo é cache mantido só por ledger_append, nunca
-- mutado fora dela — docs/DATABASE.md: "saldo é derivado do ledger".
-- ---------------------------------------------------------------------
create table public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  balance_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  credit_account_id uuid not null references public.credit_accounts (id) on delete cascade,
  kind text not null check (kind in ('purchase', 'grant', 'reserve', 'capture', 'release', 'refund', 'adjust')),
  amount_seconds integer not null,
  balance_after_seconds integer not null,
  reference_type text,
  reference_id uuid,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index credit_ledger_entries_account_idx on public.credit_ledger_entries (credit_account_id, created_at);

comment on table public.credit_ledger_entries is
  'Append-only — correção é lançamento compensatório (kind=adjust), nunca UPDATE/DELETE.';

-- ---------------------------------------------------------------------
-- budget_periods / budget_reservations — orçamento free por envelope
-- e período (docs/AI_COST_MODEL.md §6: free_ai, ingestion, infra,
-- reserve). Reserva é sempre por identidade (usuário, e-mail
-- verificado, IP anônimo) via `identity_key` opaco — a derivação
-- (hash, salt) é decisão da camada que chama, não do banco.
-- ---------------------------------------------------------------------
create table public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  envelope text not null check (envelope in ('free_ai', 'ingestion', 'infra', 'reserve')),
  period_start date not null,
  period_end date not null,
  cap_cents_brl bigint not null check (cap_cents_brl > 0),
  reserved_cents_brl bigint not null default 0 check (reserved_cents_brl >= 0),
  consumed_cents_brl bigint not null default 0 check (consumed_cents_brl >= 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (envelope, period_start, period_end)
);

create table public.budget_reservations (
  id uuid primary key default gen_random_uuid(),
  budget_period_id uuid not null references public.budget_periods (id),
  identity_key text not null,
  estimated_cost_cents_brl bigint not null check (estimated_cost_cents_brl > 0),
  captured_cost_cents_brl bigint,
  status text not null default 'reserved' check (status in ('reserved', 'captured', 'released', 'expired')),
  idempotency_key text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index budget_reservations_period_idx on public.budget_reservations (budget_period_id);
create index budget_reservations_status_expiry_idx on public.budget_reservations (status, expires_at);

-- ---------------------------------------------------------------------
-- usage_ledger_entries — custo real por operação. Escrita hoje só via
-- capture_budget_reservation (fatia 3.1); quando a Onda 5 tiver
-- chamadas reais de IA, complete_job passa a alimentar isso também.
-- Sem conteúdo — só métricas (docs/AI_COST_MODEL.md §8).
-- ---------------------------------------------------------------------
create table public.usage_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  budget_reservation_id uuid references public.budget_reservations (id),
  workspace_id uuid references public.workspaces (id),
  origin text not null check (origin in ('free', 'paid')),
  model text not null,
  seconds_processed integer not null check (seconds_processed >= 0),
  estimated_cost_micros_usd bigint not null check (estimated_cost_micros_usd >= 0),
  actual_cost_micros_usd bigint not null check (actual_cost_micros_usd >= 0),
  estimated_cost_cents_brl bigint not null check (estimated_cost_cents_brl >= 0),
  actual_cost_cents_brl bigint not null check (actual_cost_cents_brl >= 0),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index usage_ledger_entries_workspace_idx on public.usage_ledger_entries (workspace_id, created_at);

-- ---------------------------------------------------------------------
-- free_tier_configs — política vigente do gratuito
-- (docs/AI_COST_MODEL.md §4). Limite é sempre em segundos (unidade
-- interna canônica) — a copy pública ("3 minutos grátis") lê daqui,
-- nunca hardcoded.
-- ---------------------------------------------------------------------
create table public.free_tier_configs (
  id text primary key,
  max_seconds_total integer not null check (max_seconds_total >= 0),
  renewable boolean not null default false,
  is_active boolean not null default true,
  description text,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.free_tier_configs
  for each row execute function public.set_updated_at();

insert into public.free_tier_configs (id, max_seconds_total, renewable, is_active, description) values
  ('anonymous', 45, false, true, 'Prévia anônima antes de criar conta — docs/AI_COST_MODEL.md §4 (≈R$0,012/identidade).'),
  ('verified_email', 180, false, true, 'Degustação única após verificar e-mail, não renovável — docs/AI_COST_MODEL.md §4 (≈R$0,05/identidade).'),
  ('native_caption', 0, true, true, 'Legenda nativa: sem custo de IA — docs/AI_COST_MODEL.md §4.');

-- ---------------------------------------------------------------------
-- quota_counters / quota_consumption_entries — contador durável por
-- bucket+janela (docs/DATABASE.md: "usuário, IP, sessão, global,
-- plataforma"). O banco não interpreta `bucket`/`window_key` — só
-- garante atomicidade e idempotência sobre o que a camada chamadora
-- decidir usar como chave.
-- ---------------------------------------------------------------------
create table public.quota_counters (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  window_key text not null,
  consumed_units integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, window_key)
);

create table public.quota_consumption_entries (
  id uuid primary key default gen_random_uuid(),
  quota_counter_id uuid not null references public.quota_counters (id) on delete cascade,
  units integer not null check (units > 0),
  idempotency_key text not null unique,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index quota_consumption_entries_counter_idx on public.quota_consumption_entries (quota_counter_id);

comment on table public.quota_consumption_entries is
  'Log append-only de consumo — existe para idempotência (duplo clique/retry não conta duas vezes) e auditoria, além do contador agregado em quota_counters.';
