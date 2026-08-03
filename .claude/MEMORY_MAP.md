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
| `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md` | Missão completa, requisitos, ondas e critérios de aceite | Primeira leitura do projeto e qualquer decisão transversal |
| `docs/HANDOFF.md` | Estado vivo, ordem de execução, bloqueios e próximo passo | Início e fim de toda sessão |
| `docs/PASTESCRIBE_BRIEFING.md` | Produto, público, proposta de valor e escopo | Produto, UX, copy e priorização |
| `docs/PASTESCRIBE_MONETIZATION.md` | Gratuito adaptativo, créditos, assinatura e orçamento inicial | Monetização, quota, custo e conversão |
| `docs/DECISIONS.md` | Decisões ativas e substituídas | Antes de reabrir decisão técnica ou de negócio |
| `docs/PENDING_FEATURES.md` | Funcionalidades adiadas e condições para retomada | Antes de retomar ou pausar escopo |
| `docs/STITCH_REFERENCE.md` | Como interpretar o material exportado do Stitch | Design, frontend e reconstrução de telas |
| `docs/SECURITY_BASELINE.md` | Restrições mínimas de segurança e privacidade | Auth, banco, upload, URLs, IA, billing e logs |
| `docs/REPOSITORY_RESEARCH_TARGETS.md` | Pesquisa obrigatória nos projetos existentes | Onda 0 e criação das skills locais |
| `README.md` | Overview e onboarding técnico inicial | Entrada no repositório |
| `CLAUDE.md` | Procedimento obrigatório do Claude Code | Toda sessão |
| `AGENTS.md` | Procedimento para outros agentes | Revisão e colaboração |
| `stitch-reference/` | Referências visuais e HTML exportado | Reconstrução do frontend |

## Documentos que a Onda 0 deve criar ou consolidar

- `docs/ARCHITECTURE.md`;
- `docs/DATABASE.md`;
- `docs/DESIGN_SYSTEM.md`;
- `docs/SEO.md`;
- `docs/ANALYTICS_EVENTS.md`;
- `docs/AI_CALL_MATRIX.md`;
- `docs/AI_COST_MODEL.md`;
- `docs/API.md`;
- `docs/FEATURE_FLAGS.md`;
- `docs/THREAT_MODEL.md`;
- `docs/ROADMAP.md`;
- `docs/LAUNCH_CHECKLIST.md`;
- `LESSONS_LEARNED.md`.

Somente promova um arquivo a canônico quando houver conteúdo real e decisão verificável. Ao criar, atualizar este mapa e `CLAUDE.md`.

## Skills esperadas

A Onda 0 deve pesquisar e criar/adaptar skills locais para:

- controle de escopo e entrega;
- governança de IA/custos;
- UI premium e visual polish;
- acessibilidade;
- SEO internacional;
- segurança de upload e URL;
- pre-merge gate;
- backlog/feature flags;
- simulação de produto e UX.

Não copiar nomes e regras específicas de outros produtos sem adaptação.

## Atualização obrigatória

Ao fim de toda tarefa, verificar se mudou:

- produto ou escopo → `docs/PASTESCRIBE_BRIEFING.md`;
- monetização, quota ou custo → `docs/PASTESCRIBE_MONETIZATION.md` e futuros `AI_*`;
- decisão → `docs/DECISIONS.md`;
- feature adiada → `docs/PENDING_FEATURES.md`;
- arquitetura/setup → `README.md` e futuro `docs/ARCHITECTURE.md`;
- fonte de verdade → este mapa e `CLAUDE.md`;
- estado da entrega → `docs/HANDOFF.md` sempre.
