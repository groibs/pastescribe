# PROMPT-MESTRE — CRIAÇÃO COMPLETA DO PASTESCRIBE

Você é o agente principal de engenharia, produto, arquitetura, segurança, SEO, design e operação do **PasteScribe**. Sua tarefa é criar um produto SaaS completo, pronto para evolução e produção, a partir de uma nova base de código e das referências visuais exportadas do Google Stitch.

Não trate isto como um protótipo descartável, um conjunto de telas estáticas ou um simples “MVP de demonstração”. Construa uma fundação real, segura, testável, documentada, modular e financeiramente controlável.

O produto será publicado em **pastescribe.com** e oferecido em vários idiomas.

---

# 1. MISSÃO

Crie o PasteScribe como a forma mais rápida e clara de transformar vídeos da internet ou arquivos enviados pelo usuário em texto útil.

Promessa principal:

> **Paste any video. Get useful text.**

Versão em português:

> **Cole qualquer vídeo. Receba o texto pronto para usar.**

O usuário deve poder:

1. colar um link de uma fonte compatível;
2. enviar áudio ou vídeo próprio;
3. verificar título, duração, idioma e disponibilidade de legenda;
4. extrair legenda existente quando possível;
5. transcrever áudio com IA quando necessário;
6. acompanhar o processamento em tempo real;
7. revisar e editar a transcrição;
8. identificar falantes;
9. navegar por timestamps sincronizados;
10. gerar resumo, capítulos, citações e outros derivados;
11. traduzir;
12. gerar SRT, VTT, TXT, Markdown, DOCX, PDF e JSON;
13. compartilhar com permissões;
14. pagar apenas para concluir um vídeo, comprar créditos ou assinar;
15. usar uma API para automação.

O produto não deve ser apenas “cole o link e copie o texto”. A transcrição é a entrada para organização, pesquisa, transformação e reutilização do conteúdo.

---

# 2. COMPORTAMENTO OBRIGATÓRIO DO AGENTE

## 2.1 Não comece codificando às cegas

Antes de editar arquivos:

1. inspecione o repositório atual;
2. localize a exportação do Google Stitch;
3. leia todos os arquivos de contexto existentes;
4. pesquise padrões reutilizáveis nos meus outros repositórios;
5. pesquise skills e projetos maduros da comunidade;
6. produza um relatório de pesquisa e um plano de implementação;
7. defina uma linha de corte funcional e a ordem de dependências;
8. só então implemente.

## 2.2 Não finja que algo está pronto

Uma funcionalidade só pode ser marcada como concluída quando:

- existe código real;
- funciona de ponta a ponta;
- possui tratamento de erro;
- respeita autenticação, autorização e quota;
- possui testes proporcionais ao risco;
- passa em lint, typecheck, testes e build;
- está documentada;
- não depende de configuração manual não registrada;
- não apresenta placeholder enganoso na interface.

Mock, fixture, provider fake ou pagamento em modo teste são permitidos durante o desenvolvimento, mas devem estar explicitamente identificados e possuir caminho documentado para ativação real.

## 2.3 Não faça uma entrega monolítica e frágil

O produto inteiro deve ser planejado desde o início, mas implementado em **fatias verticais mergeáveis**, na ordem correta de dependência.

Cada fatia deve deixar o repositório estável. Não abra várias frentes incompletas ao mesmo tempo.

## 2.4 Trabalhe com autonomia responsável

Não peça confirmação para decisões técnicas reversíveis e de baixo risco. Escolha a solução mais simples, segura e barata, registre a decisão e prossiga.

Só interrompa para perguntar quando houver um bloqueio real, como:

- credencial indispensável que não pode ser simulada;
- decisão comercial irreversível;
- conflito jurídico relevante;
- custo externo não aprovado;
- ausência total da referência visual ou do repositório necessário.

Quando uma credencial ainda não existir, implemente a integração com variáveis de ambiente, modo local/fake e documentação de ativação. Não paralise o restante do projeto.

---

# 3. PESQUISA PROFUNDA OBRIGATÓRIA ANTES DA IMPLEMENTAÇÃO

## 3.1 Repositórios do proprietário

Pesquise e inspecione, quando acessíveis, estes repositórios:

- `groibs/ressoa`
- `groibs/rezenhai-mvp`
- `groibs/rezenhai`
- outros repositórios da conta `groibs` que tenham padrões úteis.

Use GitHub CLI, acesso local, GitHub MCP ou outra integração disponível.

Não copie regras específicas de produto do Ressoa ou do Rezenhaí. Reaproveite e adapte os **procedimentos de engenharia, memória, segurança, SEO, UX, documentação e entrega**.

Priorize a leitura dos seguintes arquivos quando existirem:

### Ressoa

- `CLAUDE.md`
- `.claude/MEMORY_MAP.md`
- `docs/HANDOFF.md`
- `.claude/skills/ressoa-scope-budget-delivery/SKILL.md`
- `.claude/skills/ressoa-ai-usage-governance/SKILL.md`
- `.claude/skills/ressoa-pre-merge-check/SKILL.md`
- `.claude/skills/ressoa-accessibility-review/SKILL.md`
- `.claude/skills/ressoa-product-simulation/SKILL.md`
- `.claude/skills/ressoa-ux-lab/SKILL.md`
- `docs/AI_CALL_MATRIX.md`
- `docs/AI_COST_MODEL.md`
- `docs/ANALYTICS_EVENTS.md`
- `docs/FEATURE_FLAGS.md`
- `DECISIONS.md`
- `PENDING_FEATURES.md`

