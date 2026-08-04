# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4 fatia 4.2b e planejamento canônico da exportação de vídeo com legendas inseridas mergeados em `main`. Próximo passo: Onda 4 fatia 4.2c.

## Estado do repositório

- Base/fonte de verdade: `main`.
- PR #14 — **mergeada**: enfileiramento automático após upload validado.
  - merge SHA: `1334c30df4caa3946ffc6dc2e7ce706a36cb5793`.
- PR #15 — **mergeada**: planejamento da exportação de vídeo com legendas inseridas.
  - merge SHA: `a72e34093bc5192419a503c8e19baa170ffe5604`.
- Branch transitória deste ajuste de handoff: `handoff-captioned-video-planning`.
- Não há implementação de preview/renderização disponível.
- Migrations existentes no repositório: `0001`–`0012`; nenhuma aplicada ao Supabase real do dono.

## Política de merge e revisão

PRs podem ser mergeadas automaticamente quando `checks`, `db-migrations-rls` e Vercel estiverem verdes.

Pausa/revisão explícita é obrigatória para:

- aplicar migrations ou alterar o projeto Supabase real;
- produção, DNS ou serviço pago;
- CI vermelho;
- primeira migration/contrato irreversível de renderização;
- decisão arquitetural significativa ou ambígua.

## Entregas reais até aqui

- Onda 1: fundação do monorepo, design system inicial, home/pricing e observabilidade-base planejada.
- Onda 2: schema de identidade/workspaces, RLS, Auth SSR e área autenticada mínima.
- Onda 3: catálogo draft, ledger, orçamento, quota, funções atômicas e admin de kill switches/orçamento.
- Onda 4.1: R2/StoragePort, upload autenticado, quarentena e validação pós-upload.
- Onda 4.2a: `transcription_jobs`, `job_steps`, claim/heartbeat/complete/fail, duração real e reserva separada.
- Onda 4.2b: `POST /api/uploads/[id]/complete` consome quota e chama `enqueue_job`.
- Planejamento P1 de vídeo legendado: docs canônicos, ondas, segurança, custo, monetização, flags, analytics e design definidos sem código de runtime.

## PR #14 — teste HTTP real

A PR #14 está completa e mergeada com:

- lint, typecheck, testes e build verdes;
- `db-migrations-rls` verde, incluindo 176 pgTAP;
- Vercel verde;
- tipagem das RPCs `consume_quota` e `enqueue_job` validada.

O ciclo `sessão real → upload → complete → linha em transcription_jobs` **não foi exercitado no ambiente real** porque:

1. migrations `0001`–`0012` ainda não foram aplicadas ao Supabase real;
2. variáveis R2 ainda não estão configuradas na Vercel real;
3. tocar esses ambientes exige autorização explícita.

Não afirmar que esse teste foi feito. O risco restante é integração/configuração do ambiente real; a lógica SQL e os contratos estão cobertos por CI/pgTAP.

## Próximo passo exato — Onda 4 fatia 4.2c

Construir o worker Python + FFmpeg + provider fake, mantendo a fatia mergeável.

Fluxo obrigatório:

1. `claim_next_job`;
2. adquirir a mídia do storage;
3. executar `ffprobe` e obter duração real;
4. estimar custo e chamar `reserve_job_budget`;
5. executar pipeline/provider fake;
6. persistir resultado fixture;
7. `complete_job` ou `fail_job`;
8. heartbeat, retries, timeout, cancelamento seguro e cleanup.

Obrigações P0 arquiteturais adicionadas pelo planejamento de vídeo legendado:

- runner/porta de FFmpeg testável;
- progresso estruturado;
- timeout e cancelamento cooperativo;
- limites de CPU, memória, disco, duração e bytes;
- diretório temporário por operação e cleanup em sucesso/falha/cancelamento/timeout;
- telemetria comum de mídia: operação, wall time, tentativas, bytes, codec, frame rate e resolução;
- desenho de storage compatível com futuros outputs temporários;
- fixture simples de inserção de legenda apenas se não ampliar materialmente o escopo da 4.2c.

Fora da 4.2c:

- preview de legendas;
- presets/fontes no produto;
- `render_jobs`;
- MP4 para download;
- quote, checkout ou cobrança;
- benefício gratuito de renderização.

## Exportação de vídeo com legendas inseridas

### Posicionamento e prioridade

