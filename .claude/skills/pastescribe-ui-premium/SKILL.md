---
name: pastescribe-ui-premium
description: Eleva a UI do PasteScribe a nível premium, técnico e claro, sem AI slop. Use sempre que redesenhar ou refinar qualquer tela (home, dashboard, nova transcrição, processamento, editor, pricing), ajustar tipografia, espaçamento, hierarquia, cor ou profundidade. Impõe os tokens do design system e o critique-loop.
---

# PasteScribe — UI premium

Direção: precisão, eficiência, clareza — "effortless power". Interface clara e técnica para profissionais que querem o texto, rápido. Tokens canônicos: `docs/DESIGN_SYSTEM.md` (fonte da verdade no código: `packages/ui`). Se divergirem, o código vence.

## Princípios

1. **O herói é uma tese.** O herói do PasteScribe é o campo de colar URL + o resultado real (transcript de verdade na tela). Nunca mockup flutuante ou número decorativo.
2. **Uma ação principal por tela.** Nomeie o único trabalho da tela antes de tocar no código.
3. **Borda define objeto; sombra é rara.** L1 = branco + borda `outline-variant`; sombra só em dropdown/modal.
4. **Tipografia trabalha.** Inter para tudo; JetBrains Mono para timestamps/metadados técnicos — a distinção transcript × metadado é identidade do produto.
5. **Azul cobalto é ação.** `primary` só em CTA, progresso e estado ativo. Nunca decoração.
6. **Mobile de verdade.** Editor mobile: transcript é o foco, player recolhível, ações em bottom sheet, teclado tratado, touch ≥44px.

## Tokens rápidos (consulta; canônico no design system)

```
fundo #faf8ff · card #ffffff + borda #c4c5d8 · texto #161b2b / #444656
primary #003adb · botão primário #3157f5 · tint ativo #dee1ff · erro #ba1a1a
raio: 8px botões/inputs, 16px cards grandes · base 8px · container 1280px
Inter (display 48/56 700 −0.02em … body-md 16/24) · JetBrains Mono 13/18 timestamps
```

## Anti-AI-slop — checklist duro

- ❌ gradiente roxo/glow decorativo — o PasteScribe é plano e preciso;
- ❌ grid de cards idênticos com sombra uniforme;
- ❌ "big number + label + gradient" como hero;
- ❌ três passos 01/02/03 decorativos;
- ❌ ícones aleatórios como enfeite;
- ❌ centralização de tudo / spacing robótico — use ritmo (respiro maior antes do clímax);
- ❌ hero que não mostra o produto — mostre transcript real;
- ❌ copy vaga ("revolucione seu workflow") — copy diz o que acontece: "Cole o link. Receba o texto.";
- ❌ pill em CTA principal (pill é só chip de status).

## Processo (critique-loop)

1. Nomeie a tela e seu único trabalho.
2. Leia os arquivos reais antes de propor.
3. Declare 2–3 escolhas opinativas + 1 risco estético defensável.
4. Implemente com tokens de `packages/ui` — nunca valores soltos.
5. Critique: "tire um acessório" — o que sai sem perder a mensagem?
6. Teste em ≤375px e com strings pt-BR/es (mais longas) antes de dar pronto.

## Telas-alvo e único trabalho

| Tela | Único trabalho |
|---|---|
| Home | colar um link agora |
| Dashboard | novo link + estado dos jobs num relance |
| Nova transcrição | confirmar custo e iniciar sem susto |
| Processamento | confiança: progresso real por etapa |
| Editor | ler/editar texto sincronizado sem fricção |
| Pricing | entender o preço em 10 segundos |
