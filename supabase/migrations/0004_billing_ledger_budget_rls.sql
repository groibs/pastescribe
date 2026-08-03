-- PasteScribe — RLS das tabelas de billing/ledger/orçamento/quota.
-- docs/DATABASE.md §Estratégia de RLS, regra 4: "tabelas financeiras e
-- de quota são só-servidor" — nenhuma delas tem consumidor client
-- ainda (pricing page continua estática via packages/i18n; não existe
-- UI de saldo/créditos). RLS habilitada em todas (defesa em
-- profundidade) sem nenhuma policy — só `service_role` (BYPASSRLS)
-- alcança, exatamente como `app_settings` na fatia 2.1.
--
-- Quando alguma dessas tabelas ganhar um consumidor client real (ex.:
-- pricing lendo `plans`/`prices` do banco, ou uma tela de saldo lendo
-- `credit_accounts`), a policy certa entra na mesma PR que liga esse
-- consumidor — nunca antes, sem uso real para validar o desenho.

alter table public.plans enable row level security;
revoke all on public.plans from anon, authenticated;

alter table public.prices enable row level security;
revoke all on public.prices from anon, authenticated;

alter table public.credit_accounts enable row level security;
revoke all on public.credit_accounts from anon, authenticated;

alter table public.credit_ledger_entries enable row level security;
revoke all on public.credit_ledger_entries from anon, authenticated;

alter table public.usage_ledger_entries enable row level security;
revoke all on public.usage_ledger_entries from anon, authenticated;

alter table public.budget_periods enable row level security;
revoke all on public.budget_periods from anon, authenticated;

alter table public.budget_reservations enable row level security;
revoke all on public.budget_reservations from anon, authenticated;

alter table public.free_tier_configs enable row level security;
revoke all on public.free_tier_configs from anon, authenticated;

alter table public.quota_counters enable row level security;
revoke all on public.quota_counters from anon, authenticated;

alter table public.quota_consumption_entries enable row level security;
revoke all on public.quota_consumption_entries from anon, authenticated;
