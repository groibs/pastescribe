# HANDOFF — PasteScribe

Última atualização: **2026-08-04** — Onda 4 fatia 4.2b mergeada; planejamento canônico da exportação de vídeo com legendas inseridas concluído em branch separada, sem implementação do recurso.

## Branch e base

- Base: `main`.
- PR #14 (`Onda 4 fatia 4.2b`) foi mergeada por squash em `main` após `checks`, `db-migrations-rls` e Vercel verdes.
- Merge SHA da PR #14: `1334c30df4caa3946ffc6dc2e7ce706a36cb5793`.
- Branch desta entrega: `plan-captioned-video-export`.
- Escopo: **somente planejamento/documentação** da nova saída de vídeo legendado e obrigações arquiteturais para evitar retrabalho no worker.
- Nenhuma migration, tabela, flag em código, endpoint, UI, billing ou renderização foi implementada.

## Política de merge

Merge automático continua autorizado quando todos os checks obrigatórios estiverem verdes. Pausa/revisão explícita continua obrigatória para:

- tocar o projeto Supabase real;
- alterar produção/DNS/serviço pago;
- CI vermelho;
- primeira migration/contrato irreversível de renderização;
- decisão arquitetural ambígua.

## Estado real da Onda 4

### Entregue e mergeado

- 4.1: storage R2 + upload autenticado e validado.
- 4.2a: `transcription_jobs`/`job_steps`, funções de fila, duração real e reserva separada.
- 4.2b: upload validado consome quota de enqueue e cria `transcription_job` real.

### Próxima fatia exata

**Onda 4 fatia 4.2c — worker Python + FFmpeg + provider fake.**

Aceite principal permanece:

1. `claim_next_job`;
2. adquirir mídia do storage;
3. `ffprobe` para duração real;
4. `reserve_job_budget`;
5. pipeline/provider fake;
6. `complete_job` ou `fail_job`;
7. cleanup, heartbeat, retry e timeout.

Obrigações P0 arquiteturais adicionadas pela nova funcionalidade, sem desviar o aceite:

- runner/porta de FFmpeg testável;
- progresso estruturado;
- timeout e cancelamento cooperativo;
- limites de CPU, memória, disco, duração e bytes;
- diretório temporário por operação e cleanup em todos os caminhos;
- telemetria de mídia: tipo de operação, wall time, tentativas, bytes, codec, frame rate e resolução;
- storage preparado conceitualmente para futuros outputs temporários;
- fixture simples de inserção de legenda somente se couber sem ampliar materialmente a fatia.

Não entram na 4.2c: `render_jobs`, MP4 para usuário, editor/presets, quote, checkout, compra ou benefício gratuito.

## PR #14 e o ciclo HTTP real

A PR #14 está tecnicamente completa e mergeada:

- lint, typecheck, testes e build verdes;
- 176 testes pgTAP verdes;
- deploy Vercel verde;
- tipagem das RPCs `consume_quota` e `enqueue_job` validada.

O ciclo HTTP completo `sessão real → upload → complete → linha real em transcription_jobs` **continua não exercitado** porque:

- migrations `0001`–`0012` ainda não foram aplicadas ao projeto Supabase real;
- variáveis do storage ainda não estão configuradas no projeto Vercel real;
- tocar esse ambiente exige autorização explícita.

Isso não é uma promessa de teste feito. O risco restante é integração com a infraestrutura real; a lógica SQL e contratos estão cobertos por CI/pgTAP.

## Nova funcionalidade planejada

O PasteScribe poderá futuramente:

> Exportar o vídeo com as legendas inseridas.

A tese central permanece:

> Paste any video. Get useful text.

Não reposicionar como editor de vídeo, repostagem ou publicação. Não usar “pronto para publicar”.

### Prioridade

- **P1 comercial:** recurso completo.
- **P0 arquitetural na fase atual:** somente primitivas do worker/storage/telemetria que evitem incompatibilidade futura.

### Decisão de arquitetura

- `transcription_jobs` permanece específico da transcrição;
- futura Onda 6.4 cria `render_jobs` separado, após revisão explícita;
- ambos podem compartilhar runtime do worker, storage, ledger de uso e observabilidade;
- não criar tabela genérica de jobs nem schema de renderização agora.

## Entrada exata por onda/fatia

### Onda 4.2c

Somente compatibilidade arquitetural do worker, descrita acima.

### Onda 6.1

Editor de transcrição e player sincronizado.

### Onda 6.2

