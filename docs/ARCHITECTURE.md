# Arquitetura — PasteScribe

Criado na Onda 0 em 2026-08-03. Válido até substituição registrada em `docs/DECISIONS.md`.

Versões-base: Next.js 16.2.x, Tailwind CSS 4.3.x, `@supabase/ssr`, PostgreSQL/Supabase, Node 22, Python 3.11+.

## Visão geral

Dois planos de execução, um banco como fonte de verdade:

```text
USUÁRIO
  │ HTTPS
  ▼
apps/web — Next.js/Vercel
  · páginas públicas, dashboard, editor e admin
  · auth SSR/cookies
  · rotas server-side de autorização, quota, billing e criação de jobs
  · nunca executa download longo, FFmpeg ou processamento pesado
  │ SQL/RPC
  ▼
Supabase — Postgres/Auth/RLS
  · workspaces, jobs, transcripts, ledger, orçamento, quota, flags
  · fila durável em tabelas de domínio + funções atômicas
  ▲ poll/claim/heartbeat/resultados
  │
apps/worker — Python/FastAPI/FFmpeg
  · ingestão autorizada, ffprobe/FFmpeg, normalização e providers
  · operações longas, lease, progresso, retries, cancelamento e cleanup
  │ S3-compatible
  ▼
Storage temporário
  · dev local; produção alvo R2
  · URLs assinadas, TTL e exclusão automática
```

Serviços externos ficam atrás de provider fake e kill switch: OpenAI, billing, Turnstile e e-mail.

## Monorepo

```text
pastescribe/
├── apps/web
├── apps/worker
├── packages/config
├── packages/contracts
├── packages/ui
├── packages/database
├── packages/ai
├── packages/billing
├── packages/storage
├── packages/analytics
├── packages/i18n
├── packages/observability
├── supabase
├── docs
└── scripts
```

Ferramentas: pnpm/Turborepo, uv, FFmpeg, Docker quando disponível e Supabase CLI/PostgreSQL nativo para migrations/testes.

## Web na Vercel, processamento fora

A web valida, autoriza, reserva, enfileira e lê estado. Funções da Vercel não fazem scraping, download de mídia, FFmpeg nem chamadas longas.

## Filas e domínios de jobs

### Transcrição

`transcription_jobs` é específico do domínio de transcrição, com claim atômico `FOR UPDATE SKIP LOCKED`, lease/heartbeat, retries finitos, dead-letter, prioridade e idempotência.

### Renderização futura de vídeo legendado

Não generalizar `transcription_jobs` e não forçar renderização dentro dela.

Decisão de planejamento:

- a Onda 6.4 criará `render_jobs` separados somente quando houver consumidor real;
- transcrição e renderização podem compartilhar runtime do worker, portas de execução, storage, ledger de uso e observabilidade;
- cada domínio preserva estados, autoridade financeira, inputs, outputs, idempotência, retries, cancelamento e TTL próprios;
- uma fila física comum, se necessária, fica atrás de adapters/QueuePorts e não transforma os modelos de domínio numa tabela genérica;
- nenhuma migration de renderização entra durante o planejamento ou na fatia 4.2c.

Revisão explícita antes da primeira migration de `render_jobs`. Detalhes em `docs/CAPTIONED_VIDEO_EXPORT.md`.

## Runtime de mídia do worker — obrigação da Onda 4.2c

O worker deve nascer com uma abstração testável de execução de mídia, por exemplo `FFmpegPort`, sem comandos espalhados pelo domínio.

Contrato mínimo:

- probe de metadados com `ffprobe`;
- execução FFmpeg com argumentos permitidos, timeout e processo isolado;
- callbacks/eventos de progresso estruturado;
- heartbeat de lease independente do parsing de stdout;
- cancelamento cooperativo quando seguro;
- limites de CPU, memória, disco, duração e bytes de output;
- diretório temporário por operação;
- cleanup em sucesso, falha, cancelamento e timeout;
- execução sem rede para processamento de arquivos locais;
- códigos de erro estáveis e retries finitos;
- fixtures pequenas e determinísticas.

