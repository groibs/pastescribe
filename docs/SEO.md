# SEO internacional — PasteScribe

Criado na Onda 0 em 2026-08-03. SEO é parte do produto (aquisição principal), não ajuste posterior. Implementação começa na Onda 1 (estrutura de locale) e se completa na Onda 10.

## Idiomas e URLs

- Iniciais: `en` (default), `pt-br`, `es`. Arquitetura pronta para `fr`, `de` e outros (adicionar locale = mensagens + conteúdo, sem refactor).
- URLs por prefixo de locale: `/en/...`, `/pt-br/...`, `/es/...`. Raiz `/` redireciona por `Accept-Language` com fallback `en` (redirect 302 por request, nunca por IP-geolocation persistente; usuário pode trocar e a escolha persiste em cookie).
- Toda página pública emite `hreflang` completo (incluindo `x-default` → `en`) e `canonical` self-referencing por locale.
- Slugs traduzidos apenas quando houver valor de busca claro; caso contrário slug em inglês estável.

## Implementação técnica (Onda 1+)

- Next.js App Router com `next-intl` (ou equivalente validado na implementação) e segmento `[locale]`;
- páginas públicas SSG/ISR; `generateMetadata` por página com title ≤ 60 chars, description ≤ 155, OG/social cards por locale;
- `sitemap.ts` gera sitemap index por locale e tipo (marketing, plataformas, resultados, blog/help); `robots.ts` central;
- structured data: `Organization` + `SoftwareApplication` no site; `BreadcrumbList` onde houver trilha; `FAQPage` apenas quando o FAQ está visível na página;
- Core Web Vitals como gate (Lighthouse CI na Onda 10); URLs estáveis; 404/410 corretos; redirects registrados.

## Indexação

Indexar: home, features, pricing, API pública (docs de marketing), soluções, ferramentas públicas, páginas de plataforma, páginas de resultado, blog/guias, ajuda, legal.

`noindex` (tríplice obrigatória: `robots` na metadata + prefixo no `robots.txt` + fora do sitemap, testada em CI):

- `/app/**` (dashboard, editor, histórico), `/auth/**`, `/checkout/**`, `/admin/**`, `/api/**`, shares privados (`/s/**`), páginas de erro operacionais, transcripts privados.

**Transcripts de terceiros nunca são indexáveis.** Página pública de transcript só existirá atrás de `public_transcripts_enabled` com prova de controle do conteúdo, opt-in, valor adicional e mecanismo de remoção (`docs/PENDING_FEATURES.md`).

## Páginas programáticas com qualidade

Dois eixos, ambos com ferramenta real na página:

- **Plataforma:** YouTube/TikTok/Instagram/Facebook/X/Vimeo/Loom transcript + video/audio URL to text. Conteúdo específico real: limitações verdadeiras da plataforma, formatos, passo a passo, FAQ próprio, exemplos.
- **Resultado:** video to text/summarizer/article/script/subtitles/SRT/VTT/notes/translation + utilitários client-side (remove timestamps, TXT→SRT, SRT→VTT, word counter, reading speed) que funcionam 100% no navegador, sem custo de backend.

### Gate de qualidade (bloqueante antes de publicar cada página)

1. intenção de busca distinta das demais páginas (não doorway);
2. ferramenta funcional configurada para o caso;
3. copy localizada por humano/revisada, não string trocada;
4. limitações reais declaradas (nada de prometer fonte incompatível);
5. exemplos e casos de uso próprios;
6. FAQ específico (mínimo 3 perguntas não repetidas de outra página);
7. links internos contextuais;
8. data de revisão + responsável;
9. metadata + schema corretos;
10. registro da página no inventário de SEO (Onda 10) com decisão de indexação.

Página que não passa no gate fica `noindex` ou não é publicada. A skill `pastescribe-seo-international-check` audita todo PR que toque rota pública.

## Analytics

Ver `docs/ANALYTICS_EVENTS.md` — nada de PII; conversões principais: `signup_completed`, `single_job_purchased`, `credit_pack_purchased`, `subscription_started`.

## Domínio

`pastescribe.com` (DNS/produção só com autorização do dono). Toda URL absoluta usa `APP_URL` de config; nunca hardcode, nunca `*.vercel.app` em metadata de produção.