TXT, Markdown, DOCX, PDF, SRT, VTT e JSON.

### Onda 6.3 — início real da experiência de vídeo legendado

- módulo secundário abaixo da transcrição;
- preview no navegador de até aproximadamente 15 segundos;
- timestamps reais;
- presets, fontes, cores, posição e reset;
- mobile, acessibilidade, cache/idempotência e analytics sem PII;
- sem timeline ou editor avançado.

### Onda 6.4 — início real da renderização completa

- revisão explícita do schema;
- `render_jobs` separado;
- presets/settings versionados;
- FFmpeg e MP4 com áudio preservado;
- 720p/1080p conforme entitlement;
- progresso, cancelamento seguro, retry finito e idempotência;
- reserva/reconciliação de custo com provider/entitlement fake;
- output temporário, URL assinada, TTL e cleanup;
- flags desligadas por padrão.

Nenhum pagamento real ativo nessa fatia.

### Onda 9.3

Quote server-side e compra avulsa de vídeo legendado.

### Onda 9.4

Pacotes, franquia de planos e primeira exportação gratuita elegível:

- uma vez por conta verificada;
- vídeo de até 2 minutos;
- máximo 720p;
- presets limitados;
- entitlement durável;
- Turnstile, orçamento, concorrência, limites globais e sinais de abuso;
- IP apenas como sinal secundário;
- free sujeito a Normal/Economy/Restricted/Blocked; paid preservado.

### Onda 9.5

Analytics do funil e experimentos de preço; decisão explícita entre minutos separados, créditos únicos ou modelo combinado.

### Onda 10

Comunicação secundária em features, pricing, FAQ e páginas de legendas/exports. Homepage preserva a tese principal.

Copy aceitável:

> Exporte como texto, SRT, VTT ou vídeo com as legendas inseridas.

## Decisões comerciais e de custo

- preço final não foi hardcoded;
- quote deve considerar duração, resolução, codec, frame rate, preset, scaling, processamento, storage, egress, retries, gateway, impostos e reserva;
- markup não é margem de contribuição;
- transcrição e renderização mantêm categorias internas de custo separadas;
- FFmpeg/storage/egress não entram artificialmente no modelo de chamadas de IA;
- documento específico de custo de mídia só será criado após a 4.2c produzir medições reais.

## Contratos planejados

Sem tabelas agora, mas o desenho exige schemas versionados para:

- preset imutável por versão;
- settings validados;
- quote expirável;
- render job;
- output MP4 temporário;
- entitlement;
- uso/reserva/captura;
- compra;
- expiração/download.

Quote, preço, saldo, entitlement e pagamento são autoridade do servidor.

## Segurança e abuso adicionados

- exaustão de CPU/memória/disco;
- arquivos enormes/corrompidos;
- codecs maliciosos e decompression bombs;
- retries provocados;
- render duplicado;
- downloads excessivos;
- storage abandonado;
- quote adulterado;
- confirmação de compra apenas no client;
- reutilização do benefício gratuito;
- múltiplas contas;
- alteração de resolução/duração/settings após quote.

Gates completos em `docs/THREAT_MODEL.md` e `docs/CAPTIONED_VIDEO_EXPORT.md`.

## Arquivos modificados nesta entrega

- `.claude/MEMORY_MAP.md`;
- `docs/CAPTIONED_VIDEO_EXPORT.md` — novo canônico;
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
- extensão de `StoragePort` para download/output;
- billing/quote/checkout;
- benefício gratuito;
- eventos/flags em packages;
- copy pública prometendo disponibilidade;
- documento de custo de mídia sem medições.

## Configuração manual pendente

1. Aplicar migrations `0001`–`0012` no projeto Supabase real, somente com autorização.
2. Configurar variáveis R2 na Vercel real.
3. Inserir o primeiro `platform_admin` no projeto real.
4. Exercitar o ciclo HTTP autenticado de ponta a ponta depois dos itens 1–3.

## Checks aplicáveis

Esta entrega é documental, sem código ou migration. Ainda assim, a PR deve passar:

- checks de documentação/repositório;
- lint;
- typecheck;
- testes;
- build;
- `db-migrations-rls` sem regressão;
- deploy Vercel.

## Próximo passo exato

Depois do merge desta PR de planejamento, iniciar **Onda 4 fatia 4.2c**. Não iniciar a experiência de vídeo legendado antes da Onda 6.3. Não criar `render_jobs` antes da revisão explícita da Onda 6.4.