Isso é P0 arquitetural porque o worker ainda não existe. Não autoriza construir editor, checkout, presets ou renderização completa na Onda 4.

## Storage temporário

`StoragePort` atual oferece upload presignado, metadata, range e delete. Ele continua válido para a ingestão.

A evolução para outputs deve acontecer quando houver consumidor real, sem transformar `media_assets` prematuramente em tabela genérica. O domínio futuro de renderização precisa conseguir:

- gravar output por key opaca;
- obter metadata/checksum;
- emitir GET assinado de curta duração;
- registrar TTL;
- deletar idempotentemente;
- distinguir original, temporário de processamento e output final temporário.

Original e output não são permanentes por padrão.

## Orçamento e ledger

### Transcrição gratuita

A duração real é descoberta pelo worker; só então `reserve_job_budget` reserva orçamento de IA e avança o job.

### Renderização

Renderização não é chamada de IA. Custos de CPU, memória, disco, storage e egress pertencem a categoria separada de mídia/processamento.

Quando implementada:

- quote, entitlement, reserva e captura são server-side;
- uso de transcrição e renderização permanece categorizado separadamente;
- falha interna libera/estorna reserva;
- retries e reload não cobram novamente;
- orçamento free de renderização pode ser suspenso sem afetar paid.

Não criar tabelas/colunas antes da Onda 6.4/9.

## Estados da transcrição

A máquina canônica vive em `packages/contracts`. O worker Python porta a mesma regra e não inventa transições.

```text
created → validating → awaiting_user_confirmation → queued
  → resolving_metadata → fetching_captions → acquiring_media
  → extracting_audio → normalizing_audio → transcribing
  → diarizing → postprocessing → indexing → completed
qualquer ativo → failed | cancel_requested → cancelled
queued/awaiting → expired
```

Estados de renderização serão definidos separadamente quando o schema existir.

## Ingestão de links

Adapters por plataforma, allowlist, SSRF completa e ativação por flag. Nenhum fetch genérico de URL arbitrária. Upload é o fallback universal.

## Autenticação e autorização

- Supabase Auth com cookies;
- RLS por workspace;
- service role apenas no servidor/worker;
- admin verificado server-side;
- API keys futuras com hash e scopes.

Quote, preço, entitlement, saldo, resolução autorizada e compra nunca são aceitos como autoridade do client.

## Comunicação web ↔ worker

Estado compartilhado passa pelo banco. Endpoints internos de health/readiness/cancel-hint exigem autenticação interna. Egress do worker é restrito.

## Ambientes

| Ambiente | Web | Banco | Worker | Providers |
|---|---|---|---|---|
| local | pnpm dev | Postgres/Supabase local | worker local | fake |
| test/CI | build/testes | Postgres efêmero | pytest/fixtures | fake |
| preview | Vercel preview | Supabase dev | opcional | fake por padrão |
| production | Vercel | Supabase | container host | reais atrás de flags |

## Observabilidade

Logs usam request/job/operation id e nunca incluem transcript, legenda, e-mail, URL privada/assinada ou token.

Métricas de transcrição:

- profundidade e latência de fila;
- etapa, retries, dead-letter;
- custo estimado/real por modelo.

Métricas comuns de mídia, obrigatórias desde 4.2c:

- `operation_kind`;
- wall time;
- CPU aproximada quando disponível;
- memória e disco máximos;
- duração;
- bytes de entrada/saída;
- codec, frame rate, largura e altura;
- tentativas, timeout, cancelamento e resultado.

## O que esta arquitetura proíbe

- chamada paga em reload, mount ou duplo clique;
- processamento pesado na Vercel;
- scraping evasivo/DRM/conteúdo privado;
- mídia permanente ou pública por padrão;
- renderização dentro de `transcription_jobs` por conveniência;
- schema genérico sem consumidor real;
- preço, crédito, papel, entitlement ou pagamento concedidos pelo client;
- segredo no client;
- mudança de schema fora de migration.
