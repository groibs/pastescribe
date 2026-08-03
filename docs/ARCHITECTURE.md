# Arquitetura — PasteScribe

Criado na Onda 0 em 2026-08-03. Válido até substituição registrada em `docs/DECISIONS.md`.

Versões validadas na pesquisa da Onda 0 (`docs/RESEARCH_REPORT.md`): Next.js 16.2.x, Tailwind CSS 4.3.x, `@supabase/ssr`, Supabase Queues/pgmq, Node 22, Python 3.11+.

## Visão geral

Dois planos de execução, um banco como fonte de verdade:

```text
┌────────────────────────────────────────────────────────────────────┐
│                            USUÁRIO                                 │
│        navegador (site público, dashboard, editor, admin)          │
└──────────────┬─────────────────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼─────────────────────────────────────────────────────┐
│  apps/web — Next.js App Router (Vercel)                            │
│  · páginas públicas com SSG/SSR + i18n (en, pt-BR, es)             │
│  · auth via @supabase/ssr (cookies; sem token no client storage)   │
│  · rotas server-side: criação de job, billing, quota, admin        │
│  · NUNCA: download de mídia, FFmpeg, chamadas longas, segredos     │
│    no bundle                                                       │
└───────┬──────────────────────────────┬─────────────────────────────┘
        │ SQL/RPC (anon+RLS ou         │ enqueue (RPC atômica:
        │ service role só no server)   │ reserva orçamento + job)
┌───────▼──────────────────────────────▼─────────────────────────────┐
│  Supabase (PostgreSQL + Auth + RLS + Storage pequeno)              │
│  · fonte de verdade: perfis, workspaces, jobs, transcripts,        │
│    ledger de créditos, ledger de uso, reservas de orçamento,       │
│    quotas duráveis, feature flags, app_settings                    │
│  · fila durável de jobs em tabela própria (claim atômico via       │
│    FOR UPDATE SKIP LOCKED; migração futura p/ pgmq sem mudar       │
│    domínio — interface QueuePort)                                  │
│  · funções SECURITY DEFINER p/ quota, reserva, ledger, claim       │
└───────▲──────────────────────────────▲─────────────────────────────┘
        │ poll/claim + heartbeat       │ resultados, custo real,
        │ (service role, egress        │ transições de estado
        │ restrito)                    │
┌───────┴──────────────────────────────┴─────────────────────────────┐
│  apps/worker — Python 3.11+/FastAPI em container (host a definir:  │
│  Railway/Render/Fly/VPS — código agnóstico de provedor)            │
│  · ingestão de URL (adapters com allowlist + proteção SSRF)        │
│  · download autorizado, ffprobe/FFmpeg, normalização de áudio      │
│  · transcrição via provider (fake local | OpenAI)                  │
│  · pós-processamento, segmentação, timestamps, diarização          │
│  · idempotência, lease/heartbeat, retries finitos, cancelamento    │
│  · limpeza de arquivos temporários (TTL curto)                     │
└───────┬────────────────────────────────────────────────────────────┘
        │ S3-compatible (URLs assinadas, TTL)
┌───────▼────────────────────────────────────────────────────────────┐
│  Storage de mídia temporária                                       │
│  · dev: MinIO/filesystem local  · prod: Cloudflare R2 (a ativar)   │
│  · mídia NUNCA é permanente por padrão; exclusão automática        │
└────────────────────────────────────────────────────────────────────┘

Serviços externos (todos atrás de kill switch e provider fake local):
· OpenAI (transcrição + Responses/Structured Outputs) — chaves free e
  paid separadas, só no worker/servidor
· Stripe test mode (billing) — abstração BillingPort
· Cloudflare Turnstile (anti-abuso pré-operação paga)
· e-mail transacional (a definir; fake local até lá)
```

## Monorepo

```text
pastescribe/
├── apps/
│   ├── web/            # Next.js 16 App Router, TS estrito, Tailwind 4
│   └── worker/         # Python (uv), FastAPI, FFmpeg — a partir da Onda 4
├── packages/
│   ├── config/         # env tipada (zod) + feature flags centralizadas
│   ├── contracts/      # schemas zod: estados de job, eventos, DTOs
│   ├── ui/             # design system (a partir da Onda 1/6)
│   ├── database/       # tipos gerados do Supabase + helpers
│   ├── ai/             # AIProviderPort: fake local | openai
│   ├── billing/        # BillingPort: fake local | stripe test
│   ├── storage/        # StoragePort: local | s3-compatible
│   ├── analytics/      # catálogo fechado de eventos sem PII
│   ├── i18n/           # mensagens en/pt-BR/es + helpers de locale
│   └── observability/  # logger estruturado sem PII, request/job id
├── supabase/           # config.toml, migrations, seed — a partir da Onda 2
├── content/            # seo/blog/help por locale — a partir da Onda 10
├── docs/               # canônicos
├── .claude/            # memória operacional + skills
├── scripts/
├── stitch-reference/
├── pnpm-workspace.yaml
└── turbo.json
```

Ferramentas: `pnpm` (workspaces), Turborepo (tarefas), `uv` (Python), Docker (worker e serviços locais), Supabase CLI (migrations/local).

## Decisões estruturais

### Web na Vercel, processamento fora

Funções da Vercel não fazem scraping, download, FFmpeg nem chamadas longas. A web só: valida, autoriza, reserva orçamento, enfileira e lê estado. Todo trabalho pesado é do worker.

