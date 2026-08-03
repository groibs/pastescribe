---
name: pastescribe-seo-international-check
description: Gate de SEO internacional e analytics antes de criar/alterar rota pública, robots, sitemap, metadata, hreflang ou qualquer chamada de tracking no PasteScribe. Verifica indexação correta, tríplice noindex para rotas privadas, hreflang/canonical por locale, gate de qualidade de página programática e ausência de PII em analytics. Produz PASS/FAIL — não corrige sozinha.
---

# PasteScribe — SEO internacional + analytics check

Referências: `docs/SEO.md`, `docs/ANALYTICS_EVENTS.md`. Esta skill verifica e relata.

## 1. Indexação — bloqueante

- rota pública nova: `generateMetadata` próprio (não herda default genérico); no sitemap do locale; canonical self-referencing;
- rota privada nova (`/app`, `/auth`, `/checkout`, `/admin`, shares, api): **tríplice noindex** — `robots: {index:false, follow:false}` na metadata + prefixo no `robots.txt` + fora do sitemap;
- transcript de terceiro nunca indexável (flag `public_transcripts_enabled` desligada = nem existe rota).

## 2. i18n/hreflang — bloqueante para página pública

- página existe (ou tem fallback declarado) em en, pt-br, es;
- `hreflang` completo incluindo `x-default` → en; URLs por prefixo de locale;
- title ≤ ~60 chars e description ≤ ~155 em **cada** locale, localizados de verdade (não string trocada);
- structured data válida (Organization/SoftwareApplication/Breadcrumb/FAQ só se visível).

## 3. Página programática — bloqueante

Aplicar o gate de qualidade de `docs/SEO.md` item a item (intenção distinta, ferramenta real, limitações verdadeiras, FAQ próprio, links internos, data de revisão). Página que não passa = `noindex` ou não publica. Nunca doorway trocando nome de plataforma.

## 4. Analytics — bloqueante

- todo evento novo existe no catálogo fechado (`docs/ANALYTICS_EVENTS.md`) e no tipo de `packages/analytics`;
- revisão linha a linha das props: zero transcript, título privado, URL completa, nome, e-mail, IP bruto, token, dado de pagamento;
- script de terceiro (se um dia existir) condicional a env + consentimento; nunca bloqueia render.

## 5. Domínio

- URL absoluta só de `APP_URL` config; nunca hardcode nem `*.vercel.app` em produção;
- `metadataBase` consistente.

## 6. Sanidade executável (se mudou robots/sitemap)

```bash
pnpm build && pnpm start &
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml
```

## Saída

```
# SEO check — <rota/mudança>
indexação:   PASS/FAIL
hreflang:    PASS/FAIL/N-A
programática:PASS/FAIL/N-A
analytics:   PASS/FAIL/N-A
domínio:     PASS/FAIL
Veredito: PRONTO / CORRIGIR ANTES
```
