# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatias 1.1/1.2 + Onda 2 fatia 2.1 mergeadas; reconstrução do site fiel ao Stitch em revisão)

## Branch e base

- Base: `main` (PRs #2, #3, #4 já mergeadas a pedido do dono)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: home e pricing reconstruídas com fidelidade real ao Google Stitch; PR aberta aguardando revisão. **Não fazer merge sem autorização.**

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; deploy da Vercel corrigido (Root Directory = `apps/web`); domínio ainda não comprado; `docs/DECISIONS.md` tem os detalhes completos.

## O que esta entrega contém: reconstrução fiel ao Google Stitch

O dono enviou o export original **íntegro** do Stitch (1,9 MB — o ZIP da Onda 0 estava truncado). Substituído em `stitch-reference/pastescribe-stitch-export.zip`. Material completo: logo, home, dashboard, editor, pricing (cada um com `code.html` + `screen.png`) + 2 docs de design. Detalhes em `docs/STITCH_REFERENCE.md` e `docs/RESEARCH_REPORT.md`.

**Reconstruído com fidelidade real (não copiado — reescrito com `packages/ui`, Tailwind, tokens):**

- **Home** (`apps/web/app/[locale]/page.tsx`): header, hero com `TranscribeBar` (novo componente) + plataformas suportadas, seção "Instant clarity" (demo estático não-interativo), grid de features (bento 2+1+1+2), footer. Idêntico em estrutura ao Stitch nos 3 locales.
- **Pricing** (`apps/web/app/[locale]/pricing/`): heading, aviso de **draft** (preços ilustrativos, `docs/PASTESCRIBE_MONETIZATION.md`), toggle Monthly/Yearly **funcional** (`PricingToggle.tsx`, client component, sem chamada de rede), 3 cards de plano, banner de créditos, FAQ com `<details>/<summary>` nativos (acessível sem JS), aviso pay-as-you-go.
- **`SiteHeader`/`SiteFooter`** (`apps/web/app/_components/`): compartilhados entre as duas páginas. Nav para páginas que ainda não existem (API, Resources, Sign In, Get Started) aparece **visualmente idêntica ao Stitch mas inerte** (não é link nem botão clicável) — nunca uma promessa que o produto ainda não cumpre. Seletor de idioma (EN/PT/ES) adicionado — não existe no Stitch, mas é requisito do produto (`docs/SEO.md`).
- **`packages/ui`:** `TranscribeBar` (pílula ícone+input+botão, label ocultável) e `Logomark` (SVG inline dos documentos sobrepostos — não a imagem hotlinked do export), ambos testados com axe.
- **Fontes e ícones:** Inter + JetBrains Mono via `next/font/google` (self-hosted, sem request ao Google em runtime); `lucide-react` no lugar dos Material Symbols do export (evita fonte de ícone externa). Foto de estoque do hero substituída por placeholder com tokens (não hotlinkamos o CDN do Google AI Studio).
- **Tokens novos:** `inverse-surface`, `on-background`, `surface-bright`, `surface-variant`, `on-secondary-fixed-variant` — faltavam e causaram um bug real (mockup de vídeo sem fundo escuro) pego na verificação visual, corrigido.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- **Screenshots via Playwright** (Chromium pré-instalado do ambiente) comparados visualmente com os screenshots originais do Stitch — home (en/pt-br/es) e pricing (en) batem estruturalmente; identifiquei e corrigi 1 bug real (tokens de cor faltando).
- **axe-core direto contra o servidor real** (não só componentes isolados): 4 combinações de página/locale, **0 violações** após corrigir 2 achados reais:
  - `scrollable-region-focusable` (sério) — painel de transcrição do demo não era focável por teclado; corrigido com `tabIndex={0}` + `role="group"` + `aria-label`.
  - `heading-order` (moderado) — cards de plano na pricing pulavam de `h1` para `h3`; corrigido para `h2`.
- **Mobile (375px)** verificado visualmente: header colapsa corretamente, seções empilham, sem scroll horizontal, touch targets ≥44px.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`: **61 testes**, 6 rotas SSG (`/en`, `/pt-br`, `/es`, `/en/pricing`, `/pt-br/pricing`, `/es/pricing`) + `/api/health`.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @pastescribe/web dev   # /en, /en/pricing, /pt-br, /es...
```

## O que ficou de fora (deliberado)

- **Dashboard e editor:** material do Stitch já salvo (`stitch-reference/`), mas a reconstrução espera dado real (Ondas 2.3 e 6) — não faz sentido construir agora com dados fake permanentes.
- Páginas para Tools/Platforms/Privacy/Terms/API Docs/API/Resources: ainda não existem; nav e footer apontam para elas de forma inerte (não-clicável), nunca com link morto.
- `eslint-plugin-jsx-a11y`: adiado; a combinação typecheck + axe real contra o servidor já pegou os 2 problemas reais desta entrega.

## Riscos e limitações

- Preços da pricing são os números ilustrativos do próprio Stitch (Free $0/Creator $19/Pro $49), claramente marcados como draft — **não são preços aprovados**.
- Toggle Yearly usa desconto de 20% calculado manualmente por mim (não vem de `docs/PASTESCRIBE_MONETIZATION.md`, que ainda não fixou números) — só ilustrativo.
- Ambiente de execução deste sandbox tem particularidades de rede (Docker Hub bloqueado) e de processos em background (servidores `next start` encerrados no fim de uma chamada de shell não sobrevivem de forma confiável a menos que iniciados via o mecanismo nativo de background da ferramenta) — não afeta o código entregue, só o processo de QA local.

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não fazer merge sem autorização; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates da Onda 3.

## Próximo passo exato

1. Dono revisa/mergeia esta PR.
2. Nova branch para **Onda 2 fatia 2.2**: `@supabase/ssr`, magic link + Google + senha opcional, `packages/database` com tipos gerados — e, com autorização explícita, aplicar as migrations já prontas (`supabase/migrations/0001`/`0002`) no projeto Supabase real do dono.
3. Fatia 2.3: dashboard autenticado mínimo (usa o material do Stitch já salvo) + base do `/admin`.

## Documentos de memória atualizados nesta sessão

`docs/STITCH_REFERENCE.md`, `docs/RESEARCH_REPORT.md`, `docs/DESIGN_SYSTEM.md`, `LESSONS_LEARNED.md`, `docs/HANDOFF.md` (este).
