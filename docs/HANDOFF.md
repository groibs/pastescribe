# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4.3a (status, cancelamento e transcript somente leitura) verificada e mergeada.

## Estado do repositório

- Base/fonte de verdade: `main`.
- PR #17 mergeada: fundação Python/FFmpeg.
- PR #18 mergeada: adapters Supabase/R2/custo.
- PR #19 mergeada: transcript persistido e ciclo completo do worker (`0013`–`0015`).
- PR #20 mergeada: Onda 4.3a — RLS de leitura + UI de status/cancelamento (`0016`).
- Branch: `wave-4-3a-processing-ui` (mergeada; próxima fatia abre branch nova).
- Migrations versionadas: `0001`–`0016`. Nenhuma aplicada ao Supabase real do dono.
- `WORKER_AUTOSTART` continua `false` por padrão.
- Não há OpenAI real, host de produção, preview ou renderização MP4 para usuário.

## Política de merge e revisão

PRs são mergeadas automaticamente quando `checks`, `db-migrations-rls` e Vercel estiverem verdes.

Pausa/revisão explícita continua obrigatória para:

- aplicar migrations ou alterar o Supabase real;
- produção, DNS ou serviço pago;
- CI vermelho;
- primeira migration/contrato irreversível de renderização;
- decisão arquitetural significativa ou ambígua.

## Onda 4.3a — o que esta fatia entregou

### Banco

- `supabase/migrations/0016_job_transcript_read_rls.sql`: `authenticated` com `viewer+` no workspace lê `transcription_jobs`, `job_steps`, `transcripts`, `transcript_segments`; nenhuma escrita direta (INSERT/UPDATE/DELETE seguem exclusivos de `service_role`/funções `SECURITY DEFINER`).
- `supabase/tests/17_job_transcript_read_rls.sql` (20 testes novos): viewer lê as 4 superfícies e não escreve em nenhuma; estranho autenticado não vê nada; anon segue bloqueado; owner lê; `service_role` segue escrevendo.
- `supabase/tests/14_transcription_jobs_rls.sql`/`16_transcripts_rls.sql` atualizados: os invariantes negativos que preservam (anon bloqueado, `authenticated` não escreve direto) continuam testados ali; a leitura por membership passou a ser coberta no `17`.

### Web

- `GET /api/jobs/[id]` — status privado (`Cache-Control: private, no-store`), lido via client RLS-scoped do usuário (a visibilidade é inteiramente responsabilidade da RLS, sem checagem manual de membership no código).
- `POST /api/jobs/[id]/cancel` — confirma ownership com o client do usuário (RLS) antes de elevar para `service_role` e chamar `request_job_cancel`; exige same-origin (defesa CSRF).
- `/{locale}/app/jobs/{id}` — página autenticada com progresso real (`ProgressSteps`, `aria-live="polite"`), polling seguro (sem chamada paga), cancelamento, transcript somente leitura quando `completed`.
- `apps/web/lib/jobs/status.ts` — leitura/mapeamento de estado para as 5 etapas visíveis ao usuário, validação de UUID de job, regras de quando parar de fazer polling/permitir cancelar.
- Dashboard (`/{locale}/app`) lista os 5 jobs mais recentes do workspace.
- Copy completa em `en`/`pt-br`/`es` (`packages/i18n/src/job-status.ts`).

### Verificação real feita ao continuar esta PR

Esta PR foi aberta por outra sessão sem os checkboxes do test plan marcados e com CI vermelho (erro de TS por usar `Array.prototype.toReversed()`, incompatível com a lib `ES2022` do tsconfig, e dois testes RLS legados desatualizados). Ao retomar:

- confirmado que os commits de correção já estavam no branch (`toReversed` trocado por `.reverse()`, testes `14`/`16` realinhados);
- CI verde confirmado nos dois jobs (`checks`, `db-migrations-rls`) contra o HEAD atual;
- **checagem local independente**, mirroring exato do workflow de CI (`uv sync --project apps/worker --extra dev` antes de `pnpm lint/typecheck/test/build` — sem isso, `mypy`/`pytest` do worker não enxergam `fastapi`/`httpx`, que são dependências base, não extras de dev): `pnpm lint`, `pnpm typecheck` (TS + `mypy --strict`), `pnpm test` (34 UI + 8 web/jobs + demais pacotes + 18 Python passed/2 skipped — os 2 skips são testes que dependem de `ffmpeg` real, indisponível neste sandbox mas confirmado passando no runner do CI, que instala `ffmpeg` via `apt-get`), `pnpm build` — todos verdes;
- `bash scripts/test-db-local.sh`: **241/241 pgTAP** (17 arquivos) contra Postgres nativo local;
- revisão manual da migration `0016`, das duas rotas novas (`cancel`/status) e do componente `ProgressSteps` — padrão "confirma ownership sob RLS antes de elevar pra service_role" replicado corretamente do endpoint de upload; `error_detail` (pode conter mensagem crua) não é exposto ao client, só `error_code`.
- `docs/DATABASE.md`/`docs/DECISIONS.md` estavam desatualizados (ainda descreviam RLS como "não entregue" nesta fatia) — corrigido no mesmo commit que fecha esta PR.

## Ciclo do worker (herdado da 4.2c, inalterado nesta fatia)

```text
claim_next_job
→ media_asset validado
→ download local/R2
→ ffprobe
→ estimate + reserve_job_budget
→ awaiting_user_confirmation OU provider fake
→ postprocessing
→ complete_transcription_job
→ transcript persistido + orçamento capturado + completed
```

Falha interna passa por `fail_job`; temporários são removidos em sucesso, falha e cancelamento. Não afirmar que o ciclo foi exercitado contra Supabase/R2 reais — continua bloqueado por configuração/autorização.

## Configuração manual pendente

1. Autorizar aplicação das migrations `0001`–`0016` no Supabase real.
2. Configurar variáveis R2 na Vercel real.
3. Inserir o primeiro `platform_admin`.
4. Criar `budget_period` real.
5. Exercitar sessão → upload → enqueue → worker fake → transcript → tela de status, de ponta a ponta contra infraestrutura real.
6. Definir host do worker somente após o fluxo local/web estar estável.

## Guardrails do vídeo com legendas inseridas (inalterado)

- tese principal: **Paste any video. Get useful text.**
- recurso completo continua P1 comercial;
- `transcription_jobs` permanece específico; `render_jobs` só nasce na 6.4 após revisão explícita;
- não comunicar a feature como disponível agora.

## Próximo passo exato

1. **4.3b**: ligar a UI de upload ao status/transcript desta fatia, fechando o fluxo local da web (colar/upload → acompanhar → ler resultado) sem OpenAI real.
2. Retomar a decisão de host do worker (Railway/Render/Fly/VPS — hoje "a definir") quando o fluxo local estiver estável o bastante para justificar o primeiro deploy real.
3. Sweeper de leases expirados — ainda um risco aceito, sem scheduler no projeto.
4. Quando o dono autorizar: aplicar `0001`–`0016` no Supabase real + configurar R2 na Vercel + bootstrap de `platform_admins`/`budget_periods`.

Não ativar OpenAI real, não tocar o Supabase hospedado e não iniciar `render_jobs` sem autorização explícita.
