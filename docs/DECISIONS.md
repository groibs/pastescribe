# Decisões — PasteScribe

Este arquivo consolida as decisões ativas. Código e migrations vencem em caso de divergência; o histórico completo permanece no Git.

## Produto

### Nome e tese

- **Status:** ativa.
- **Decisão:** PasteScribe; tese principal **“Paste any video. Get useful text.”**
- **Consequência:** transcrição/texto útil são o núcleo. Saídas adicionais não reposicionam o produto.

### Gratuito adaptativo

- **Status:** ativa.
- **Decisão:** orçamento inicial próximo de R$ 500/mês; free controlado por Normal/Economy/Restricted/Blocked.
- **Consequência:** paid não para quando o free é reduzido.

### Multilíngue e conteúdo

- **Status:** ativa.
- **Decisão:** inglês, pt-BR e espanhol desde o início; sem scraping evasivo, DRM ou conteúdo privado.

## Workflow e infraestrutura

### Git/PR

- **Status:** ativa.
- **Decisão:** nunca desenvolver em `main`; uma PR por fatia. Merge automático quando checks, pgTAP e deploy estiverem verdes.
- **Pausa obrigatória:** Supabase/produção/DNS reais, serviço pago, CI vermelho ou arquitetura significativa/ambígua.

### Stack e separação

- **Status:** ativa.
- **Decisão:** Next.js/Vercel para web; Supabase para Auth/Postgres/RLS; Python/FastAPI/uv/FFmpeg para worker; storage S3-compatible.
- **Consequência:** Vercel não processa mídia nem executa FFmpeg.

### Fila

- **Status:** ativa.
- **Decisão:** filas em tabelas de domínio no PostgreSQL, `FOR UPDATE SKIP LOCKED`, lease/heartbeat, retry, prioridade, dead-letter e idempotência.
- **Consequência:** sem Redis inicial; migração física futura fica atrás de adapters.

### Storage

- **Status:** ativa.
- **Decisão:** local em dev/test, R2 como alvo de produção; keys opacas, TTL, URLs assinadas e cleanup.

### Banco local e tipos

- **Status:** ativa.
- **Decisão:** usar PostgreSQL nativo no sandbox; projeto real só com autorização. Tipos são mantidos manualmente enquanto geração oficial estiver indisponível.

## Custo e billing

### Ledger/orçamento/quota

- **Status:** ativa.
- **Decisão:** ledger append-only; saldo como cache; orçamento em centavos BRL; custo também em micros USD; quota durável; server-authority.

### Billing

- **Status:** parcial.
- **Decisão:** provider fake primeiro; integração real em test mode na Onda 9. Provider comercial final permanece a confirmar.

### OpenAI

- **Status:** bloqueada até a Onda 5.
- **Decisão:** providers/modelos configuráveis; chaves free/paid separadas; nenhuma chamada real antes dos gates.

## Onda 4 — upload, fila e worker

### Upload direto e quarentena

- **Status:** ativa.
- **Decisão:** upload presignado; validação real de tamanho/MIME; falha apaga o objeto antes de rejeitar.

### `transcription_jobs` específico

- **Status:** ativa; RLS de leitura entregue.
- **Decisão:** fila específica da transcrição. RLS de client entrou junto com o primeiro consumidor real (UI 4.3a, migration `0016`): `viewer+` do workspace lê `transcription_jobs`/`job_steps`/`transcripts`/`transcript_segments`; nenhuma escrita direta.

### Enqueue separado da reserva

- **Status:** ativa.
- **Decisão:** `enqueue_job` não reserva IA. Worker descobre duração real e chama `reserve_job_budget`.
- **Consequência:** excesso do free vai para `awaiting_user_confirmation` sem provider pago.

### Enqueue automático pós-upload

- **Status:** ativa.
- **Decisão:** rota de complete valida o asset, consome quota e enfileira. Falha de enqueue não desfaz a validação.

### Fundação do worker

- **Status:** entregue.
- **Decisão:** runner FFmpeg testável, limites de recursos, timeout, cleanup, logs redigidos, provider fake e container non-root.

