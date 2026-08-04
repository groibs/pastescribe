# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4 fatia 4.2c dividida em três subfatias; 4.2c-a e 4.2c-b mergeadas, 4.2c-c em PR com migrations, persistência de transcript e ciclo completo do worker.

## Estado do repositório

- Base/fonte de verdade: `main`.
- PR #17 mergeada: fundação Python/FFmpeg (`fef9aefe1d545a3b440769e318258f9d968ee671`).
- PR #18 mergeada: adapters Supabase/R2/custo (`5b7bcb42d11b79468bdf346ee498c7388cd7f13f`).
- Branch atual: `wave-4-2c-worker-cycle`.
- PR atual: #19 — transcript persistido e ciclo completo.
- Migrations desta branch: `0013`–`0015`; total versionado após merge: `0001`–`0015`.
- Nenhuma migration foi aplicada ao Supabase real do dono.
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

## Onda 4.2c — estado após esta PR

### Worker e mídia

- projeto Python/uv com FastAPI apenas para health/readiness;
- FFmpeg/ffprobe testáveis, limites de CPU/memória/tamanho/duração/timeout;
- subprocessos encerrados por process group;
- storage local e S3-compatible/R2 com streaming e teto de bytes;
- cleanup por job;
- logs JSON com redação de conteúdo sensível;
- provider fake determinístico;
- estimativa/reserva de custo configurável;
- polling da fila atrás de `WORKER_AUTOSTART=false`;
- heartbeat concorrente;
- cancelamento cooperativo em etapas seguras;
- retry finito via `fail_job`;
- espera em `awaiting_user_confirmation` antes do provider.

### Banco e resultado

- `transcripts`: resultado privado 1:1 com `transcription_jobs`;
- `transcript_segments`: segmentos ordenados com timestamps;
- RLS deny-by-default até a UI 4.3;
- `persist_transcript_result`: idempotente;
- `complete_transcription_job`: transcript + segmentos + captura de orçamento + `completed` na mesma transação;
- `request_job_cancel`: cancelamento imediato sem lease ou sinalização para worker ativo;
- `cancel_job`: confirmação pelo dono do lease e liberação da reserva;
- tipos compartilhados atualizados no mesmo PR.

### Ciclo implementado

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

Falha interna passa por `fail_job`; temporários são removidos em sucesso, falha e cancelamento.

## Verificação desta fatia

- migrations `0013`–`0015` aplicadas no Postgres efêmero do CI;
- 49 novos pgTAP para persistência, rollback, idempotência, RLS e cancelamento;
- banco verde no CI;
- testes Python cobrem sucesso, gate de orçamento, cancelamento por heartbeat e falha/retry;
- Ruff, mypy estrito, testes, build e Vercel precisam estar verdes antes do merge final.

Não afirmar que o ciclo foi exercitado contra o Supabase/R2 reais. O ciclo real hospedado continua bloqueado por configuração e autorização.

## Próximo passo exato após merge verde

**Onda 4 fatia 4.3a — leitura segura e UI de processamento.**

Recorte recomendado:

1. policies SELECT por workspace para `transcription_jobs`, `job_steps`, `transcripts` e `transcript_segments`;
2. testes RLS usuário A/B e papéis;
3. rota/página autenticada para acompanhar o job criado após upload;
4. `ProgressSteps` com estados reais e `aria-live`;
5. polling seguro sem chamadas pagas;
6. ação de cancelar usando `request_job_cancel` server-side;
7. exibição do transcript fake concluído em modo somente leitura;
8. estados de erro, retry, `awaiting_user_confirmation`, cancelled e completed;
9. nenhuma edição avançada ainda — editor completo permanece na Onda 6.

Depois: **4.3b** pode integrar o upload UI ao status/transcript e fechar o fluxo local da web sem criar OpenAI real.

## Configuração manual pendente

1. Autorizar aplicação das migrations `0001`–`0015` no Supabase real.
2. Configurar variáveis R2 na Vercel real.
3. Inserir o primeiro `platform_admin`.
4. Criar `budget_period` real.
5. Exercitar sessão → upload → enqueue → worker fake → transcript.
6. Definir host do worker somente após o fluxo local/web estar estável.

## Guardrails do vídeo com legendas inseridas

- tese principal: **Paste any video. Get useful text.**
- recurso completo continua P1 comercial;
- nenhuma migration de renderização entrou na Onda 4;
- `transcription_jobs` permanece específico;
- `render_jobs` só pode nascer na 6.4 após revisão explícita;
- preview começa na 6.3; monetização na 9.3–9.5;
- não comunicar a feature como disponível agora.

## Regra de continuidade

Após merge verde da #19, iniciar automaticamente a **4.3a** em branch/PR separada. Não ativar OpenAI real, não tocar o Supabase hospedado e não iniciar `render_jobs`.
