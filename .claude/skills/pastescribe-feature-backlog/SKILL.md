---
name: pastescribe-feature-backlog
description: Disciplina de backlog e escopo adiado do PasteScribe. Use ao receber ideia nova, ao considerar retomar feature adiada, ao pausar escopo ou quando uma feature ameaçar furar a ordem de ondas. Garante que nada entra sem pré-condição cumprida e que nada é esquecido sem registro.
---

# PasteScribe — Backlog e escopo adiado

Fonte da verdade: `docs/PENDING_FEATURES.md` (tabela feature → estado → pré-condição) e `docs/ROADMAP.md` (ordem de ondas e gates).

## Ao receber ideia/pedido novo

1. Classifique: pertence a qual onda? Tem pré-condição pendente?
2. Se fura a ordem de dependências: registre em `docs/PENDING_FEATURES.md` com pré-condição objetiva e **não implemente**.
3. Se cabe na onda atual: aplique `pastescribe-scope-budget-delivery` (admissão A/B/C).
4. Ideia rejeitada de vez → `docs/DECISIONS.md` com motivo (evita reabrir sem contexto).

## Ao retomar feature adiada

- confira a pré-condição na tabela — cumprida de verdade (código/testes), não "quase";
- features **Bloqueadas** (OpenAI pública, publicação de transcripts) só saem do bloqueio com os gates do `docs/THREAT_MODEL.md`/`docs/ROADMAP.md` entregues e decisão registrada;
- atualize o estado na tabela no mesmo PR que iniciar a retomada.

## Ao pausar/remover escopo

- flag esconde, nunca apaga (`docs/FEATURE_FLAGS.md`);
- registre em `docs/PENDING_FEATURES.md` com condição de retomada;
- UI mostra estado neutro honesto — nunca "em breve" com promessa.

## Regras

- Nenhuma feature parcial visível que quebre fluxo ou engane o usuário.
- Backlog não é lista de desejos: cada entrada tem pré-condição verificável.
- Uma frente por vez; a onda atual fecha antes da próxima abrir (salvo gate já entregue).
