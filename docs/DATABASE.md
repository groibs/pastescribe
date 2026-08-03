# Modelo de dados — PasteScribe

Criado na Onda 0 em 2026-08-03. Este documento define o desenho; o estado real é sempre o das migrations em `supabase/migrations/`. Divergência entre este doc e migration = migration vence + atualizar este doc.

**Entregue:** identidade/workspaces (Onda 2, `0001`–`0002`) e billing/ledger/orçamento/quota (Onda 3 fatia 3.1, `0003`–`0005`, ver §Funções SQL atômicas). Ainda não entregue: `billing_customers`/`subscriptions`/`payment_events` (fatia 3.3), `abuse_signals`/`abuse_events` (sem lógica de abuso real para escrever neles ainda), tudo de Onda 4+.

Convenções: UUID (`gen_random_uuid()`) como PK, `created_at`/`updated_at` timestamptz, FKs com `on delete` explícito, índices para todo padrão de acesso real, RLS ativa em toda tabela exposta.

## Domínios e entidades

### Identidade e workspaces (Onda 2)

- `profiles` — 1:1 com `auth.users`; nome de exibição, locale, preferências. Sem e-mail duplicado (fica no Auth).
- `workspaces` — todo usuário nasce com um workspace pessoal; times são workspaces com mais membros.
- `workspace_members` — (workspace_id, user_id, role: owner|admin|editor|viewer), único por par.
- `workspace_invites` — token hash, e-mail, papel, validade, status.

### Planos e billing (Onda 3/9)

- `plans` / `prices` — catálogo controlado pelo servidor; preços `draft` até aprovação; múltiplas moedas.
- `billing_customers` — mapeia workspace → customer no provider; provider é coluna (`stripe`, `fake`).
- `subscriptions` — estado espelhado do provider via webhook; nunca fonte primária de verdade de pagamento.
- `payment_events` — todo webhook recebido, com `provider_event_id` único (idempotência/replay), payload mínimo, status de processamento.

### Créditos, uso e orçamento (Onda 3 fatia 3.1 — entregue) — coração financeiro

- `plans` / `prices` — entregues nesta fatia com o catálogo draft (free/creator/pro, mesmos números do `packages/i18n`). `plans.is_purchasable` é o kill switch real: existir no catálogo não significa poder comprar — fica `false` até os preços serem aprovados (`docs/PASTESCRIBE_MONETIZATION.md`).
- `credit_accounts` — 1 por workspace; `balance_seconds` é um **cache** mantido só por `ledger_append` (nunca por UPDATE direto) — a fonte de verdade é o histórico em `credit_ledger_entries`.
- `credit_ledger_entries` — append-only. `kind: purchase|grant|reserve|capture|release|refund|adjust`, quantidade em segundos de mídia (unidade interna canônica: segundos; UI mostra minutos), referência ao job/pagamento, `idempotency_key` única. Correção = lançamento compensatório (`kind=adjust`), nunca update/delete.
- `usage_ledger_entries` — custo real por operação: modelo, segundos processados, custo estimado/real em USD (micros, `bigint`, fiel à fatura real) e em BRL (centavos — moeda de planejamento do orçamento), origem free|paid, referência à reserva e ao workspace. Sem conteúdo. Escrita hoje só por `capture_budget_reservation`; a Onda 4/5 passa a alimentar via `complete_job`.
- `budget_periods` — orçamento por envelope (`free_ai|ingestion|infra|reserve`, docs/AI_COST_MODEL.md §6) e período: teto, reservado, realizado, todos em centavos de BRL (moeda que o negócio realmente usa pra decidir o teto). Atualizado apenas por função atômica.
- `budget_reservations` — reserva por identidade (`identity_key` opaco — hash/uuid decidido pela camada chamadora, não pelo banco): estimativa, estado `reserved|captured|released|expired`, expiração.
- `free_tier_configs` — política vigente do gratuito, só por `max_seconds_total` (segundos — a única unidade realmente aplicada; o "custo máximo" do `docs/AI_COST_MODEL.md` §4 é ilustrativo, não uma segunda trava separada por imprecisão de centavos numa base tão pequena). Seed: `anonymous` (45s), `verified_email` (180s, não renovável), `native_caption` (0s, sem custo de IA). A copy pública lê daqui, nunca hardcoded.
- `quota_counters` / `quota_consumption_entries` — contador durável por `bucket`+`window_key` opacos (usuário, IP, sessão, global, plataforma — quem/qual janela é decisão de quem chama, o banco só garante atomicidade) mais um log append-only para idempotência/auditoria de cada consumo individual.
- `abuse_signals` / `abuse_events` — **ainda não entregue** (sem lógica de detecção de abuso real para escrever neles ainda; chega junto com a Onda 4/5 quando existir tráfego real pra detectar).

