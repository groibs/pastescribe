# Relatório de pesquisa — Onda 0

Data da pesquisa: **2026-08-03**. Fontes: repositórios do proprietário (clones locais de `groibs/ressoa`, `groibs/rezenhai-mvp`, `groibs/rezenhai`), documentação oficial e buscas na web nesta data.

## 1. Repositórios do proprietário

### `groibs/ressoa` — o mais valioso para o PasteScribe

| Padrão | Origem | Decisão | Adaptação |
|---|---|---|---|
| Quota durável via RPC `consume_ai_quota` (tabela de contadores com janela, `SECURITY DEFINER`, `search_path` fixo, `revoke` anon/auth, `FOR UPDATE`, fail em parâmetro inválido) | `supabase/migrations/0002_ai_usage_governance.sql` | **Adaptar** | base de `quota_counters` + `consume_quota` do PasteScribe; estender com reserva de orçamento (que o Ressoa não tem — lá é franquia, aqui é budget em R$) |
| Skill de governança de IA (classificação determinística/híbrida/IA; 1 ação lógica = 1 operação; reutilização antes de geração; fail-closed; kill switch; anti-padrões) | `.claude/skills/ressoa-ai-usage-governance` | **Adaptar** | vira `pastescribe-ai-cost-governance`; adiciona reserva de orçamento free, separação free/paid e custo por minuto de mídia |
| `AI_CALL_MATRIX.md` como contrato vivo (toda operação com: usa IA?, modelo, limites free/paid, reutilização/fallback; atualização no mesmo PR) | `docs/AI_CALL_MATRIX.md` | **Adaptar** | criado `docs/AI_CALL_MATRIX.md` do PasteScribe |
| `AI_COST_MODEL.md` com unidade comercial explícita, tarifas com nível de confiança e lacunas nomeadas (não escondidas em média) | `docs/AI_COST_MODEL.md` | **Adaptar** | unidade aqui é segundo de mídia; lacunas marcadas (derivados de texto) |
| Créditos finitos sem reset (teto de custo conhecido por unidade) | idem | **Adaptar** | degustação única de 3 min sem reset diário segue exatamente essa lógica |
| Feature flags: desligada esconde e nunca apaga; opt-in estrito; leitura centralizada; procedimento de reativação documentado por flag | `docs/FEATURE_FLAGS.md` | **Adaptar** | criado `docs/FEATURE_FLAGS.md`; PasteScribe adiciona flags dinâmicas em banco para kill switches |
| Skill scope-budget-delivery (admissão A/B/C antes de tocar código; faixas por consumo de janela; reserva para PR) | `.claude/skills/ressoa-scope-budget-delivery` | **Adaptar** | vira `pastescribe-scope-budget-delivery` |
| Pre-merge check em seções bloqueantes com PASS/FAIL, sem merge automático | `.claude/skills/ressoa-pre-merge-check` | **Adaptar** | vira `pastescribe-pre-merge-check` com seções de custo/SSRF/SEO |
| Analytics first-party server-side, pseudonimizado, retenção 90 dias, allowlist revalidada no servidor | `docs/FEATURE_FLAGS.md` + migration 0025 | **Adaptar** | base do `docs/ANALYTICS_EVENTS.md` |
| Modo de teste que reduz capacidade (nunca concede plano; provider local à força; defesa central `authorizeAI`) | `AI_CALL_MATRIX.md` §modo de teste | **Adaptar** | provider fake do PasteScribe segue o princípio "só reduz capacidade" |

**Rejeitado do Ressoa:** regras de produto (manifestação, Auri, ciclo), copy espiritual, unidade "mensagens", Capacitor/mobile nativo — fora do domínio do PasteScribe.

### `groibs/rezenhai-mvp`

| Padrão | Origem | Decisão | Adaptação |
|---|---|---|---|
| Rate limit durável em Postgres com janela fixa (`floor(epoch/window)`), upsert por (bucket, janela), limpeza oportunista (1% das chamadas), RLS sem policy = zero acesso | `supabase/migrations/017_rate_limiting.sql` | **Adaptar** | complementa `consume_quota` para rajadas por IP/evento |
| SEO.md com tabela rota → indexável? → onde configurado; tríplice noindex (metadata + robots + fora do sitemap); regra "URL absoluta só de env" | `SEO.md` | **Adaptar** | incorporado em `docs/SEO.md` |
| Skill seo-ads-check (gate PASS/FAIL para rota pública nova; revisão linha a linha de PII em analytics; scripts externos condicionais a env) | `.claude/skills/rezenhai-seo-ads-check` | **Adaptar** | vira parte de `pastescribe-seo-international-check` |
| Skill ui-premium (tese do herói; anti-AI-slop checklist duro; critique-loop "tire um acessório"; tokens canônicos com fonte da verdade única) | `.claude/skills/rezenhai-ui-premium` | **Adaptar** | vira `pastescribe-ui-premium` com tokens do Stitch |
| `LESSONS_LEARNED.md` acionável (formato: aprendizado/aplicação/onde consultar/status) | `LESSONS_LEARNED.md` | **Adaptar** | criado `LESSONS_LEARNED.md` na raiz |
| Server Components para leitura; client mínimo interativo (lição de componentes client gigantes) | idem | **Usar** | regra de arquitetura da web |
| skill-research com relatório datado e critérios | `.claude/skill-research/REPORT.md` | **Usar** | formato deste relatório |

**Rejeitado do rezenhai-mvp:** identidade Y2K (amarelo/roxo/Fredoka), voz informal brasileira, padrão de RSVP sem login com escrita direta do browser no Supabase (o PasteScribe tem operações caras — toda mutação sensível passa por servidor), Pix manual.

