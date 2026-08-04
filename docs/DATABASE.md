# Modelo de dados — PasteScribe

Criado na Onda 0 em 2026-08-03. Este documento define o desenho; o estado real é sempre o das migrations em `supabase/migrations/`. Em divergência, migration vence e este arquivo deve ser corrigido.

## Estado entregue

Migrations `0001`–`0012` existem no repositório e foram testadas localmente/CI, mas ainda não foram aplicadas ao projeto Supabase real do dono.

Entregue no schema versionado:

- identidade e workspaces (`0001`–`0002`);
- planos draft, créditos, usage ledger, orçamento e quotas (`0003`–`0005`);
- `platform_admins` e flags iniciais (`0006`);
- `media_assets` (`0007`);
- `transcription_jobs`, `job_steps` e funções da fila (`0008`–`0012`).

Não entregue:

- worker Python/FFmpeg;
- transcripts/segmentos/editor;
- billing customers/subscriptions/payment events;
- abuse signals/events;
- media sources/adapters;
- exports persistidos;
- qualquer tabela de preview ou renderização de vídeo legendado.

Convenções: UUID como PK; timestamps `timestamptz`; FKs com `on delete` explícito; índices por padrão de acesso real; RLS deny-by-default; schema somente via migration.

## Identidade e workspaces

- `profiles`: perfil 1:1 com `auth.users`; e-mail permanece no Auth.
- `workspaces`: unidade de ownership/billing.
- `workspace_members`: papel `owner|admin|editor|viewer` por workspace.
- `workspace_invites`: convite com token hash, validade e status.

## Catálogo, créditos, uso e orçamento

### Entregue

- `plans` / `prices`: catálogo server-side; valores atuais são draft e `is_purchasable=false`.
- `credit_accounts`: uma conta por workspace; saldo é cache derivado do ledger.
- `credit_ledger_entries`: append-only; `purchase|grant|reserve|capture|release|refund|adjust`; correção é lançamento compensatório.
- `usage_ledger_entries`: uso real sem conteúdo, com custo estimado/real e referência ao workspace/reserva.
- `budget_periods`: teto, reservado e consumido por envelope/período.
- `budget_reservations`: reserva expirável e idempotente por identidade opaca.
- `free_tier_configs`: políticas atuais de degustação da transcrição.
- `quota_counters` / `quota_consumption_entries`: quota durável com log append-only e idempotência.

### Futuro — Onda 9

- `billing_customers`;
- `subscriptions`;
- `payment_events` com provider event id único;
- compras/entitlements necessários à transcrição e à renderização;
- `abuse_signals` / `abuse_events` quando houver detector e consumidor reais.

Quote, preço, entitlement, saldo e captura são sempre autoridade do servidor.

## Mídia e transcrição

### `media_assets` — entregue

Representa upload original temporário:

- ownership por workspace/usuário;
- `storage_key` opaca;
- filename apenas para exibição, sanitizado;
- status `pending_upload|validated|rejected|deleted`;
- conteúdo/tamanho declarados separados dos valores reais;
- motivo de rejeição, validade e timestamps;
- RLS: membros podem criar/ler conforme papel; transições de status são server-only.

`media_assets` não deve ser transformada prematuramente numa tabela genérica de qualquer output. Original, temporário de processamento e output final temporário têm ciclos de vida diferentes.

### `transcription_jobs` — entregue

Fila específica de transcrição:

- `workspace_id`, `created_by`;
- `source_kind: upload|url`;
- exatamente um entre `media_asset_id` e `source_url`;
- estado compatível com `packages/contracts/src/job-states.ts`;
- prioridade e `idempotency_key` única;
- lease/heartbeat;
- retries, backoff, dead-letter e próxima tentativa;
- cancel request estrutural;
- reserva de orçamento opcional;
- duração real descoberta pelo worker;
- erros sem conteúdo sensível.

`source_kind=url` é apenas estrutural; nenhum adapter/rota real existe ainda.

### `job_steps` — entregue

Histórico append-only de transições de `transcription_jobs`, com ator e timestamp.

`job_attempts` não existe: será criado somente se um consumidor real exigir granularidade adicional além de `job_steps` + retry count.

## Funções SQL atômicas entregues

### Identidade/RLS

- `handle_new_user()`;
- `handle_new_workspace()`;
- `workspace_role_rank()`;
- `is_workspace_member()`.

### Quota, ledger e orçamento

- `consume_quota()`;
- `ledger_append()`;
- `reserve_free_budget()`;
- `capture_budget_reservation()`;
- `release_budget_reservation()`.

### Fila de transcrição

- `enqueue_job()`: cria job sem reserva de IA;
- `reserve_job_budget()`: após duração real, reserva free ou move para `awaiting_user_confirmation`;
- `claim_next_job()`;
- `heartbeat_job()`;
- `advance_job_step()`;
- `complete_job()`;
- `fail_job()`.

