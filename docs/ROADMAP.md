# Roadmap — plano em ondas e fatias verticais mergeáveis

Criado na Onda 0 em 2026-08-03. Ordem de dependências obrigatória (prompt-mestre §25). Cada fatia deixa o repositório estável, testável e mergeável; nenhuma abre frente que não fecha.

Legenda: ✅ concluída · 🔄 em andamento · ⬜ pendente

## Onda 0 — Descoberta e governança 🔄

Inventário, auditoria do Stitch, pesquisa (repos do dono + comunidade + docs oficiais), arquitetura, threat model, modelo de dados, estratégia de RLS/jobs/upload/SSRF, governança de custo, SEO, design system, skills locais, este plano.

**Critério de aceite:** documentos canônicos reais criados; skills operacionais; decisões registradas; handoff atualizado; PR mergeável.

## Onda 1 — Fundação do monorepo

| Fatia | Conteúdo | Aceite |
|---|---|---|
| 1.1 Workspace + web mínima | pnpm workspaces + Turborepo; `apps/web` Next.js 16 (TS estrito, Tailwind 4, App Router) com i18n en/pt-br/es e páginas honestas mínimas; `packages/config`; `packages/contracts`; `packages/i18n`; CI; `.env.example` | lint, typecheck, test e build verdes; app roda sem credenciais |
| 1.2 Design tokens + `packages/ui` base | tokens, Button, Input, URLInput, Badge, Alert, Skeleton com estados + testes + axe | checks verdes e axe sem violações |
| 1.3 Observabilidade base | `packages/observability`, logger estruturado com redação, request-id, healthcheck | log sem campos proibidos |

## Onda 2 — Auth, workspaces e RLS

2.1 Supabase local + migration inicial (profiles, workspaces, members, invites, feature_flags, app_settings) + RLS + testes. 2.2 Auth SSR. 2.3 Dashboard autenticado mínimo + admin base.

**Gate:** testes RLS A/B; nenhum acesso cruzado; service role fora do bundle.

## Onda 3 — Billing, ledger, quota e governador de custo

3.1 Migrations de planos, créditos, uso, orçamento e quota. 3.2 testes de custo/abuso. 3.3 provider fake/webhook idempotente/admin. 3.4 Turnstile + rate limits.

**Gate:** cenários bloqueantes de custo e abuso passando antes de OpenAI ou pagamento real.

## Onda 4 — Upload e pipeline local (sem OpenAI real)

### 4.1 — Storage e upload

StoragePort local/S3-compatible, upload assinado, quarentena, limites e MIME sniffing.

### 4.2a — Fila de transcrição

`transcription_jobs`, claim, heartbeat, transições, complete/fail, retries e idempotência.

### 4.2b — Enfileiramento pós-upload

Upload validado cria `transcription_job` real, protegido por quota de enqueue.

### 4.2c — Worker Python + FFmpeg + provider fake

Implementar o ciclo `claim_next_job` → adquirir mídia → `ffprobe` → reservar orçamento → pipeline fake → `complete_job`/`fail_job`.

Além do aceite principal, o worker deve nascer compatível com renderização posterior, sem implementar o recurso completo:

- runner/porta de FFmpeg testável;
- progresso, heartbeat, timeout, cancelamento cooperativo e cleanup;
- limites de CPU, memória, disco, duração e bytes;
- telemetria comum de mídia: operação, duração, wall time, tentativas, bytes, codec, frame rate e resolução;
- storage temporário capaz de receber futuros outputs;
- fixture simples de inserção de legenda somente se não ampliar materialmente a fatia.

Não entram aqui: editor de legendas, `render_jobs`, checkout, billing de renderização ou exportação MP4 para usuário.

### 4.3 — UI de processamento

Etapas reais, `aria-live`, cancelamento, transcript fixture e primeira RLS de leitura de jobs por workspace.

**Gate:** upload → job → worker fake → transcript de ponta a ponta; cleanup; idempotência; cancelamento; timeout. As obrigações arquiteturais de mídia em `docs/CAPTIONED_VIDEO_EXPORT.md` precisam estar refletidas no desenho do worker.

## Onda 5 — OpenAI real

Transcrição real atrás de flags, chaves free/paid separadas, chunking, timestamps, diarização opcional, telemetria de custo, retries finitos e kill switches.

