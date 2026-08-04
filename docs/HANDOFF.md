# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4 fatia 4.2c-a mergeada; subfatia **4.2c-b — adapters do worker** em andamento na branch `wave-4-2c-worker-adapters`.

## Estado do repositório

- Base/fonte de verdade: `main`.
- PR #14 mergeada: enqueue automático após upload (`1334c30`).
- PR #15 mergeada: planejamento do vídeo com legendas inseridas (`a72e340`).
- PR #16 mergeada: handoff pós-planejamento (`8d42ffb`).
- PR #17 mergeada: fundação Python/FFmpeg do worker (`fef9aefe1d545a3b440769e318258f9d968ee671`).
- Branch atual: `wave-4-2c-worker-adapters`.
- Migrations existentes: `0001`–`0012`; nenhuma aplicada ao Supabase real do dono.
- Não há preview, renderização MP4, cobrança ou feature pública de vídeo legendado.

## Política de merge e revisão

PRs são mergeadas automaticamente quando `checks`, `db-migrations-rls` e Vercel estiverem verdes.

Pausa/revisão explícita continua obrigatória para:

- aplicar migrations ou alterar o Supabase real;
- produção, DNS ou serviço pago;
- CI vermelho;
- primeira migration/contrato irreversível de renderização;
- decisão arquitetural significativa ou ambígua.

## Onda 4.2c-a — mergeada

A fundação do worker contém:

- projeto Python 3.11+ com `uv`;
- FastAPI apenas para `/health` e `/ready`;
- FFmpeg/ffprobe isolados e testáveis;
- limites de CPU, memória, input, output, duração e timeout;
- subprocessos encerrados por process group;
- cleanup de temporários por operação;
- telemetria de mídia e logs JSON com redação;
- provider fake determinístico;
- Dockerfile non-root;
- Ruff, mypy estrito, pytest e build Python integrados ao CI;
- teste real de MP4/ffprobe/mídia corrompida/legenda curta em fixture.

Checks da PR #17: lint, mypy, pytest, build, 176 pgTAP e Vercel verdes.

## Subfatia atual — 4.2c-b: adapters do worker

### Implementado nesta branch

- modelo Python alinhado aos 18 estados canônicos de `transcription_jobs`;
- `SupabaseJobRepository` via PostgREST/RPC com service role, atrás de `JobRepository`;
- contratos para claim, heartbeat, leitura de asset, reserva, avanço, conclusão e falha;
- erros externos reduzidos a códigos estáveis, sem vazar payload do banco;
- filtro de asset por `id`, workspace e `status='validated'`;
- `LocalMediaStorage` com proteção contra path traversal;
- `S3MediaStorage`/R2 com streaming, validação de `ContentLength`, teto de bytes e fechamento do body;
- cálculo configurável de custo estimado, fator de reserva e conversão operacional USD→BRL;
- janela mensal em UTC;
- configuração fail-closed para Supabase, S3 e autostart;
- readiness expõe apenas estado de configuração, sem segredos;
- testes de contratos HTTP, custo, storage local/S3, limites e erros.

### Corte deliberado

Esta subfatia **não liga o loop automaticamente** e não completa jobs reais. Sem persistência durável do transcript, concluir o job seria incorreto.

Também ficam fora:

- migration de `transcripts`/`transcript_segments`;
- sink idempotente do transcript;
- heartbeat concorrente durante processamento;
- cancelamento atômico com liberação de reserva;
- orquestrador claim→download→ffprobe→reserve→fake→persist→complete;
- aplicação de migrations ou uso do Supabase real;
- host de produção.

Nenhuma migration é criada na 4.2c-b.

## Próximo passo exato após merge verde

**Onda 4 fatia 4.2c-c — persistência e ciclo local completo.**

Escopo:

1. migrations de `transcripts` e `transcript_segments`, específicas do domínio;
2. persistência idempotente e atômica do resultado fake;
3. função atômica de cancelamento que libera reserva quando aplicável;
4. atualização dos tipos de banco no mesmo PR;
5. heartbeat concorrente;
6. orquestrador completo usando os adapters da 4.2c-b;
7. `complete_job` somente depois do transcript persistido;
8. `fail_job`/retry finito em falha interna;
9. cancelamento entre etapas e timeout global;
10. testes pgTAP e integração local sem tocar o Supabase hospedado.

Depois da 4.2c-c, a 4.3 pode construir a UI de processamento e a primeira leitura RLS dos jobs/transcripts.

## PR #14 — teste HTTP real ainda pendente

O ciclo `sessão real → upload → complete → linha em transcription_jobs` não foi exercitado no ambiente real porque:

1. migrations `0001`–`0012` não foram aplicadas ao Supabase real;
2. variáveis R2 não foram configuradas na Vercel real;
3. tocar esses ambientes exige autorização explícita.

Não afirmar que esse teste foi feito. SQL e contratos continuam cobertos por CI/pgTAP; o risco restante é integração/configuração do ambiente real.

## Guardrails do vídeo com legendas inseridas

- tese principal: **Paste any video. Get useful text.**
- saída futura: **Exportar o vídeo com as legendas inseridas.**
- recurso completo é P1 comercial; compatibilidade do worker é P0 nesta onda.
- `transcription_jobs` permanece específico da transcrição.
- `render_jobs` só pode nascer na Onda 6.4, após revisão explícita.
- preview começa na 6.3; renderização na 6.4; monetização na 9.3–9.5.
- não comunicar a feature como disponível agora.

## Configuração manual pendente

1. Autorizar e aplicar migrations no Supabase real somente quando solicitado.
2. Configurar variáveis R2 na Vercel real.
3. Inserir o primeiro `platform_admin` no projeto real.
4. Exercitar o ciclo HTTP autenticado.
5. Definir host do worker após o pipeline local completo.

## Regra de continuidade

Após merge verde da 4.2c-b, iniciar automaticamente a **4.2c-c**. Não iniciar preview, `render_jobs`, checkout ou billing de renderização.
