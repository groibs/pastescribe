# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 mergeada + fatia 1.2 da Onda 1)

## Branch e base

- Base: `main` (PR #2 — Onda 0 + fatia 1.1 — **já mergeada** a pedido do dono)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet` (recriada a partir do `main` pós-merge, conforme regra de sessão)
- Estado: fatia 1.2 (`packages/ui`) implementada e verificada; PR aberta aguardando revisão. **Não fazer merge sem autorização.**

## Decisão de infraestrutura registrada nesta sessão

O dono vai começar em **Vercel free (Hobby)** e **Supabase free**; **domínio ainda não comprado**. Registrado em `docs/DECISIONS.md` (2026-08-03 — Infra inicial em free tier, sem domínio). Consequências já refletidas no código: site permanece `noindex`, nenhuma URL hardcoded de domínio, nenhum serviço pago ativado.

## O que esta entrega contém (fatia 1.2 — packages/ui)

- **Tokens no código:** `apps/web/app/globals.css` (Tailwind v4 `@theme`) — cores, raio (nomenclatura padrão Tailwind: `rounded-md`=8px, `rounded-xl`=16px), tipografia. Adicionados `success`/`warning` (ausentes no Stitch), com contraste verificado (≥4.5:1, tabela em `docs/DESIGN_SYSTEM.md`).
- **`packages/ui`:** Button (primary/secondary, loading, disabled, touch ≥44px), Input (label sempre visível, hint/erro mutuamente exclusivos, `aria-describedby`), UrlInput (status idle/checking/valid/invalid, `aria-live` polite para checking/valid, `role="alert"` para invalid sem duplicar anúncio), Badge (texto sempre obrigatório — nunca só cor), Alert (`role="alert"` só para error, `role="status"` para o resto), Skeleton (`aria-live`, respeita `prefers-reduced-motion`).
- **Testes:** 25 testes em `packages/ui` (estado + comportamento + axe-core em cada componente, zero violações WCAG). Helper `expectNoA11yViolations` usa axe-core diretamente (não um wrapper de terceiros com manutenção incerta — ver `docs/RESEARCH_REPORT.md`).
- **Integração real na home:** Badge de status, Alert informativo, e um `UrlInput`+`Button` **desabilitados** com hint explicando que o produto ainda não aceita links — honesto, não um placeholder que finge funcionar (regra do prompt-mestre §2.2 e skill `pastescribe-product-simulation`).
- **i18n:** novas chaves (`previewBadge/previewLabel/previewHint/previewCta`) traduzidas em en/pt-br/es, cobertas pelo teste de paridade existente.
- **Docs atualizados:** `docs/DESIGN_SYSTEM.md` (tokens semânticos + status de entrega), `docs/DECISIONS.md` (infra free tier).

## Comandos executados e resultados

```bash
pnpm install
pnpm lint       # ok — 5 pacotes
pnpm typecheck  # ok — 5 pacotes
pnpm test       # ok — 54 testes (config 8, contracts 11, i18n 6, ui 25, web 4)
pnpm build      # ok — /en /pt-br /es SSG + /api/health
```

Smoke test manual do servidor de produção (`pnpm start`): confirmado no HTML servido que `/pt-br` renderiza o Badge "Em construção", o Alert (`role="status"`), o Button "Gerar transcrição" e o input, ambos com `disabled=""`.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @pastescribe/web dev   # http://localhost:3000 → /en
pnpm --filter @pastescribe/ui test   # suíte isolada de componentes + axe
```

## O que ficou de fora (deliberado)

- Componentes restantes do inventário do design system (Dialog, Tabs, Toast, Dropzone, Table etc.) — chegam nas Ondas 2–6 conforme a tela que os exige (`docs/DESIGN_SYSTEM.md` §Componentes).
- Negociação de locale por `Accept-Language` (fatia 1.3).
- Observabilidade (`packages/observability`, fatia 1.3).
- ESLint sem plugin específico de React/JSX-a11y ainda (typecheck cobre erros de tipo em JSX; considerar `eslint-plugin-jsx-a11y` quando o volume de UI crescer — não bloqueante agora porque a skill `pastescribe-accessibility-review` + axe nos testes já cobrem o essencial).

## Riscos e limitações

- Sem screenshots do Stitch (ver PR anterior) — tokens de cor/tipografia seguros; fidelidade pixel-a-pixel das telas completas ainda depende de reconstrução visual nas Ondas 6/10.
- `success`/`warning` são decisão desta sessão (Stitch não os define) — revisar se o dono tiver preferência de marca diferente.
- Vercel/Supabase free têm limites (pausa por inatividade no Supabase, limites de função na Vercel) — aceitos nesta fase; não afeta as Ondas 1 (sem backend ainda).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não fazer merge sem autorização; não alterar DNS/produção; não inserir segredos; não promover HTML do Stitch a produção; não liberar IA gratuita sem os gates da Onda 3; não implementar scraping evasivo; não indexar/registrar conteúdo privado.

## Decisões manuais pendentes (dono)

- Comprar domínio (quando decidir) e então tirar o `noindex` conforme `docs/SEO.md`.
- Criar projeto Supabase free e projeto Vercel free (nenhum dos dois é necessário até a Onda 2 — a fundação atual roda 100% local sem credenciais).
- Provider de pagamento definitivo; host definitivo do worker; estratégia autorizada por plataforma (Onda 8); valores finais de planos e créditos.

## Próximo passo exato

1. Dono revisa/mergeia a PR desta fatia (1.2).
2. Nova branch para **fatia 1.3**: observabilidade (`packages/observability`, logger estruturado com redação) + negociação de locale via middleware validado para Next 16 (substituindo o redirect fixo `/`→`/en`).
3. Em seguida, **Onda 2**: criar projeto Supabase (free tier), `supabase/migrations/0001_initial_schema.sql` (profiles, workspaces, workspace_members, workspace_invites, feature_flags, app_settings) com RLS e testes, e auth SSR com `@supabase/ssr`.

## Documentos de memória atualizados nesta sessão

`docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/HANDOFF.md` (este).
