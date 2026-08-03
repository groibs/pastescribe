# Catálogo de eventos de analytics — PasteScribe

Criado na Onda 0 em 2026-08-03. Catálogo **fechado**: evento fora desta lista não pode ser emitido (o tipo em `packages/analytics` só aceita estes nomes; o servidor revalida por allowlist). Padrão adaptado do Ressoa (instrumentação própria, server-side, pseudonimizada, retenção 90 dias).

## Regra de ouro

Nenhum evento carrega, em nenhum campo: texto de transcrição, título de vídeo privado, URL completa, nome, e-mail, IP bruto, conteúdo de arquivo, API key, token, dados de pagamento. Permitidos: plataforma genérica (`youtube`), locale, plano, duração em faixas, contadores, resultado (`success|error_code`), UTM.

## Eventos

### Aquisição e ativação

| Evento | Quando | Props permitidas |
|---|---|---|
| `landing_tool_started` | usuário cola URL/inicia upload numa página pública | `platform`, `locale`, `page_kind` |
| `source_detected` | pré-análise concluída | `platform`, `has_native_captions`, `duration_bucket` |
| `signup_completed` | conta criada | `locale`, `method` (`magic_link|google|password`) |
| `email_verified_for_preview` | verificação para ampliar degustação | `locale` |
| `onboarding_completed` | onboarding respondido/pulado | `answers_count`, `skipped` |

### Degustação e conversão

| Evento | Quando | Props |
|---|---|---|
| `free_preview_started` | job de prévia enfileirado | `platform`, `preview_kind` (`anonymous|verified`) |
| `free_preview_completed` | prévia entregue | `platform`, `duration_bucket`, `latency_bucket` |
| `paywall_viewed` | oferta contextual exibida | `trigger` (`preview_end|quota_end|feature_gate`), `plan_context` |
| `single_job_purchased` | conclusão avulsa paga | `duration_bucket`, `currency` |
| `credit_pack_purchased` | pacote comprado | `pack_id`, `currency` |
| `subscription_started` | assinatura iniciada | `plan_id`, `interval`, `currency` |
| `subscription_cancelled` | cancelamento | `plan_id`, `reason_category` opcional |

### Uso do produto

| Evento | Quando | Props |
|---|---|---|
| `transcription_job_created` | job criado (qualquer origem) | `source_kind` (`url|upload`), `platform`, `origin` (`free|paid`), `duration_bucket` |
| `transcription_completed` | job concluído | idem + `latency_bucket`, `used_native_captions` |
| `transcription_failed` | job falhou | `error_code`, `platform`, `step` |
| `editor_opened` | editor aberto | `duration_bucket` |
| `artifact_generated` | derivado gerado | `artifact_kind`, `origin` |
| `export_completed` | export baixado | `format`, `options_count` |
| `share_created` | share criado | `scope` (`read|edit`), `has_expiry` |
| `api_job_created` | job via API pública | `source_kind`, `scope` |

### Sistema e custo (server-side apenas)

| Evento | Quando | Props |
|---|---|---|
| `free_state_changed` | Normal/Economy/Restricted/Blocked mudou | `from`, `to`, `trigger` (`budget|manual|abuse`) |
| `budget_threshold_reached` | 50/80/95/100% do orçamento | `envelope`, `threshold` |
| `kill_switch_toggled` | switch mudou | `switch`, `to`, `actor_role` |
| `abuse_action_taken` | bloqueio/restrição aplicada | `signal_kind`, `action` |

## Buckets padronizados

- `duration_bucket`: `<1m`, `1-5m`, `5-15m`, `15-60m`, `>60m`
- `latency_bucket`: `<30s`, `30s-2m`, `2-10m`, `>10m`

## Implementação (Onda 1+)

- `packages/analytics` exporta `track(event, props)` tipado pelo catálogo; props passam por schema zod que **rejeita chaves extras**;
- envio para rota server-side própria; servidor revalida allowlist, pseudonimiza ator/sessão (hash com salt rotacionável) e persiste;
- flag `analytics_enabled` (default on por ser first-party sem PII); ambientes test e modos internos não emitem;
- tracking de terceiros (GA/Ads), se um dia existir, é opt-in por env, condicionado a consentimento conforme jurisdição, e não recebe nada além deste catálogo.

## Mudanças

Adicionar/alterar evento = PR que atualiza este arquivo + o tipo + o schema, com revisão de PII linha a linha (skill `pastescribe-seo-international-check` cobre o gate de analytics).
