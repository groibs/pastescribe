---
name: pastescribe-accessibility-review
description: Revisão de acessibilidade WCAG AA (bloqueante) para o PasteScribe. Use ao criar ou alterar qualquer tela, componente, player, editor ou fluxo. Cobre contraste, teclado, leitores de tela, aria-live de progresso, player/editor acessíveis, mobile e reduced motion. Produz PASS/FAIL.
---

# PasteScribe — Revisão de acessibilidade

WCAG AA é bloqueante. Rodar axe automatizado (testes) + revisão manual nas telas críticas.

## Checklist geral — bloqueante

- contraste AA em todo par texto/fundo usado (inclusive `on-surface-variant` sobre superfícies tintadas);
- foco visível em todo interativo (`focus-visible` com ring, nunca `outline: none` sem substituto);
- navegação completa por teclado; ordem de tabulação lógica; sem armadilha;
- labels programáticas em todo controle; erros de formulário associados via `aria-describedby`;
- status nunca só por cor (ícone/texto junto — chips de job, estados de quota);
- `prefers-reduced-motion` respeitado em toda animação;
- zoom 200% sem perda de função; touch ≥44×44px; inputs ≥16px no iOS;
- modais com focus trap e retorno de foco; bottom sheets fecháveis por teclado;
- strings traduzidas (pt-BR/es mais longas) sem quebra/corte.

## Específicos do PasteScribe — bloqueante

- **Progresso de job:** etapa atual anunciada por `aria-live="polite"`; porcentagem/etapa em texto, não só barra;
- **Player:** controles com nomes acessíveis; atalhos documentados e desativáveis; timestamps navegáveis por teclado; estado de reprodução anunciado;
- **Editor de transcript:** segmentos alcançáveis por teclado; edição inline não sequestra setas do leitor de tela; "play daqui"/"copiar timestamp" acessíveis fora do hover (foco também revela); busca com resultado anunciado;
- **URL input do herói:** erro de validação anunciado; sucesso da detecção descrito textualmente;
- **Paywall/ofertas:** dialogs corretos, sem auto-foco em CTA de compra.

## Processo

1. Rode os testes axe existentes (ou adicione para a tela nova).
2. Percorra o fluxo inteiro só por teclado.
3. Verifique com viewport 375px + zoom 200%.
4. Relate PASS/FAIL por seção com evidência; falha grave bloqueia o PR.
