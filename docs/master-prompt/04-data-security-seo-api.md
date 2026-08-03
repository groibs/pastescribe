# 13. MODELO DE DADOS

Desenhe e documente o schema completo. Use UUIDs, timestamps, constraints, índices e RLS.

Entidades mínimas:

- `profiles`;
- `workspaces`;
- `workspace_members`;
- `workspace_invites`;
- `plans`;
- `prices`;
- `subscriptions`;
- `billing_customers`;
- `payment_events`;
- `credit_accounts`;
- `credit_ledger_entries`;
- `usage_ledger_entries`;
- `budget_periods`;
- `budget_reservations`;
- `free_tier_configs`;
- `quota_counters`;
- `abuse_signals`;
- `abuse_events`;
- `transcription_jobs`;
- `job_steps`;
- `job_attempts`;
- `media_sources`;
- `media_assets`;
- `platform_adapters`;
- `transcripts`;
- `transcript_segments`;
- `speakers`;
- `transcript_versions`;
- `generated_artifacts`;
- `artifact_versions`;
- `exports`;
- `folders`;
- `folder_items`;
- `shares`;
- `comments` ou `notes`;
- `glossaries`;
- `glossary_terms`;
- `templates`;
- `integrations`;
- `api_keys`;
- `webhook_endpoints`;
- `webhook_deliveries`;
- `feature_flags`;
- `app_settings`;
- `analytics_events` ou pipeline equivalente;
- `audit_logs`;
- `support_cases` opcional;
- `seo_pages` e `seo_localizations` se houver CMS;
- `prompt_versions`;
- `model_configs`.

## 13.1 Ledger

Créditos e consumo devem usar ledger append-only.

Nunca confie apenas em um campo mutável `balance` sem histórico.

Use transação atômica para:

- reservar;
- capturar;
- liberar;
- estornar;
- ajustar.

## 13.2 RLS

RLS ativa em todas as tabelas expostas.

Regras:

- usuário acessa apenas workspaces dos quais participa;
- papel controla ação;
- transcrição pertence a workspace;
- compartilhamento público usa token seguro e escopo mínimo;
- admin não depende apenas de UI;
- service role apenas no servidor/worker;
- funções privilegiadas com `search_path` seguro;
- migrations testadas.

---

# 14. SEGURANÇA

Crie `docs/SECURITY.md` e um threat model.

## 14.1 Segredos

- nenhum segredo no client;
- nenhum segredo no Git;
- `.env.example` sem valores reais;
- validação de env no boot;
- chaves separadas por ambiente;
- rotação documentada;
- logs redigidos.

## 14.2 Autorização

- toda ação sensível valida sessão e ownership no servidor;
- não confiar em IDs vindos do client;
- RBAC de workspace;
- admin server-side;
- API keys com scopes;
- chaves armazenadas com hash, exibidas uma única vez;
- tokens de share revogáveis.

## 14.3 API e web

- CSRF quando aplicável;
- CORS mínimo;
- CSP;
- headers de segurança;
- rate limiting durável;
- Turnstile;
- validação Zod/Pydantic;
- payload size limit;
- timeout;
- idempotency keys;
- proteção contra replay de webhook;
- HMAC em comunicação web↔worker;
- nenhum endpoint interno público sem autenticação forte.

## 14.4 Dependências

- lockfiles;
- Dependabot ou Renovate;
- CodeQL;
- secret scanning;
- audit no CI;
- SBOM opcional;
- licenças verificadas;
- sem dependência abandonada para função crítica.

## 14.5 Logs

Nunca registrar:

- transcrição completa por padrão;
- e-mail em texto aberto quando não necessário;
- token;
- link de share;
- API key;
- conteúdo íntimo;
- dados de pagamento;
- URL assinada.

Use IDs, hashes e métricas.

## 14.6 Exclusão e retenção

- mídia temporária com TTL curto;
- transcrição persistida conforme escolha do usuário;
- exclusão da conta e dados;
- fila de deleção;
- tombstone/audit sem conteúdo;
- backups e limitações documentados;
- exportação de dados;
- política LGPD/GDPR.

---

# 15. SEO INTERNACIONAL

SEO é parte central do produto, não ajuste posterior.

## 15.1 Idiomas iniciais

Estruture para múltiplos idiomas desde o início.

Implemente inicialmente pelo menos:

- inglês;
- português do Brasil;
- espanhol.

Deixe arquitetura pronta para francês, alemão e outros.

Use URLs por locale, por exemplo:

```text
/en/
/pt-br/
/es/
```

## 15.2 Requisitos técnicos

- server rendering/static generation quando adequado;
- metadata completa;
- canonical;
- hreflang;
- sitemap index por locale e tipo;
- robots;
- Open Graph;
- social cards;
- `SoftwareApplication`;
- `Organization`;
- breadcrumbs;
- FAQ schema apenas quando visível e adequado;
- Core Web Vitals;
- URLs estáveis;
- redirecionamentos corretos;
- 404/410;
- pagination/canonical;
- Search Console readiness;
- Bing readiness.

## 15.3 Indexação

Indexar:

- home;
- features;
- pricing;
- API pública;
- soluções;
- ferramentas públicas;
- páginas de plataforma;
- páginas de resultado;
- blog e guias;
- legal/ajuda conforme adequado.

`noindex`:

- login;
- cadastro;
- dashboard;
- editor;
- transcrições privadas;
- checkout;
- admin;
- API internals;
- shares privados;
- páginas de erro operacionais.

## 15.4 Conteúdo programático com qualidade

Não criar milhares de páginas finas.

Cada página precisa de:

- intenção distinta;
- ferramenta real;
- copy localizada;
- exemplos;
- limitações;
- conteúdo útil;
- links internos;
- data de revisão;
- responsável/editor;
- controle de indexação.

Crie gate de qualidade antes de publicar.

## 15.5 Conteúdo público de transcripts

Transcrições de terceiros devem permanecer privadas e `noindex` por padrão.

Páginas públicas indexáveis de transcript só podem existir quando:

- o usuário provar controle/autorização do canal ou conteúdo;
- aceitar publicação;
- houver valor adicional real;
- existir mecanismo de remoção;
- a feature estiver ligada.

## 15.6 Analytics sem PII

Crie catálogo fechado em `docs/ANALYTICS_EVENTS.md`.

Eventos relevantes:

- `landing_tool_started`;
- `source_detected`;
- `free_preview_started`;
- `free_preview_completed`;
- `email_verified_for_preview`;
- `paywall_viewed`;
- `single_job_purchased`;
- `credit_pack_purchased`;
- `subscription_started`;
- `transcription_completed`;
- `export_completed`;
- `artifact_generated`.

Nunca enviar:

- texto da transcrição;
- título privado;
- URL completa;
- nome;
- e-mail;
- conteúdo do arquivo;
- API key;
- dados de pagamento.

Tracking não essencial deve ser opt-in conforme jurisdição/configuração.

---

# 16. API PÚBLICA

Crie API versionada, por exemplo `/api/v1`.

Endpoints mínimos:

- criar job por URL;
- criar job por upload;
- obter job;
- cancelar job;
- obter transcript;
- listar segments;
- criar artifact;
- obter artifact;
- criar export;
- listar webhooks;
- criar/revogar API key;
- obter usage.

Requisitos:

- OpenAPI;
- schemas compartilhados;
- autenticação por API key;
- scopes;
- rate limits;
- idempotency key;
- paginação;
- erros padronizados;
- request IDs;
- webhooks assinados;
- retries;
- docs com exemplos TypeScript, Python e cURL;
- SDK apenas depois de API estável, mas deixe geração possível.

---
