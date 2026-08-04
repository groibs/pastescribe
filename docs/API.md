# API pública — PasteScribe (design v1, draft)

Criado na Onda 0 em 2026-08-03. Status: design. Implementação na Onda 11, atrás de `api_enabled`. Este documento fixa o contrato-alvo para que jobs, billing, transcripts e exports anteriores não criem modelos incompatíveis.

## Princípios

- Versionada em `/api/v1`; breaking change = nova versão.
- Schemas compartilhados e OpenAPI gerada.
- API keys com hash, scopes e revogação.
- Rate limits duráveis; custos debitam o mesmo ledger da conta.
- `Idempotency-Key` em toda mutação.
- Erros padronizados com `request_id`.
- Paginação por cursor.
- Quote, preço, entitlement, saldo e pagamento são autoridade do servidor.

## Endpoints v1 mínimos

| Método | Rota | Scope | Descrição |
|---|---|---|---|
| POST | `/api/v1/jobs` | `jobs:write` | criar job de transcrição por URL/upload |
| POST | `/api/v1/uploads` | `jobs:write` | iniciar upload |
| GET | `/api/v1/jobs/{id}` | `jobs:read` | estado do job |
| POST | `/api/v1/jobs/{id}/cancel` | `jobs:write` | cancelamento |
| GET | `/api/v1/transcripts/{id}` | `transcripts:read` | transcript |
| GET | `/api/v1/transcripts/{id}/segments` | `transcripts:read` | segmentos paginados |
| POST | `/api/v1/transcripts/{id}/artifacts` | `artifacts:write` | gerar derivado |
| GET | `/api/v1/artifacts/{id}` | `artifacts:read` | derivado |
| POST | `/api/v1/exports` | `exports:write` | gerar export de texto/legenda |
| GET | `/api/v1/exports/{id}` | `exports:read` | estado + URL assinada |
| GET | `/api/v1/usage` | `usage:read` | consumo/créditos |
| GET/POST/DELETE | `/api/v1/webhooks` | `webhooks:manage` | endpoints de webhook |

## Impacto futuro de vídeo legendado

A renderização de MP4 não será inserida silenciosamente em `transcription_jobs` nem tratada como export síncrono comum.

Quando o domínio estiver estável após as Ondas 6.4 e 9, a API poderá receber endpoints próprios, por exemplo:

| Método | Rota futura | Scope | Descrição |
|---|---|---|---|
| POST | `/api/v1/render-quotes` | `renders:write` | quote expirável e autoritativo para settings validados |
| POST | `/api/v1/renders` | `renders:write` | cria `render_job` idempotente com quote/entitlement válido |
| GET | `/api/v1/renders/{id}` | `renders:read` | estado, progresso e metadados do output |
| POST | `/api/v1/renders/{id}/cancel` | `renders:write` | solicita cancelamento seguro |
| GET | `/api/v1/renders/{id}/download` | `renders:read` | emite URL assinada curta se autorizado |

Essas rotas não fazem parte da API v1 mínima e não são promessa de disponibilidade. Antes de incluí-las, os schemas de preset/settings, quote, render job, entitlement, uso e output precisam estar versionados e testados.

O client nunca envia preço final, saldo, captura confirmada, duração confiável ou resolução acima do entitlement. Mudança nos parâmetros depois do quote exige novo quote.

## Webhooks

Eventos mínimos atuais: `job.completed`, `job.failed`, `artifact.completed`, `export.completed`.

Eventos futuros possíveis, somente após estabilização: `render.completed`, `render.failed`. Assinatura HMAC-SHA256, timestamp contra replay e retries finitos.

## Não-objetivos da v1

SDKs antes de estabilidade; streaming de transcript em tempo real; gestão de workspace; exposição pública prematura do domínio de renderização.