### `groibs/rezenhai`

Repositório de protótipo (dados mockados, sem backend). Útil: separação handoff visual ↔ código (`rezenha-design-system/` como referência não-produção — mesmo papel do `stitch-reference/` aqui) e `docs/decisions.md` enxuto. **Nada de código a reaproveitar.** Confirmado que o MVP é mais atual.

## 2. Documentação oficial e versões (verificadas 2026-08-03)

| Tecnologia | Estado verificado | Decisão |
|---|---|---|
| Next.js | 16.2.x estável (16.2.12 em jul/2026) | App Router, TS estrito — base do `apps/web` |
| Tailwind CSS | 4.3.x (config CSS-first via `@theme`) | tokens do design system em CSS variables |
| Supabase SSR auth | `@supabase/ssr` (auth-helpers deprecado) | padrão de auth na Onda 2 |
| Supabase Queues | pgmq nativo, visibility timeout, exactly-once dentro do timeout | opção futura; início com tabela própria + `FOR UPDATE SKIP LOCKED` por transacionalidade com a reserva de orçamento (interface `QueuePort` permite migrar) |
| OpenAI transcrição | `gpt-4o-mini-transcribe` ≈ US$0,003/min; `gpt-4o-transcribe` ≈ US$0,006/min; `gpt-4o-transcribe-diarize` (diarized_json, mesmo preço do 4o-transcribe) | `docs/AI_COST_MODEL.md`; revalidar na conta antes da Onda 5 |
| Node/pnpm | Node 22 + pnpm 10 disponíveis no ambiente | engines do monorepo |

## 3. Bibliotecas candidatas (licença/manutenção verificadas por reputação; auditar versão exata ao adotar)

| Uso | Escolha | Licença | Risco | Alternativa rejeitada |
|---|---|---|---|---|
| Validação/contratos | zod | MIT | baixo | — |
| Componentes acessíveis | Radix UI primitives | MIT | baixo | Headless UI (cobertura menor p/ editor) |
| i18n | next-intl | MIT | baixo — validar compat. exata com Next 16 na implementação | rosetta/caseiro (sem hreflang helpers) |
| Formulários | React Hook Form | MIT | baixo | — |
| Monorepo tasks | Turborepo | MIT | baixo | Nx (mais pesado que o necessário) |
| Testes web | Vitest + Playwright + axe-core | MIT | baixo | Jest (mais lento no ESM) |
| Worker HTTP | FastAPI + Pydantic + httpx | MIT/BSD | baixo | Flask (sem tipagem nativa) |
| Worker deps | uv (Astral) | MIT/Apache | baixo | pip/poetry (mais lentos) |
| Fila | SQL próprio (`FOR UPDATE SKIP LOCKED`) | — | baixo; padrão documentado do Postgres | Redis/BullMQ (custo + infra extra), Graphile Worker (Node, worker é Python) |
| Storage S3 | MinIO local + R2 prod via SDK S3 | AGPL (MinIO, só dev-container)/— | baixo | Supabase Storage para mídia grande (custo/limites) |
| Observabilidade | pino (web) + structlog (worker) + Sentry SDK opcional | MIT/BSD | baixo | — |

**Rejeitados com motivo:** yt-dlp e similares como base de ingestão pública (risco de termos de uso e evasão — adapters só após pesquisa jurídica por plataforma, Onda 8; upload é o caminho universal); LangChain (abstração desnecessária sobre 2 chamadas de API); NextAuth (Supabase Auth já cobre e integra com RLS); Prisma (migrations do Supabase CLI + tipos gerados bastam; menos camadas sobre RLS).

## 4. Auditoria da referência Stitch

- Na Onda 0, o ZIP `pastescribe-stitch-export.zip` estava **truncado** (15 KB; sem central directory) — só os dois docs de design e um HTML parcial foram recuperáveis (detalhe histórico em `LESSONS_LEARNED.md`).
- **2026-08-03 (sessão seguinte):** o dono enviou o export original íntegro (1,9 MB). Substituído no repositório; confirmado com `unzip -t` sem erros. Material completo: logo, home, dashboard, editor, pricing — cada um com `code.html` + `screen.png` — e os dois `DESIGN.md`, que conferem exatamente com os tokens já consolidados em `docs/DESIGN_SYSTEM.md`.
- Home e pricing foram reconstruídos com fidelidade real ao HTML/screenshot do Stitch (não copiado diretamente — reescrito com `packages/ui`, Tailwind, `next/font` para Inter/JetBrains Mono self-hosted e `lucide-react` no lugar dos Material Symbols via Google Fonts do export original, evitando dependência de fonte de ícone externa). Dashboard e editor ficam para as Ondas 2.3/6, quando houver dado real para preencher.

## 5. Skills comunitárias

Herdado do relatório de pesquisa do Rezenhaí (2026-06-18, `.claude/skill-research/REPORT.md`): a skill oficial `frontend-design` (tese do herói, tipografia com personalidade, restraint) já está destilada nas skills ui-premium — o PasteScribe herda essa destilação adaptada. Skills de documento (pdf/docx/xlsx) são relevantes na Onda 6 (exports) como referência de manipulação de formatos, não como dependência.

## 6. Decisão final

Stack confirmada sem alteração da recomendação do prompt-mestre (motivo forte para mudar: nenhum). Registrada em `docs/DECISIONS.md` (2026-08-03, Onda 0). Detalhe completo em `docs/ARCHITECTURE.md`.
