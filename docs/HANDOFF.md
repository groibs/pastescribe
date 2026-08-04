# HANDOFF — PasteScribe

Última atualização: **2026-08-04** (Onda 0 até fatia 3.3 + Onda 4 fatia 4.1 mergeadas; Onda 4 fatia 4.2a — fila de transcrição, camada de banco, com correção de desenho — completa, PR a caminho)

## Branch e base

- Base: `main` (PRs #2–#12 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 4 fatia 4.2a **corrigida** — separa criar o job de reservar orçamento (ver §Correção abaixo). PR a caminho.
- **Merge de PR é automático** assim que CI estiver verde (autorização do dono, `docs/DECISIONS.md`). Pausa e pergunta explícita continuam obrigatórias para: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; domínio ainda não comprado. Conta Cloudflare R2 real criada anteriormente (bucket `pastescribe-media`). **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita, agora com 12 migrations acumuladas (`0001`–`0012`). Variáveis de storage ainda pendentes no projeto Vercel real.

## Correção de desenho nesta entrega (importante — leia antes de mexer em `transcription_jobs`)

A primeira versão de 4.2a (mergeada no PR #12) tinha uma função só (`reserve_free_budget_and_enqueue`) que criava o job **e** reservava orçamento no mesmo instante, presumindo que a duração da mídia já era conhecida ali. O dono apontou o problema: pra upload, a duração só existe depois que o worker baixa o arquivo e roda `ffprobe`; pra link, vem de metadata da própria plataforma — e antes disso pode até haver **legenda nativa pronta**, que não custa IA nenhuma. Declarar a duração no client foi descartado explicitamente (não dá pra confiar nisso, diferente de `content_type`/`size` que têm verificação barata via `headObject`).

**Desenho corrigido:** `enqueue_job` cria o job (`'queued'`) sem nenhum orçamento envolvido — determinístico, grátis. O worker processa o passo que revela a duração real, e só então chama `reserve_job_budget`: cabe no free → reserva de verdade + `transcribing`; excede → `awaiting_user_confirmation` (estado que já existia na máquina desde a Onda 0 sem nenhum caminho real até agora), sem cobrar ninguém (checkout pago é Onda 9). `source_kind='url'` também virou estrutural nesta correção (coluna `source_url` + check constraint), preparando o terreno pro link sem construir adapter/SSRF/fetch nenhum ainda. Decisão completa, incluindo por que descobrir a duração não consome o orçamento de IA, em `docs/DECISIONS.md`.

## O que esta entrega contém: Onda 4 fatia 4.2a — fila de transcrição (só banco)

`docs/ROADMAP.md` agrupa "fila + worker Python/FFmpeg" num bullet só — grande demais pra uma fatia mergeável. Esta entrega corta em sub-fatias (decisão completa em `docs/DECISIONS.md`): **4.2a** (esta) é só a camada de banco, testável de ponta a ponta com pgTAP sem precisar de worker nenhum. 4.2b (próxima) liga isso à web. 4.2c é o worker Python/FFmpeg propriamente dito.

- **`supabase/migrations/0008_transcription_jobs.sql`**: tabelas `transcription_jobs` e `job_steps` (transições auditáveis, append-only).
- **`supabase/migrations/0009_transcription_jobs_rls.sql`**: RLS habilitada, **sem nenhuma policy** — só `service_role` alcança (a policy de leitura por workspace entra junto com a fatia 4.3).
- **`supabase/migrations/0010_transcription_jobs_functions.sql`**: versão original das funções (histórico — a maioria foi substituída/ajustada em `0012`, ver abaixo).
- **`supabase/migrations/0011_transcription_jobs_split_budget.sql`**: `duration_seconds`/`source_url` novos; `media_asset_id` vira nullable; `source_kind` aceita `'url'` também (check constraint alargado + novo check de consistência garantindo exatamente um entre `media_asset_id`/`source_url`).
- **`supabase/migrations/0012_transcription_jobs_split_budget_functions.sql`**: `drop function reserve_free_budget_and_enqueue`; `enqueue_job` (cria o job, sem orçamento); `reserve_job_budget` (chamada pelo worker com a duração real — reserva ou manda pra `awaiting_user_confirmation`); `claim_next_job` atualizada com ramo por `source_kind` (`upload`→`acquiring_media`, `url`→`resolving_metadata`).
- **`packages/contracts/src/job-states.ts`**: `awaiting_user_confirmation` agora é sucessor válido de `acquiring_media` e `resolving_metadata` (os dois pontos onde a duração real passa a ser conhecida).
- Decisões completas (correção de desenho, por que `source_kind` aceita `url` estruturalmente, por que RLS deny-all, por que sem reap de lease expirado, por que sem replicar o grafo de transições em SQL, custo de descobrir duração) em `docs/DECISIONS.md`.

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

- **Migrations `0008`–`0012` aplicadas de verdade** contra Postgres nativo local (`scripts/test-db-local.sh`) sobre o schema acumulado das fatias 2.1–4.1.
- **`supabase/tests/13_transcription_jobs_queue.sql` reescrito** (52 testes) pro desenho corrigido: `enqueue_job` cria sem orçamento (idempotente, rejeita asset inválido/de outro workspace/combinação `source_kind` inconsistente), `claim_next_job` respeita prioridade e `FOR UPDATE SKIP LOCKED`, `reserve_job_budget` cobre os dois caminhos — cabe no free (grava `duration_seconds`, reserva, avança pra `transcribing`, idempotente) e excede o free (vai pra `awaiting_user_confirmation`, `error_code='exceeds_free_tier'`, solta o lease, nenhuma reserva criada) —, `heartbeat_job`/`advance_job_step` rejeitam worker que não é dono do lease, `complete_job`/`fail_job` idempotentes, retry com backoff até `dead_letter` com refund integral (só quando havia reserva). `supabase/tests/14_transcription_jobs_rls.sql` (6 testes) segue cobrindo RLS deny-all. **176 testes pgTAP no total.**
- **`pnpm lint && pnpm typecheck && pnpm test && pnpm build`**: todos verdes (75 testes JS/TS + 2 skips esperados do S3 sem credenciais + 176 pgTAP).
- **O que NÃO pôde ser testado ao vivo**: não há nada para testar via HTTP nesta fatia — não existe rota nem UI nova (só banco). Nem `enqueue_job` nem `reserve_job_budget` foram chamadas fora dos testes pgTAP; a fatia 4.2b é quem vai exercitá-las a partir de uma rota real.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash scripts/test-db-local.sh
```

Não há UI nem rota nova pra clicar nesta fatia — é só camada de banco, testável só via pgTAP (`supabase/tests/13`–`14`).

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`–`0012` só rodaram neste sandbox.
- Um `media_asset` validado ainda não gera nenhum job de verdade — nada chama `enqueue_job` fora dos testes (isso é a fatia 4.2b).
- Sem worker nenhum ainda, nenhum job jamais vai ser reivindicado/processado de verdade em produção, e `reserve_job_budget` nunca é chamada de verdade (isso é a fatia 4.2c).
- Retomar um job em `awaiting_user_confirmation` depois que o usuário pagar/upgradar é **A confirmar** — nada construído ainda, já que checkout pago não existe (Onda 9). O estado permite voltar pra `queued`, mas isso re-processaria do zero (redundante) — a forma certa de retomar sem refazer trabalho fica pra quando existir um fluxo pago de verdade.
- Um worker que trava (não crasha — trava, sem nunca chamar heartbeat/fail) deixa o job preso até intervenção manual; não há reap de lease expirado (sem scheduler no projeto ainda). Risco teórico até existir um worker de verdade.
- O grafo completo de transições válidas (`packages/contracts/src/job-states.ts`) não é validado em SQL — `advance_job_step`/`reserve_job_budget` só garantem lease válido + estado não-terminal; o worker Python (4.2c) precisa portar a mesma máquina de estados, não reinventar.
- `source_kind='url'` é só estrutural — nenhuma rota, adapter, SSRF ou normalização de URL existe ainda (Onda 8).
- Variáveis de storage ainda não existem no projeto Vercel real (herdado da fatia 4.1).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates completos da Onda 3 (falta o provider de billing + Turnstile/rate limits); não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 4 fatia 4.2b: ligar `enqueue_job` a uma rota/Server Action real (chamada depois que `POST /api/uploads/[id]/complete` valida um asset) — o primeiro consumidor real da fila. Decidir aí também a política de quota (`consume_quota`) que gate o `enqueue_job` contra abuso do passo determinístico de descoberta de duração.
2. Onda 4 fatia 4.2c: worker Python (FastAPI, `uv`) com FFmpeg + provider fake, rodando local em Docker — implementa de fato o ciclo `claim_next_job` → descobre duração real (`ffprobe`) → `reserve_job_budget` → pipeline → `complete_job`/`fail_job`. Retomar aí a decisão de host (Railway/Render/Fly/VPS, hoje "a definir") e a estratégia de build sem depender do pull de imagem do Docker Hub bloqueado neste sandbox.
3. Onda 4 fatia 4.3: UI de processamento (etapas reais, `aria-live`, cancelamento) — é também quando `transcription_jobs`/`job_steps` ganham a primeira RLS policy de SELECT por workspace.
4. Onda 3 fatia 3.4 (Turnstile + rate limits) segue sem alvo real — permanece adiada, não esquecida.
5. Quando o dono autorizar: aplicar todas as migrations (`0001`–`0012`) no projeto Supabase real + configurar as 6 variáveis de storage na Vercel + rodar o bootstrap de `platform_admins`.

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este), `packages/contracts/src/job-states.ts`.
