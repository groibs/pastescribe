# Arquitetura — PasteScribe

Criado na Onda 0 em 2026-08-03. Válido até substituição registrada em `docs/DECISIONS.md`.

## Visão geral

```text
USUÁRIO
  │ HTTPS
  ▼
apps/web — Next.js/Vercel
  · páginas públicas, dashboard, editor e admin
  · auth SSR/cookies
  · autorização, quota, billing e criação de jobs
  · nunca executa FFmpeg ou processamento longo
  │ SQL/RPC
  ▼
Supabase — Postgres/Auth/RLS
  · workspaces, jobs, transcripts, ledger, orçamento, quota e flags
  · fila durável e funções atômicas
  ▲ claim/heartbeat/resultados
  │
apps/worker — Python/FastAPI/FFmpeg
  · download autorizado, ffprobe, providers e persistência
  · lease, heartbeat, retry, cancelamento, timeout e cleanup
  │ S3-compatible
  ▼
Storage temporário — local em dev; R2 como alvo de produção
```

## Separação web/worker

A web valida, autoriza, enfileira e lê estado. Vercel não faz download longo, FFmpeg ou transcrição.

O worker tem somente health/readiness HTTP; o fluxo de negócio passa pelo banco e storage.

## Worker entregue na Onda 4.2c

### Runtime

- Python 3.11+ com uv/FastAPI;
- container non-root;
- `FfmpegRunner` testável;
- ffprobe e FFmpeg com timeout;
- limites de CPU, memória virtual, input, output e duração;
- process group para interrupção;
- diretório temporário por job;
- cleanup em sucesso/falha/cancelamento;
- logs estruturados com redação;
- telemetria de duração, bytes, codecs, frame rate e resolução.

### Ports/adapters

- `JobRepository`: Supabase PostgREST/RPC com service role;
- `MediaStorage`: local e S3-compatible/R2 com streaming e teto de bytes;
- `TranscriptionProvider`: fake determinístico nesta onda;
- `MediaRunner`: FFmpeg/ffprobe.

### Ciclo durável

```text
claim_next_job
→ heartbeat concorrente
→ media_asset validado
→ aquisição do storage
→ ffprobe
→ estimativa + reserve_job_budget
→ awaiting_user_confirmation OU transcribing
→ provider fake
→ postprocessing
→ complete_transcription_job
```

`complete_transcription_job` grava transcript/segmentos, captura orçamento e conclui o job numa única transação. Falha interna passa por `fail_job`; cancelamento ativo é sinalizado por heartbeat e finalizado por `cancel_job`.

### Ativação

`WORKER_AUTOSTART=false` por padrão. Para ligar o loop são obrigatórios:

- Supabase URL + service role;
- migrations aplicadas;
- storage configurado;
- budget period aberto;
- host/ambiente controlado.

Nenhuma dessas condições foi aplicada ao ambiente real nesta sessão.

## Filas e domínios

### Transcrição

`transcription_jobs` é específico, com `FOR UPDATE SKIP LOCKED`, lease/heartbeat, retry finito, dead-letter, prioridade e idempotência.

`transcripts` e `transcript_segments` são resultados privados do domínio. RLS de leitura para usuários só entra com a UI da Onda 4.3.

### Renderização futura de vídeo legendado

Não generalizar `transcription_jobs` nem forçar renderização nela.

- `render_jobs` só pode nascer na Onda 6.4, com consumidor real e revisão explícita;
- transcrição/renderização podem compartilhar runtime, storage, ledger e observabilidade;
- estados, inputs, outputs, TTL, idempotência, custo e entitlement permanecem separados;
- fila física comum, caso futura, fica atrás de adapters e não substitui os modelos de domínio.

## Orçamento

A duração real vem de ffprobe. Só então o worker estima e chama `reserve_job_budget`.

- cabe no free: reserva e segue;
- não cabe: `awaiting_user_confirmation`, sem provider pago;
- sucesso: captura dentro da conclusão atômica;
- falha definitiva/cancelamento: libera reserva;
- reload/retry não duplica reserva nem captura.

Renderização futura terá categoria de custo separada de IA.

## Estados

A máquina canônica vive em `packages/contracts`; o worker Python porta os mesmos 18 estados.

```text
created → validating → awaiting_user_confirmation → queued
→ resolving_metadata → fetching_captions → acquiring_media
→ extracting_audio → normalizing_audio → transcribing
→ diarizing → postprocessing → indexing → completed
ativo → cancel_requested → cancelled
ativo → failed/retry
queued/awaiting → expired
```

## Storage e retenção

- original: key opaca, temporário, TTL;
- download do worker: streaming e teto de bytes;
- temporários locais: removidos por job;
- sweeper de órfãos/leases expirados: ainda pendente;
- outputs futuros: GET assinado e TTL, quando houver consumidor.

## Segurança

- service role somente no servidor/worker;
- nenhum segredo no client/log;
- asset filtrado por id, workspace e `validated`;
- URL arbitrária continua proibida até adapters/SSRF da Onda 8;
- transcript e mídia não entram em analytics;
- quote, custo, entitlement, saldo e pagamento são server-authority.

## Ambientes

| Ambiente | Web | Banco | Worker | Providers |
|---|---|---|---|---|
| local | pnpm dev | Postgres/Supabase local | worker local | fake |
| test/CI | build/testes | Postgres efêmero | pytest/FFmpeg | fake |
| preview | Vercel | Supabase dev | opcional | fake |
| production | Vercel | Supabase | host a definir | reais por flag |

## Próxima evolução

Onda 4.3: policies mínimas de leitura, UI de progresso/cancelamento e transcript fake somente leitura.

OpenAI real continua bloqueada até a Onda 5. Renderização de vídeo legendado continua bloqueada até 6.3/6.4.

## Proibições

- processamento pesado na Vercel;
- chamada paga em reload/mount/duplo clique;
- scraping evasivo, DRM ou conteúdo privado;
- mídia pública/permanente por padrão;
- job `completed` sem resultado persistido;
- renderização dentro de `transcription_jobs` por conveniência;
- schema genérico sem consumidor;
- autoridade financeira no client;
- schema fora de migration.
