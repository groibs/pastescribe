# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4 fatia 4.2c dividida em subfatias mergeáveis. A subfatia **4.2c-a — fundação do worker** está implementada na branch `wave-4-2c-worker-foundation`; CI/PR ainda pendentes neste ponto do documento.

## Estado do repositório

- Base/fonte de verdade: `main`.
- PR #14 mergeada: enfileiramento automático após upload validado (`1334c30df4caa3946ffc6dc2e7ce706a36cb5793`).
- PR #15 mergeada: planejamento da exportação de vídeo com legendas inseridas (`a72e34093bc5192419a503c8e19baa170ffe5604`).
- PR #16 mergeada: consolidação do handoff pós-planejamento (`8d42ffb2848173f90e7f09d737ddc8ff4a526cfe`).
- Branch atual: `wave-4-2c-worker-foundation`.
- Migrations existentes: `0001`–`0012`; nenhuma aplicada ao Supabase real do dono.
- Não há preview, renderização MP4, cobrança ou feature pública de vídeo legendado.

## Política de merge e revisão

PRs podem ser mergeadas automaticamente quando `checks`, `db-migrations-rls` e Vercel estiverem verdes.

Pausa/revisão explícita continua obrigatória para:

- aplicar migrations ou alterar o Supabase real;
- produção, DNS ou serviço pago;
- CI vermelho;
- primeira migration/contrato irreversível de renderização;
- decisão arquitetural significativa ou ambígua.

## Entregas reais anteriores

- Onda 1: fundação do monorepo, design system inicial e home/pricing.
- Onda 2: identidade/workspaces, RLS, Auth SSR e área autenticada mínima.
- Onda 3: catálogo draft, ledger, orçamento, quota, funções atômicas e admin.
- Onda 4.1: R2/StoragePort, upload autenticado, quarentena e validação pós-upload.
- Onda 4.2a: `transcription_jobs`, `job_steps`, claim/heartbeat/complete/fail, duração real e reserva separada.
- Onda 4.2b: `POST /api/uploads/[id]/complete` consome quota e chama `enqueue_job`.
- Planejamento P1 de vídeo legendado: docs, ondas, segurança, custo, flags, analytics e design sem código de runtime.

## Subfatia atual — 4.2c-a: fundação do worker

### Implementado

- `apps/worker` como projeto Python 3.11+ gerenciado por `uv`.
- FastAPI restrito a `/health` e `/ready`; nenhum endpoint público de negócio.
- `FfmpegRunner` testável com `ffprobe` e FFmpeg fora da Vercel.
- Subprocessos em process group próprio, mortos em timeout ou cancelamento.
- Limites configuráveis de CPU, memória virtual, tamanho de output, input e duração.
- Diretório temporário por operação e cleanup em sucesso, falha e timeout.
- Telemetria estruturada de mídia: duração, bytes, codecs, resolução e frame rate.
- Logger JSON com redação de transcript, e-mail, URL, autorização e segredos.
- Provider fake determinístico (`fake-transcriber-v1`).
- CLI local para validar arquivo real sem depender de Supabase/R2.
- Fixture curta de legenda embutida via FFmpeg usada somente em teste arquitetural; não é feature do produto.
- Dockerfile sem root no runtime, com FFmpeg e healthcheck.
- Scripts raiz `lint`, `typecheck`, `test` e `build` incluem o worker.
- CI instala Python 3.13, `uv`, FFmpeg e dependências do worker antes dos checks.
- Variáveis e limites documentados em `.env.example`.

### Verificação local feita

```text
PYTHONPATH=src python3 -m compileall -q src
PYTHONPATH=src pytest -q
7 passed
```

Os testes locais cobrem:

- defaults e invariantes de lease/heartbeat;
- redação de campos sensíveis;
- provider fake determinístico;
- cleanup do diretório por operação;
- `ffprobe` sobre MP4 real gerado na hora;
- rejeição de mídia corrompida;
- inserção curta de legenda em vídeo como fixture arquitetural.

Ruff e mypy dependem da resolução de pacotes do CI; este sandbox não possui acesso ao registro Python. Não declarar esses checks verdes antes do GitHub Actions.

## Corte deliberado da 4.2c-a

Ainda não entram nesta subfatia:

- polling/claim do Supabase;
- heartbeat contra as RPCs reais;
- download local/R2 pelo worker;
- `reserve_job_budget` chamado pelo worker;
- persistência de transcript fixture;
- `complete_job`/`fail_job` ligados ao loop real;
- migration de transcript;
- aplicação das migrations no Supabase real;
- host de produção do worker.

O corte existe para validar primeiro processo, isolamento, limites, cleanup e CI em Python antes de ligar credenciais, banco e storage.

## Próximo passo exato após o merge desta subfatia

**Onda 4 fatia 4.2c-b — adapters e ciclo real do worker.**

Escopo obrigatório:

1. `SupabaseJobRepository` via service role, atrás de porta estreita;
2. `claim_next_job` e heartbeat concorrente;
3. consulta server-side do `media_asset` validado;
4. `StoragePort` Python local + S3-compatible/R2 com streaming e teto de bytes;
5. `ffprobe` e cálculo configurável de reserva;
6. `reserve_job_budget`;
7. provider fake;
8. persistência idempotente do transcript fixture em schema próprio;
9. `complete_job`/`fail_job`;
10. cancelamento entre etapas, timeout global, retry finito e cleanup;
11. testes unitários + pgTAP + integração local sem tocar o Supabase real.

A primeira migration de transcript pode entrar na 4.2c-b porque terá consumidor real imediato (worker) e consumidor seguinte já definido (UI 4.3). Ela não deve criar `render_jobs` nem generalizar a fila.

## PR #14 — teste HTTP real ainda pendente

O ciclo `sessão real → upload → complete → linha em transcription_jobs` não foi exercitado no ambiente real porque:

1. migrations `0001`–`0012` não foram aplicadas ao Supabase real;
2. variáveis R2 não foram configuradas na Vercel real;
3. tocar esses ambientes exige autorização explícita.

Não afirmar que o teste foi feito. A lógica SQL e os contratos continuam cobertos por CI/176 pgTAP; o risco restante é integração/configuração do ambiente real.

## Guardrails do vídeo com legendas inseridas

- tese principal: **Paste any video. Get useful text.**
- saída futura: **Exportar o vídeo com as legendas inseridas.**
- recurso completo é P1 comercial; somente compatibilidade do worker é P0 nesta onda.
- `transcription_jobs` permanece específico da transcrição.
- `render_jobs` só pode nascer na Onda 6.4, após revisão explícita.
- preview começa na 6.3; renderização completa na 6.4; monetização na 9.3–9.5.
- não comunicar a feature como disponível agora nem usar “pronto para publicar”.

## Configuração manual pendente

1. Autorizar e aplicar migrations no Supabase real somente quando solicitado.
2. Configurar variáveis R2 na Vercel real.
3. Inserir o primeiro `platform_admin` no projeto real.
4. Exercitar o ciclo HTTP autenticado de ponta a ponta.
5. Definir host de produção do worker depois do pipeline local completo.

## Regra de continuidade

Após merge verde da 4.2c-a, iniciar automaticamente a **4.2c-b** em branch/PR separada. Não iniciar preview, `render_jobs`, checkout ou billing de renderização.
