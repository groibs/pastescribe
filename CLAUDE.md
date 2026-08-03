# CLAUDE.md — índice operacional do PasteScribe

Este é o ponto de partida obrigatório de toda sessão do Claude Code neste repositório.

## Como começar toda tarefa

1. Leia este arquivo.
2. Leia `.claude/MEMORY_MAP.md`.
3. Leia `docs/HANDOFF.md` e respeite a ordem de dependências registrada nele.
4. Leia os documentos canônicos relevantes à tarefa.
5. Leia o código real e as migrations antes de inferir estado.
6. Use as skills locais em `.claude/skills/` quando existirem e forem aplicáveis.
7. Tarefas grandes devem ser divididas em fatias verticais mergeáveis, com reserva para testes, documentação, push e PR.
8. Atualize `docs/HANDOFF.md` antes de encerrar qualquer sessão.

## Documento de missão

O escopo completo está em `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md`.

Não tente implementar o projeto inteiro de uma vez. A ordem de ondas, os requisitos bloqueantes, os critérios de aceite e os limites do produto definidos nesse documento são obrigatórios.

## Hierarquia da verdade

1. Código, migrations e configuração versionada definem o que existe de fato.
2. Documentos canônicos definem produto, arquitetura e decisões ativas.
3. Skills definem procedimentos de trabalho.
4. Handoffs e relatórios registram estado histórico e devem ser confirmados.
5. Referências do Stitch são direcionamento visual, não arquitetura nem código canônico.

Quando houver conflito ou informação insuficiente, escreva **A confirmar**. Não invente.

## Pesquisa obrigatória antes da primeira implementação

Inspecione, sem copiar cegamente, os repositórios:

- `groibs/ressoa`;
- `groibs/rezenhai-mvp`;
- `groibs/rezenhai`.

Priorize padrões de:

- `CLAUDE.md` e `AGENTS.md`;
- `.claude/MEMORY_MAP.md`;
- `docs/HANDOFF.md`;
- skills de escopo, entrega, UI premium, acessibilidade, SEO, pre-merge e governança de IA;
- Supabase, migrations, RLS e autenticação;
- feature flags;
- analytics sem PII;
- CI, build, typecheck e documentação.

Adapte apenas o que fizer sentido para PasteScribe. Não importe identidade, copy ou regras específicas de Ressoa/Rezenhaí.

Pesquise também skills e repositórios comunitários para frontend, design system, FFmpeg, filas, transcrição, segurança de URL/SSRF, uploads, testes, i18n, SEO, OpenAI e Supabase. Registre fonte, licença, maturidade, manutenção, risco e decisão de uso.

## Regras bloqueantes de produto e custo

- Orçamento operacional inicial total: aproximadamente **R$ 500/mês**.
- O gratuito é uma degustação com teto financeiro durável, não uma franquia recorrente ilimitada.
- O backend deve reservar orçamento antes de iniciar qualquer job gratuito.
- Clientes pagos não podem parar porque o orçamento gratuito acabou.
- Nenhuma chamada paga ocorre por reload, montagem, animação, duplo clique ou texto fixo.
- Free e paid devem usar quotas, chaves/projetos e kill switches separados quando aplicável.
- Não confiar apenas no orçamento configurado no painel do provider.
- Não expor OpenAI, Supabase service role ou credenciais de pagamento no client.
- Não implementar scraping evasivo, acesso a conteúdo privado ou contorno de proteção.
- Upload e URLs devem ter proteção contra SSRF, abuso, malware, tamanho excessivo e decompression bombs.
- Transcripts, links privados e dados pessoais não entram em analytics, logs ou URLs públicas.

## Referência do Stitch

A pasta `stitch-reference/` contém uma exportação organizada do Google Stitch.

Use para:

- hierarquia;
- espaçamento;
- densidade;
- composição;
- fluxos;
- tokens iniciais;
- direção visual.

Não use como justificativa para:

- copiar HTML diretamente;
- manter componentes frágeis;
- aceitar baixa acessibilidade;
- criar UI sem responsividade;
- ignorar design system real;
- introduzir dependências sem análise.

## Convenções de Git

- Nunca desenvolver diretamente em `main`.
- Branch descritiva em kebab-case.
- Commits claros e de escopo coerente.
- Uma PR por fatia lógica mergeável.
- Não fazer merge sem autorização explícita do dono.
- Não alterar DNS, produção ou serviços pagos sem autorização explícita.
- Antes de PR: typecheck, lint, testes, build, segurança proporcional, acessibilidade e documentação.

## Início de cada sessão

Declare objetivamente:

- branch e base;
- estado do repositório;
- documentos lidos;
- skills aplicáveis;
- escopo admitido;
- P0/P1;
- critérios de aceite;
- checks;
- riscos;
- linha de corte mergeável.

## Encerramento de cada sessão

Informe:

- feito e não feito;
- arquivos principais;
- migrations;
- comandos e testes executados;
- resultados;
- riscos e limitações;
- configuração manual pendente;
- branch/PR;
- como testar;
- documentos de memória atualizados;
- próximo passo exato.

Atualize `docs/HANDOFF.md` sempre.
