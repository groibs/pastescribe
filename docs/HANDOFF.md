# HANDOFF — PasteScribe

Última atualização: **2026-08-04** (Onda 0 até fatia 3.3 mergeadas; Onda 4 fatia 4.1 — storage + upload autenticado — completa, PR a caminho)

## Branch e base

- Base: `main` (PRs #2–#10 já mergeadas)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet`
- Estado: Onda 4 fatia 4.1 completa (`packages/storage`, migration `media_assets`, endpoints de upload autenticado). PR a caminho.
- **Merge de PR é automático** assim que CI estiver verde (autorização do dono, `docs/DECISIONS.md`). Pausa e pergunta explícita continuam obrigatórias para: qualquer coisa que toque o projeto Supabase real, CI vermelho, ou mudança arquiteturalmente significativa/ambígua.

## Infraestrutura

Vercel (free) + projeto Supabase (free) já criados pelo dono; domínio ainda não comprado. **Nenhuma migration foi aplicada no projeto Supabase real do dono** — segue pendente de autorização explícita, agora com 7 migrations acumuladas (`0001`–`0007`).

**Novo nesta entrega:** conta Cloudflare R2 real criada pelo dono (bucket `pastescribe-media`), a pedido explícito dele (`AskUserQuestion` sobre onde persistir upload — ver `docs/DECISIONS.md`). As credenciais reais vivem em `.env.local` neste sandbox (gitignored, confirmado), válidas só para esta sessão. **O dono ainda precisa adicionar as mesmas variáveis no projeto Vercel real** (nenhum acesso ao dashboard existe aqui): `STORAGE_PROVIDER=s3`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION=auto`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

## O que esta entrega contém: Onda 4 fatia 4.1 — storage real + upload autenticado

`docs/ROADMAP.md` pede, para 4.1, a fundação de storage e o endpoint de upload. Fila de transcrição (`transcription_jobs`) e worker ficam para a próxima fatia (4.2) — sem eles, um `media_asset` validado ainda não dispara nada, só fica pronto pra ser referenciado.

- **`packages/storage`** (novo pacote): interface `StoragePort` (`createPresignedPut`, `headObject`, `getObjectRange`, `deleteObject`) com dois adapters — `s3-adapter.ts` (AWS SDK v3 contra R2 real) para produção, `local-adapter.ts` (filesystem, path-traversal protegido) só para dev/test. `AntivirusPort` pluggable com `noopAntivirusScanner` padrão. `apps/web/lib/storage/config.ts` decide o adapter via `STORAGE_PROVIDER`, com fail-closed real: `local` em produção Vercel (`process.env.VERCEL === "1"`) devolve `null`, nunca finge que funciona.
- **`supabase/migrations/0007_media_assets.sql`**: tabela `media_assets` (status `pending_upload|validated|rejected|deleted`, declarado vs. real, RLS `editor+` insere/`viewer+` lê, nenhuma policy de update/delete pra `authenticated` — só `service_role` faz transição de status).
- **`POST /api/uploads`**: cria o `media_asset` (`pending_upload`) e devolve uma URL presignada de PUT direto pro R2 — os bytes nunca passam pela função Next (limite de corpo da Vercel). Quem decide se o usuário pode criar a linha é a RLS, não um check manual.
- **`POST /api/uploads/[id]/complete`**: validação real pós-upload — `headObject` (tamanho de verdade) + `getObjectRange`+`file-type` (MIME real via sniffing de magic bytes, nunca o `Content-Type` que o client declarou) + scan (noop hoje). Qualquer falha apaga o objeto do storage antes de marcar `rejected` — padrão "quarentena, valida, libera ou apaga" (skill `pastescribe-upload-url-security` §2).
- Decisões completas (por que sem enforcement de tamanho via assinatura SigV4, por que local-adapter não serve pra produção, etc.) em `docs/DECISIONS.md`.

## Configuração manual pendente (o dono precisa fazer isto, não dá pra automatizar)

1. Adicionar as 6 variáveis de storage (`STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) no projeto Vercel real — sem isso, upload em produção responde `503 storage_not_configured` (fail-closed, não quebra silenciosamente).
2. O bootstrap de `platform_admins` da entrega anterior continua pendente:
   ```sql
   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'lucasds50@gmail.com';
   ```

## Entregas anteriores (mergeadas)

- **Onda 3 fatia 3.3** — `/admin` com kill switches e criação de `budget_periods`.
- **Onda 3 fatia 3.1/3.2** — billing/ledger/orçamento/quota completo, 5 funções atômicas.
- **Fix de hero** — `text-balance`/`text-pretty` corrigindo linhas viúvas/órfãs.
- **Fatia 2.2/2.3** — Supabase Auth SSR completo, estado autenticado no header, `/{locale}/app`.
- **Fatia 1.4** — reconstrução fiel ao Google Stitch.

