# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatias 1.1/1.2/2.1/2.2/2.3 + fix de hero mergeadas; Onda 3 fatia 3.1/3.2 em revisão)

## Branch e base

- Base: `main` (PRs #2–#8 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 3 fatia 3.1/3.2 (schema de billing/ledger/orçamento/quota + funções atômicas + testes de abuso) completa; PR aberta.
- **Merge de PR é automático** assim que CI estiver verde (autorização do dono, `docs/DECISIONS.md`). Pausa e pergunta explícita continuam obrigatórias para: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; domínio ainda não comprado. **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita, agora com 5 migrations acumuladas (`0001`–`0005`).

## O que esta entrega contém: Onda 3 fatia 3.1/3.2 — billing, ledger, orçamento free e quota

Fundação de dados que tem que existir **antes** de qualquer chamada real de IA (Onda 5) — nenhuma chamada de IA acontece nesta fatia, é só o governador de custo/abuso. `docs/ROADMAP.md` divide a Onda 3 em 4 fatias; esta entrega é 3.1 (migrations) + 3.2 (testes), invocada via a skill `pastescribe-ai-cost-governance`.

- **`supabase/migrations/0003`** — `plans`/`prices` (catálogo draft, `is_purchasable=false` até aprovação), `credit_accounts`+`credit_ledger_entries` (créditos pagos, saldo é cache do ledger), `usage_ledger_entries` (custo real: USD em micros fiel à fatura, BRL em centavos pro orçamento), `budget_periods`/`budget_reservations` (orçamento por envelope — `free_ai`/`ingestion`/`infra`/`reserve` — e período), `free_tier_configs` (seed: anônimo 45s, e-mail verificado 180s não renovável, legenda nativa 0s — `docs/AI_COST_MODEL.md` §4), `quota_counters`+`quota_consumption_entries` (contador durável por bucket+janela com log de idempotência).
- **`0004`** — RLS: todas as 10 tabelas novas nascem service_role-only (deny-by-default, nenhuma tem consumidor client ainda — nem `plans`/`prices`, que um dia serão de leitura pública).
- **`0005`** — funções atômicas: `consume_quota`, `ledger_append`, `reserve_free_budget`, `capture_budget_reservation`, `release_budget_reservation`. Todas `SECURITY DEFINER`, idempotentes (`idempotency_key` único — duplo clique/retry devolve o mesmo resultado em vez de duplicar), `FOR UPDATE` (trava a linha certa antes de decidir), fail-closed (`RAISE EXCEPTION` em vez de permitir silenciosamente), executáveis só por `service_role`.
- **Decisão importante:** `reserve_free_budget_and_enqueue` (nome do `docs/DATABASE.md`) **não foi construída** — depende de `transcription_jobs`, que só existe na Onda 4. Esta fatia entrega as peças completas e testadas (`reserve_free_budget` + `capture_budget_reservation` + `release_budget_reservation`); a Onda 4 monta a versão combinada chamando estas de dentro da criação/conclusão do job, em vez de duplicar a lógica. Detalhes em `docs/DECISIONS.md`.
- **Fora de escopo desta fatia** (deliberado): `billing_customers`/`subscriptions`/`payment_events` (fatia 3.3, com o provider de billing fake); `abuse_signals`/`abuse_events` (sem lógica de abuso real pra escrever ainda); Turnstile/rate limits (fatia 3.4).

## Entregas anteriores (mergeadas)

- **Fix de hero** — `text-balance`/`text-pretty` no título/subtítulo da home, corrigindo linhas viúvas/órfãs (pedido direto do dono).
- **Fatia 2.3** — estado autenticado no header, `/{locale}/app` mínimo, correção de um bug real de contraste (`text-outline`/`opacity-60`).
- **Fatia 2.2** — Supabase Auth SSR completo (`packages/database`, clients, `/login`, `/auth/callback`).
- **Fatia 1.4** — reconstrução fiel ao Google Stitch.

Detalhes completos em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- **Migrations aplicadas de verdade** contra Postgres nativo local (`scripts/test-db-local.sh`, mesmo script que o CI roda) — `0003`/`0004`/`0005` rodam sem erro sobre o schema real das fatias 2.1/2.2.
- **101 testes pgTAP** (46 anteriores + 55 novos em `supabase/tests/07`–`10`), cobrindo os cenários do prompt-mestre §21.4 que fazem sentido em nível de banco: duplo clique/retry (idempotência) em todas as 5 funções, orçamento mensal encerrado, reserva maior que saldo disponível, contador/orçamento indisponível (período não configurado), refund de job falho (`release_budget_reservation`), captura idempotente (reprocessar não desconta duas vezes), free bloqueado não afeta paid (`ledger_append` funciona independente do estado de `budget_periods`), RLS deny-by-default nas 10 tabelas novas (`anon`/`authenticated` barrados, `service_role` passa).
- **Nota de honestidade sobre "concorrência"**: os testes verificam que a lógica sequencial sob `FOR UPDATE` está correta (reservar até o teto, depois rejeitar) — é o mesmo invariante que torna `FOR UPDATE` seguro sob duas conexões concorrentes de verdade, mas não é um teste com duas conexões paralelas reais (nenhum arquivo pgTAP deste repositório faz isso; é um teste de nível mais pesado, não construído aqui).
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` no monorepo inteiro: todos verdes (61 testes JS/TS + 101 pgTAP).
- `packages/database/src/types.ts` atualizado à mão com as 10 tabelas e 5 funções novas — typecheck confirma que `apps/web` (que importa `@pastescribe/database`) continua compilando.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash scripts/test-db-local.sh   # migrations + pgTAP (precisa de PostgreSQL local com pgtap — ver o script)
```

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`–`0005` só rodaram neste sandbox. Segue pendente de autorização explícita.
- Nenhuma função desta fatia tem um caller real ainda (nenhuma API route/Server Action as chama) — isso só faz sentido a partir da Onda 4/5, quando `transcription_jobs` e a API de transcrição existirem. Construídas e testadas agora porque são pré-requisito bloqueante, não porque já têm consumidor.
- `identity_key`/`bucket` são opacos ao banco — a derivação real (hash de IP, salt, formato) é decisão de quem chamar essas funções, ainda **A confirmar** (Onda 4/5).
- Câmbio BRL/USD usado para converter estimativa de custo em `reserve_free_budget` é decisão da camada chamadora (ainda não existe) — `docs/AI_COST_MODEL.md` já avisa que o câmbio de planejamento precisa revalidação mensal.

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates completos da Onda 3 (esta fatia é parte do gate, não o gate inteiro — falta 3.3/3.4); não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 3 fatia 3.3: provider de billing fake + webhook idempotente (`apply_payment_event`) + admin de orçamento/kill switches (liga/desliga `openai_enabled`/`free_ai_enabled` de verdade).
2. Onda 3 fatia 3.4: Turnstile + rate limits.
3. Quando o dono autorizar: aplicar todas as migrations (`0001`–`0005`) no projeto Supabase real, junto com o resto do fluxo de auth já pendente.

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
