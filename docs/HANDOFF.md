# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatias 1.1/1.2/2.1/2.2/2.3 mergeadas; fix de widows/orphans do hero em revisão)

## Branch e base

- Base: `main` (PRs #2–#7 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: correção de linhas viúvas/órfãs no hero da home completa; PR aberta.
- **A partir desta sessão, merge de PR é automático** assim que CI estiver verde (autorização explícita do dono no chat — decisão registrada em `docs/DECISIONS.md`). Continua exigindo pausa e pergunta explícita: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; deploy da Vercel corrigido (Root Directory = `apps/web`); domínio ainda não comprado; `docs/DECISIONS.md` tem os detalhes completos. **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente.

## O que esta entrega contém: linhas viúvas/órfãs no hero (pedido direto do dono)

- O dono reportou (com screenshot) que o título do hero da home quebrava deixando uma linha órfã ("text." sozinho na segunda linha em EN). Pediu correção nos 3 locales, título e subtítulo, sem afetar mobile.
- **`apps/web/app/[locale]/page.tsx`**: `text-balance` (`text-wrap: balance`) no `<h1>` do hero e `text-pretty` (`text-wrap: pretty`) no parágrafo de lead — utilitários nativos do Tailwind v4 (compilação confirmada no CSS gerado, não é suposição). `balance` distribui o título em linhas de comprimento parecido (ideal para headlines curtas); `pretty` evita especificamente a última linha órfã em parágrafos mais longos, sem redistribuir tudo.
- Escopo deliberadamente restrito ao hero da home, como pedido — não toquei heading/lead de pricing/login (mesmo padrão, se o dono quiser depois).

## Entregas anteriores (mergeadas)

- **Fatia 2.3** — estado autenticado no header (`AuthHeaderStatus`, lido no client para não tirar home/pricing de SSG), `signOutAction`, página `/{locale}/app` mínima e real (workspace pessoal via RLS, sem dado fake), decisão de deixar `/admin` de fora (sem agregados reais ainda). Corrigido também um bug real de contraste pré-existente (`text-outline` como texto, `opacity-60` no demo) achado ao vivo com axe-core.
- **Fatia 2.2** — Supabase Auth SSR: `packages/database` (tipos handwritten), clients browser/server/`proxy.ts`, página `/{locale}/login` (magic link, Google, senha opcional), `/auth/callback`. `SUPABASE_URL`/`ANON_KEY` renomeados para `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Fatia 1.4** — reconstrução fiel ao Google Stitch: home, pricing, `SiteHeader`/`SiteFooter`, `TranscribeBar`, `Logomark`, fontes self-hosted, tokens de cor.

Detalhes completos em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` no monorepo inteiro: todos verdes, **61 testes**.
- Confirmei no CSS gerado (`.next/static/chunks/*.css`) que `text-wrap:balance` e `text-wrap:pretty` realmente compilam — não é só a classe existir no HTML sem efeito.
- **Servidor real + Playwright, screenshot do `<h1>` isolado nos 3 locales** (viewport 1440px, mesma largura do screenshot do dono): EN quebra em "Paste any video." / "Get useful text." (2 linhas balanceadas, sem órfã); PT-BR e ES também balanceados, sem linha de 1 palavra sozinha.
- Screenshot da seção hero completa em desktop (1440px) e mobile (375px): título, subtítulo e o resto do hero (input, plataformas) continuam corretos nos dois breakpoints — `text-balance`/`text-pretty` são progressive enhancement, não quebram em telas estreitas.
- axe-core ao vivo em `/en`, `/pt-br`, `/es`: **0 violações** (mudança é só CSS de quebra de linha, não deveria afetar a11y, mas testei mesmo assim).

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @pastescribe/web dev   # /en, /pt-br, /es — olhar o hero em ~1440px de largura
```

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita (fatia 2.2/2.3).
- Auth real (login completo + `/app` com sessão) não foi exercitada contra o GoTrue/Postgres reais — sem credenciais neste sandbox.
- Preços da pricing continuam ilustrativos (herdado, inalterado).
- `text-balance` tem suporte limitado a ~6 linhas pelo spec CSS (não é problema aqui — o título tem 1-2 linhas); `text-pretty` tem suporte um pouco mais recente em navegadores mas ambos são progressive enhancement — navegadores sem suporte simplesmente quebram a linha do jeito padrão (nunca quebra o layout).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates da Onda 3; não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 3: gates de custo/orçamento para IA gratuita (ledger, reserva atômica, kill switches) — bloqueante antes de qualquer chamada real de transcrição, mesmo que a UI ainda não exista.
2. Quando o dono autorizar: aplicar `supabase/migrations/0001_initial_schema.sql` e `0002_workspace_rls.sql` no projeto Supabase real, preencher `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel, habilitar o provider Google, testar o fluxo completo de auth de ponta a ponta.

## Documentos de memória atualizados nesta sessão

`docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