Detalhes completos em commits/PRs anteriores (`git log`) e em `docs/DECISIONS.md`.

## Verificação real feita nesta sessão (não só "deveria funcionar")

- **`s3-adapter` testado ao vivo contra o bucket R2 real** (`pastescribe-media`): ciclo completo — presigned PUT, `fetch` PUT real (estilo browser), `headObject`, `getObjectRange` (range HTTP), `deleteObject`, reconfirmação de que o objeto sumiu. Rodado com `node --env-file=.env.local` fora do `pnpm test` automatizado (que sempre roda sem credenciais e faz skip limpo — `describe.skipIf`).
- **Migration `0007` aplicada de verdade** contra Postgres nativo local (`scripts/test-db-local.sh`) sobre o schema acumulado das fatias 2.1–3.3.
- **118 testes pgTAP** (108 anteriores + 10 novos em `supabase/tests/12`): editor+ insere, ninguém falsifica `created_by`, viewer lê mas não insere, **ninguém autenticado consegue fazer UPDATE de status** (nem o próprio dono da linha), não-membro não vê nada, `service_role` valida normalmente, constraints de status/tamanho barram até `service_role`.
- **Servidor real**: `curl -X POST /api/uploads` sem env do Supabase configurado confirmado devolvendo `503 {"error":"not_configured"}`, exatamente o fail-closed esperado.
- **O que NÃO pôde ser testado ao vivo**: o fluxo HTTP completo autenticado (sessão real → `POST /api/uploads` → PUT presignado real → `POST .../complete` → `media_assets` validado) — exigiria um projeto Supabase real com usuário logado, impossível neste sandbox. Mesma limitação já registrada para `/login`, `/app`, `/admin` nas entregas anteriores; só o caminho "não configurado" foi verificado ao vivo aqui, e as operações de storage foram verificadas à parte, de verdade, contra o R2 real.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`: todos verdes (75 testes JS/TS passando + 2 skips esperados do S3 sem credenciais, + 118 pgTAP).

## Como testar

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
bash scripts/test-db-local.sh
```

Para testar o `s3-adapter` contra R2 de verdade (precisa das credenciais em `.env.local`, não versionadas):
```bash
cd packages/storage && node --env-file=../../.env.local ./node_modules/.bin/vitest run
```

Para testar o fluxo de upload de ponta a ponta: aplicar as migrations no projeto real, configurar as variáveis de storage na Vercel, logar via `/login`, chamar `POST /api/uploads` com uma sessão real.

## Riscos e limitações

- **Nenhuma migration foi aplicada no projeto Supabase real do dono** — `0001`–`0007` só rodaram neste sandbox.
- **Variáveis de storage ainda não existem no projeto Vercel real** — upload em produção fica `503` até o dono configurar.
- O fluxo HTTP autenticado completo de upload não foi exercitado ao vivo — ver seção de verificação acima.
- `transcription_jobs`/worker (Onda 4.2) ainda não existem — um `media_asset` validado hoje não dispara nenhuma transcrição, só fica pronto para referenciar.
- Sem enforcement de tamanho por assinatura na URL presignada — o controle real é o `headObject`+delete pós-upload (decisão documentada, mesmo resultado de segurança por caminho diferente).
- Validação de duração (`ffprobe`) e proteção contra decompression bomb durante decodificação real ficam para a Onda 4.2 (dependem do worker de FFmpeg).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não alterar DNS/produção; não inserir segredos; não prometer feature que não existe; não liberar IA gratuita sem os gates completos da Onda 3 (falta o provider de billing + Turnstile/rate limits); não aplicar migrations no projeto Supabase real sem autorização explícita.

## Próximo passo exato

1. Onda 4 fatia 4.2: `transcription_jobs` + `media_sources` (URL) + worker FFmpeg (validação real de duração, extração de áudio, decompression-bomb protection) — a fatia que finalmente liga upload/URL a uma transcrição de verdade.
2. Onda 3 fatia 3.4 (Turnstile + rate limits) segue sem alvo real até existir checkout (Turnstile) ou endpoint de IA gratuita de fato consumível (rate limit) — permanece adiada, não esquecida.
3. Quando o dono autorizar: aplicar todas as migrations (`0001`–`0007`) no projeto Supabase real + configurar as 6 variáveis de storage na Vercel + rodar o bootstrap de `platform_admins`.

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
