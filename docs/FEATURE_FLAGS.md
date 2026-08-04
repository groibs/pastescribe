# Feature flags — PasteScribe

Criado na Onda 0 em 2026-08-03. Flag desligada esconde, nunca apaga; fallback seguro obrigatório; leitura centralizada.

## Regras

1. Nenhum código lê env de flag diretamente — tudo passa por `packages/config`.
2. Flag de risco/custo é opt-in: só `true`/`1` liga; ausente ou inválida = desligada.
3. Flags de build são públicas; flags dinâmicas vivem no banco e são resolvidas no servidor.
4. Kill switches precisam agir sem redeploy.
5. Ligar flag que muda coleta ou custo exige atualizar threat model e modelo de custo.
6. Toda flag tem teste nos dois estados quando implementada.
7. Uma flag nunca substitui entitlement, quota, orçamento, autorização ou validação server-side.

## Registro inicial

| Flag | Tipo | Default | Esconde/controla | Pré-condição para ligar |
|---|---|---|---|---|
| `openai_enabled` | dinâmica | `false` | chamada real à OpenAI | gates das Ondas 3+5 |
| `free_ai_enabled` | dinâmica | `false` | IA gratuita | orçamento durável + estados adaptativos |
| `free_native_captions_enabled` | dinâmica | `false` | legenda nativa no free | adapter ativo e barato |
| `link_ingestion_enabled` | dinâmica | `false` | ingestão por URL | SSRF testada |
| `youtube_adapter_enabled` … `loom_adapter_enabled` | dinâmica | `false` | cada adapter | pesquisa e testes |
| `upload_enabled` | dinâmica | `false` | upload | pipeline da Onda 4 completo |
| `diarization_enabled` | dinâmica | `false` | falantes | custo/qualidade validados |
| `batch_enabled` | dinâmica | `false` | lote | franquias e fila estáveis |
| `public_transcripts_enabled` | dinâmica | `false` | transcript público | ownership + remoção |
| `teams_enabled` | dinâmica | `false` | times | Onda 11 |
| `api_enabled` | dinâmica | `false` | API v1 | Onda 11 |
| `seo_cms_enabled` | dinâmica | `false` | CMS SEO | Onda 10 |
| `auto_free_budget_growth_enabled` | dinâmica | `false` | crescimento automático do free | 2 meses sustentáveis |
| `maintenance_mode` | dinâmica | `false` | bloqueia jobs novos, preserva leitura | — |
| `analytics_enabled` | build | `true` | analytics first-party sem PII | — |

## Flags planejadas para vídeo legendado

Estas flags são registro de planejamento. Não entram em `packages/config` antes do primeiro consumidor real.

| Flag | Tipo | Default | Controle | Pré-condição |
|---|---|---|---|---|
| `captioned_video_preview_enabled` | dinâmica | `false` | módulo secundário de preview no navegador | Onda 6.3, timestamps reais, a11y e analytics |
| `caption_presets_enabled` | dinâmica | `false` | escolha de presets/fontes/settings | presets versionados e licenciados |
| `captioned_video_render_enabled` | dinâmica | `false` | criação de `render_jobs` e MP4 | Onda 6.4, limites, idempotência, cleanup e entitlement fake |
| `free_captioned_video_export_enabled` | dinâmica/kill switch | `false` | benefício gratuito único | conta verificada, entitlement durável, Turnstile, orçamento e abuso |
| `caption_render_checkout_enabled` | dinâmica/kill switch | `false` | quote/checkout/captura pagos | Onda 9, billing server-side, webhooks e reconciliação |

Comportamentos seguros:

- preview off: transcrição e exports existentes continuam normais;
- presets off: nenhum controle ou promessa é exibido;
- render off: nenhum job MP4 é criado, mesmo com preview disponível;
- gratuito off: clientes pagos continuam elegíveis conforme entitlement;
- checkout off: quote pode ser ocultado ou ficar em provider fake, sem capturar valor;
- falha ao resolver qualquer flag = `false`.

Enquanto a tabela `feature_flags` não existe ou a flag ainda não foi implementada, nenhuma copy deve sugerir que o recurso está disponível.
