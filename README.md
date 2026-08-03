# PasteScribe

PasteScribe transforma links e arquivos de vídeo em texto utilizável: transcrição, timestamps, falantes, resumo, capítulos, tradução, legendas e formatos derivados.

## Estado atual

Este repositório contém apenas o **bootstrap de produto e engenharia** para o Claude Code iniciar o desenvolvimento com contexto suficiente. Ainda não existe aplicação de produção.

A referência visual exportada do Google Stitch está em [`stitch-reference/`](stitch-reference/). Ela deve orientar acabamento, hierarquia e fluxos, mas **não deve ser promovida diretamente a código de produção**.

## Ordem obrigatória para qualquer agente

1. Ler [`CLAUDE.md`](CLAUDE.md).
2. Ler [`.claude/MEMORY_MAP.md`](.claude/MEMORY_MAP.md).
3. Ler [`docs/HANDOFF.md`](docs/HANDOFF.md).
4. Ler [`PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md`](PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md).
5. Consultar apenas os documentos canônicos relevantes.
6. Inspecionar o código real antes de alterar qualquer área.
7. Atualizar `docs/HANDOFF.md` antes de encerrar a sessão.

## Primeira missão do Claude Code

Executar a **Onda 0 — Descoberta e governança** definida no prompt-mestre:

- auditar a referência do Stitch;
- pesquisar padrões reutilizáveis nos repositórios `groibs/ressoa`, `groibs/rezenhai-mvp` e `groibs/rezenhai`;
- pesquisar skills e projetos comunitários adequados;
- validar a arquitetura com documentação oficial;
- consolidar threat model, backlog, decisões e plano em ondas;
- somente então iniciar a primeira fatia vertical mergeável.

## Workflow

- `main` é protegida por processo: não trabalhar diretamente nela.
- Uma frente por vez, em branch descritiva.
- Toda entrega relevante termina em PR independente, testável e documentada.
- Claude Code é o construtor principal; Codex pode revisar, testar, corrigir e refatorar depois.
- Nunca inserir segredos, chaves, dumps, mídia privada ou dados pessoais no repositório.
