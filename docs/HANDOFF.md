# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4.3b (upload real ligado ao status/transcript) completa, PR a caminho.

## Estado do repositório

- Base/fonte de verdade: `main`.
- PR #17 mergeada: fundação Python/FFmpeg.
- PR #18 mergeada: adapters Supabase/R2/custo.
- PR #19 mergeada: transcript persistido e ciclo completo do worker (`0013`–`0015`).
- PR #20 mergeada: Onda 4.3a — RLS de leitura + UI de status/cancelamento (`0016`).
- Branch atual: `claude/pastescribe-wave-0-vqgzet`. Onda 4.3b (upload no dashboard) completa nesta branch, PR a caminho.
- Migrations versionadas: `0001`–`0016` (4.3b não altera schema — só código de aplicação). Nenhuma aplicada ao Supabase real do dono.
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

## Onda 4.3b — o que esta fatia entregou

Fecha o fluxo local da web: até aqui existia validação/enfileiramento de upload (4.1/4.2b) e uma tela de status/cancelamento (4.3a), mas nenhuma UI real permitia iniciar um upload — o dashboard só listava jobs já existentes. Esta fatia adiciona o pedaço que faltava.

### Web

- `apps/web/app/[locale]/app/_components/UploadDropzone.tsx` (novo, client component): dropzone acessível (`<label>` nativo + `<input type="file" class="sr-only">`, sem JS custom para teclado) com drag-and-drop, progresso real via `XMLHttpRequest` (`role="progressbar"` + texto, nunca só a barra), erros via `Alert` (`role="alert"`, texto explicando o problema). Fluxo: `POST /api/uploads` → `PUT` presignado direto pro storage → `POST /api/uploads/[id]/complete` → redireciona pra `/{locale}/app/jobs/{job.id}` quando o job nasce. Nenhuma rota nova — reusa o contrato já existente e testado desde a 4.1/4.2b.
- `/{locale}/app` (dashboard) ganhou o card "Start transcribing": input de link **continua desabilitado** (mesmo padrão da home desde a Onda 1 — `source_kind=url` é só estrutural, sem adapter, Onda 8) + divisor "or" + a dropzone real. Reusa `TranscribeBar` (`packages/ui`) já existente.
- `apps/web/lib/uploads/limits.ts` (novo, **sem** `server-only`): `MAX_UPLOAD_SIZE_BYTES`, `ALLOWED_MEDIA_MIME_TYPES`, `validateSelectedFile`, `formatMegabytes`/`MAX_UPLOAD_SIZE_LABEL`. `apps/web/lib/uploads/constants.ts` (continua `server-only`) passou a reexportar os dois primeiros daqui, em vez de duplicar — client e servidor compartilham a mesma fonte de verdade sobre o limite.
- Validação client-side (tamanho/MIME) é só UX — evita gastar banda subindo um arquivo que o servidor certamente rejeitaria. A fronteira de segurança real continua 100% no servidor (`headObject` + MIME sniffing, inalterado desde a 4.1).
- Copy nova em `en`/`pt-br`/`es` (`packages/i18n/src/job-status.ts`, seção `upload`).

### Testes novos

- `apps/web/test/upload-limits.test.ts` (7 testes): `formatMegabytes`, `validateSelectedFile` (aceita dentro do limite, rejeita tamanho e tipo, tamanho vence quando os dois estão errados).
- Nenhuma migration/pgTAP nova — schema inalterado nesta fatia.

### Verificação real feita nesta sessão

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`: todos verdes (25 testes em `apps/web` + demais pacotes inalterados).
- `bash scripts/test-db-local.sh`: **241/241 pgTAP**, inalterado (confirma que 4.3b não quebrou nada da camada de banco).
- Servidor real: `/en/app` continua redirecionando `307` pra `/en/login` sem sessão (fail-closed inalterado); `/en`, `/pt-br`, `/es` respondem `200`.
- **O que NÃO pôde ser testado ao vivo**: o fluxo real de selecionar/arrastar um arquivo e ver o upload progredir de ponta a ponta — exigiria uma sessão autenticada real com Supabase configurado, indisponível neste sandbox (mesma limitação de sempre nesta sessão). A lógica pura de validação tem cobertura de teste completa; a integração via `fetch`/`XMLHttpRequest` contra as rotas reais foi revisada por código, não exercitada ao vivo.

## Ciclo do worker (herdado da 4.2c, inalterado)

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
5. Exercitar sessão → upload (agora com UI real) → enqueue → worker fake → transcript → tela de status, de ponta a ponta contra infraestrutura real.
6. Definir host do worker somente após o fluxo local/web estar estável.

## Guardrails do vídeo com legendas inseridas (inalterado)

- tese principal: **Paste any video. Get useful text.**
- recurso completo continua P1 comercial;
- `transcription_jobs` permanece específico; `render_jobs` só nasce na 6.4 após revisão explícita;
- não comunicar a feature como disponível agora.

## Próximo passo exato

1. Rodar o fluxo local de ponta a ponta contra um Supabase real (item 5 de configuração manual) assim que o dono autorizar — é o primeiro momento em que dá pra confirmar visualmente o ciclo completo (upload → job → worker fake → transcript) fora de testes automatizados.
2. Retomar a decisão de host do worker (Railway/Render/Fly/VPS — hoje "a definir") quando o fluxo local estiver validado contra infraestrutura real.
3. Sweeper de leases expirados — ainda um risco aceito, sem scheduler no projeto.
4. Link/URL (`source_kind=url`) segue sem adapter — Onda 8, com pesquisa técnica/jurídica por plataforma antes de qualquer ativação.
5. Quando o dono autorizar: aplicar `0001`–`0016` no Supabase real + configurar R2 na Vercel + bootstrap de `platform_admins`/`budget_periods`.

Não ativar OpenAI real, não tocar o Supabase hospedado e não iniciar `render_jobs` sem autorização explícita.
