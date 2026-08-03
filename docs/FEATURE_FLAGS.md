# Feature flags — PasteScribe

Criado na Onda 0 em 2026-08-03. Padrão adaptado do Ressoa: flag desligada **esconde, nunca apaga**; fallback seguro obrigatório; leitura centralizada.

## Regras

1. Nenhum código lê env de flag diretamente — tudo passa por `packages/config` (`flags.ts`).
2. Flag de risco/custo é **opt-in**: só liga com valor exato `true`/`1`; ausente, vazia ou inválida = desligada.
3. Flags de build (`NEXT_PUBLIC_*`) são públicas por definição e nunca guardam segredo; flags dinâmicas vivem na tabela `feature_flags` (a partir da Onda 2) e são resolvidas no servidor.
4. Kill switches (`openai_enabled`, `free_ai_enabled`, `maintenance_mode`, por-plataforma) são **dinâmicos** (banco), para agir sem redeploy.
5. Ligar flag que muda coleta de dados ou custo exige atualizar `docs/THREAT_MODEL.md` / `docs/AI_COST_MODEL.md` no mesmo PR.
6. Toda flag tem teste nos dois estados.

## Registro inicial

| Flag | Tipo | Default | Esconde/controla | Pré-condição para ligar |
|---|---|---|---|---|
| `openai_enabled` | dinâmica | `false` | toda chamada real à OpenAI | gates da Onda 3+5 (ledger, quota, reserva, idempotência, rate limit, kill switch testado) |
| `free_ai_enabled` | dinâmica | `false` | IA gratuita (paga continua) | orçamento durável + estados adaptativos ativos |
| `free_native_captions_enabled` | dinâmica | `false` | entrega de legenda nativa no free | adapter da plataforma ativo e barato |
| `link_ingestion_enabled` | dinâmica | `false` | ingestão por URL (global) | proteção SSRF testada (Onda 8) |
| `youtube_adapter_enabled` … `loom_adapter_enabled` (por plataforma) | dinâmica | `false` | cada adapter | pesquisa técnica/jurídica da plataforma + testes |
| `upload_enabled` | dinâmica | `false` | upload de arquivos | pipeline da Onda 4 completo |
| `diarization_enabled` | dinâmica | `false` | opção de falantes | validação de custo/qualidade (Onda 5+) |
| `batch_enabled` | dinâmica | `false` | processamento em lote | franquias e fila estáveis |
| `public_transcripts_enabled` | dinâmica | `false` | publicação indexável de transcript | prova de propriedade + remoção + decisão registrada |
| `teams_enabled` | dinâmica | `false` | workspaces multi-membro | Onda 11 |
| `api_enabled` | dinâmica | `false` | API pública v1 | Onda 11 |
| `seo_cms_enabled` | dinâmica | `false` | CMS de páginas SEO | Onda 10 |
| `auto_free_budget_growth_enabled` | dinâmica | `false` | aplicação automática da recomendação de orçamento | 2 meses sustentáveis + auditoria |
| `maintenance_mode` | dinâmica | `false` | modo manutenção (bloqueia jobs novos, preserva leitura) | — |
| `analytics_enabled` | build | `true` | eventos first-party sem PII | — |

Enquanto a tabela `feature_flags` não existe (pré-Onda 2), as dinâmicas são resolvidas de env com os mesmos nomes (`FLAG_OPENAI_ENABLED` etc.) pela mesma interface — o call site não muda.

## Como reativar/desligar

Documentar por flag, ao implementá-la, o procedimento exato (onde setar, o que revisar antes, comportamento visível com ela off). Uma flag desligada mostra estado neutro honesto — nunca "em breve" com data, nunca placeholder enganoso.
