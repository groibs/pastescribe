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

## ⚠️ Estado real do arquivo (auditoria da Onda 0, 2026-08-03)

O ZIP versionado está **truncado** (15 KB, sem end-of-central-directory; `unzip` falha). Recuperação por parsing manual dos local headers obteve:

- `design/PASTESCRIBE_DESIGN.md` — **íntegro** (idêntico em conteúdo à cópia já versionada em `stitch-reference/design/`, com prose um pouco mais completa);
- `design/LUMINA_LEXICON.md` — **íntegro** (variante de design com JetBrains Mono para timestamps; recuperado apenas via extração);
- `html/dashboard.html` — **parcial** (~5,4 KB de 25,5 KB; confirma os tokens no Tailwind config);
- `html/home.html`, `html/editor.html`, `html/pricing.html` e os 5 screenshots `.webp` — **ausentes do arquivo** (perdidos na truncagem).

Consequências: os tokens e a direção visual estão seguros e consolidados em `docs/DESIGN_SYSTEM.md`; a comparação pixel-a-pixel com screenshots não é possível. Se o export original íntegro ainda existir, recomitá-lo melhora a fidelidade das Ondas 6/10 — não bloqueia as ondas de fundação. O script `scripts/extract-stitch-reference.sh` continua falhando com o ZIP atual por design (`unzip` estrito); a recuperação parcial foi feita manualmente.

## Estrutura

O material limpo está preservado em:

```text
stitch-reference/
├── README.md
└── pastescribe-stitch-export.zip
```

Após executar `bash scripts/extract-stitch-reference.sh`, será criado:

```text
stitch-reference/extracted/
├── design/
│   ├── PASTESCRIBE_DESIGN.md
│   └── LUMINA_LEXICON.md
├── html/
│   ├── home.html
│   ├── dashboard.html
│   ├── editor.html
│   └── pricing.html
└── screens/
    ├── logo.webp
    ├── home.webp
    ├── dashboard.webp
    ├── editor.webp
    └── pricing.webp
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