Todas as funções privilegiadas são `SECURITY DEFINER`, `search_path` fixo e executáveis apenas por `service_role` quando aplicável.

## Transcript, derivados e exports — futuro

- `transcripts`: resultado por job, fonte e idioma.
- `transcript_segments`: `start_ms`, `end_ms`, texto e speaker.
- `speakers`;
- `transcript_versions`: edições não apagam o original.
- `generated_artifacts` / `artifact_versions`;
- `exports`: TXT/MD/DOCX/PDF/SRT/VTT/JSON, estado e output temporário.

Essas tabelas entram com consumidor real nas Ondas 4.3, 6 e 7.

## Vídeo com legendas inseridas — planejamento, sem schema

### Decisão de domínio

Não reutilizar nem alargar `transcription_jobs` para renderização.

A Onda 6.4 deve avaliar e, após revisão explícita, criar `render_jobs` separados. Transcrição e renderização compartilham apenas primitivas de worker, storage, ledger de uso e observabilidade.

Não criar tabela genérica de jobs nesta fase.

### Entidades candidatas — somente quando necessárias

Os nomes finais dependem da implementação e não são migrations aprovadas:

- `caption_presets` ou catálogo equivalente: preset imutável por versão, defaults, capabilities e licença;
- `render_jobs`: fila/estado/progresso/lease/retries/cancelamento/idempotência;
- `render_outputs`: MP4 temporário, storage key, bytes, checksum, codec, resolução, duração, TTL e exclusão;
- `render_quotes`: quote expirável, parâmetros autorizados e versão da política de preço;
- `render_entitlements` ou estrutura equivalente: origem `free_once|single_purchase|pack|plan`;
- `render_purchases`: vínculo auditável com evento confiável do provider, se não for absorvido pelo modelo geral de billing;
- uso/reservas de renderização: categoria separada da transcrição, mesmo quando compartilhar tabelas gerais de ledger/orçamento.

Não criar todas essas tabelas automaticamente. Cada uma exige consumidor, padrão de acesso, RLS, idempotência e teste na mesma fatia.

### Schemas versionados obrigatórios

`render_settings` não pode ser JSON arbitrário. Quando implementado, deve ser validado por schema versionado e estrito, contendo apenas:

- `schema_version`;
- `preset_id` + `preset_version`;
- fonte allowlisted;
- tamanho em faixa;
- cores válidas;
- posição enumerada;
- fundo/contorno/sombra enumerados;
- palavras máximas por bloco em faixa;
- resolução/scaling autorizados.

Preset é imutável por versão para reprodução, suporte, auditoria e retry.

### Regras de integridade futuras

- um render referencia mídia e versão do transcript existentes no mesmo workspace;
- parâmetros efetivos são os do quote/entitlement validado no servidor;
- mudança de duração, resolução ou settings após quote exige novo quote;
- idempotency key impede duplicação por reload/retry;
- output nunca é público por padrão;
- download usa URL assinada curta e autorização atual;
- TTL/cleanup são obrigatórios;
- falha interna libera ou estorna reserva/crédito;
- benefício gratuito é entitlement único e durável, não inferido só por IP.

Planejamento completo: `docs/CAPTIONED_VIDEO_EXPORT.md`.

## RLS

1. deny-by-default;
2. membership do workspace é a base;
3. papel controla escrita;
4. tabelas financeiras, quota, quote, entitlement, compra e uso são server-only;
5. shares nunca abrem tabelas diretamente;
6. admin usa service role depois de guard server-side;
7. toda migration com RLS nasce com testes A/B e negativos.

Tabelas futuras de renderização devem nascer sem policy de client até existir o primeiro consumidor real. A UI lê por rota/view/policy mínima definida na mesma PR.

## Retenção

- mídia original: temporária, TTL configurável e exclusão automática;
- temporários do worker: cleanup ao final e sweeper para órfãos;
- outputs de export/render: TTL curto, renovação/novo download conforme entitlement;
- transcript: persiste até exclusão pelo usuário, sujeito à política de retenção;
- analytics: retenção curta e sem conteúdo;
- ledgers/audit: retenção compatível com obrigação financeira e operacional.

Valores exatos entram em `app_settings` quando houver consumidor real; não hardcode em copy.

## Regra para próximas migrations

Antes de criar schema de renderização:

1. revisar `docs/CAPTIONED_VIDEO_EXPORT.md` e `docs/DECISIONS.md`;
2. confirmar a fatia 6.4 e o consumidor real;
3. comparar `render_jobs` separado versus fila física compartilhada atrás de adapter;
4. registrar estados, RLS, idempotência, TTL e autoridade financeira;
5. atualizar tipos do banco no mesmo PR;
6. adicionar testes pgTAP;
7. obter revisão explícita antes de mudança arquitetural irreversível.
