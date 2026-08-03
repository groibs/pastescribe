# Referência Google Stitch

## Origem

Material exportado pelo Google Stitch e recebido em `paste_scribe.zip` em 2026-08-03.

O pacote original continha:

- logo;
- homepage;
- dashboard;
- editor;
- pricing;
- HTML por tela;
- dois documentos de design.

Foi reorganizado em `stitch-reference/` com nomes consistentes.

## Histórico: ZIP truncado na Onda 0, substituído em 2026-08-03

O ZIP versionado originalmente na Onda 0 estava truncado (15 KB, sem end-of-central-directory). Tokens e os dois docs de design foram recuperados por parsing manual; os 4 HTMLs completos e os 5 screenshots estavam ausentes — registrado então em `docs/RESEARCH_REPORT.md` e `LESSONS_LEARNED.md`.

**Resolvido:** o dono enviou o export original íntegro (1,9 MB, `unzip -t` sem erros), que substituiu o arquivo truncado em `stitch-reference/pastescribe-stitch-export.zip`. Material completo confirmado: logo, home, dashboard, editor e pricing, cada um com `code.html` + `screen.png`, mais os dois `DESIGN.md`. `docs/DESIGN_SYSTEM.md` e a home/pricing do produto foram atualizados com fidelidade total a partir daqui.

## Estrutura

O material compactado está preservado em:

```text
stitch-reference/
├── README.md
├── design/
│   ├── PASTESCRIBE_DESIGN.md
│   └── LUMINA_LEXICON.md
└── pastescribe-stitch-export.zip
```

Após executar `bash scripts/extract-stitch-reference.sh`, será criado (estrutura real do export, não versionada):

```text
stitch-reference/extracted/stitch_universal_video_transcriber/
├── pastescribe/DESIGN.md
├── lumina_lexicon/DESIGN.md
├── pastescribe_logo/screen.png
├── pastescribe_home/{code.html, screen.png}
├── pastescribe_dashboard/{code.html, screen.png}
├── pastescribe_editor/{code.html, screen.png}
└── pastescribe_pricing/{code.html, screen.png}
```

A pasta `extracted/` é gerada localmente e não precisa ser versionada.

## Como usar

Extrair:

- composição;
- hierarquia visual;
- grid;
- densidade;
- tokens iniciais;
- fluxo de navegação;
- padrões de editor;
- tratamento de pricing.

Reconstruir:

- componentes;
- estados;
- responsividade;
- acessibilidade;
- design tokens;
- navegação;
- semântica;
- comportamento real;
- loading/error/empty states.

## O que não fazer

- Não copiar HTML para a aplicação sem revisão.
- Não tratar imagens ou textos de demonstração como conteúdo final.
- Não assumir que o design cobre todos os fluxos descritos no prompt-mestre.
- Não preservar inconsistências apenas porque aparecem no Stitch.
- Não usar dependências externas embutidas no HTML sem auditoria.
- Não aceitar fonte, contraste ou touch targets sem teste.

## Direção visual inicial

O material sugere:

- fundo claro frio;
- azul elétrico como ação principal;
- bordas de baixo contraste;
- bastante espaço em branco;
- tipografia utilitária;
- dashboard objetivo;
- editor de três áreas;
- sombras discretas;
- sem gradientes decorativos pesados.

A Onda 0 deve consolidar o design system real em `docs/DESIGN_SYSTEM.md` e tokens no código.
