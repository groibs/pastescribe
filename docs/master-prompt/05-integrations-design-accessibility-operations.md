# 17. INTEGRAÇÕES

Crie arquitetura para:

- Google Drive;
- Dropbox;
- Notion;
- Google Docs;
- Slack;
- Zapier/Make;
- webhooks.

Não precisa ativar todas com credenciais reais na primeira entrega, mas:

- interfaces;
- telas;
- estados;
- scopes;
- segurança;
- feature flags;
- documentação;
- pelo menos uma integração real de referência quando possível.

---

# 18. DESIGN SYSTEM

Crie `packages/ui` e `docs/PASTESCRIBE_DESIGN_SYSTEM.md`.

Defina:

- cores;
- tipografia;
- escala;
- spacing;
- radius;
- sombras;
- grid;
- motion;
- ícones;
- estados;
- acessibilidade;
- densidade para editor;
- breakpoints;
- safe-area;
- dark mode apenas se for realmente implementado.

Componentes:

- buttons;
- inputs;
- URL input;
- upload dropzone;
- selects;
- combobox;
- tabs;
- menu;
- tooltip;
- dialog;
- drawer;
- bottom sheet;
- toast;
- alerts;
- cards;
- table;
- pagination;
- filters;
- badges;
- avatar;
- language tag;
- plan badge;
- credit meter;
- job status;
- progress;
- skeleton;
- empty state;
- error state;
- player;
- transcript segment;
- speaker control;
- contextual selection toolbar;
- export panel;
- pricing card;
- charts.

Cada componente precisa de:

- default;
- hover;
- focus;
- active;
- disabled;
- loading;
- error;
- success;
- mobile behavior.

A tela principal deve ter um único trabalho claro. Faça escolhas visuais opinativas, critique e remova excessos antes de concluir.

---

# 19. ACESSIBILIDADE

WCAG AA é bloqueante.

- contraste;
- foco visível;
- teclado;
- leitores de tela;
- labels;
- `aria-live` para progresso;
- player acessível;
- timestamps navegáveis;
- atalhos documentados;
- touch target ≥44px;
- reduced motion;
- zoom;
- textos traduzidos sem quebra;
- status não dependente apenas de cor;
- formulários com erros associados;
- modais com focus trap;
- mobile e teclado virtual.

Use axe em testes automatizados e revisão manual das telas críticas.

---

# 20. OBSERVABILIDADE E OPERAÇÃO

Implemente:

- structured logging;
- request ID;
- job ID;
- tracing web→worker→OpenAI;
- métricas de fila;
- latência por etapa;
- custo estimado/real;
- taxa de erro;
- retries;
- status de adapters;
- healthchecks;
- readiness;
- alertas;
- Sentry ou adapter equivalente;
- painel administrativo;
- runbook.

Crie `docs/OPERATIONS_RUNBOOK.md` com:

- incidentes;
- OpenAI indisponível;
- fila travada;
- orçamento esgotado;
- plataforma bloqueada;
- storage cheio;
- webhook falhando;
- pagamento divergente;
- abuso;
- vazamento de segredo;
- rollback;
- desligamento do gratuito sem afetar pagos.

---
