---
name: pastescribe-pre-merge-check
description: Gate de qualidade antes de abrir PR ou pedir merge no PasteScribe. Use ao finalizar qualquer mudança. Verifica build, tipos, testes, custo/IA, segurança, privacidade, SEO, acessibilidade, mobile, migrations, documentação e git. Produz PASS/FAIL por seção e nunca faz merge sozinho.
---

# PasteScribe — Pre-merge check

Esta skill verifica e relata. Nunca faz merge nem altera `main`.

## 1. Repositório

- branch descritiva correta; diff só com o escopo acordado;
- sem `.env`, chaves, dumps, mídia ou arquivos gerados;
- sem TODO crítico ou placeholder enganoso na UI;
- mergeável contra a base.

## 2. Build, tipos e testes — bloqueante

Rode o que existir (marque N/A quando não existir; não invente comando):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
# worker: uv run ruff check && uv run pyright && uv run pytest
```

Erro introduzido pela mudança = FAIL.

## 3. Custo e IA — bloqueante (com `pastescribe-ai-cost-governance`)

- nenhuma chamada paga nova sem entrada em `docs/AI_CALL_MATRIX.md`;
- reload/duplo clique/retry sem custo duplicado (teste ou análise explícita);
- fail-closed preservado; kill switches funcionais; free/paid separados;
- nenhum custo em texto fixo, animação ou montagem.

## 4. Segurança e privacidade — bloqueante

- segredos só no servidor; nada em `NEXT_PUBLIC_*`/bundle;
- autenticação + ownership validados no servidor em toda ação sensível;
- mudança de schema = migration completa com RLS + índices + testes;
- superfície de URL/upload/FFmpeg passou por `pastescribe-upload-url-security`;
- logs/analytics sem transcript, e-mail, URL privada, token (catálogo fechado);
- webhooks assinados e idempotentes quando aplicável.

## 5. Produto — bloqueante

Checar contra `docs/PASTESCRIBE_BRIEFING.md`:

- promessa responsável ("vídeos públicos de fontes compatíveis ou arquivos enviados por você" — nunca "qualquer site");
- custo/consumo visível antes de processar; sem "ilimitado" sem proteção;
- copy de limites vem de configuração, não hardcoded;
- estados de conta nova/free/paga/sem saldo/falha tratados na tela tocada.

## 6. SEO e i18n — bloqueante para rota pública

- rota pública nova: metadata própria, hreflang/canonical, no sitemap, gate de qualidade de `docs/SEO.md`;
- rota privada nova: tríplice noindex (metadata + robots + fora do sitemap);
- strings novas nos 3 locales (en, pt-br, es) sem quebra de layout.

## 7. Acessibilidade e mobile — bloqueante para falha grave

- contraste AA; foco visível; teclado; labels/ARIA; touch ≥44px;
- `prefers-reduced-motion`; inputs ≥16px iOS; teclado virtual não cobre campo ativo;
- progresso de job com `aria-live`; status não só por cor.

## 8. Documentação e memória

- docs canônicos afetados atualizados no mesmo PR;
- `docs/HANDOFF.md` atualizado;
- decisão nova registrada em `docs/DECISIONS.md`.

## Saída

```
# Pre-merge — <escopo>
repo:          PASS/FAIL
build/testes:  PASS/FAIL
custo/IA:      PASS/FAIL/N-A
segurança:     PASS/FAIL
produto:       PASS/FAIL
seo/i18n:      PASS/FAIL/N-A
a11y/mobile:   PASS/FAIL/N-A
docs/handoff:  PASS/FAIL

Veredito: PRONTO PARA PR / CORRIGIR ANTES
Pendências bloqueantes: ...
```
