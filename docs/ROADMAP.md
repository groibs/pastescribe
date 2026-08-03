# Roadmap — plano em ondas e fatias verticais mergeáveis

Criado na Onda 0 em 2026-08-03. Ordem de dependências obrigatória (prompt-mestre §25). Cada fatia deixa o repositório estável, testável e mergeável; nenhuma abre frente que não fecha.

Legenda: ✅ concluída · 🔄 em andamento · ⬜ pendente

## Onda 0 — Descoberta e governança 🔄 (esta entrega)

Inventário, auditoria do Stitch, pesquisa (repos do dono + comunidade + docs oficiais), arquitetura, threat model, modelo de dados, estratégia de RLS/jobs/upload/SSRF, governança de custo, SEO, design system, skills locais, este plano.

**Critério de aceite:** documentos canônicos reais criados; skills operacionais; decisões registradas; handoff atualizado; PR mergeável.

## Onda 1 — Fundação do monorepo

| Fatia | Conteúdo | Aceite |
|---|---|---|
| **1.1 (nesta PR)** Workspace + web mínima | pnpm workspaces + Turborepo; `apps/web` Next.js 16 (TS estrito, Tailwind 4, App Router) com i18n en/pt-br/es e páginas honestas mínimas; `packages/config` (env zod + flags com fallback seguro); `packages/contracts` (máquina de estados de job, catálogo de analytics); `packages/i18n`; CI (lint, typecheck, test, build); `.env.example` | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes no CI; app roda local sem credencial nenhuma |
| 1.2 Design tokens + `packages/ui` base | tokens do `docs/DESIGN_SYSTEM.md` em Tailwind/CSS vars; Button, Input, URLInput, Badge, Alert, Skeleton com estados + testes + axe | idem + axe sem violações |
| 1.3 Observabilidade base | `packages/observability` (logger estruturado com redação), request-id middleware, healthcheck | log nunca contém campos proibidos (teste) |

## Onda 2 — Auth, workspaces e RLS

2.1 Supabase local + migration inicial (profiles, workspaces, members, invites, feature_flags, app_settings) + RLS + testes de RLS no CI. 2.2 Auth SSR (@supabase/ssr): magic link + Google + senha opcional, sessão, perfil. 2.3 Dashboard autenticado mínimo + admin base (papel server-side).

**Gate:** testes RLS A/B; nenhum acesso cruzado; service role fora do bundle.

## Onda 3 — Billing, ledger, quota e governador de custo (pré-requisito absoluto de OpenAI real)

3.1 Migrations: plans/prices, credit_accounts + ledger append-only, usage ledger, budget_periods/reservations, free_tier_configs, quota_counters + funções atômicas (`consume_quota`, `reserve_free_budget_and_enqueue`, `ledger_append`). 3.2 Testes de custo/abuso (duplo clique, reload, concorrência, orçamento encerrado, contador indisponível → fail-closed, free bloqueado + paid funcional). 3.3 Billing provider fake + webhook idempotente + admin de orçamento/kill switches. 3.4 Turnstile + rate limits.

**Gate:** todos os cenários de teste da seção 21.4 do prompt-mestre passando.

## Onda 4 — Upload e pipeline local (sem OpenAI real)

4.1 StoragePort local + upload assinado com limites/MIME sniffing. 4.2 Fila: transcription_jobs + claim/heartbeat/complete/fail + worker Python em Docker com provider fake + FFmpeg (ffprobe, normalização). 4.3 UI de processamento (etapas reais, aria-live, cancelamento) + transcript fixture no editor mínimo.

**Gate:** upload→job→worker fake→transcript de ponta a ponta local; cleanup de temporários; testes de idempotência/cancelamento/timeout.

## Onda 5 — OpenAI real

Transcrição real atrás de `openai_enabled` (chaves free/paid separadas), chunking com overlap e reconciliação de offsets, timestamps, diarização opcional, telemetria de custo real, retries finitos, kill switches testados; AI_CALL_MATRIX/AI_COST_MODEL atualizados com medições.

**Gate:** requisitos bloqueantes de `docs/PENDING_FEATURES.md` (ledger, quota durável, reserva, idempotência, rate limit, kill switch) já entregues nas Ondas 3–4.

## Onda 6 — Editor e exports

Player sincronizado, segmentos editáveis com versões, speakers, busca/substituição, autosave, atalhos, mobile; exports TXT/MD/DOCX/PDF/SRT/VTT/JSON com opções.

## Onda 7 — Inteligência derivada

Prompts versionados + Structured Outputs; resumo, capítulos, citações, tradução, formatos; quotas e caching; artefatos versionados.

## Onda 8 — Link adapters

Interface de adapter + suíte SSRF completa + metadados + legendas nativas; ativar somente fontes verificadas (pesquisa técnica/jurídica por plataforma); fallback upload; admin de saúde por plataforma.

## Onda 9 — Monetização completa

Single-job purchase, credit packs, assinaturas, checkout server-side (Stripe test), webhooks, invoices, refunds, upgrade flows.

## Onda 10 — Site público e SEO

Homepage, features, pricing, API, soluções, ferramentas client-side, páginas de plataforma/resultado com gate de qualidade, blog/help, sitemaps/hreflang/schema, Lighthouse CI.

## Onda 11 — Equipes, compartilhamento, integrações e API pública

Shares com token, teams/roles, API keys + `/api/v1` (docs/API.md), webhooks, primeiras integrações.

## Onda 12 — Hardening e lançamento

Auditorias (segurança, acessibilidade, SEO, custo/abuso, carga), visual regression, runbook, launch checklist, staging.

## Regras transversais

- Uma onda pode começar antes da anterior estar 100% se (e só se) a dependência real já estiver entregue — a tabela acima nomeia os gates.
- Toda fatia: typecheck + lint + testes + build verdes, docs e HANDOFF atualizados, PR independente.
- OpenAI real, pagamentos reais, adapters públicos e DNS/produção: cada um tem gate explícito e autorização do dono.
