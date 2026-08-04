# Design system — PasteScribe

Criado na Onda 0 em 2026-08-03, consolidando a referência do Stitch. Fonte da verdade dos tokens no código: `packages/ui`.

## Direção

Precisão, eficiência e clareza. Interface técnica sem hostilidade, premium sem ornamento. Uma ação principal por tela. Bordas de baixo contraste definem objetos; sombras são raras. Sem gradientes/glows decorativos ou estética genérica de IA.

A transcrição é a ação principal do produto. O preview de vídeo com legendas, quando chegar, é um módulo secundário abaixo da transcrição ou em painel subordinado; nunca substitui o editor nem domina a hierarquia.

## Tokens

### Cor

| Token | Valor | Uso |
|---|---|---|
| `background` / `surface` | `#faf8ff` | fundo geral |
| `surface-container-lowest` | `#ffffff` | cards |
| `surface-container-low` | `#f3f3ff` | áreas agrupadas |
| `surface-container` | `#ebedff` | chips/secundários |
| `surface-container-high` | `#e3e7fe` | hover |
| `on-surface` | `#161b2b` | texto principal |
| `on-surface-variant` | `#444656` | texto secundário |
| `outline` | `#747687` | borda forte rara |
| `outline-variant` | `#c4c5d8` | borda padrão |
| `primary` | `#003adb` | ação/ativo |
| `primary-container` | `#3157f5` | botão primário |
| `on-primary` | `#ffffff` | texto no primário |
| `primary-fixed` | `#dee1ff` | seleção |
| `error` / `error-container` | `#ba1a1a` / `#ffdad6` | erro |
| `tertiary` | `#922f00` | avisos raros |
| `success` | `#1a7f37` | sucesso |
| `warning` | `#8a5300` | aviso |

Cores livres de legenda são validadas por contraste e por limites de schema. O preview precisa oferecer fundo/contorno/sombra suficiente para legibilidade sobre vídeo variável.

### Tipografia

- Inter para UI e prosa;
- JetBrains Mono para timestamps e metadados;
- escala existente de display/headline/body/label/timestamp;
- transcript em `body-md`, container legível;
- fontes de legenda vêm de lista pequena, licenciada e versionada; nenhum upload arbitrário de fonte no MVP.

### Espaço, grid, raio e motion

Base 8px; grid 12/8/4; raio 8px em controles e 16px em cards/player; elevação rara; transições 150–250ms; `prefers-reduced-motion` sempre respeitado.

## Componentes e ondas

- Onda 1: Button, Input, UrlInput, Badge, Alert, Skeleton, TranscribeBar.
- Ondas 2–4: Dialog, Tabs, Toast, Dropzone, ProgressSteps, JobStatusChip, EmptyState, ErrorState, Table.
- Onda 6.1: Player, TranscriptSegment, SpeakerControl, SelectionToolbar.
- Onda 6.2: ExportPanel para TXT/MD/DOCX/PDF/SRT/VTT/JSON.
- Onda 6.3: `CaptionPreviewPanel`, `CaptionPresetPicker`, `CaptionStyleControls` e `CaptionPreviewPlayer`.
- Onda 6.4: `RenderProgress`, `RenderOutputCard`, download temporário e estados de falha/cancelamento.
- Ondas 9–10: PricingCard, CreditMeter, PlanBadge, quote/checkout contextual e charts.

## Módulo de preview de legendas — Onda 6.3

Hierarquia:

1. transcript/editor;
2. heading secundário “Veja como as legendas ficam no vídeo”;
3. player de preview;
4. poucos controles previsíveis;
5. oferta discreta de download completo.

O preview não deve usar CTA primário maior que os controles do transcript. Não abrir automaticamente modal full-screen. Não renderizar no servidor por mount/reload/troca de controle.

Controles permitidos no MVP:

- preset;
- fonte allowlisted;
- tamanho em faixa;
- cor principal;
- cor de destaque;
- posição inferior/central/superior;
- contorno, sombra ou caixa;
- máximo aproximado de palavras por bloco;
- reset.

Não criar timeline, keyframes, múltiplas camadas, drag livre, corte, reframing ou editor avançado.

## Presets planejados

Candidatos: Clássica, Social Bold, Palavra em destaque, Karaokê, Caixa, Minimalista, Podcast/Falante.

Regras:

- nome localizado e refinável;
- `preset_id` estável e `preset_version` imutável;
- defaults reproduzíveis;
- fonte/licença registradas;
- não copiar nomes, assets ou aparência exata de TikTok, Instagram, CapCut ou outra marca;
- preset gratuito/pago é decisão de entitlement, não duplicação visual do componente.

## Oferta contextual

Estrutura aceitável próxima ao preview:

> Baixar vídeo completo com legendas  
> 1min42s · 1080p  
> R$ X

O valor vem do servidor e pode ser compra avulsa, pacote ou franquia. Não usar “pronto para publicar”, “reposte” ou copy que transforme o produto em editor/plataforma de publicação.

## Acessibilidade bloqueante

- WCAG AA;
- foco visível e teclado completo;
- touch ≥44px;
- `aria-live` para progresso de render;
- status nunca só por cor;
- labels para todos os controles;
- input ≥16px no iOS;
- safe areas;
- strings longas em pt-BR/es;
- preview com alternativa textual e timestamps;
- destaque de palavra não pode depender apenas de mudança de cor;
- controles respeitam reduced motion;
- captions devem permanecer legíveis em frames claros e escuros.

## Anti-padrões

Gradiente roxo genérico; glow; grade de cards idênticos; número gigante decorativo; ícones aleatórios; sombra em tudo; mockup flutuante; copy vaga; centralização de tudo; preview dominando a tela; editor estilo CapCut; controles infinitos; timeline no MVP; aparência copiada de marcas sociais.

Planejamento funcional e contratos: `docs/CAPTIONED_VIDEO_EXPORT.md`.
