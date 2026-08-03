# Aprendizados — PasteScribe

Aprendizados práticos e acionáveis. Não é changelog. Formato herdado (adaptado) do Rezenhaí.

```
## AAAA-MM-DD — Título
Aprendizado:
Aplicação prática:
Onde consultar:
Status: ativo / revisar depois / desatualizado
```

---

## 2026-08-03 — Verificar integridade de binários recebidos antes de depender deles

Aprendizado: o `pastescribe-stitch-export.zip` versionado no bootstrap estava truncado (15 KB, sem end-of-central-directory). Só 2 dos 9 arquivos esperados eram recuperáveis por parsing manual dos local headers; screenshots e 3 dos 4 HTMLs foram perdidos silenciosamente — o repositório parecia completo até a extração da Onda 0.

Aplicação prática: todo artefato binário recebido (zip de design, fixture de mídia, dump) deve ser validado na chegada (`unzip -t`, checksum) antes do commit; scripts de extração devem falhar alto. O mesmo princípio vale para uploads de usuários no produto: nunca confiar que um container está íntegro/é o que diz ser — validar de verdade (já refletido em `docs/THREAT_MODEL.md` T3).

Onde consultar: `docs/RESEARCH_REPORT.md` §4, `docs/DESIGN_SYSTEM.md`.

Status: **resolvido em 2026-08-03** — o dono enviou o export original íntegro, substituído no repositório. A lição sobre validar binários na chegada continua ativa como prática permanente.

## 2026-08-03 — Governança madura já existe nos repos do dono; adaptar, não reinventar

Aprendizado: Ressoa e Rezenhaí MVP já pagaram o custo de aprendizado de quota durável (RPC `SECURITY DEFINER` + janela + `FOR UPDATE`), rate limit em Postgres, matriz de chamadas de IA como contrato vivo, flags que escondem sem apagar e gates PASS/FAIL de pre-merge/SEO. Reimplementar do zero seria regressão.

Aplicação prática: mudanças nessas áreas partem dos padrões registrados em `docs/RESEARCH_REPORT.md` §1; desvios exigem motivo registrado em `docs/DECISIONS.md`.

Onde consultar: `docs/RESEARCH_REPORT.md`, clones de pesquisa (não versionados aqui).

Status: ativo