### Adapters do worker

- **Status:** entregue.
- **Decisão:** portas estreitas para Supabase/RPC e storage local/S3; streaming com teto de bytes; estimativa configurável; autostart fail-closed.

### 2026-08-04 — Resultado de transcrição específico, não artifact genérico

- **Status:** ativa.
- **Contexto:** o worker precisa persistir resultado antes de marcar o job concluído. Um artifact genérico nesta fase criaria abstração sem consumidor.
- **Decisão:** `transcripts` é 1:1 com `transcription_jobs`; `transcript_segments` guarda timeline ordenada. Derivados/exports permanecem domínios futuros.
- **Consequência:** schema simples e auditável; editor/versionamento chegam na Onda 6.

### 2026-08-04 — Conclusão atômica específica da transcrição

- **Status:** ativa.
- **Contexto:** chamar uma RPC para persistir e outra para `complete_job` permitiria job completed sem resultado, ou resultado sem captura de orçamento.
- **Decisão:** `complete_transcription_job` executa transcript + segmentos + captura de orçamento + transição final na mesma transação.
- **Invariantes:**
  - nenhum completed sem transcript;
  - falha reverte tudo;
  - retry não duplica transcript, segmentos ou uso;
  - captura só ocorre depois de resultado válido.
- **Revisão:** quando providers reais exigirem múltiplos resultados/versões; preservar atomicidade.

### 2026-08-04 — Cancelamento em duas fases para job ativo

- **Status:** ativa.
- **Contexto:** web não pode apagar lease/processo do worker no meio de uma etapa.
- **Decisão:** sem lease, `request_job_cancel` cancela imediatamente; com lease, marca `cancel_requested`; heartbeat sinaliza e o worker chama `cancel_job` após interromper etapa segura.
- **Consequência:** reserva é liberada; subprocessos canceláveis são interrompidos; download bloqueante termina sob limites antes da confirmação.

### 2026-08-04 — Autostart desligado

- **Status:** ativa.
- **Decisão:** `WORKER_AUTOSTART=false` por padrão. Loop só inicia com Supabase/service role/storage/migrations/orçamento configurados.
- **Consequência:** merge não ativa infraestrutura nem custo real.

### Lease expirado

- **Status:** risco aceito temporariamente.
- **Decisão:** sweeper automático espera scheduler real. Worker morto pode exigir intervenção até essa fatia.

### 2026-08-04 — Onda 4.3b: upload real no dashboard, link continua desabilitado

- **Status:** entregue.
- **Decisão:** o card "Start transcribing" do dashboard replica a composição visual do Stitch (input de link + divisor "or" + dropzone), mas só a dropzone funciona de verdade — o input de link segue `disabled` com hint explicando que ainda não está disponível (mesmo padrão já usado na home desde a Onda 1, honesto sobre `source_kind=url` ser só estrutural). `UploadDropzone` (`apps/web/app/[locale]/app/_components/`) reusa o contrato já existente da 4.1/4.2b sem mudar nenhuma rota: `POST /api/uploads` (presigned) → `PUT` direto pro storage com progresso real (`XMLHttpRequest`, único jeito de ter evento de progresso de upload no browser) → `POST /api/uploads/[id]/complete` → redireciona pra `/{locale}/app/jobs/{job.id}` quando o job nasce. `apps/web/lib/uploads/limits.ts` (sem `server-only`) guarda `MAX_UPLOAD_SIZE_BYTES`/`ALLOWED_MEDIA_MIME_TYPES`/`validateSelectedFile` — o mesmo módulo que o servidor usa (via re-export em `constants.ts`, que continua `server-only`), pra client e servidor nunca divergirem sobre o limite. Validação client-side é só UX (feedback antes de gastar banda com um arquivo que o servidor rejeitaria); a fronteira de segurança real continua exclusivamente no servidor (`headObject` + MIME sniffing, fatia 4.1).
- **Acessibilidade:** dropzone é um `<label>` nativo envolvendo um `<input type="file">` (`sr-only`, não `display:none`) — Tab alcança o input, Enter/Espaço abrem o seletor nativo do SO, sem JS custom pra teclado; foco visível via `focus-within` no label (o input em si fica fora da área visível). Progresso usa `role="progressbar"` com `aria-valuenow` real, mais texto (`Uploading…`/`Validating…`) — nunca só a barra. Erros usam o componente `Alert` já revisado (`role="alert"`), com a mensagem de texto explicando o problema, nunca só cor.
- **O que NÃO pôde ser verificado ao vivo:** o fluxo completo de arrastar/soltar um arquivo real e ver o upload progredir — exigiria uma sessão autenticada real, indisponível neste sandbox (mesma limitação de sempre). Verificado ao vivo: a rota `/{locale}/app` continua redirecionando corretamente pra `/login` sem sessão, e o build/lint/typecheck de todas as três páginas de locale. A lógica pura de validação (`validateSelectedFile`) tem cobertura de teste completa.

