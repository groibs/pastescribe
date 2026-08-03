# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatias 1.1/1.2 + Onda 2 fatias 2.1/2.2 mergeadas; fatia 2.3 em revisão)

## Branch e base

- Base: `main` (PRs #2, #3, #4, #5, #6 já mergeadas a pedido do dono)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: fatia 2.3 (estado autenticado no header + `/{locale}/app` mínimo) completa; PR aberta aguardando revisão. **Não fazer merge sem autorização.**

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; deploy da Vercel corrigido (Root Directory = `apps/web`); domínio ainda não comprado; `docs/DECISIONS.md` tem os detalhes completos. **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente, ver seção própria abaixo.

## O que esta entrega contém: fatia 2.3 — estado autenticado + `/app` mínimo

- **`AuthHeaderStatus`** (`apps/web/app/_components/AuthHeaderStatus.tsx`, novo client component): o `SiteHeader` mostra "Sign In"/"Get Started Free" (agora links reais para `/{locale}/login`) quando deslogado, ou um badge com a inicial do e-mail + botão "Sign out" quando logado. **Decisão importante:** esse estado é lido no **client** (`supabase.auth.getUser()`/`onAuthStateChange`), não no server component do header — ler cookies no server forçaria `/{locale}` e `/{locale}/pricing` a saírem de SSG. Custo aceito: um instante de estado vazio antes do primeiro efeito rodar (sem layout shift — placeholder do mesmo tamanho). Decisão completa em `docs/DECISIONS.md`.
- **`apps/web/app/actions/auth.ts`** (`signOutAction`, Server Action): chama `supabase.auth.signOut()` e redireciona para `/{locale}` — usado tanto pelo header quanto pela página `/app`, sempre via `<form action={signOutAction}>`.
- **`/{locale}/app`** (`apps/web/app/[locale]/app/page.tsx`): área autenticada mínima e **real**, sem dado fake do mockup do Stitch (a funcionalidade de transcrição não existe ainda). Sem sessão → redireciona para `/{locale}/login`. Com sessão → mostra e-mail, busca o workspace pessoal do usuário com uma query real sob RLS (`workspaces` filtrado por `created_by`/`is_personal`, protegido pela policy `workspaces_select_member`) e um aviso honesto de que o produto em si segue em desenvolvimento. Página inerentemente dinâmica (não SSG) — não tem o problema de cookies do header, porque já não podia ser estática de qualquer forma.
- **`/admin` NÃO entrou nesta fatia** — decisão deliberada, não esquecimento. `docs/ARCHITECTURE.md`/master-prompt só especificam "painel admin lê agregados, nunca conteúdo" e "protegido por papel e validação server-side"; não há ainda nenhum agregado real para mostrar (sem jobs, sem ledger, sem billing — chegam nas Ondas 3+). Construir uma "base" agora seria placeholder vazio ou dado inventado. Fica para quando houver algo real de admin para agregar.
- **Achado de acessibilidade real, corrigido nesta sessão** (não introduzido por ela — pré-existia, apareceu ao rodar axe-core ao vivo contra o header que eu estava editando): `text-outline` usado como cor de texto (spans inertes "API"/"Resources", links do seletor de idioma para locale não-ativo, timestamp da seção de demo da home) tinha contraste real de ~4.26:1 contra `bg-surface` — abaixo do mínimo de 4.5:1. Também a seção de demo da home usava `opacity-60` nas linhas de transcrição além da primeira, o que reduz o contraste de qualquer cor por baixo do limiar. Corrigido: `text-outline` → `text-on-surface-variant` (token já comprovadamente compatível) nesses pontos; `opacity-60` removido (todas as linhas do demo renderizam na mesma cor/contraste agora). Detalhes em `docs/DECISIONS.md`.

## Entregas anteriores (mergeadas)

- **Fatia 2.2** — Supabase Auth SSR: `packages/database` (tipos handwritten), clients browser/server/`proxy.ts`, página `/{locale}/login` (magic link, Google, senha opcional), `/auth/callback`. `SUPABASE_URL`/`ANON_KEY` renomeados para `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Fatia 1.4** — reconstrução fiel ao Google Stitch: home, pricing, `SiteHeader`/`SiteFooter`, `TranscribeBar`, `Logomark`, fontes self-hosted, tokens de cor.

Detalhes completos de ambas em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (fatia 2.3 — não só "deveria funcionar")

- `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` no monorepo inteiro: todos verdes, **61 testes**. Rotas agora incluem `/en/app`, `/pt-br/app`, `/es/app` (SSG neste ambiente sem credenciais — ver nota abaixo).
- **Servidor real (`next start`) + Playwright**: confirmei ao vivo que `curl /en/app` sem sessão devolve `307` para `/en/login` (não é suposição de código — testado). Screenshot da home completa após as correções de contraste, revisado visualmente: header mostra "Sign In"/"Get Started Free" reais, linhas de demo consistentes (sem mais o washed-out da `opacity-60`).
- **axe-core ao vivo contra 8 combinações de página/locale** (`/en`, `/pt-br`, `/es`, `/en/pricing`, `/pt-br/pricing`, `/en/login`, `/pt-br/login`, `/en/app`): **0 violações** após corrigir o achado de contraste descrito acima (antes da correção: 12 nós violando `color-contrast` só na home, mais 4 no header da pricing).
- **Nota técnica sobre `/en/app` ser SSG neste build**: como este sandbox não tem `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` configuradas, `getSupabaseConfig()` retorna `null` em build-time e `cookies()` nunca é alcançado — o Next.js consegue provar que a página sempre redireciona para `/login` e pré-renderiza esse redirect como estático. **Num deploy real com credenciais configuradas, essa mesma página se torna dinâmica automaticamente** (o build não consegue mais provar que o branch de `cookies()` é morto) — comportamento correto e esperado, documentado em `docs/DECISIONS.md`, não testável de ponta a ponta aqui.
- **O que NÃO foi testado (sem credenciais reais neste sandbox)**: login real seguido de visita a `/app` com sessão de verdade, a query RLS contra o workspace pessoal com um usuário real, e o botão "Sign out"/`AuthHeaderStatus` no estado logado. O código segue a API oficial do `@supabase/ssr`/`supabase-js` e a RLS já testada localmente com pgTAP (fatia 2.1), mas isso é diferente de ter sido exercitado contra o GoTrue/Postgres reais do projeto do dono.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @pastescribe/web dev   # /en, /en/app (redireciona pra /en/login sem sessão)
```

Para testar o fluxo autenticado de verdade: preencher `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`, aplicar as migrations `0001`/`0002` no projeto Supabase (ver risco abaixo), logar via `/en/login`, e então visitar `/en/app` — deve mostrar o e-mail e o workspace pessoal (criado automaticamente pelo trigger `handle_new_user`).

## O que ficou de fora (deliberado)

- **`/admin`**: sem agregados reais para mostrar ainda (ver seção acima) — não construído.
- **Avatar de verdade**: `profiles` não tem coluna `avatar_url`; o "avatar" no header é um círculo colorido com a inicial do e-mail (honesto, sem inventar imagem).
- **Cadastro por senha**: só login por senha existe; criar conta com senha exigiria tela própria + confirmação de e-mail — magic link/Google já cobrem criação de conta.
- **Dashboard com dado de produto (histórico de transcrições etc.)**: não existe ainda a feature em si; `/app` mostra só o que é real hoje (conta, workspace).

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`/`0002` só rodaram neste sandbox (Postgres nativo). Sem aplicá-las lá, login funciona (GoTrue é independente do schema `public`) mas `/app` mostraria "nenhum workspace encontrado" (a UI já trata esse caso sem quebrar — `dict.app.workspaceFallback`).
- Auth real (login completo + `/app` com sessão) não foi exercitada contra o GoTrue/Postgres reais — sem credenciais neste sandbox.
- Preços da pricing continuam ilustrativos (herdado, inalterado).
- Ambiente de execução deste sandbox tem particularidades de rede (Docker Hub bloqueado) e de processos em background (só o mecanismo nativo de background da ferramenta mantém `next start` vivo de forma confiável) — não afeta o código entregue, só o processo de QA local.

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não fazer merge sem autorização; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates da Onda 3; não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Dono revisa/mergeia esta PR.
2. Com autorização explícita do dono: aplicar `supabase/migrations/0001_initial_schema.sql` e `0002_workspace_rls.sql` no projeto Supabase real (via SQL Editor ou `supabase db push` com o projeto linkado), preencher `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel, habilitar o provider Google em Authentication → Providers, e então testar o fluxo completo (login → `/app` → sign out) de ponta a ponta contra o projeto real — não pôde ser feito neste sandbox.
3. Onda 3: gates de custo/orçamento para IA gratuita (ledger, reserva atômica, kill switches) — bloqueante antes de qualquer chamada real de transcrição, mesmo que a UI ainda não exista.

## Documentos de memória atualizados nesta sessão

`docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
