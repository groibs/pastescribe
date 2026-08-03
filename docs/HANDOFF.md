# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (sessão da Onda 0 + fatia 1.1 da Onda 1)

## Branch e base

- Base: `main`
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 0 completa + fatia 1.1 da Onda 1 implementada; PR aberta aguardando revisão do dono. **Não fazer merge sem autorização.**

## O que esta entrega contém

### Onda 0 — Descoberta e governança (completa)

- **Inventário e auditoria do Stitch:** o ZIP versionado está truncado — tokens/design docs recuperados e consolidados; screenshots e 3 HTMLs perdidos (detalhes em `docs/STITCH_REFERENCE.md` e `docs/RESEARCH_REPORT.md` §4). Se o dono tiver o export íntegro, recomitar melhora a fidelidade visual futura; não bloqueia nada até a Onda 6.
- **Pesquisa:** clones locais de `groibs/ressoa`, `groibs/rezenhai-mvp` e `groibs/rezenhai` inspecionados; padrões adaptados/rejeitados registrados em `docs/RESEARCH_REPORT.md`; versões e modelos validados em documentação oficial (Next 16.2, Tailwind 4.3, `@supabase/ssr`, pgmq, modelos OpenAI de transcrição com preços de referência).
- **Documentos canônicos criados:** ARCHITECTURE, THREAT_MODEL, DATABASE, AI_CALL_MATRIX, AI_COST_MODEL, ANALYTICS_EVENTS, FEATURE_FLAGS, SEO, DESIGN_SYSTEM, API (draft v1), RESEARCH_REPORT, ROADMAP, LESSONS_LEARNED. Índice atualizado em `.claude/MEMORY_MAP.md`.
- **Decisões da Onda 0 registradas** em `docs/DECISIONS.md` (worker Python/FastAPI, fila em tabela PG com SKIP LOCKED, BillingPort fake→Stripe test, storage S3-compatible local→R2, modelos OpenAI, estrutura do monorepo, retenção).
- **Skills locais criadas** (9): scope-budget-delivery, ai-cost-governance, upload-url-security, pre-merge-check, ui-premium, accessibility-review, seo-international-check, feature-backlog, product-simulation. Adiadas com motivo no `.claude/skills/README.md`.

### Onda 1 — fatia 1.1 (implementada e verificada)

- Monorepo pnpm + Turborepo (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`).
- `packages/contracts`: máquina de estados canônica do job (com testes de transição) + catálogo fechado de analytics tipado com schemas strict (testes anti-PII).
- `packages/config`: validação de env com zod (defaults seguros; providers fake por padrão; coerência provider↔credencial) + feature flags centralizadas com fallback seguro (testes).
- `packages/i18n`: en/pt-br/es com tipo compartilhado, labels, BCP47, teste de paridade de chaves entre locales.
- `apps/web`: Next.js 16 App Router, TS estrito, Tailwind 4 com tokens do design system, rotas `/{locale}` SSG com metadata localizada + hreflang (noindex até o lançamento), `/api/health`, redirect raiz→`/en`.
- CI: `.github/workflows/ci.yml` (lint, typecheck, test, build).
- `.env.example` completo por grupos; nenhuma credencial necessária para rodar.

## Comandos executados e resultados

```bash
pnpm install          # ok
pnpm lint             # ok (4 pacotes)
pnpm typecheck        # ok (4 pacotes)
pnpm test             # ok — 29 testes passando (contracts 11, config 8, i18n 6, web 4)
pnpm build            # ok — /en /pt-br /es SSG + /api/health
# smoke: root 307→/en; /en 200; /pt-br 200; /api/health {"status":"ok"}
```

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @pastescribe/web dev   # http://localhost:3000 → /en
```

## O que ficou de fora (deliberado)

- Negociação de locale por `Accept-Language` (middleware/proxy do Next 16 — validar API na fatia 1.3; raiz redireciona para `/en` por ora).
- `packages/ui` (fatia 1.2), observabilidade (1.3), Supabase/auth (Onda 2), worker (Onda 4).
- `docs/LAUNCH_CHECKLIST.md`, `OPERATIONS_RUNBOOK.md`, `PLATFORM_ADAPTERS.md` — criar quando houver conteúdo real (registrado no MEMORY_MAP).
- Skills visual-polish/delight-motion/ux-lab — adiadas com motivo.

## Riscos e limitações

- Referência visual: sem screenshots do Stitch, a reconstrução das telas (Ondas 6/10) dependerá dos tokens + descrições. Mitigação possível: dono recomitar o export íntegro.
- Preços OpenAI são referência pública de 2026-08-03; **revalidar na conta antes da Onda 5**.
- `next-intl` não foi adotado ainda (i18n leve própria) — reavaliar quando a superfície de tradução crescer.
- Site marcado `noindex` até decisão de lançamento (flip documentado em `docs/SEO.md`).

## Restrições que não podem ser violadas (inalteradas)

- Não trabalhar em `main`; não fazer merge sem autorização; não alterar DNS/produção; não inserir segredos; não promover HTML do Stitch a produção; não liberar IA gratuita sem os gates da Onda 3; não implementar scraping evasivo; não indexar/registrar conteúdo privado.

## Decisões manuais pendentes (dono)

- Provider de pagamento comercial definitivo (MoR vs. Stripe live vs. Mercado Pago).
- Host definitivo do worker de mídia.
- Estratégia autorizada por plataforma (Onda 8).
- Domínio/DNS final; momento de ativar Vercel Pro/Supabase Pro/R2.
- Valores finais de planos e créditos.
- (Opcional) Reenviar export íntegro do Stitch.

## Próximo passo exato

1. Dono revisa e faz merge da PR desta branch (ou pede ajustes).
2. Nova branch para a **fatia 1.2**: `packages/ui` com tokens + Button/Input/URLInput/Badge/Alert/Skeleton (estados completos + axe), aplicando `pastescribe-ui-premium` e `pastescribe-accessibility-review`.
3. Em seguida fatia 1.3 (observabilidade + negociação de locale via middleware/proxy validado) e então Onda 2 (Supabase local + migration inicial + RLS com testes).

## Documentos de memória atualizados nesta sessão

`.claude/MEMORY_MAP.md`, `docs/DECISIONS.md`, `docs/STITCH_REFERENCE.md`, `docs/HANDOFF.md` (este), `LESSONS_LEARNED.md` + todos os canônicos novos listados acima.