### 2026-08-04 — Onda 4.3a: UI de status/cancelamento antes do editor

- **Status:** entregue.
- **Decisão:** primeira tela autenticada sobre o pipeline real (`/{locale}/app/jobs/{id}`) é somente leitura + cancelamento — sem edição, autosave ou exportação (isso é Onda 6). Status via polling de banco (`GET /api/jobs/[id]`, `no-store`) — nenhuma chamada paga entra nesse caminho. Cancelamento (`POST /api/jobs/[id]/cancel`) confirma ownership com o client RLS-scoped do usuário antes de elevar para `service_role` e chamar `request_job_cancel`; mesma origem exigida (defesa contra CSRF num POST autenticado por cookie).
- **Consequência:** `error_detail` (pode conter mensagem crua de exceção Postgres) nunca é exposto na resposta — só `error_code` (enum estável). `ProgressSteps` comunica estado por texto/`aria-current`/ícone, nunca só por cor; região `aria-live="polite"` anuncia mudança de estado pra leitor de tela.

## Vídeo com legendas inseridas

### Prioridade e posicionamento

- **Status:** planejamento ativo; recurso não disponível.
- **Decisão:** P1 comercial; apenas compatibilidade arquitetural foi P0 na Onda 4. Copy: “Exportar o vídeo com as legendas inseridas.”

### Domínio separado

- **Status:** ativa; revisão obrigatória antes da primeira migration.
- **Decisão:** não usar `transcription_jobs`. `render_jobs` separado somente na Onda 6.4, compartilhando runtime, storage, ledger e observabilidade.

### Ondas

- 6.3: preview no navegador;
- 6.4: render MP4 e domínio próprio;
- 9.3: quote/compra avulsa;
- 9.4: pacotes/planos/free;
- 10: comunicação secundária.

### Presets/settings

- **Decisão:** presets imutáveis por versão; settings estritos/versionados; fontes licenciadas/allowlisted; sem JSON arbitrário.

### Gratuito de renderização

- **Status:** bloqueado.
- **Decisão:** uma vez por conta verificada, até 2 min/720p, entitlement durável, Turnstile, orçamento, concorrência, abuso e kill switch. IP é sinal secundário.

### Preço/custo

- **Decisão:** quote server-side considera duração, resolução, codec, frame rate, preset, processamento, storage, egress, retry, gateway, impostos e reserva. Renderização não entra em custo de IA.

## Próximo passo

Onda 4.3a entregue (policies SELECT por workspace, UI de progresso/cancelamento, transcript somente leitura). Próximo: 4.3b (upload UI ligada ao status/transcript, fechando o fluxo local sem OpenAI real) ou retomar a decisão de host do worker para o primeiro deploy real.

## A confirmar

- host definitivo do worker;
- provider comercial de pagamento;
- estratégia por plataforma;
- tarifas reais dos derivados;
- unidade comercial final;
- política de preço após telemetria;
- desenho final de `render_jobs` na 6.4;
- scheduler/sweeper de leases expirados.