- tese principal preservada: **Paste any video. Get useful text.**
- saída adicional futura: **Exportar o vídeo com as legendas inseridas.**
- não posicionar como editor, repostagem ou plataforma de publicação;
- não usar “pronto para publicar”.
- recurso completo: **P1 comercial**;
- apenas compatibilidade do worker/storage/telemetria: **P0 arquitetural na Onda 4**.

### Decisão arquitetural

- `transcription_jobs` permanece específico da transcrição;
- futura Onda 6.4 cria `render_jobs` separado, após revisão explícita;
- domínios compartilham apenas runtime do worker, storage, ledger de uso e observabilidade;
- não criar tabela genérica de jobs ou migration de renderização antes do consumidor real.

### Entrada exata por onda

- **6.1:** editor de transcrição e player sincronizado.
- **6.2:** TXT, Markdown, DOCX, PDF, SRT, VTT e JSON.
- **6.3:** início da experiência real — preview secundário no navegador, até ~15 s, timestamps reais, presets, fontes, cores, posição, reset, mobile, a11y e analytics.
- **6.4:** início da renderização real — revisão do schema, `render_jobs`, settings/presets versionados, FFmpeg, MP4, 720p/1080p por entitlement, progresso, cancelamento, retries, reserva/reconciliação fake, URL assinada, TTL e cleanup.
- **9.3:** quote e compra avulsa server-side.
- **9.4:** pacotes, planos e benefício gratuito único.
- **9.5:** analytics comercial e decisão entre minutos separados, créditos únicos ou combinação.
- **10:** comunicação secundária em features/pricing/FAQ/páginas de legendas e exports, sem alterar a tese da homepage.

### Benefício gratuito planejado

- uma exportação por conta verificada;
- até 2 minutos;
- máximo 720p;
- presets limitados;
- entitlement durável e não renovável automaticamente;
- Turnstile, orçamento global, limite diário/mensal, concorrência e sinais de abuso;
- IP apenas como sinal secundário;
- Economy/Restricted/Blocked podem reduzir/suspender free sem afetar paid;
- flags e kill switch desligados por padrão.

### Preço e custo

- nenhum valor final hardcoded;
- quote considera duração, resolução, codec, frame rate, preset, scaling, processamento, storage, egress, retries, gateway, impostos e reserva;
- markup não é margem de contribuição;
- transcrição e renderização mantêm categorias internas separadas;
- FFmpeg/storage/egress não entram artificialmente no modelo de chamadas de IA;
- documento de custo de mídia só deve ser criado após medições reais da 4.2c.

## Documentos canônicos atualizados pela PR #15

- `.claude/MEMORY_MAP.md`;
- `docs/CAPTIONED_VIDEO_EXPORT.md` — novo;
- `docs/ROADMAP.md`;
- `docs/HANDOFF.md`;
- `docs/PASTESCRIBE_BRIEFING.md`;
- `docs/PASTESCRIBE_MONETIZATION.md`;
- `docs/DECISIONS.md`;
- `docs/PENDING_FEATURES.md`;
- `docs/ARCHITECTURE.md`;
- `docs/DATABASE.md`;
- `docs/THREAT_MODEL.md`;
- `docs/FEATURE_FLAGS.md`;
- `docs/DESIGN_SYSTEM.md`;
- `docs/ANALYTICS_EVENTS.md`;
- `docs/API.md`;
- `docs/AI_COST_MODEL.md`.

## O que não foi implementado

- preview;
- presets/fontes no código;
- `render_jobs` ou migration;
- renderização MP4;
- alteração do `StoragePort` para outputs/downloads;
- quote/billing/checkout;
- benefício gratuito;
- novos eventos/flags em packages;
- copy pública prometendo disponibilidade;
- documento de custo de mídia sem medições.

## Checks da PR #15

Todos verdes:

- lint;
- typecheck;
- testes;
- build;
- migrations/RLS/176 pgTAP;
- Vercel.

## Configuração manual pendente

1. Autorizar e aplicar migrations `0001`–`0012` no Supabase real.
2. Configurar variáveis R2 na Vercel real.
3. Inserir o primeiro `platform_admin` no projeto real.
4. Exercitar o ciclo HTTP autenticado de ponta a ponta.

## Regra de continuidade

A próxima PR de implementação deve ser a **Onda 4 fatia 4.2c**. Não iniciar preview antes da 6.3 e não criar `render_jobs` antes da revisão explícita da 6.4.