### Jobs e mídia (Onda 4)

- `transcription_jobs` — a fila e o estado. Colunas-chave: `workspace_id`, `created_by`, `source_kind: url|upload`, `media_source_id`, estado (enum da máquina canônica em `packages/contracts`), `priority`, `idempotency_key` (única), `lease_expires_at`, `heartbeat_at`, `retry_count`, `next_attempt_at`, `dead_letter boolean`, `cancel_requested_at`, `budget_reservation_id`, `error_code/error_detail` (sem conteúdo sensível).
- `job_steps` — transições auditáveis: job, de→para, timestamp, ator (web|worker|admin), duração.
- `job_attempts` — tentativa n, worker id, resultado, métricas.
- `media_sources` — URL normalizada (hash para dedup), plataforma, metadados públicos (título, duração, idioma, thumbnail), ou referência de upload.
- `media_assets` — objetos no storage temporário: bucket, chave, MIME real, tamanho, checksum, TTL, estado de limpeza.
- `platform_adapters` — registro operacional por plataforma: flag, status (`active|degraded|disabled`), risco, última verificação.

### Transcript e derivados (Onda 4/6/7)

- `transcripts` — 1 por job concluído; idioma detectado/informado, fonte (`native_captions|ai`), versão bruta preservada.
- `transcript_segments` — segmento com `start_ms`, `end_ms`, texto, `speaker_id`, índice; edições não destroem o original (versionamento).
- `speakers` — rótulos por transcript, renomeáveis.
- `transcript_versions` — snapshot por salvamento significativo (editor).
- `generated_artifacts` / `artifact_versions` — resumo, capítulos, citações, tradução etc. como artefatos separados e versionados; nunca sobrescrevem transcript.
- `exports` — pedidos de exportação: formato, opções, estado, objeto gerado (TTL).
- `folders` / `folder_items`, `shares` (token hash, escopo read|edit, validade, revogação), `comments`/`notes`, `glossaries` / `glossary_terms`, `templates`.

### Plataforma e governança (transversal)

- `feature_flags` — flags dinâmicas de servidor (complementam as de build); fallback seguro = desligado.
- `app_settings` — configuração operacional versionada (orçamentos, políticas do free, modelos ativos).
- `model_configs` — modelos de IA por operação/ambiente (nome, provider, custo de referência, ativo) — nomes de modelo não ficam hardcoded no código.
- `prompt_versions` — prompts versionados por operação, com hash e data de ativação.
- `api_keys` (Onda 11) — hash da chave, prefixo exibível, scopes, última utilização, revogação.
- `webhook_endpoints` / `webhook_deliveries` (Onda 11) — assinatura por segredo, retries com backoff, status.
- `analytics_events` — catálogo fechado, pseudonimizado, com retenção curta (ver `docs/ANALYTICS_EVENTS.md`).
- `audit_logs` — ações administrativas e sensíveis: ator, ação, alvo, timestamp, sem payload de conteúdo.
- `platform_admins` — **entregue na Onda 3 fatia 3.3**: allowlist global (`user_id` → `auth.users`), não confundir com `workspace_members.role` (que é por workspace). É a base do `/admin` — "papel em banco" verificado só no servidor com `service_role`, nunca RLS no client (regra 6 abaixo). Sem seed: o primeiro admin é inserido manualmente (`docs/HANDOFF.md` tem o comando).
- `integrations` (Onda 11), `seo_pages`/`seo_localizations` (Onda 10, se houver CMS), `support_cases` (opcional).

## Estratégia de RLS

Princípios:

1. **Deny by default.** Tabela sem policy = inacessível para `anon`/`authenticated`.
2. **Membership é a chave.** Quase toda policy deriva de `workspace_members` (função `is_workspace_member(workspace_id, min_role)` STABLE, `SECURITY DEFINER`, `search_path` fixo).
3. **Papel controla escrita.** viewer lê; editor cria/edita conteúdo; admin gerencia membros; owner gerencia billing e exclusão.
4. **Tabelas financeiras e de quota são só-servidor.** `credit_ledger_entries`, `usage_ledger_entries`, `budget_*`, `quota_*`, `payment_events`, `abuse_*`: `revoke all` de anon/authenticated; acesso apenas via funções `SECURITY DEFINER` ou service role. Leitura do próprio ledger pelo usuário passa por view/função filtrada. `plans`/`prices`/`credit_accounts` também nasceram só-servidor na fatia 3.1 (deny-by-default, regra 1) porque nenhuma UI os lê ainda — a policy de leitura pública de `plans`/`prices` (como `feature_flags`) e a de saldo do próprio workspace em `credit_accounts` entram na mesma PR que ligar o primeiro consumidor real.
5. **Share por token nunca abre a tabela.** Acesso público de share resolve via função que valida token hash + validade + escopo e retorna somente o conteúdo compartilhado.
6. **Admin não é RLS bypass no client.** Rotas admin usam service role no servidor após verificação de papel; nenhuma policy "is_admin" para acesso amplo via client.
7. **Toda migration com RLS nasce com teste** (usuários A/B, papéis, negativas) — CI roda contra Postgres efêmero.

