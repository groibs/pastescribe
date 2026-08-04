# Catálogo de eventos de analytics — PasteScribe

Criado na Onda 0 em 2026-08-03. Catálogo fechado: evento fora desta lista não pode ser emitido. Instrumentação first-party, server-side, pseudonimizada, retenção inicial de 90 dias.

## Regra de ouro

Nenhum evento carrega texto de transcrição/legenda, título privado, URL completa, nome, e-mail, IP bruto, conteúdo de arquivo, API key, token ou dados de pagamento. Permitidos: IDs de catálogo, locale, plano, plataforma genérica, buckets, contadores, resolução e resultado.

## Aquisição e ativação

| Evento | Quando | Props permitidas |
|---|---|---|
| `landing_tool_started` | usuário cola URL/inicia upload | `platform`, `locale`, `page_kind` |
| `source_detected` | pré-análise concluída | `platform`, `has_native_captions`, `duration_bucket` |
| `signup_completed` | conta criada | `locale`, `method` |
| `email_verified_for_preview` | verificação amplia degustação | `locale` |
| `onboarding_completed` | onboarding concluído/pulado | `answers_count`, `skipped` |

## Degustação e conversão

| Evento | Quando | Props |
|---|---|---|
| `free_preview_started` | preview de transcrição enfileirado | `platform`, `preview_kind` |
| `free_preview_completed` | preview entregue | `platform`, `duration_bucket`, `latency_bucket` |
| `paywall_viewed` | oferta contextual exibida | `trigger`, `plan_context` |
| `single_job_purchased` | transcrição avulsa paga | `duration_bucket`, `currency` |
| `credit_pack_purchased` | pacote comprado | `pack_id`, `currency` |
| `subscription_started` | assinatura iniciada | `plan_id`, `interval`, `currency` |
| `subscription_cancelled` | cancelamento | `plan_id`, `reason_category` opcional |

## Uso do produto

| Evento | Quando | Props |
|---|---|---|
| `transcription_job_created` | job criado | `source_kind`, `platform`, `origin`, `duration_bucket` |
| `transcription_completed` | job concluído | idem + `latency_bucket`, `used_native_captions` |
| `transcription_failed` | job falhou | `error_code`, `platform`, `step` |
| `editor_opened` | editor aberto | `duration_bucket` |
| `artifact_generated` | derivado gerado | `artifact_kind`, `origin` |
| `export_completed` | export baixado | `format`, `options_count` |
| `share_created` | share criado | `scope`, `has_expiry` |
| `api_job_created` | job via API | `source_kind`, `scope` |

## Vídeo com legendas inseridas — eventos planejados

Só implementar junto com as fatias correspondentes; os nomes ficam reservados desde já.

| Evento | Quando | Props permitidas |
|---|---|---|
| `caption_preview_opened` | módulo secundário aberto | `duration_bucket`, `preview_duration_bucket`, `device_class` |
| `caption_preset_selected` | preset alterado | `preset_id`, `preset_version`, `position`, `has_highlight` |
| `caption_preview_completed` | preview chegou ao fim | `preset_id`, `preview_duration_bucket` |
| `caption_render_quote_viewed` | quote server-side exibido | `duration_bucket`, `resolution`, `price_bucket`, `currency`, `entitlement_origin` |
| `caption_render_checkout_started` | checkout iniciado | `duration_bucket`, `resolution`, `price_bucket`, `currency` |
| `caption_render_purchased` | compra confirmada pelo servidor | `duration_bucket`, `resolution`, `price_bucket`, `currency` |
| `caption_render_started` | render job iniciado | `duration_bucket`, `resolution`, `preset_id`, `entitlement_origin` |
| `caption_render_completed` | MP4 concluído | `duration_bucket`, `resolution`, `preset_id`, `latency_bucket`, `attempts_bucket`, `output_size_bucket` |
| `caption_render_failed` | render terminou em falha | `error_code`, `step`, `resolution`, `attempts_bucket` |
| `free_caption_render_redeemed` | benefício único capturado | `duration_bucket`, `resolution`, `free_state` |
| `render_pack_purchased` | pacote de render comprado | `pack_id`, `currency` |
| `render_plan_upgrade_started` | upgrade contextual iniciado | `from_plan_id`, `to_plan_id`, `trigger` |

Nenhum desses eventos recebe texto, fonte enviada pelo usuário, cor livre, URL assinada, nome de arquivo, quote_id, payment_id ou identificador externo do gateway.

## Sistema e custo — server-side

| Evento | Quando | Props |
|---|---|---|
| `free_state_changed` | estado do free mudou | `from`, `to`, `trigger` |
| `budget_threshold_reached` | 50/80/95/100% | `envelope`, `threshold` |
| `kill_switch_toggled` | switch mudou | `switch`, `to`, `actor_role` |
| `abuse_action_taken` | restrição aplicada | `signal_kind`, `action` |

## Buckets padronizados

- `duration_bucket`: `<1m`, `1-5m`, `5-15m`, `15-60m`, `>60m`
- `preview_duration_bucket`: `<=5s`, `6-10s`, `11-15s`
- `latency_bucket`: `<30s`, `30s-2m`, `2-10m`, `>10m`
- `attempts_bucket`: `1`, `2`, `3+`
- `output_size_bucket`: `<25mb`, `25-100mb`, `100-500mb`, `>500mb`
- `price_bucket`: definido server-side por moeda; nunca enviar valor exato quando não necessário ao experimento

## Implementação

- catálogo tipado e schemas estritos rejeitam chaves extras;
- servidor revalida allowlist e pseudonimiza ator/sessão;
- ambientes test e modos internos não emitem;
- tracking de terceiros, se existir, é condicionado a consentimento e recebe somente este catálogo;
- adicionar/alterar evento exige PR com revisão de PII linha a linha.
