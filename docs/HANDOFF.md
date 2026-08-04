# HANDOFF — PasteScribe

Última atualização: **2026-08-04** (Onda 0 até fatia 3.3 + Onda 4 fatia 4.1 mergeadas; Onda 4 fatia 4.2a — fila de transcrição, só camada de banco — completa, PR a caminho)

## Branch e base

- Base: `main` (PRs #2–#11 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 4 fatia 4.2a completa (`transcription_jobs`/`job_steps` + 6 funções atômicas da fila). PR a caminho.
- **Merge de PR é automático** assim que CI estiver verde (autorização do dono, `docs/DECISIONS.md`). Pausa e pergunta explícita continuam obrigatórias para: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; domínio ainda não comprado. Conta Cloudflare R2 real criada na entrega anterior (bucket `pastescribe-media`). **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita, agora com 10 migrations acumuladas (`0001`–`0010`). Variáveis de storage ainda pendentes no projeto Vercel real (ver entrega anterior).

## O que esta entrega contém: Onda 4 fatia 4.2a — fila de transcrição (só banco)

`docs/ROADMAP.md` agrupa "fila + worker Python/FFmpeg" num bullet só — grande demais pra uma fatia mergeável. Esta entrega corta em sub-fatias (decisão completa em `docs/DECISIONS.md`): **4.2a** (esta) é só a camada de banco, testável de ponta a ponta com pgTAP sem precisar de worker nenhum. 4.2b (próxima) liga isso à web — uma rota que chama `reserve_free_budget_and_enqueue` depois de um upload validado. 4.2c é o worker Python/FFmpeg propriamente dito.

- **`supabase/migrations/0008_transcription_jobs.sql`**: tabelas `transcription_jobs` (fila e estado — mesmo enum de 18 estados de `packages/contracts/src/job-states.ts`) e `job_steps` (transições auditáveis, append-only). `source_kind` trava em `'upload'` por check constraint — `'url'`/`media_sources` só quando existir adapter de plataforma (Onda 8, decisão registrada).
- **`supabase/migrations/0009_transcription_jobs_rls.sql`**: RLS habilitada, **sem nenhuma policy** — só `service_role` alcança, mesmo padrão de `budget_periods` na Onda 3.1 (a policy de leitura por workspace entra junto com a fatia 4.3, quando existir tela pra ler isso).
- **`supabase/migrations/0010_transcription_jobs_functions.sql`**: `reserve_free_budget_and_enqueue` (valida o `media_asset` + reserva orçamento + cria o job, tudo atômico), `claim_next_job` (`FOR UPDATE SKIP LOCKED`, lease, prioridade), `heartbeat_job` (renova lease, só o dono), `advance_job_step` (transição intermediária do pipeline + auditoria), `complete_job` (transição final + `capture_budget_reservation`), `fail_job` (retry com backoff exponencial até esgotar tentativas, depois `dead_letter` + `release_budget_reservation`).
- Decisões completas (por que source_kind trava em upload, por que RLS deny-all, por que sem reap de lease expirado, por que sem replicar o grafo de transições em SQL) em `docs/DECISIONS.md`.

## Configuração manual pendente (inalterado desde a última entrega)

1. Variáveis de storage no projeto Vercel real (`STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`).
2. Bootstrap de `platform_admins`:
   ```sql
   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'lucasds50@gmail.com';
   ```

## Entregas anteriores (mergeadas)

- **Onda 4 fatia 4.1** — `packages/storage` (R2 real), `media_assets`, upload autenticado (presigned PUT + validação pós-upload).
- **Onda 3 fatia 3.3** — `/admin` com kill switches e criação de `budget_periods`.
- **Onda 3 fatia 3.1/3.2** — billing/ledger/orçamento/quota completo, 5 funções atômicas.
- **Fatia 2.2/2.3** — Supabase Auth SSR completo, estado autenticado no header, `/{locale}/app`.
- **Fatia 1.4** — reconstrução fiel ao Google Stitch.

Detalhes completos em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- **Migrations `0008`–`0010` aplicadas de verdade** contra Postgres nativo local (`scripts/test-db-local.sh`) sobre o schema acumulado das fatias 2.1–4.1.
- **43 testes pgTAP novos** (`supabase/tests/13_transcription_jobs_queue.sql`, 37 testes; `supabase/tests/14_transcription_jobs_rls.sql`, 6 testes) — 161 no total. Cobrem: idempotência de enfileiramento (duplo clique não cria job duas vezes), asset não validado/de outro workspace rejeitado, orçamento insuficiente não deixa nada pra trás (fail-closed transacional), `claim_next_job` respeita prioridade e `FOR UPDATE SKIP LOCKED` (fila vazia devolve null sem erro), lease só é renovado/avançado pelo dono (`heartbeat_job`/`advance_job_step` rejeitam worker errado), `complete_job` capta o orçamento e é idempotente (recompletar não duplica `usage_ledger_entries`), `fail_job` retry com backoff (simulado adiantando `next_attempt_at` direto na tabela, já que pgTAP não espera tempo real passar) até esgotar tentativas e cair pra `dead_letter` com refund integral da reserva, idempotência de refalhar um job já `failed`, e RLS deny-all (`anon`/`authenticated` não alcançam nada, nem para inserir um job direto sem passar pela função).
- **`pnpm lint && pnpm typecheck && pnpm test && pnpm build`**: todos verdes (75 testes JS/TS + 2 skips esperados do S3 sem credenciais + 161 pgTAP).
- **O que NÃO pôde ser testado ao vivo**: não há nada para testar via HTTP nesta fatia — não existe rota nem UI nova (só banco). `reserve_free_budget_and_enqueue` nunca foi chamada fora dos testes pgTAP; a fatia 4.2b é quem vai exercitá-la a partir de uma rota real.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash scripts/test-db-local.sh
```

Não há UI nem rota nova pra clicar nesta fatia — é só camada de banco, testável só via pgTAP (`supabase/tests/13`–`14`).

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`–`0010` só rodaram neste sandbox.
- Um `media_asset` validado ainda não gera nenhum job de verdade — nada chama `reserve_free_budget_and_enqueue` fora dos testes (isso é a fatia 4.2b).
- Sem worker nenhum ainda, nenhum job jamais vai ser reivindicado/processado de verdade em produção (isso é a fatia 4.2c).
- Um worker que trava (não crasha — trava, sem nunca chamar heartbeat/fail) deixa o job preso até intervenção manual; não há reap de lease expirado (sem scheduler no projeto ainda). Risco teórico até existir um worker de verdade.
- O grafo completo de transições válidas (`packages/contracts/src/job-states.ts`) não é validado em SQL — `advance_job_step` só garante lease válido + estado não-terminal; o worker Python (4.2c) precisa portar a mesma máquina de estados, não reinventar.
- Variáveis de storage ainda não existem no projeto Vercel real (herdado da fatia 4.1).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates completos da Onda 3 (falta o provider de billing + Turnstile/rate limits); não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 4 fatia 4.2b: ligar `reserve_free_budget_and_enqueue` a uma rota/Server Action real (chamada depois que `POST /api/uploads/[id]/complete` valida um asset) — o primeiro consumidor real da fila.
2. Onda 4 fatia 4.2c: worker Python (FastAPI, `uv`) com FFmpeg + provider fake, rodando local em Docker — retomar aí a decisão de host (Railway/Render/Fly/VPS, hoje "a definir") e a estratégia de build sem depender do pull de imagem do Docker Hub bloqueado neste sandbox.
3. Onda 4 fatia 4.3: UI de processamento (etapas reais, `aria-live`, cancelamento) — é também quando `transcription_jobs`/`job_steps` ganham a primeira RLS policy de SELECT por workspace.
4. Onda 3 fatia 3.4 (Turnstile + rate limits) segue sem alvo real — permanece adiada, não esquecida.
5. Quando o dono autorizar: aplicar todas as migrations (`0001`–`0010`) no projeto Supabase real + configurar as 6 variáveis de storage na Vercel + rodar o bootstrap de `platform_admins`.

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
