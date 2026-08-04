# HANDOFF — PasteScribe

Última atualização: **2026-08-04** (Onda 0 até fatia 3.3 + Onda 4 fatia 4.1 + Onda 4 fatia 4.2a (com correção) mergeadas; Onda 4 fatia 4.2b — enfileirar automaticamente após upload validado — completa, PR a caminho)

## Branch e base

- Base: `main` (PRs #2–#13 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 4 fatia 4.2b completa — `POST /api/uploads/[id]/complete` agora enfileira um `transcription_job` de verdade depois de validar o upload. PR a caminho.
- **Merge de PR é automático** assim que CI estiver verde (autorização do dono, `docs/DECISIONS.md`). Pausa e pergunta explícita continuam obrigatórias para: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura (inalterado desde a última entrega)

Vercel (free) + projeto Supabase (free) já criados pelo dono; domínio ainda não comprado. Conta Cloudflare R2 real criada anteriormente (bucket `pastescribe-media`). **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita, com 12 migrations acumuladas (`0001`–`0012`, sem mudança nesta entrega — 4.2b é só código de aplicação). Variáveis de storage ainda pendentes no projeto Vercel real.

## Correção de desenho registrada na entrega anterior (ainda relevante)

A primeira versão da fila (fatia 4.2a) tinha uma função só que criava o job **e** reservava orçamento no mesmo instante, presumindo duração conhecida — corrigido para `enqueue_job` (sem custo) + `reserve_job_budget` (chamada pelo worker só depois da duração real). Detalhe completo em `docs/DECISIONS.md`, resumo no HANDOFF anterior (`git log`).

## O que esta entrega contém: Onda 4 fatia 4.2b — primeiro consumidor real da fila

- **`POST /api/uploads/[id]/complete`**: depois de marcar o `media_asset` como `validated`, chama `consume_quota` (bucket `enqueue:user:<uuid>`, janela = dia UTC, limite `MAX_JOBS_ENQUEUED_PER_DAY = 20` — provisório, `apps/web/lib/jobs/constants.ts`) e, se passar, `enqueue_job` (via admin client) — cria o `transcription_job` em `'queued'`, **sem nenhum orçamento envolvido**. A resposta ganhou `job: {id, state} | null` e `jobError` — falha em enfileirar (quota estourada ou erro) não derruba a validação do upload, que já aconteceu de verdade; os dois domínios de falha (upload válido vs. job pôde nascer) ficam separados na resposta.
- **`apps/web/lib/jobs/constants.ts`** (novo): `MAX_JOBS_ENQUEUED_PER_DAY`, `jobEnqueueQuotaBucket(userId)`, `jobEnqueueQuotaWindow(now?)` — funções puras, testadas.
- Nenhuma migration nova. Decisão completa (por que automático, por que a quota não é o gate de orçamento de IA, por que falha de enqueue não derruba a resposta 200) em `docs/DECISIONS.md`.

## Configuração manual pendente (inalterado desde a última entrega)

1. Variáveis de storage no projeto Vercel real (`STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`).
2. Bootstrap de `platform_admins`:
   ```sql
   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'lucasds50@gmail.com';
   ```

## Entregas anteriores (mergeadas)

- **Onda 4 fatia 4.2a (+ correção)** — `transcription_jobs`/`job_steps`, `enqueue_job`/`reserve_job_budget`/`claim_next_job`/`heartbeat_job`/`advance_job_step`/`complete_job`/`fail_job`, 176 testes pgTAP.
- **Onda 4 fatia 4.1** — `packages/storage` (R2 real), `media_assets`, upload autenticado (presigned PUT + validação pós-upload).
- **Onda 3 fatia 3.3** — `/admin` com kill switches e criação de `budget_periods`.
- **Onda 3 fatia 3.1/3.2** — billing/ledger/orçamento/quota completo, 5 funções atômicas.
- **Fatia 2.2/2.3** — Supabase Auth SSR completo, estado autenticado no header, `/{locale}/app`.

Detalhes completos em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- **Tipagem verificada via `tsc`**: as duas chamadas `.rpc("consume_quota", ...)` e `.rpc("enqueue_job", ...)` batem com `Database["public"]["Functions"]` (`packages/database`) — é a primeira vez que código de `apps/web` chama uma função Postgres via `.rpc()` neste projeto.
- **4 testes novos** (`apps/web/test/jobs.test.ts`) para as funções puras `jobEnqueueQuotaBucket`/`jobEnqueueQuotaWindow`.
- **Servidor real**: `curl -X POST /api/uploads/<id>/complete` sem Supabase configurado confirmado devolvendo `503 {"error":"not_configured"}` — o fail-closed de sempre, inalterado pela mudança.
- **`pnpm lint && pnpm typecheck && pnpm test && pnpm build`**: todos verdes (79 testes JS/TS + 2 skips esperados do S3 sem credenciais + 176 pgTAP, sem mudança na camada de banco).
- **O que NÃO pôde ser testado ao vivo**: o ciclo completo (sessão real → upload → complete → `enqueue_job` de verdade → linha em `transcription_jobs`) — exigiria um projeto Supabase real com usuário logado, impossível neste sandbox. Mesma limitação já registrada para todo fluxo autenticado desta sessão; `consume_quota`/`enqueue_job` já têm cobertura pgTAP profunda desde a 4.2a, então o risco é só na integração via `.rpc()`, não na lógica em si.

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash scripts/test-db-local.sh
```

Para testar o enfileiramento de ponta a ponta: aplicar as migrations no projeto real, configurar storage na Vercel, logar via `/login`, subir um arquivo e chamar `POST /api/uploads/<id>/complete` com uma sessão real — a resposta deve trazer `job: {id, state: "queued"}`.

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`–`0012` só rodaram neste sandbox.
- O ciclo HTTP completo (upload → complete → job criado) não foi exercitado ao vivo — ver seção de verificação acima.
- Sem worker nenhum ainda, todo job enfileirado fica parado em `queued` para sempre em produção — isso é a fatia 4.2c.
- `MAX_JOBS_ENQUEUED_PER_DAY = 20` é um número provisório, sem calibragem nenhuma — ajustável sem migration (é só uma constante TS).
- Retomar um job em `awaiting_user_confirmation` depois que o usuário pagar/upgradar é **A confirmar** — nada construído ainda (Onda 9).
- `source_kind='url'` é só estrutural — nenhuma rota, adapter, SSRF ou normalização de URL existe ainda (Onda 8).
- Variáveis de storage ainda não existem no projeto Vercel real (herdado da fatia 4.1).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates completos da Onda 3 (falta o provider de billing + Turnstile/rate limits); não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 4 fatia 4.2c: worker Python (FastAPI, `uv`) com FFmpeg + provider fake, rodando local em Docker — implementa o ciclo `claim_next_job` → descobre duração real (`ffprobe`) → `reserve_job_budget` → pipeline → `complete_job`/`fail_job`. Retomar aí a decisão de host (Railway/Render/Fly/VPS, hoje "a definir") e a estratégia de build sem depender do pull de imagem do Docker Hub bloqueado neste sandbox.
2. Onda 4 fatia 4.3: UI de processamento (etapas reais, `aria-live`, cancelamento) — é também quando `transcription_jobs`/`job_steps` ganham a primeira RLS policy de SELECT por workspace, e quando o usuário passa a ver o status do próprio job na tela.
3. Onda 3 fatia 3.4 (Turnstile + rate limits) segue sem alvo real — permanece adiada, não esquecida.
4. Quando o dono autorizar: aplicar todas as migrations (`0001`–`0012`) no projeto Supabase real + configurar as 6 variáveis de storage na Vercel + rodar o bootstrap de `platform_admins`.

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
