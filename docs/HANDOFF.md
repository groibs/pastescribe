# HANDOFF — PasteScribe

Última atualização: **2026-08-03**

## Branch e base

- Base: `main`
- Branch de bootstrap: `chore/bootstrap-claude-code`
- Estado: PR de preparação aguardando revisão/merge

## Objetivo desta entrega

Preparar o repositório para o Claude Code iniciar o PasteScribe com:

- prompt-mestre completo;
- memória operacional;
- briefing e decisões já tomadas;
- regras de segurança e custo;
- material do Google Stitch organizado como referência;
- workflow de branches, PRs e handoff.

## Concluído

- Repositório inicializado.
- ZIP do Google Stitch inspecionado e reorganizado.
- Screenshots, HTML e design docs preservados em `stitch-reference/`.
- `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md` adicionado.
- `CLAUDE.md`, `AGENTS.md` e `.claude/MEMORY_MAP.md` criados.
- Briefing, monetização, decisões, segurança e alvos de pesquisa documentados.
- `.gitignore` preparado para impedir segredos, mídia e artefatos locais.

## O que falta — ordem obrigatória

### 1. Merge do bootstrap

Revisar e fazer merge da PR de bootstrap antes de iniciar outra frente.

### 2. Claude Code — Onda 0

Antes de editar código:

1. ler `CLAUDE.md`;
2. ler `.claude/MEMORY_MAP.md`;
3. ler este handoff;
4. ler integralmente `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md`;
5. extrair e inspecionar `stitch-reference/`;
6. pesquisar os repositórios e skills listados em `docs/REPOSITORY_RESEARCH_TARGETS.md`;
7. pesquisar referências comunitárias e documentação oficial;
8. produzir inventário, relatório de pesquisa, arquitetura, riscos e plano em ondas;
9. criar/adaptar skills locais;
10. atualizar documentação canônica e este handoff.

### 3. Primeira fatia funcional

Depois da Onda 0, iniciar a Onda 1 em uma nova branch e PR, preservando uma fatia vertical mergeável. Não ativar OpenAI real nem scraping público nessa primeira fatia.

## Restrições que não podem ser violadas

- Não trabalhar diretamente em `main`.
- Não fazer merge sem autorização do dono.
- Não alterar DNS ou produção.
- Não inserir segredos.
- Não promover HTML do Stitch diretamente a produção.
- Não liberar IA gratuita sem orçamento durável, reserva atômica, rate limit, idempotência e kill switch.
- Não implementar scraping evasivo, conteúdo privado ou contorno de proteção.
- Não indexar transcripts privados.
- Não registrar links privados, transcript, e-mail ou conteúdo em analytics/logs.
- Não introduzir serviço pago sem necessidade e registro de custo.

## Decisões manuais pendentes

- Provider de pagamento internacional/Merchant of Record.
- Infraestrutura definitiva do worker de mídia.
- Estratégia autorizada por plataforma para obtenção de legendas/áudio.
- Domínio e configuração DNS final.
- Valores finais de planos e créditos após custos reais.
- Momento de ativação do Vercel Pro e Supabase Pro.

Nenhuma dessas decisões bloqueia a Onda 0 ou a fundação local com providers falsos.

## Como iniciar a próxima sessão

Enviar ao Claude Code:

> Leia `CLAUDE.md`, `.claude/MEMORY_MAP.md`, `docs/HANDOFF.md` e integralmente `PASTESCRIBE_CLAUDE_CODE_MASTER_PROMPT.md`. Extraia e inspecione `stitch-reference/`. Execute primeiro a Onda 0 e produza o inventário, a pesquisa, a arquitetura, os riscos e o plano exigidos antes de implementar. Depois avance apenas para a primeira fatia vertical mergeável. Atualize `docs/HANDOFF.md` antes de encerrar.
