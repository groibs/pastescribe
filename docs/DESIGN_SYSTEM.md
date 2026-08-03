# Design system — PasteScribe

Criado na Onda 0 em 2026-08-03, consolidando a auditoria da referência do Stitch (`docs/STITCH_REFERENCE.md`). Fonte da verdade dos tokens no código: `packages/ui` (a partir da Onda 1). Se código e este doc divergirem, o código vence + atualizar aqui.

## Direção

Precisão, eficiência, clareza — "effortless power". Interface clara, técnica sem hostilidade, premium sem ornamento. Uma ação principal por tela. Bordas de baixo contraste definem objetos; sombras são raras e suaves. Sem gradientes decorativos, sem glow, sem estética genérica de IA (ver anti-padrões).

## Tokens (extraídos do Stitch — `PASTESCRIBE_DESIGN.md`, confirmados no HTML recuperado)

### Cor (light theme; dark mode só se for realmente implementado)

| Token | Valor | Uso |
|---|---|---|
| `background` / `surface` | `#faf8ff` | fundo geral frio |
| `surface-container-lowest` | `#ffffff` | cards nível 1 |
| `surface-container-low` | `#f3f3ff` | áreas agrupadas |
| `surface-container` | `#ebedff` | chips, secundários |
| `surface-container-high` | `#e3e7fe` | hover de containers |
| `on-surface` | `#161b2b` | texto principal |
| `on-surface-variant` | `#444656` | texto secundário/metadata |
| `outline` | `#747687` | bordas fortes (raras) |
| `outline-variant` | `#c4c5d8` | bordas padrão de card/input |
| `primary` | `#003adb` | azul cobalto — ação/CTA/estado ativo |
| `primary-container` | `#3157f5` | botão primário sólido |
| `on-primary` | `#ffffff` | texto sobre primário |
| `primary-fixed` | `#dee1ff` | tint de seleção/ativo |
| `error` / `error-container` | `#ba1a1a` / `#ffdad6` | erro |
| `tertiary` | `#922f00` | avisos/acentos raros (laranja queimado) |

Semânticos derivados (definir no código): `success`, `warning` com contraste AA — o Stitch não os traz; **decisão**: `success #1a7f37`-família e `warning` âmbar escuro, validados com checker de contraste na implementação.

### Tipografia

- **Inter** para tudo (UI e prosa) — utilitária, internacional.
- **JetBrains Mono** para timestamps, código e metadados técnicos (vindo do doc alternativo Lumina Lexicon; adotado porque distinção transcript × metadado é central no editor).
- Escala: display 48/56 −0.02em 700 · headline-lg 32/40 −0.01em 700 (mobile 24/32) · headline-md 24/32 600 · headline-sm 20/28 600 · body-lg 18/28 · body-md 16/24 · body-sm 14/20 · label-md 14/16 600 · label-sm 12/16 600 · `timestamp` 13/18 600 JetBrains Mono.
- Corpo de transcript: `body-md`, container ~800px para linha legível.

### Espaço, grid, raio

- Base 8px (`unit`); stack-sm 8 / stack-md 16 / stack-lg 32; gutter 24; margem mobile 16, desktop 48; container máx. 1280px (marketing) / editor pode usar até 1440px.
- Grid 12 col desktop / 4 col mobile / 8 col tablet.
- Raio: sm 4px · padrão 8px (botões, inputs) · lg 16px (cards grandes, players) · full só para chips de status e ícones utilitários. Nada de pill em CTA principal.
- Elevação: L0 fundo; L1 branco + borda 1px `outline-variant`, sem sombra; L2 (dropdown/modal) branco + borda + sombra difusa `0 8px 24px rgba(11,16,32,0.05)`. Nunca elemento flutuante sem borda.
- Motion: transições 150–250ms, easing suave; `prefers-reduced-motion` respeitado sempre; animação só com propósito (progresso, entrada de resultado).

## Componentes (inventário e onda de chegada)

Onda 1: tokens, Button, Input, URLInput, Badge, Alert, Skeleton, layout base.
Onda 2–4: Dialog, Tabs, Toast, Dropzone, ProgressSteps, JobStatusChip, EmptyState, ErrorState, Table.
Onda 6: Player, TranscriptSegment, SpeakerControl, SelectionToolbar, ExportPanel.
Onda 9–10: PricingCard, CreditMeter, PlanBadge, Charts (admin).

Cada componente entrega estados: default, hover, focus-visible, active, disabled, loading, error, success + comportamento mobile. Base acessível: Radix UI (validar por componente; licença MIT).

### Especificações herdadas do Stitch

- Botão primário: sólido `#3157f5`, texto branco, raio 8px; secundário: superfície `#eef2ff`/`surface-container` com texto primário; nunca gradiente.
- Input: borda 1px `outline-variant`; focus: borda primária + ring externo 2px azul 10%.
- Segmento de transcript: timestamp (JetBrains Mono) + speaker (Inter 600) + texto editável; hover revela "play daqui" e "copiar link do timestamp"; segmento ativo recebe tint `primary-fixed` (sem elevação).
- Chips de plataforma: monocromáticos (`on-surface-variant`), cor da marca só no hover.
- Progresso: barra linear azul; para processos longos, estimativa em `timestamp` style.
- Empty state: ícone monocromático + `headline-sm` + ação de colar link.

## Acessibilidade (bloqueante, WCAG AA)

Contraste AA em todo par usado; foco visível; navegação por teclado completa (editor e player com atalhos documentados); touch ≥ 44px; `aria-live` para progresso de job; status nunca só por cor (ícone/texto junto); inputs ≥ 16px no iOS; focus trap em modais; safe-area respeitada; textos traduzidos sem quebra de layout (strings longas de pt-BR/es testadas). Skill `pastescribe-accessibility-review` audita.

## Anti-padrões (bloqueiam PR de UI)

Gradiente roxo genérico; glow decorativo; grade de cards idênticos; número gigante sem função; seções 01/02/03 decorativas; ícones aleatórios; sombra uniforme em tudo; hero sem produto real; mockup flutuante; copy vaga ("revolucione seu workflow"); centralização de tudo; spacing robótico sem ritmo.

## Lacuna registrada

Os screenshots do Stitch (home, dashboard, editor, pricing, logo) foram perdidos na truncagem do ZIP exportado (ver `docs/STITCH_REFERENCE.md`). A reconstrução de telas usará: tokens acima + descrições do prompt-mestre + fragmento recuperado do dashboard. Se o dono tiver o export original íntegro, recomitar o ZIP melhora a fidelidade — **não bloqueia** as Ondas 0–5 (fundação e backend).