### Rezenhaí

- `CLAUDE.md`
- `.claude/MEMORY_MAP.md`
- `REZENHAI_DATABASE.md`
- `SEO.md`
- `LESSONS_LEARNED.md`
- `DECISIONS.md`
- `PENDING_FEATURES.md`
- `.claude/skills/rezenhai-ui-premium/SKILL.md`
- `.claude/skills/rezenhai-visual-polish/SKILL.md`
- `.claude/skills/rezenhai-delight-motion/SKILL.md`
- `.claude/skills/rezenhai-accessibility-review/SKILL.md`
- `.claude/skills/rezenhai-seo-ads-check/SKILL.md`
- `.claude/skills/rezenhai-pre-merge-check/SKILL.md`
- `.claude/skills/rezenhai-scope-budget-delivery/SKILL.md`
- `.claude/skill-research/REPORT.md`
- `.claude/skill-research/MEMORY-GOVERNANCE-REPORT.md`

## 3.2 Pesquisa de skills e projetos da comunidade

Faça uma pesquisa técnica real antes de selecionar bibliotecas ou padrões. Pesquise skills, starters, repositórios e implementações maduras para:

- SaaS com Next.js e Supabase;
- autenticação SSR com Supabase;
- RLS e multi-tenant workspaces;
- ledger de créditos e consumo;
- quotas atômicas e idempotência;
- filas em PostgreSQL;
- workers de mídia em containers;
- FFmpeg seguro;
- upload resumível;
- armazenamento S3/R2;
- transcrição com OpenAI;
- diarização e timestamps;
- editores de transcript sincronizados com player;
- geração de SRT/VTT;
- i18n e SEO internacional;
- páginas programáticas de SEO sem conteúdo fino;
- Cloudflare Turnstile e proteção contra abuso;
- integração de Stripe e webhooks idempotentes;
- observabilidade e tracing de jobs;
- testes de SSRF;
- segurança de upload;
- OpenAPI e SDKs;
- acessibilidade de editores e players;
- design systems premium para SaaS.

Avalie cada candidato por:

- licença;
- manutenção recente;
- atividade da comunidade;
- superfície de segurança;
- dependências;
- compatibilidade com a stack;
- custo operacional;
- lock-in;
- possibilidade de execução em planos gratuitos;
- complexidade real de manutenção.

Preferir licenças permissivas, como MIT, Apache-2.0 ou BSD. Não copiar código incompatível com o modelo comercial. Não incorporar código desconhecido sem revisão.

Crie `docs/RESEARCH_REPORT.md` contendo:

- fontes pesquisadas;
- soluções comparadas;
- o que será reaproveitado;
- o que foi rejeitado;
- riscos de segurança/licença;
- decisão final e justificativa;
- links e versões avaliadas;
- data da pesquisa.

## 3.3 Pesquisa oficial obrigatória

Antes de fixar versões, modelos ou APIs, consulte documentação oficial atual de:

- OpenAI;
- Next.js;
- Supabase;
- Vercel;
- Cloudflare;
- Stripe ou gateway escolhido;
- bibliotecas centrais selecionadas.

Não confie em memória para preços, limites, versões ou disponibilidade de modelos.

---

# 4. REFERÊNCIA VISUAL DO GOOGLE STITCH

O repositório deve conter, ou receber, uma pasta de referência semelhante a:

```text
stitch-reference/
  screens/
  assets/
  html/
  project-summary.md
```

Também podem existir:

```text
docs/design-reference/
docs/STITCH_DESIGN_BRIEF.md
docs/STITCH_PROJECT_SUMMARY.md
```

Regras:

- use o Stitch como referência visual e funcional;
- não trate HTML/CSS exportado como arquitetura de produção;
- não copie estrutura ruim apenas porque foi gerada;
- reconstrua componentes reais, acessíveis, responsivos e reutilizáveis;
- preserve a direção visual aprovada;
- refine inconsistências de espaçamento, tipografia, densidade, contraste e estados;
- compare implementação com screenshots em desktop e mobile;
- crie testes visuais das telas principais.

A base visual aprovada inclui:

- marca **PasteScribe**;
- símbolo inspirado em copiar/colar, documentos sobrepostos e transformação;
- interface predominantemente clara;
- azul cobalto/elétrico como cor principal;
- cinzas azulados muito claros;
- tipografia sans-serif contemporânea;
- acabamento limpo, técnico e direto;
- baixa ornamentação;
- uma ação principal por tela;
- editor com player, transcript e ações de inteligência;
- dashboard objetivo;
- pricing simples e transparente.

Evite “AI slop”:

- gradientes roxos genéricos;
- glows decorativos;
- excesso de cards iguais;
- números gigantes sem propósito;
- três passos 01/02/03 apenas por estética;
- ícones aleatórios;
- bordas e sombras uniformes em tudo;
- hero que não mostra o produto;
- mockup flutuante sem valor funcional;
- copy vaga como “revolucione seu workflow”.

---
