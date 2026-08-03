# Pesquisa obrigatória em repositórios existentes

A Onda 0 deve pesquisar e registrar o que será adaptado, rejeitado ou refeito.

## Repositórios do proprietário

### `groibs/ressoa`

Priorizar:

- `CLAUDE.md`;
- `.claude/MEMORY_MAP.md`;
- `docs/HANDOFF.md`;
- `.claude/skills/ressoa-scope-budget-delivery/SKILL.md`;
- `.claude/skills/ressoa-ai-usage-governance/SKILL.md`;
- skills de acessibilidade e pre-merge;
- documentos de AI call matrix, cost model, analytics e feature flags;
- migrations, RLS, quotas e idempotência;
- padrões de admin e observabilidade.

### `groibs/rezenhai-mvp`

Priorizar:

- `CLAUDE.md`;
- `.claude/MEMORY_MAP.md`;
- `.claude/skills/rezenhai-ui-premium/SKILL.md`;
- skills de visual polish, motion, acessibilidade, SEO e pre-merge;
- `SEO.md`;
- `LESSONS_LEARNED.md`;
- `SECURITY_AUDIT_2026-07-01.md` apenas como histórico, confirmando o código atual;
- migrations, RLS, auth e feature flags;
- CI e estrutura de documentação.

### `groibs/rezenhai`

Priorizar:

- `AGENTS.md`;
- `README.md`;
- `docs/decisions.md`;
- `rezenha-design-system/`;
- padrões que forem mais atuais que o MVP, após comparação.

## Critérios de seleção

Para cada padrão encontrado, registrar:

- problema que resolve;
- origem e caminho;
- estado atual no repo de origem;
- dependências;
- risco de copiar;
- adaptação necessária;
- decisão: usar, adaptar, rejeitar ou pesquisar mais.

## Pesquisa comunitária

Pesquisar apenas fontes com manutenção e licença verificáveis para:

- Next.js/App Router e monorepo;
- Supabase Auth/RLS/migrations;
- filas e workers baratos;
- FFmpeg e processamento seguro;
- uploads grandes e resumíveis;
- OpenAI audio/transcription;
- editor sincronizado com timestamps;
- internacionalização e hreflang;
- SEO programático com quality gate;
- proteção SSRF;
- rate limit durável;
- idempotência;
- billing/ledger;
- Playwright, Vitest e testes de contrato;
- observabilidade sem PII;
- acessibilidade.

Não incorporar repositório apenas por popularidade. Verificar licença, atividade, issues, segurança, compatibilidade e custo operacional.