## Onda 6 — Editor e exports

### 6.1 — Editor de transcrição e player sincronizado

Segmentos editáveis e versionados, speakers, busca/substituição, autosave, atalhos e mobile.

### 6.2 — Exports de texto e arquivos de legenda

TXT, Markdown, DOCX, PDF, SRT, VTT e JSON, com opções validadas e outputs temporários.

### 6.3 — Prévia de legenda no vídeo

Módulo visualmente secundário abaixo da transcrição; overlay no navegador; até aproximadamente 15 segundos; timestamps reais; presets, fontes, cores, posição e reset; mobile, acessibilidade, cache/idempotência e analytics sem PII. Não criar timeline ou editor avançado.

### 6.4 — Renderização do vídeo completo

Criar o domínio real de renderização somente aqui: `render_jobs` separado de `transcription_jobs`, presets/settings versionados, FFmpeg, MP4, áudio preservado, 720p/1080p conforme entitlement, progresso, cancelamento seguro, retry finito, reserva/reconciliação de custo, provider fake/entitlement de teste, URL assinada, TTL, cleanup e feature flags.

A renderização paga permanece desligada até os gates da Onda 9. Schema significativo exige revisão explícita antes da migration.

## Onda 7 — Inteligência derivada

Prompts versionados + Structured Outputs; resumo, capítulos, citações, tradução, formatos; quotas, caching e artefatos versionados.

## Onda 8 — Link adapters

Interface de adapter + suíte SSRF completa + metadados + legendas nativas; fontes verificadas; fallback upload; admin de saúde por plataforma.

## Onda 9 — Monetização completa

### 9.1 — Fundação de billing real

Provider em test mode, checkout server-side, webhooks idempotentes, invoices, refunds, chargebacks e reconciliação.

### 9.2 — Monetização da transcrição

Conclusão avulsa, pacotes de créditos, assinaturas e retomada de job após pagamento.

### 9.3 — Quote e compra avulsa de vídeo legendado

Quote autoritativo no servidor baseado em duração, resolução, codec, frame rate, complexidade, processamento, storage, egress, retries, gateway, impostos e reserva operacional; política configurável sem valores finais hardcoded; compra/captura somente server-side; retomada idempotente do render.

### 9.4 — Pacotes, planos e benefício gratuito de renderização

Pacotes de minutos, franquia de plano, 1080p, presets extras, prioridade e lote nos planos adequados. Primeira exportação gratuita: uma vez por conta verificada, até 2 minutos, 720p, presets limitados, sujeita a entitlement durável, Turnstile, orçamento global, estados Normal/Economy/Restricted/Blocked, concorrência e sinais de abuso. IP é sinal secundário, nunca identidade única.

### 9.5 — Analytics e experimentos comerciais

Funil de preview → quote → checkout → compra → render → download; experimentos de preço sem deploy; comparação explícita entre minutos separados, créditos únicos e modelo combinado antes da decisão final.

## Onda 10 — Site público e SEO

Homepage, features, pricing, API, soluções, ferramentas, páginas de plataforma/resultado, blog/help, sitemaps/hreflang/schema e Lighthouse CI.

A funcionalidade de vídeo legendado entra de forma secundária em features, pricing, FAQ, páginas de legendas/exports e ferramentas relevantes. Não alterar a tese principal da homepage e não usar “pronto para publicar”. Copy aceitável:

> Exporte como texto, SRT, VTT ou vídeo com as legendas inseridas.

## Onda 11 — Equipes, compartilhamento, integrações e API pública

Shares, teams/roles, API keys, `/api/v1`, webhooks e integrações. Exposição pública de renderização só depois de o domínio e billing estarem estáveis.

## Onda 12 — Hardening e lançamento

Auditorias de segurança, acessibilidade, SEO, custo/abuso e carga; visual regression; runbook; launch checklist; staging.

## Regras transversais

- Uma onda pode começar antes da anterior estar 100% somente quando a dependência real já estiver entregue.
- Toda fatia: typecheck, lint, testes, build, docs e HANDOFF atualizados; PR independente.
- OpenAI real, pagamentos reais, adapters públicos, DNS/produção e migrations significativas de renderização exigem gates e autorização/revisão explícita.
- Exportação de vídeo legendado é P1 comercial; somente suas incompatibilidades arquiteturais são P0 durante a Onda 4.
