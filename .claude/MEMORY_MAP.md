# Memory Map — PasteScribe

Mapa oficial da memória operacional do projeto.

## Regra de ouro

Código e migrations confirmam o estado real. Documentos canônicos definem decisões ativas. Relatórios e referências visuais são insumos, não verdade absoluta. Na dúvida, registrar **A confirmar**.

## Ordem de leitura

1. `CLAUDE.md`;
2. este mapa;
3. `docs/HANDOFF.md`;
4. documentos canônicos relevantes;
5. código e migrations;
6. skills aplicáveis.

## Fontes canônicas atuais

| Arquivo | Função | Consultar quando |
|---|---|---|
| `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md` | Missão completa, requisitos, ondas e critérios de aceite | Primeira leitura do projeto e decisão transversal |
| `docs/HANDOFF.md` | Estado vivo, ordem de execução, bloqueios e próximo passo | Início e fim de toda sessão |
| `docs/PASTESCRIBE_BRIEFING.md` | Produto, público, proposta de valor e escopo | Produto, UX, copy e priorização |
| `docs/PASTESCRIBE_MONETIZATION.md` | Gratuito adaptativo, créditos, assinatura e orçamento | Monetização, quota, custo e conversão |
| `docs/CAPTIONED_VIDEO_EXPORT.md` | Planejamento canônico da prévia e exportação de vídeo com legendas inseridas | Worker/FFmpeg, Onda 6, render jobs, presets, quote, gratuito e monetização de renderização |
| `docs/DECISIONS.md` | Decisões ativas e substituídas | Antes de reabrir decisão técnica ou de negócio |
| `docs/PENDING_FEATURES.md` | Funcionalidades adiadas e condições para retomada | Antes de retomar ou pausar escopo |
| `docs/STITCH_REFERENCE.md` | Como interpretar o material exportado do Stitch | Design e frontend |
| `docs/SECURITY_BASELINE.md` | Restrições mínimas de segurança e privacidade | Auth, banco, upload, URLs, IA, billing e logs |
| `docs/REPOSITORY_RESEARCH_TARGETS.md` | Pesquisa obrigatória nos projetos existentes | Onda 0 e skills locais |
| `README.md` | Overview e onboarding técnico inicial | Entrada no repositório |
| `CLAUDE.md` | Procedimento obrigatório do Claude Code | Toda sessão |
| `AGENTS.md` | Procedimento para outros agentes | Revisão e colaboração |
| `stitch-reference/` | Referências visuais e HTML exportado | Reconstrução do frontend |

## Documentos canônicos criados na Onda 0

| Arquivo | Função | Consultar quando |
|---|---|---|
| `docs/ARCHITECTURE.md` | Serviços, monorepo, fila, reserva de orçamento, ambientes | Implementação estrutural |
| `docs/THREAT_MODEL.md` | Ameaças e gates bloqueantes | Superfície nova, segurança, custo, upload, URL |
| `docs/DATABASE.md` | Modelo de dados, RLS, funções atômicas, retenção | Migrations e acesso a dados |
| `docs/AI_CALL_MATRIX.md` | Contrato de operações de IA | Antes de criar/alterar chamada de IA |
| `docs/AI_COST_MODEL.md` | Tarifas, orçamento e reserva de IA | Custo, quota e degustação |
| `docs/ANALYTICS_EVENTS.md` | Catálogo fechado sem PII | Qualquer tracking |
| `docs/FEATURE_FLAGS.md` | Registro de flags e regras | Criar/ler flag ou kill switch |
| `docs/SEO.md` | Locales, hreflang, indexação e gates | Rota pública, conteúdo, i18n |
| `docs/DESIGN_SYSTEM.md` | Tokens, componentes, a11y e anti-padrões | UI |
| `docs/API.md` | Design v1 da API pública | Modelagem consumida pela API futura |
| `docs/RESEARCH_REPORT.md` | Pesquisa, fontes, decisões e rejeições | Reabrir escolha de biblioteca/padrão |
| `docs/ROADMAP.md` | Ondas, fatias mergeáveis e gates | Planejamento de entrega |
| `LESSONS_LEARNED.md` | Aprendizados acionáveis | Início de sessão e post-mortem |

Pendente de criação somente quando houver conteúdo real: `docs/LAUNCH_CHECKLIST.md`, `docs/OPERATIONS_RUNBOOK.md`, `docs/PLATFORM_ADAPTERS.md`, `docs/PRIVACY_DATA_RETENTION.md`, `docs/PASTESCRIBE_COPY.md`.

Um documento específico de custo de mídia/renderização permanece pendente até a Onda 4.2c gerar medições reais de CPU, wall time, disco, bytes, storage e egress. Não criar números fictícios; até lá, a política fica em `docs/CAPTIONED_VIDEO_EXPORT.md` e a separação de domínios em `docs/AI_COST_MODEL.md`.

Somente promova um arquivo a canônico quando houver conteúdo real e decisão verificável.

## Atualização obrigatória

Ao fim de toda tarefa, verificar se mudou:

- produto ou escopo → briefing;
- monetização, quota ou custo → monetização e modelos de custo;
- decisão → decisions;
- feature adiada → pending features;
- arquitetura/setup → architecture/README;
- fonte de verdade → este mapa e `CLAUDE.md` quando necessário;
- estado da entrega → HANDOFF sempre.