## Funções SQL atômicas (contratos)

**Entregues na Onda 2 fatia 2.1** (`supabase/migrations/0001_initial_schema.sql`, `0002_workspace_rls.sql`, testadas em `supabase/tests/`):

| Função/trigger | Responsabilidade |
|---|---|
| `handle_new_user()` (trigger `after insert on auth.users`) | cria `profiles` + workspace pessoal atomicamente no signup |
| `handle_new_workspace()` (trigger `after insert on public.workspaces`) | insere o criador como `owner` em `workspace_members` — vale para o workspace pessoal e para qualquer workspace de time criado depois |
| `workspace_role_rank(role)` | ordena a hierarquia viewer<editor<admin<owner para comparação |
| `is_workspace_member(workspace_id, min_role)` | `SECURITY DEFINER`/`STABLE`, único ponto de verdade sobre pertencimento e papel mínimo — toda policy de workspace* depende dela |

**Entregues na Onda 3 fatia 3.1** (`supabase/migrations/0003`–`0005`, testadas em `supabase/tests/07`–`10`):

| Função | Responsabilidade | Chamada por |
|---|---|---|
| `consume_quota(bucket, window, units, limit, idempotency_key, ...)` | contador durável com janela, `FOR UPDATE`, idempotente | web (server) e worker |
| `ledger_append(credit_account_id, kind, amount_seconds, idempotency_key, ...)` | lançamento de crédito idempotente; saldo em `credit_accounts` é cache mutado só aqui | web/worker |
| `reserve_free_budget(envelope, period_start, period_end, identity_key, estimated_cost_cents_brl, idempotency_key, ...)` | reserva atômica contra `budget_periods`, `FOR UPDATE`, idempotente | web (server) |
| `capture_budget_reservation(reservation_id, actual_cost_cents_brl, ...)` | reconciliação: reserved→consumed pelo custo real, devolve excedente, grava `usage_ledger_entries` | worker (via `complete_job`, Onda 4) |
| `release_budget_reservation(reservation_id, reason)` | refund integral de reserva não capturada (job falhou/cancelou/expirou), idempotente | worker (via `fail_job`, Onda 4) |

**Planejadas para as próximas ondas** (a Onda 4 monta `transcription_jobs` e passa a chamar as funções acima de dentro de `claim_next_job`/`complete_job`/`fail_job`, em vez de duplicar a lógica de orçamento/quota):

| Função | Responsabilidade | Chamada por |
|---|---|---|
| `reserve_free_budget_and_enqueue(...)` | `reserve_free_budget` + criação do job na mesma transação — só existe quando `transcription_jobs` existir | web (server) |
| `claim_next_job(worker_id, capabilities)` | `FOR UPDATE SKIP LOCKED`, lease, incrementa tentativa | worker |
| `heartbeat_job(job_id, worker_id)` | renova lease | worker |
| `complete_job(job_id, ...)` / `fail_job(job_id, ...)` | transição validada + chama `capture_budget_reservation`/`release_budget_reservation` + ledger | worker |
| `apply_payment_event(...)` | idempotência por `provider_event_id`, concede créditos/entitlements | webhook handler |

Todas: `SECURITY DEFINER`, `set search_path = public`, `revoke` de public/anon/authenticated, `grant` só a `service_role` (exceto as que o usuário autenticado chama legitimamente, avaliadas caso a caso — nenhuma das entregues até agora tem essa exceção).

## Retenção

- mídia temporária: TTL horas–dias (config), exclusão automática (job de limpeza);
- transcripts: persistem até exclusão pelo usuário; exclusão de conta → fila de deleção + tombstone em `audit_logs` sem conteúdo;
- `analytics_events`: retenção 90 dias com poda na escrita;
- exports: TTL curto;
- backups: documentar limitação de propagação de deleção (LGPD/GDPR) na política de privacidade.
