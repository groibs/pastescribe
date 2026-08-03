---
name: pastescribe-scope-budget-delivery
description: Gestão obrigatória de escopo, prioridade e orçamento de sessão no PasteScribe. Use sempre que houver múltiplos itens, tarefa média/grande, P0/P1 ou expectativa de PR. Antes de alterar arquivos, decide se a entrega completa cabe na janela, se apenas um recorte vertical mergeável cabe, ou se nada deve começar. Garante validação, push e PR mergeável antes do limite.
---

# PasteScribe — Escopo, orçamento e entrega

## Regra central

Uma tarefa só é viável quando há orçamento de sessão para: compreender, implementar, testar, documentar, atualizar `docs/HANDOFF.md`, commitar, publicar a branch e deixar PR mergeável. **Escrever parte do código não é entregar.**

## Admissão antes de tocar em código

1. Verifique consumo da janela/contexto e estado de branch, base e PRs.
2. Classifique prioridade (P0/P1), esforço, acoplamento e risco.
3. Escolha:
   - **A. Entrega completa viável** — declare escopo, critérios de aceite, checks e reserva para PR; comece.
   - **B. Só um recorte mergeável cabe** — declare o que entra, o que fica de fora e o valor funcional do recorte; o recorte é vertical, funcional, testável e seguro (nunca "metade do backend" ou UI sem integração). Em sessão autônoma, registre a linha de corte no HANDOFF e prossiga; com o dono presente, aguarde aprovação.
   - **C. Nada mergeável cabe** — não altere arquivos; registre no HANDOFF a tarefa menor recomendada.

## Faixas de risco por consumo da janela

- <50%: tarefas médias/grandes admissíveis com diagnóstico;
- 50–70%: linha de corte explícita para tarefas médias; divida as grandes;
- 70–85%: só recorte mergeável ou recusa;
- >85%: apenas tarefas pequenas de baixo risco;
- >90%: exclusivamente estabilizar, publicar e fechar PR aberta.

## Prioridades do PasteScribe

P0 permanente: gates de custo/segurança (Onda 3), integridade de ledger, RLS, SSRF. Nenhuma feature P1 (polish, páginas SEO, integrações) fura a ordem de dependências de `docs/ROADMAP.md`. Frente única: não abrir segunda frente com a primeira instável.

## Encerramento obrigatório

Toda sessão termina com: feito/não feito, arquivos principais, migrations, comandos e resultados, riscos, configuração manual pendente, branch/PR, como testar, próximo passo exato — e `docs/HANDOFF.md` atualizado. Sem exceção, inclusive em sessão interrompida.
