# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatias 1.1/1.2 + Onda 2 fatias 2.1/2.2 mergeadas; reconstrução do site fiel ao Stitch mergeada; auth Supabase SSR em revisão)

## Branch e base

- Base: `main` (PRs #2, #3, #4, #5 já mergeadas a pedido do dono)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: fatia 2.2 (auth Supabase SSR: `packages/database`, clients browser/server/proxy, página `/login`) completa; PR aberta aguardando revisão. **Não fazer merge sem autorização.**

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; deploy da Vercel corrigido (Root Directory = `apps/web`); domínio ainda não comprado; `docs/DECISIONS.md` tem os detalhes completos. **Nenhuma migration foi aplicada no projeto Supabase real do dono nesta entrega** — ver seção própria abaixo.

## O que esta entrega contém: fatia 2.2 — Supabase Auth SSR (`@supabase/ssr`)

- **`packages/database`** (novo pacote): tipos `Database` escritos à mão em `src/types.ts`, espelhando exatamente `supabase/migrations/0001_initial_schema.sql` e `0002_workspace_rls.sql` (mesmo formato que `supabase gen types typescript` produziria). Não foram gerados via CLI porque o gerador depende de Docker, e o pull de imagens do Docker Hub é bloqueado neste sandbox (mesmo bloqueio já registrado na fatia 2.1) — decisão e consequência (sincronizar manualmente a cada mudança de schema) documentadas em `docs/DECISIONS.md`.
- **Clients Supabase** (`apps/web/lib/supabase/`): `config.ts` (lê `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, retorna `null` se ausentes — nunca lança nem finge), `client.ts` (browser, `createBrowserClient`), `server.ts` (Server Components/Route Handlers, `createServerClient` com `next/headers`). Renomeei `SUPABASE_URL`/`SUPABASE_ANON_KEY` (fatia 1.1) para `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` em `packages/config/src/env.ts` e `.env.example` — URL e anon key não são segredo (protegidos por RLS) e precisam do prefixo `NEXT_PUBLIC_` para chegar ao bundle do browser; `SUPABASE_SERVICE_ROLE_KEY` continua sem esse prefixo, só servidor/worker.
- **`apps/web/proxy.ts`** (não `middleware.ts`): refresh de sessão via `supabase.auth.getUser()`, padrão oficial do Supabase para Next.js 16 — o Next.js 16.2 já usado neste repo depreciou `middleware.ts` em favor de `proxy.ts` (confirmado pelo warning do próprio `next build`; pesquisa confirmou que a documentação do Supabase para Next 16 já usa `proxy.ts` para exatamente este propósito). Decisão registrada em `docs/DECISIONS.md`.
- **`/{locale}/login`** (`apps/web/app/[locale]/login/`): página real de login — link mágico (`signInWithOtp`), Google (`signInWithOAuth`) e senha opcional (`signInWithPassword`, atrás de um toggle "usar uma senha"). Sem env vars configuradas, mostra um `Alert` explicando que o ambiente não está conectado e desabilita todos os campos/botões — nunca finge uma sessão nem falha em silêncio. Textos novos em `packages/i18n` (`Dictionary.auth`, 3 locales).
- **`apps/web/app/auth/callback/route.ts`**: troca `code` por sessão (`exchangeCodeForSession`). `next` só é aceito se for caminho relativo (`/…`) — nunca URL absoluta, para não virar open redirect; em erro, volta para `/{locale}/login?error=auth_callback_failed` com o locale detectado a partir do próprio `next`.
- Header/footer **não foram alterados**: "Sign In"/"Get Started Free" continuam inertes de propósito — logar com sucesso hoje deixaria o usuário numa home que ainda mostra "Sign In" (não existe estado autenticado no header nem dashboard ainda). Ligar isso é fatia 2.3, junto com o dashboard mínimo. `/login` funciona e é testável diretamente pela URL.

## Entrega anterior: reconstrução fiel ao Google Stitch (mergeada)

O dono enviou o export original **íntegro** do Stitch (1,9 MB — o ZIP da Onda 0 estava truncado). Substituído em `stitch-reference/pastescribe-stitch-export.zip`. Material completo: logo, home, dashboard, editor, pricing (cada um com `code.html` + `screen.png`) + 2 docs de design. Detalhes em `docs/STITCH_REFERENCE.md` e `docs/RESEARCH_REPORT.md`.

**Reconstruído com fidelidade real (não copiado — reescrito com `packages/ui`, Tailwind, tokens):**

- **Home** (`apps/web/app/[locale]/page.tsx`): header, hero com `TranscribeBar` (novo componente) + plataformas suportadas, seção "Instant clarity" (demo estático não-interativo), grid de features (bento 2+1+1+2), footer. Idêntico em estrutura ao Stitch nos 3 locales.
- **Pricing** (`apps/web/app/[locale]/pricing/`): heading, aviso de **draft** (preços ilustrativos, `docs/PASTESCRIBE_MONETIZATION.md`), toggle Monthly/Yearly **funcional** (`PricingToggle.tsx`, client component, sem chamada de rede), 3 cards de plano, banner de créditos, FAQ com `<details>/<summary>` nativos (acessível sem JS), aviso pay-as-you-go.
- **`SiteHeader`/`SiteFooter`** (`apps/web/app/_components/`): compartilhados entre as duas páginas. Nav para páginas que ainda não existem (API, Resources, Sign In, Get Started) aparece **visualmente idêntica ao Stitch mas inerte** (não é link nem botão clicável) — nunca uma promessa que o produto ainda não cumpre. Seletor de idioma (EN/PT/ES) adicionado — não existe no Stitch, mas é requisito do produto (`docs/SEO.md`).
- **`packages/ui`:** `TranscribeBar` (pílula ícone+input+botão, label ocultável) e `Logomark` (SVG inline dos documentos sobrepostos — não a imagem hotlinked do export), ambos testados com axe.
- **Fontes e ícones:** Inter + JetBrains Mono via `next/font/google` (self-hosted, sem request ao Google em runtime); `lucide-react` no lugar dos Material Symbols do export (evita fonte de ícone externa). Foto de estoque do hero substituída por placeholder com tokens (não hotlinkamos o CDN do Google AI Studio).
- **Tokens novos:** `inverse-surface`, `on-background`, `surface-bright`, `surface-variant`, `on-secondary-fixed-variant` — faltavam e causaram um bug real (mockup de vídeo sem fundo escuro) pego na verificação visual, corrigido.

## Verificação real feita nesta sessão (fatia 2.2 — não só "deveria funcionar")

- `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` no monorepo inteiro: todos verdes. **61 testes** (mesmo total de antes — os testes genéricos de `packages/i18n` iteram todas as chaves de todos os locales, então já cobrem o novo `Dictionary.auth` sem precisar de casos novos: paridade de chaves entre locales e ausência de string vazia continuam passando com a seção nova). Rotas SSG agora incluem `/en/login`, `/pt-br/login`, `/es/login` além das já existentes; `/auth/callback` compila como rota dinâmica. `packages/database` não tem script de teste (só tipos) — `turbo run test` o ignora normalmente.
- **Servidor real (`next start`) + Playwright + axe-core** contra `/en/login` e `/pt-br/login`: screenshots capturados, **0 violações de a11y** (incluindo `color-contrast`, que só é confiável em browser real — não em jsdom). Mobile (375px) verificado visualmente: sem scroll horizontal, cartão de login se adapta.
- O estado real e verificável neste ambiente é o de **"não configurado"**: sem `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `getSupabaseBrowserClient()` retorna `null`, a página mostra o aviso "Sign-in isn't connected yet" e desabilita todos os campos — comportamento confirmado ao vivo, não só por leitura de código.
- **O que NÃO foi testado (e não pode ser, sem credenciais reais)**: o fluxo completo de `signInWithOtp`/`signInWithOAuth`/`signInWithPassword` contra um projeto Supabase real, a troca de código em `/auth/callback`, e o refresh de sessão em `proxy.ts`. O código segue exatamente a API oficial do `@supabase/ssr` (`getAll`/`setAll`, `exchangeCodeForSession`), mas isso é diferente de ter sido exercitado contra o GoTrue real. Ver "Próximo passo exato".

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @pastescribe/web dev   # /en/login, /pt-br/login, /es/login...
```

Para testar o fluxo de auth de verdade: preencher `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (projeto Supabase do dono, já existe, free tier) em `.env.local`, garantir que o provider Google esteja habilitado em Authentication → Providers no painel Supabase, e as migrations `0001`/`0002` estejam aplicadas nesse projeto (ver risco abaixo — ainda não estão).

## O que ficou de fora (deliberado)

- **Estado autenticado no header/dashboard:** `/login` funciona isoladamente, mas o header continua mostrando "Sign In"/"Get Started Free" inertes mesmo após um login bem-sucedido — não existe ainda UI que reflita sessão ativa. Fatia 2.3 resolve isso junto com o dashboard mínimo.
- **Cadastro por senha:** só login por senha existe (`signInWithPassword`); criar conta com senha exigiria uma tela própria de cadastro + confirmação de e-mail — fora de escopo, já que magic link/Google já cobrem criação de conta na prática.
- **Dashboard e editor:** material do Stitch já salvo (`stitch-reference/`), mas a reconstrução espera dado real (Ondas 2.3 e 6).

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001_initial_schema.sql` e `0002_workspace_rls.sql` só rodaram neste sandbox (Postgres nativo). Sem aplicá-las lá, o login até funcionaria (GoTrue é independente do schema `public`), mas os triggers que criam `profiles`/`workspaces` no primeiro login não existiriam.
- Auth real (magic link/Google/senha) não foi exercitada contra o GoTrue real neste sandbox — sem credenciais aqui. Ver seção de verificação acima.
- Preços da pricing continuam ilustrativos (herdado da entrega anterior, inalterado).
- Ambiente de execução deste sandbox tem particularidades de rede (Docker Hub bloqueado — afetou tanto `supabase start` quanto `supabase gen types` desta vez) e de processos em background (só o mecanismo nativo de background da ferramenta mantém `next start` vivo de forma confiável) — não afeta o código entregue, só o processo de QA local.

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não fazer merge sem autorização; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates da Onda 3; não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Dono revisa/mergeia esta PR.
2. Com autorização explícita do dono: aplicar `supabase/migrations/0001_initial_schema.sql` e `0002_workspace_rls.sql` no projeto Supabase real (via SQL Editor ou `supabase db push` com o projeto linkado), preencher `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel, habilitar o provider Google em Authentication → Providers, e então testar o fluxo de login de ponta a ponta contra o projeto real (isso não pôde ser feito neste sandbox).
3. Fatia 2.3: dashboard autenticado mínimo (usa o material do Stitch já salvo) + estado autenticado no `SiteHeader` (esconder "Sign In"/mostrar avatar+logout) + base do `/admin`.

## Documentos de memória atualizados nesta sessão

`docs/DECISIONS.md`, `.env.example`, `docs/HANDOFF.md` (este).
