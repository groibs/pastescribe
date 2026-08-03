# 25. ORDEM DE IMPLEMENTAÇÃO

Respeite dependências. Não pule para polish de página antes da fundação crítica.

## Onda 0 — Descoberta e governança

- inspecionar Stitch;
- pesquisar repos e comunidade;
- criar docs;
- definir arquitetura;
- criar CLAUDE/MEMORY_MAP/skills;
- threat model;
- plano;
- backlog;
- critérios de aceite.

## Onda 1 — Fundação do monorepo

- Next.js;
- worker;
- Supabase local;
- packages;
- env validation;
- CI;
- logging;
- design tokens;
- i18n;
- feature flags.

## Onda 2 — Auth, workspaces e RLS

- conta;
- sessão;
- perfil;
- workspace;
- roles;
- admin base;
- testes RLS.

## Onda 3 — Billing, ledger, quota e governador de custo

- plans/prices;
- credit ledger;
- usage ledger;
- budget reservations;
- free config;
- Turnstile;
- rate limits;
- billing test provider;
- admin controls.

Esta onda deve existir antes de liberar OpenAI real ao público.

## Onda 4 — Upload e pipeline local

- upload;
- storage local;
- jobs;
- worker;
- FFmpeg;
- provider fake;
- transcript fixtures;
- processing UI.

## Onda 5 — OpenAI real

- transcrição;
- modelos configuráveis;
- chunking;
- timestamps;
- diarização;
- cost telemetry;
- idempotência;
- retries;
- kill switches;
- AI_CALL_MATRIX;
- AI_COST_MODEL.

## Onda 6 — Editor e exports

- player;
- transcript;
- edit/version;
- speakers;
- selection;
- export formats;
- mobile.

## Onda 7 — Inteligência derivada

- prompts versionados;
- structured outputs;
- summary;
- chapters;
- quotes;
- translations;
- content formats;
- quotas;
- caching.

## Onda 8 — Link adapters

- adapter interface;
- URL security;
- metadata;
- captions;
- ativar apenas fontes verificadas;
- upload fallback;
- admin health.

## Onda 9 — Monetização completa

- single-job purchase;
- credit packs;
- subscriptions;
- webhooks;
- checkout;
- invoices;
- refunds;
- upgrade flows.

## Onda 10 — Site público e SEO

- homepage;
- features;
- pricing;
- API;
- solutions;
- tools;
- platform pages;
- result pages;
- blog/help;
- sitemaps;
- hreflang;
- schema;
- content quality gate.

## Onda 11 — Equipes, compartilhamento, integrações e API pública

- shares;
- teams;
- API keys;
- webhooks;
- docs;
- integrações.

## Onda 12 — Hardening e lançamento

- security audit;
- accessibility audit;
- load test;
- abuse test;
- cost simulation;
- SEO audit;
- UX simulation;
- visual regression;
- runbook;
- launch checklist;
- staging.

---

# 26. CRITÉRIOS DE ACEITE GLOBAIS

O projeto só pode ser descrito como “pronto para beta” quando:

1. uma pessoa cria conta;
2. envia um arquivo permitido;
3. o sistema calcula custo/quota;
4. reserva orçamento;
5. cria job idempotente;
6. o worker processa;
7. a OpenAI ou provider fake transcreve;
8. o transcript aparece progressivamente ou ao concluir;
9. o editor funciona;
10. timestamps funcionam;
11. export funciona;
12. erro não consome crédito indevidamente;
13. free budget pode ser desligado;
14. paid continua funcionando;
15. admin enxerga custos e falhas;
16. RLS impede acesso cruzado;
17. SSRF está coberto;
18. secrets não vazam;
19. checkout test mode funciona;
20. webhooks são idempotentes;
21. páginas públicas têm SEO correto;
22. rotas privadas são `noindex`;
23. inglês, português e espanhol funcionam;
24. mobile não quebra;
25. acessibilidade crítica passa;
26. CI está verde;
27. migrations sobem do zero;
28. documentação está atualizada;
29. handoff está atualizado;
30. existe checklist claro para ativar produção.

---

# 27. ENTREGAS DE CADA SESSÃO

No início de cada sessão, declare:

- branch/base;
- estado do repositório;
- documentos lidos;
- skills aplicáveis;
- escopo admitido;
- P0/P1;
- critérios de aceite;
- checks;
- risco;
- linha de corte mergeável.

No fim, entregue:

- feito;
- não feito;
- arquivos principais;
- migrations;
- testes;
- comandos executados;
- resultados;
- riscos;
- configuração manual;
- PR/branch;
- como testar;
- documentos de memória atualizados;
- atualização obrigatória de `docs/HANDOFF.md`.

Se o projeto inteiro não couber numa única janela, isso não é autorização para deixar código quebrado. Entregue a maior fatia vertical segura, publique a branch/PR e registre exatamente o próximo passo.

---

# 28. PRIMEIRA RESPOSTA ESPERADA ANTES DE CODIFICAR

Antes de editar código, responda com:

1. **Inventário encontrado**
   - estrutura do repo;
   - Stitch;
   - docs;
   - código existente;
   - credenciais/configs disponíveis sem revelar segredos.

2. **Pesquisa planejada**
   - arquivos dos repos Ressoa/Rezenhaí que serão lidos;
   - temas de pesquisa comunitária;
   - critérios de seleção.

3. **Riscos centrais**
   - custo;
   - scraping/termos;
   - SSRF;
   - upload;
   - RLS;
   - billing;
   - privacidade;
   - SEO em escala.

4. **Arquitetura proposta**
   - diagrama textual;
   - serviços;
   - fluxo de job;
   - custo inicial.

5. **Plano em ondas**
   - dependências;
   - P0/P1;
   - critérios de aceite;
   - primeira fatia mergeável.

6. **Dúvidas realmente bloqueantes**
   - no máximo as indispensáveis.

Depois dessa resposta, prossiga com a Onda 0 e a primeira fatia funcional, sem esperar confirmação para detalhes técnicos reversíveis.

---

# 29. REGRAS FINAIS

- Não transformar o PasteScribe em clone visual genérico dos concorrentes.
- Não transformar o Stitch em código de produção sem revisão.
- Não usar IA paga para texto fixo, animação ou lógica conhecida.
- Não liberar transcrição gratuita recorrente sem orçamento durável.
- Não confiar apenas no limite do painel do provider.
- Não fazer scraping evasivo.
- Não baixar mídia privada.
- Não armazenar arquivos indefinidamente.
- Não registrar transcripts em logs.
- Não expor `service_role`.
- Não confiar no client para crédito, plano ou papel.
- Não criar páginas SEO finas.
- Não indexar conteúdo privado.
- Não usar “ilimitado” sem proteção.
- Não gerar custo em reload, montagem ou duplo clique.
- Não criar schema manualmente fora de migration.
- Não deixar docs contradizerem código.
- Não encerrar sessão sem atualizar o handoff.
- Não afirmar que testou serviço ou conta que não acessou.
- Não introduzir serviço pago sem necessidade e sem registrar custo.
- Preferir free-tier-first, mas não sacrificar segurança e integridade.

Crie uma base que consiga começar barata, sobreviver a abuso, converter o gratuito em pago, crescer em vários idiomas e evoluir sem precisar ser reescrita.

**Comece agora pela inspeção, pesquisa e Onda 0.**
