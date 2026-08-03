# AGENTS.md

Instruções para qualquer agente de código que atue no PasteScribe.

## Fonte de verdade

Leia nesta ordem:

1. `CLAUDE.md`;
2. `.claude/MEMORY_MAP.md`;
3. `docs/HANDOFF.md`;
4. documento canônico relacionado à tarefa;
5. código e migrations reais.

O prompt completo do projeto está em `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md`.

## Papel dos agentes

- **Claude Code:** construtor principal, responsável por pesquisa, planejamento, implementação e PRs em fatias verticais.
- **Codex/outros revisores:** revisão, testes, TypeScript, build, segurança, acessibilidade, responsividade, refatoração e correções.
- Não trabalhar simultaneamente na mesma frente ou branch.

## Restrições

- Não alterar `main` diretamente.
- Não fazer merge sem autorização explícita.
- Não inserir segredos ou dados pessoais.
- Não usar o HTML do Stitch como código de produção sem reconstrução.
- Não ativar OpenAI real antes de quota durável, idempotência, rate limit, budget reservation e kill switch.
- Não criar páginas SEO finas ou indexar transcrições privadas.
- Não implementar scraping evasivo ou acesso a conteúdo privado.
- Não afirmar que testou integração externa sem acesso real.

## Qualidade mínima

Toda PR deve:

- ser independente e mergeável;
- ter escopo fechado;
- explicar problema e solução;
- incluir testes proporcionais;
- atualizar documentação e handoff;
- evitar refatoração lateral não solicitada;
- não conter feature parcial que quebre o fluxo.
