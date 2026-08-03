# API pública — PasteScribe (design v1, draft)

Criado na Onda 0 em 2026-08-03. **Status: design.** Implementação na Onda 11, atrás de `api_enabled`. Este documento fixa o contrato-alvo para que as ondas anteriores (jobs, billing, transcripts) não criem modelos incompatíveis com a API futura.

## Princípios

- Versionada: `/api/v1/...`; breaking change = v2, nunca mutação silenciosa.
- Mesmos schemas de `packages/contracts` usados pela web (uma fonte de verdade, OpenAPI gerada deles).
- Autenticação por API key (`Authorization: Bearer psk_...`); chave com hash no banco, prefixo exibível, scopes, revogável.
- Rate limits duráveis por chave; custos debitam o mesmo ledger da conta.
- `Idempotency-Key` aceito em toda mutação; repetição retorna o resultado original.
- Erros padronizados: `{ "error": { "code", "message", "request_id" } }`; códigos estáveis documentados.
- Paginação por cursor (`?cursor=&limit=`).
- `X-Request-Id` em toda resposta.

## Endpoints v1 (mínimos)

| Método | Rota | Scope | Descrição |
|---|---|---|---|
| POST | `/api/v1/jobs` | `jobs:write` | criar job por URL (`{source: {kind:"url", url}}`) ou por upload (`{source:{kind:"upload", upload_id}}`) |
| POST | `/api/v1/uploads` | `jobs:write` | iniciar upload → URL assinada + `upload_id` |
| GET | `/api/v1/jobs/{id}` | `jobs:read` | estado do job (máquina canônica) |
| POST | `/api/v1/jobs/{id}/cancel` | `jobs:write` | cancelamento |
| GET | `/api/v1/transcripts/{id}` | `transcripts:read` | transcript com metadados |
| GET | `/api/v1/transcripts/{id}/segments` | `transcripts:read` | segmentos paginados |
| POST | `/api/v1/transcripts/{id}/artifacts` | `artifacts:write` | gerar derivado (`kind: summary|chapters|...`) |
| GET | `/api/v1/artifacts/{id}` | `artifacts:read` | derivado |
| POST | `/api/v1/exports` | `exports:write` | gerar export (`format`, opções) |
| GET | `/api/v1/exports/{id}` | `exports:read` | estado + URL assinada temporária |
| GET | `/api/v1/usage` | `usage:read` | consumo/créditos do período |
| GET/POST/DELETE | `/api/v1/webhooks` | `webhooks:manage` | endpoints de webhook |

Gestão de chaves é só pela UI autenticada (criar/revogar), nunca pela própria API.

## Webhooks

Eventos: `job.completed`, `job.failed`, `artifact.completed`, `export.completed`. Assinatura HMAC-SHA256 no header (`X-PasteScribe-Signature`, timestamp incluído contra replay), retries com backoff finito, endpoint de re-listen documentado.

## Não-objetivos da v1

SDKs (geração possível via OpenAPI, publicação só após API estável); streaming de transcript em tempo real; gestão de workspace via API.
