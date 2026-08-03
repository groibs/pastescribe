# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatias 1.1/1.2/2.1/2.2/2.3 + fix de hero + Onda 3 fatia 3.1/3.2 mergeadas; fatia 3.3 (recorte) em revisão)

## Branch e base

- Base: `main` (PRs #2–#9 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 3 fatia 3.3, recorte de admin/kill-switches (sem o provider de billing fake — ver decisão abaixo), completa; PR aberta.
- **Merge de PR é automático** assim que CI estiver verde (autorização do dono, `docs/DECISIONS.md`). Pausa e pergunta explícita continuam obrigatórias para: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; domínio ainda não comprado. **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita, agora com 6 migrations acumuladas (`0001`–`0006`).

## O que esta entrega contém: Onda 3 fatia 3.3 (recorte) — `/admin` com kill switches e orçamento

`docs/ROADMAP.md` define a fatia 3.3 como billing provider fake + webhook + admin. Este recorte entrega só a parte de admin — o provider de billing fake fica pra quando existir um checkout real que precise emitir webhooks (decisão completa em `docs/DECISIONS.md`).

- **`supabase/migrations/0006`**: `platform_admins` (allowlist global, RLS service_role-only — conceito novo, diferente de `workspace_members.role`) + seed dos 2 kill switches globais em `feature_flags` (`openai_enabled`, `free_ai_enabled`, ambos nascem `false`).
- **`apps/web/lib/supabase/admin.ts`**: client `service_role` novo, protegido com `import "server-only"` (pacote oficial da Vercel — quebra o build se algum client component tentar importar isso).
- **`apps/web/lib/admin/guard.ts`** (`requirePlatformAdmin`): único ponto de verdade sobre "esse usuário pode usar o /admin" — chamado pela página **e** por cada Server Action de admin (nunca confia que a página já filtrou).
- **`apps/web/app/actions/admin.ts`**: `toggleFeatureFlagAction` (estado alvo sempre explícito no form — nunca um "toggle" que dependeria do que a página tinha renderizado) e `createBudgetPeriodAction` (cria um `budget_period` real — sem isso, `reserve_free_budget` fica fail-closed pra sempre, já que a migration não semeia nenhum período específico de calendário).
- **`/{locale}/admin`**: sem sessão → redireciona pra `/login` (igual `/app`); logado mas não-admin → `notFound()` (não confirma que a rota existe pra quem não devia saber); admin de verdade → mostra os kill switches com toggle real e a lista de `budget_periods` com formulário de criação.

## Configuração manual pendente (o dono precisa fazer isto, não dá pra automatizar)

Depois de aplicar as migrations no projeto real e logar pelo menos uma vez via `/login`, o dono precisa se auto-conceder o primeiro platform admin — nenhuma migration sabe o `auth.users.id` real dele:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'lucasds50@gmail.com';
```

Rodar isso no SQL Editor do Supabase. Depois disso, `/en/admin` funciona normalmente.

## Entregas anteriores (mergeadas)

- **Onda 3 fatia 3.1/3.2** — billing/ledger/orçamento/quota completo (`0003`–`0005`), 5 funções atômicas, 101 testes pgTAP.
- **Fix de hero** — `text-balance`/`text-pretty` corrigindo linhas viúvas/órfãs.
- **Fatia 2.3** — estado autenticado no header, `/{locale}/app` mínimo.
- **Fatia 2.2** — Supabase Auth SSR completo.
- **Fatia 1.4** — reconstrução fiel ao Google Stitch.

Detalhes completos em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- **Migration `0006` aplicada de verdade** contra Postgres nativo local (`scripts/test-db-local.sh`) sobre o schema acumulado das fatias 2.1–3.2.
- **108 testes pgTAP** (101 anteriores + 7 novos em `supabase/tests/11`), cobrindo RLS deny-by-default de `platform_admins` (`anon`/`authenticated` barrados até de *ler* se são admin — essa decisão só existe no server com `service_role`) e os 2 kill switches nascendo desligados. Precisei também corrigir uma colisão: o teste antigo `05_flags_settings_rls.sql` inseria uma flag chamada `openai_enabled` pra testar RLS genérica — colidia com o seed novo. Renomeado pra `test_kill_switch`.
- **Servidor real**: `curl /en/admin` sem sessão confirmado devolvendo `307` pra `/en/login` (mesmo comportamento de `/en/app`, testado ao vivo). axe-core em 7 páginas (`/en`, `/pt-br`, `/es`, `/en/pricing`, `/en/login`, `/en/app`, `/en/admin`): **0 violações**.
- **O que NÃO pôde ser testado ao vivo**: o conteúdo real do `/admin` (toggle de flag, criação de budget_period, tabela renderizada) — exigiria uma sessão real + uma linha em `platform_admins`, impossível neste sandbox sem credenciais. O código foi revisado com cuidado (mesmo padrão de guard usado em `/app`, já testado ao vivo antes), mas isso é diferente de ter clicado nos botões de verdade.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`: todos verdes (61 testes JS/TS + 108 pgTAP).

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash scripts/test-db-local.sh
```

Pra testar o `/admin` de verdade: aplicar as migrations no projeto real, logar via `/login`, rodar o SQL de bootstrap acima, visitar `/en/admin`.

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`–`0006` só rodaram neste sandbox.
- O conteúdo do `/admin` (toggle, criação de período) não foi exercitado ao vivo — ver seção de verificação acima.
- Sem o bootstrap manual do primeiro `platform_admins`, ninguém acessa `/admin` — é intencional (não dá pra saber o UUID do dono de antemão), mas é um passo que não pode ser esquecido.
- Provider de billing fake + webhook (`apply_payment_event`) continuam **não construídos** — ver decisão em `docs/DECISIONS.md` sobre por que esperar até existir um checkout real.

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates completos da Onda 3 (falta o provider de billing + Turnstile/rate limits); não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 3 fatia 3.4: Turnstile + rate limits.
2. Provider de billing fake + webhook idempotente — quando existir um fluxo de checkout real (Onda 9) que precise emitir eventos, não antes.
3. Quando o dono autorizar: aplicar todas as migrations (`0001`–`0006`) no projeto Supabase real + rodar o bootstrap de `platform_admins` + testar `/admin` de ponta a ponta.

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
