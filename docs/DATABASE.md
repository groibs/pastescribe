# Modelo de dados — PasteScribe

Criado na Onda 0 em 2026-08-03. O estado real é sempre o das migrations em `supabase/migrations/`; em divergência, migration vence.

## Estado entregue

Após esta fatia, migrations `0001`–`0015` existem e são testadas no CI. Nenhuma foi aplicada ao Supabase real do dono.

Entregue:

- identidade/workspaces (`0001`–`0002`);
- catálogo draft, ledger, orçamento e quotas (`0003`–`0005`);
- admin/flags (`0006`);
- `media_assets` (`0007`);
- `transcription_jobs`, `job_steps` e fila (`0008`–`0012`);
- `transcripts` e `transcript_segments` (`0013`–`0014`);
- persistência/conclusão/cancelamento do worker (`0015`).

Não entregue:

- policies de leitura de jobs/transcripts para usuários — Onda 4.3;
- OpenAI real — Onda 5;
- editor/versionamento/exportações — Onda 6;
- billing completo — Onda 9;
- media sources/adapters — Onda 8;
- qualquer tabela de renderização de vídeo legendado — Onda 6.4, após revisão.

Convenções: UUID; `timestamptz`; FKs explícitas; índices por acesso real; RLS deny-by-default; schema somente via migration.

## Identidade e workspaces

- `profiles`: perfil 1:1 com Auth.
- `workspaces`: unidade de ownership/billing.
- `workspace_members`: `owner|admin|editor|viewer`.
- `workspace_invites`: convite com hash, validade e status.

## Catálogo, créditos, uso e orçamento

- `plans` / `prices`: catálogo draft, não comprável.
- `credit_accounts`: saldo cache derivado do ledger.
- `credit_ledger_entries`: append-only; correção por lançamento compensatório.
- `usage_ledger_entries`: custo real sem conteúdo.
- `budget_periods`: teto/reservado/consumido por envelope.
- `budget_reservations`: reserva expirável e idempotente.
- `free_tier_configs`: políticas da degustação.
- `quota_counters` / `quota_consumption_entries`: quota durável e auditável.

Quote, preço, entitlement, saldo e captura são autoridade do servidor.

## Mídia e fila de transcrição

### `media_assets`

Upload original temporário, com ownership, key opaca, estado, valores declarados/reais, validade e RLS. Status é alterado apenas pelo servidor.

### `transcription_jobs`

Fila específica de transcrição:

- source upload/url, exatamente um input;
- máquina de estados canônica;
- prioridade e idempotência;
- lease/heartbeat;
- retry/backoff/dead-letter;
- cancelamento;
- reserva opcional;
- duração real descoberta pelo worker;
- erros sem conteúdo sensível.

`source_kind=url` continua apenas estrutural.

### `job_steps`

Histórico append-only das transições. `job_attempts` continua adiado até existir necessidade real além de steps + retry count.

## Transcript entregue

### `transcripts`

Resultado privado 1:1 com o job:

- `job_id` único;
- `workspace_id` redundante para autorização/consulta;
- idioma;
- fonte `ai|native_captions`;
- modelo quando IA;
- texto completo;
- timestamps.

### `transcript_segments`

Segmentos ordenados:

- posição única por transcript;
- `start_ms`/`end_ms` validados;
- texto;
- speaker label opcional;
- timestamps.

RLS está habilitada sem policy de client. A primeira leitura por workspace entra na Onda 4.3, junto com UI/testes A/B.

## Funções SQL atômicas

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

### Fila

- `enqueue_job()`;
- `reserve_job_budget()`;
- `claim_next_job()`;
- `heartbeat_job()`;
- `advance_job_step()`;
- `complete_job()` — contrato genérico antigo, preservado; o worker de transcrição usa o contrato específico abaixo;
- `fail_job()`.

### Resultado/cancelamento da transcrição

- `persist_transcript_result()`: valida lease/estado/segmentos e persiste idempotentemente;
- `complete_transcription_job()`: persiste resultado, captura orçamento e conclui na mesma transação;
- `request_job_cancel()`: sem lease cancela imediatamente; com lease marca `cancel_requested`;
- `cancel_job()`: worker dono do lease finaliza e libera reserva.

Invariantes:

- job não fica `completed` sem transcript;
- falha de validação/captura reverte resultado, estado e uso;
- retry de conclusão não duplica transcript, segmentos ou captura;
- client não grava resultado diretamente;
- cancelamento depois da reserva devolve orçamento.

Funções privilegiadas são `SECURITY DEFINER`, `search_path` fixo e service-role-only.

## Futuro do transcript e exports

- `speakers`;
- `transcript_versions`;
- editor e autosave;
- `generated_artifacts` / `artifact_versions`;
- `exports` TXT/MD/DOCX/PDF/SRT/VTT/JSON.

Essas entidades só entram com consumidor real nas Ondas 6 e 7.

## Vídeo com legendas inseridas — sem schema

Não reutilizar nem alargar `transcription_jobs` para renderização.

A Onda 6.4 deverá avaliar/criar `render_jobs` separados, após revisão explícita. Transcrição e renderização compartilham somente runtime, storage, ledger de uso e observabilidade.

Entidades candidatas futuras — não aprovadas como migrations:

- presets imutáveis por versão;
- `render_jobs`;
- outputs temporários com TTL;
- quotes expirantes;
- entitlements/purchases;
- uso e reservas separados da transcrição.

Settings deverão usar schema estrito/versionado; JSON arbitrário é proibido. Planejamento: `docs/CAPTIONED_VIDEO_EXPORT.md`.

## RLS

1. deny-by-default;
2. membership do workspace como base;
3. papel controla escrita;
4. tabelas financeiras e funções privilegiadas são server-only;
5. shares não abrem tabelas diretamente;
6. admin usa service role após guard;
7. toda policy/migration nasce com testes A/B e negativos.

## Retenção

- mídia original: temporária e com TTL;
- temporários do worker: cleanup por job, sweeper futuro para órfãos;
- transcript: persiste até exclusão/política do usuário;
- outputs futuros: TTL curto;
- analytics: sem conteúdo e retenção curta;
- ledgers/audit: retenção financeira/operacional.

## Próximas migrations

A Onda 4.3 pode adicionar apenas policies de leitura e contratos de consulta/cancelamento necessários à UI. Nenhum schema de renderização entra antes da 6.4 e de revisão explícita.
