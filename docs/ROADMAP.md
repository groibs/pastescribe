# Roadmap — plano em ondas e fatias verticais mergeáveis

Criado na Onda 0 em 2026-08-03. Cada fatia deixa o repositório testável e mergeável.

Legenda: ✅ concluída · 🔄 em andamento · ⬜ pendente

## Ondas 0–3 — fundação ✅/🔄

- Onda 0: governança e documentos canônicos.
- Onda 1: monorepo, web, design system e observabilidade base.
- Onda 2: Auth, workspaces e RLS.
- Onda 3: ledger, orçamento, quota e admin; Turnstile/rate limits continuam pendentes antes da abertura pública do free.

## Onda 4 — Upload e pipeline local

### 4.1 — Storage e upload ✅

StoragePort local/S3-compatible, upload assinado, quarentena, limites e MIME sniffing.

### 4.2a — Fila de transcrição ✅

`transcription_jobs`, claim, heartbeat, transições, retry, complete/fail e idempotência.

### 4.2b — Enfileiramento pós-upload ✅

Upload validado cria job real, protegido por quota de enqueue.

### 4.2c-a — Fundação Python/FFmpeg ✅

Runner testável, limites, cleanup, provider fake, container non-root, telemetria e CI Python.

### 4.2c-b — Adapters Supabase/R2/custo ✅

Ports estreitas, PostgREST/RPC, storage local/S3 por streaming, estimativa e configuração fail-closed.

### 4.2c-c — Transcript persistido e ciclo completo 🔄

- `transcripts` e `transcript_segments` privados;
- persistência idempotente;
- conclusão atômica com captura de orçamento;
- cancelamento com liberação de reserva;
- polling, heartbeat e orquestrador;
- ciclo fake completo;
- pgTAP, testes Python, lint, typecheck, build e Vercel como gate.

Não entram: OpenAI real, host de produção, `render_jobs`, editor ou checkout.

### 4.3a — Leitura segura e UI de processamento ⬜

- policies SELECT por workspace para jobs, steps e transcripts;
- testes RLS usuário A/B;
- página autenticada de status;
- etapas reais, `aria-live` e polling sem custo;
- cancelamento server-side;
- transcript fake somente leitura;
- estados `awaiting_user_confirmation`, retry, error, cancelled e completed.

### 4.3b — Fechar fluxo web local ⬜

Conectar upload UI → job → status → transcript, estados de retomada e testes de acessibilidade. Editor avançado permanece na Onda 6.

**Gate da Onda 4:** upload → enqueue → worker fake → transcript persistido → UI, com cleanup, idempotência, cancelamento e timeout.

## Onda 5 — OpenAI real ⬜

Transcrição real atrás de flags, chaves free/paid separadas, chunking, timestamps, diarização opcional, telemetria, retries e kill switches.

## Onda 6 — Editor e exports ⬜

### 6.1 — Editor e player sincronizado

Segmentos editáveis/versionados, speakers, busca/substituição, autosave, atalhos e mobile.

### 6.2 — Exports de texto/legenda

TXT, Markdown, DOCX, PDF, SRT, VTT e JSON.

### 6.3 — Prévia de legenda no vídeo

Módulo secundário; overlay no navegador; até ~15 s; timestamps reais; presets/fontes/cores/posição; acessibilidade e analytics sem PII.

### 6.4 — Renderização completa

`render_jobs` separado, presets/settings versionados, FFmpeg, MP4, áudio, 720p/1080p, progresso, cancelamento, retry, custo, provider fake/entitlement, URL assinada, TTL e flags. Primeira migration exige revisão explícita.

## Onda 7 — Inteligência derivada ⬜

Resumo, capítulos, citações, tradução e formatos via prompts/outputs versionados.

## Onda 8 — Link adapters ⬜

Adapters por plataforma, SSRF, metadados, legendas nativas e fallback upload.

## Onda 9 — Monetização completa ⬜

- 9.1 billing real em test mode, webhooks, refunds/chargebacks/reconciliação;
- 9.2 transcrição avulsa, pacotes, planos e retomada;
- 9.3 quote/compra avulsa de vídeo legendado;
- 9.4 pacotes, planos e benefício gratuito de renderização;
- 9.5 analytics/experimentos e decisão de unidade comercial.

## Onda 10 — Site público e SEO ⬜

Homepage, features, pricing, ferramentas, conteúdo e SEO. Vídeo legendado entra de forma secundária, sem alterar **Paste any video. Get useful text.**

Copy aceitável:

> Exporte como texto, SRT, VTT ou vídeo com as legendas inseridas.

## Onda 11 — Equipes, integrações e API ⬜

Shares, teams/roles, API keys, `/api/v1`, webhooks e integrações.

## Onda 12 — Hardening e lançamento ⬜

Segurança, acessibilidade, SEO, custo/abuso, carga, visual regression, runbook, staging e checklist.

## Regras transversais

- dependência real entregue antes da próxima fatia;
- toda PR: lint, typecheck, testes, build, docs e handoff;
- OpenAI, pagamentos, adapters públicos, DNS/produção e render schema exigem gates explícitos;
- vídeo legendado é P1 comercial; somente compatibilidade arquitetural é P0 na Onda 4.
