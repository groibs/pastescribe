# Threat model — PasteScribe

Criado na Onda 0 em 2026-08-03. Complementa `docs/SECURITY_BASELINE.md`. Toda mitigação marcada **[gate]** é bloqueante antes de expor a superfície correspondente.

## Ativos a proteger

1. orçamento e chaves do proprietário;
2. transcripts, legendas, originais e outputs dos usuários;
3. credenciais e URLs assinadas;
4. integridade de billing, entitlements e ledgers;
5. worker/FFmpeg, CPU, memória, disco, storage e egress;
6. reputação e indexação.

## Atacantes considerados

- abusador de free tier;
- atacante de SSRF;
- uploader malicioso;
- fraudador de billing/quote;
- injetor de prompt;
- usuário tentando IDOR/RLS;
- scraper de SEO;
- abusador de renderização tentando gastar CPU/storage/tráfego ou obter benefício gratuito repetido.

## T1 — Estouro do orçamento gratuito

Vetores: rajadas, contas descartáveis, retries duplicados, reload/duplo clique, concorrência, mídia longa e múltiplas contas.

Mitigações:

- **[gate]** reserva atômica antes de operação gratuita variável;
- **[gate]** quota durável;
- **[gate]** idempotência por operação lógica;
- **[gate]** fail-closed no free, paid preservado;
- **[gate]** kill switches separados;
- limites por conta, sessão, dispositivo, IP como sinal secundário, concorrência e global;
- Turnstile e sinais de abuso;
- estados Normal/Economy/Restricted/Blocked;
- chaves/orçamentos free e paid separados.

## T2 — SSRF via URL

Mitigações bloqueantes: apenas HTTP(S), allowlist por adapter, resolução DNS e pin de IP, rejeição de ranges privados/reservados, redirects revalidados, limites de tamanho/tempo, egress restrito e suíte SSRF antes de ativar link ingestion.

## T3 — Upload e mídia maliciosa

Vetores: MIME falso, arquivo enorme, container corrompido, codec malicioso, decompression bomb e path traversal.

Mitigações:

- **[gate]** tamanho real e duração via storage/ffprobe;
- **[gate]** MIME sniffing;
- **[gate]** key opaca e nome sanitizado;
- FFmpeg/ffprobe sem rede, em processo/container isolado;
- limites de CPU, memória, disco, tempo, frames e taxa de expansão;
- quarentena, TTL e exclusão automática;
- antivírus pluggable.

## T4 — Fraude de billing, quote e ledger

Vetores: webhook forjado/replay, client confirmando compra, preço manipulado, corrida de refund, saldo negativo e alteração de parâmetros depois do quote.

Mitigações:

- **[gate]** assinatura de webhook e event id único;
- **[gate]** crédito/entitlement somente server-side;
- **[gate]** ledger append-only e lançamentos compensatórios;
- **[gate]** quote expirável vinculado a workspace, mídia, transcript versionado, duração, resolução, preset/settings e versão da política;
- novo quote quando parâmetros mudarem;
- reconciliação provider ↔ ledger;
- client nunca envia preço final ou confirmação autoritativa.

## T5 — Prompt injection via transcript

Transcript é dado não confiável, delimitado; ações de IA sem efeitos colaterais; Structured Outputs; nenhum segredo ou conteúdo de outro usuário; logs só com métricas.

## T6 — Acesso cruzado a dados

- **[gate]** RLS por workspace;
- ownership revalidada no servidor;
- share tokens com hash, escopo, validade e revogação;
- admin server-side;
- download de output exige autorização atual, não apenas posse de ID.

## T7 — Vazamento de segredos e PII

- env separada e sem segredo público;
- catálogo fechado de analytics;
- logger com redação;
- secret scanning;
- nunca logar transcript, texto de legenda, mídia, filename, e-mail, IP bruto, quote payload, URL assinada ou token.

## T8 — Abuso de SEO/conteúdo

Transcript e output são privados/noindex por padrão. Publicação exige prova de controle, opt-in, remoção e quality gate.

## T9 — Abuso e exaustão na renderização de vídeo legendado

Superfícies novas, ainda não expostas:

- CPU/memória/disco excessivos;
- arquivos enormes ou corrompidos;
- codecs/containers maliciosos;
- decompression bombs;
- preset/settings que provoquem custo extremo;
- retries intencionais;
- render duplicado por reload/concorrência;
- download excessivo;
- storage abandonado;
- reutilização da exportação gratuita;
- múltiplas contas;
- alteração de duração, resolução, frame rate ou preset depois do quote;
- compra confirmada somente no client;
- cancelamento em ponto inseguro deixando reserva/output órfão.

Mitigações bloqueantes antes de `captioned_video_render_enabled=true`:

- **[gate]** `render_jobs` idempotente e separado de `transcription_jobs`;
- **[gate]** schema versionado e estrito de preset/settings; presets imutáveis por versão;
- **[gate]** allowlist de fontes licenciadas, filtros e resoluções;
- **[gate]** limites do FFmpeg para CPU, memória, disco, tempo, frames, output bytes e expansão;
- **[gate]** diretório temporário por operação e cleanup em todos os caminhos;
- **[gate]** progresso/heartbeat, timeout, cancelamento cooperativo e retries finitos;
- **[gate]** quote e entitlement validados no servidor imediatamente antes da reserva/job;
- **[gate]** idempotência em quote, reserva, compra, job, captura e download grant;
- **[gate]** URL assinada de curta duração e limite proporcional de downloads;
- **[gate]** TTL/sweeper para outputs e temporários abandonados;
- **[gate]** orçamento free separado do paid e kill switch do benefício gratuito;
- **[gate]** conta verificada + entitlement durável único + Turnstile + limites globais/concorrência;
- IP somente como sinal secundário;
- métricas sem conteúdo e alertas de custo/erro;
- falha interna libera/estorna reserva; retry/reload não cobra outra vez.

A prévia no navegador deve evitar processamento servidor por mount/reload/troca de controle. Preview servidor, se necessário, também exige cache e idempotência.

## Riscos aceitos nesta fase

- sem WAF dedicado no início;
- antivírus pluggable, não ativo por padrão;
- fingerprint é sinal fraco;
- não há superfície de renderização ativa, portanto os gates de T9 são planejamento e devem ser implementados nas Ondas 6.4/9, não agora.

## Revisão

Revisar a cada onda que exponha superfície nova, especialmente 4.2c, 5, 6.3, 6.4, 8, 9 e 11.