### Fila durável no PostgreSQL

Início: tabela `transcription_jobs` + função SQL de claim com `FOR UPDATE SKIP LOCKED`, lease com heartbeat, `next_attempt_at`, `retry_count`, dead-letter, prioridade, cancelamento e `idempotency_key` única por operação lógica. Sem Redis.

O worker consome via `QueuePort` (interface estreita: `claim`, `heartbeat`, `complete`, `fail`, `cancel`). Se um dia migrar para pgmq/Supabase Queues ou outro sistema, muda o adapter, não o domínio. Justificativa: custo zero adicional, transacional com o resto do estado (reserva de orçamento + job na mesma transação), suficiente para o volume inicial.

### Reserva de orçamento antes de qualquer job gratuito

Sequência obrigatória, numa única transação SQL (função `SECURITY DEFINER`):

1. estimar custo máximo (duração × tarifa do modelo × fator de segurança);
2. validar orçamento diário e mensal do free (`budget_periods`);
3. validar quota individual, por IP e concorrência (`quota_counters`);
4. inserir `budget_reservations` (estado `reserved`);
5. inserir job `queued` com `idempotency_key`.

Falhou qualquer passo → nada é criado (fail-closed). Job concluído → reconciliação: custo real registrado em `usage_ledger_entries`, excedente da reserva liberado. Falha do sistema → reserva liberada, sem cobrança ao usuário. Contador crítico indisponível → operação gratuita negada (fail-closed), pagos seguem por caminho próprio.

### Free e paid separados

- chaves/projetos OpenAI distintos (`OPENAI_FREE_*`, `OPENAI_PAID_*`);
- kill switches independentes (`free_ai_enabled`, `openai_enabled`);
- fila com prioridade: paid nunca espera esgotamento do free;
- orçamento do free nunca bloqueia job pago (jobs pagos debitam créditos do usuário via ledger, não o orçamento do produto).

### Estados do job (máquina canônica)

```text
created → validating → awaiting_user_confirmation → queued
  → resolving_metadata → fetching_captions → acquiring_media
  → extracting_audio → normalizing_audio → transcribing
  → diarizing → postprocessing → indexing → completed
qualquer estado ativo → failed | cancel_requested → cancelled
queued/awaiting → expired (TTL)
```

Transições validadas no servidor, registradas em `job_steps` com timestamps, e auditáveis. O schema canônico vive em `packages/contracts` e é a única fonte para web e worker.

### Ingestão de links por adapters

Interface por plataforma (`canHandle`, `validate`, `resolveMetadata`, `getNativeCaptions`, `acquireAuthorizedMedia`, capacidades e `riskLevel`), ativação por feature flag. Nenhum fetch genérico de URL arbitrária. Proteção SSRF completa (ver `docs/THREAT_MODEL.md`). Nenhum adapter é ativado antes de pesquisa técnica/jurídica específica por plataforma (Onda 8); upload manual é o fallback universal e chega antes (Onda 4).

### Autenticação e autorização

- Supabase Auth com `@supabase/ssr` (cookies), magic link + Google + senha opcional;
- RLS ativa em toda tabela exposta; usuário só vê workspaces dos quais participa;
- service role apenas em servidor/worker; nunca em bundle;
- admin validado server-side por papel em banco, não por UI;
- API keys (Onda 11) com hash + scopes, exibidas uma única vez.

### Comunicação web ↔ worker

O worker não expõe endpoints públicos de negócio. Estado compartilhado passa pelo banco. Endpoints internos do worker (health/readiness/cancel-hint) exigem HMAC com segredo rotacionável. Egress do worker restrito a allowlist (plataformas suportadas, OpenAI, storage).

## Ambientes

| Ambiente | Web | Banco | Worker | Providers |
|---|---|---|---|---|
| local | `pnpm dev` | Supabase CLI local | Docker local | todos fake |
| test/CI | build + testes | Postgres efêmero | testes pytest | todos fake |
| preview | Vercel preview | projeto Supabase dev | opcional | fake por padrão |
| production | Vercel | Supabase | container host | reais, atrás de flags |

Variáveis por grupo (`APP`, `SUPABASE`, `OPENAI_FREE`, `OPENAI_PAID`, `STORAGE`, `WORKER`, `TURNSTILE`, `BILLING`, `EMAIL`, `ANALYTICS`, `SENTRY`, `ADMIN`), documentadas em `.env.example`, validadas no boot por `packages/config`. Nenhum segredo com prefixo público (`NEXT_PUBLIC_*`).

## Observabilidade

- logs estruturados com `request_id`/`job_id`, sem transcript, e-mail, URL completa privada ou token;
- métricas de fila (profundidade, latência por etapa, retries, dead-letter);
- custo estimado × real por job, por modelo e por plataforma;
- Sentry (ou adapter equivalente) atrás de env; healthcheck/readiness no worker;
- painel admin lê agregados, nunca conteúdo.

## O que esta arquitetura proíbe

- chamada paga em reload, montagem, duplo clique ou texto fixo;
- scraping evasivo, DRM, conteúdo privado, contorno de bloqueio;
- mídia de terceiros armazenada permanentemente ou publicamente;
- "ilimitado" sem fair use e margem comprovada;
- segredo no client; crédito/plano/papel concedidos pelo client;
- schema alterado fora de migration.
