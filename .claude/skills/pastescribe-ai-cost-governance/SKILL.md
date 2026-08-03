---
name: pastescribe-ai-cost-governance
description: Governança obrigatória para qualquer criação, alteração ou revisão de chamada de IA, transcrição, quota, orçamento free, ledger ou provider no PasteScribe. Decide quando o comportamento deve ser determinístico, impõe reserva atômica de orçamento antes de job gratuito, separa free de paid e exige atualização da matriz de chamadas no mesmo PR.
---

# PasteScribe — Governança de IA e custo

## Regra central

O PasteScribe só usa API paga quando o valor depende de **transcrição, compreensão ou geração**. Conversão de formato, exibição, navegação, validação e reexibição de resultado persistido são determinísticos e gratuitos para sempre.

O orçamento inicial total é ~R$ 500/mês (`docs/PASTESCRIBE_MONETIZATION.md`). O sistema falha fechado antes de ultrapassá-lo.

## Quando esta skill é obrigatória

Antes de alterar: qualquer chamada a provider de IA; pipeline de transcrição; quota, orçamento, reserva, ledger ou créditos; limites free/paid; modelo, prompt ou provider; retry, fila, cache, rate limit ou kill switch; qualquer feature que possa gerar chamada sem o usuário perceber.

## 1. Classifique a operação

- **Determinística** (proibido usar IA): exports, SRT↔VTT, remover timestamps, contadores, UI, reexibição, validação de URL, metadados via API/ffprobe.
- **Híbrida**: regra local primeiro; IA só quando a regra não entrega qualidade equivalente (ex.: detecção de idioma — metadado/ffprobe antes de perguntar ao modelo).
- **IA necessária**: transcrição de áudio, diarização, resumo/capítulos/derivados, tradução.

Classificação e motivo entram em `docs/AI_CALL_MATRIX.md` **no mesmo PR**.

## 2. Sequência inviolável de uma operação free

1. autorização (sessão/identidade) → 2. Turnstile quando aplicável → 3. quota durável (`consume_quota`) → 4. **reserva atômica de orçamento** (estimativa × 1,5) → 5. criação idempotente do job → 6. execução → 7. reconciliação (custo real no usage ledger, excedente devolvido; falha do sistema não consome degustação).

Se qualquer contador/orçamento estiver indisponível: **negar o free com mensagem clara** (fail-closed). Paid segue por caminho próprio (débito de créditos via ledger, nunca o orçamento do produto).

## 3. Uma ação lógica, uma operação cobrada

- reload, remontagem, voltar de tela, duplo clique e retry de rede **não criam custo** (idempotency key);
- derivados agrupáveis (resumo+capítulos+títulos) saem numa única resposta estruturada quando não degradar qualidade;
- retry automático é finito e contabilizado no custo da operação;
- resultado persistido nunca é regenerado por reexibição.

## 4. Separação free × paid

- chaves/projetos OpenAI distintos (`OPENAI_FREE_*` / `OPENAI_PAID_*`);
- kill switches independentes (`openai_enabled` corta tudo; `free_ai_enabled` só o free);
- esgotamento do free jamais degrada cliente pago;
- estados adaptativos (Normal/Economy/Restricted/Blocked) são decisão do servidor guiada por orçamento real.

## 5. Unidades e transparência

Usuário vê **minutos** (interno: segundos) e créditos compreensíveis — nunca tokens. Copy de limites vem de `free_tier_configs`/config, nunca hardcoded ("3 minutos grátis para sempre" é proibido).

## 6. Segurança

Segredo só no servidor/worker; transcript é conteúdo não confiável (nunca instrui o sistema — T5 do threat model); Structured Outputs validados por schema; logs com métricas, nunca conteúdo; limites de tamanho de entrada; timeout; concorrência máxima.

## 7. Gate antes do PR

- [ ] operação mapeada em `docs/AI_CALL_MATRIX.md`;
- [ ] custo novo/alterado refletido em `docs/AI_COST_MODEL.md`;
- [ ] reload/duplo clique/retry testados sem custo duplicado;
- [ ] fail-closed testado (contador indisponível);
- [ ] `openai_enabled=false` corta as chamadas (teste);
- [ ] free bloqueado + paid funcional (teste);
- [ ] nenhum segredo no bundle; logs sem conteúdo;
- [ ] provider fake continua sendo o default de dev/test/CI.

## Anti-padrões proibidos

IA para texto fixo/animação; chamada em `useEffect` de montagem; regeneração por reload; "ilimitado" sem proteção; limite apenas em memória de uma instância; confiar no orçamento do painel do provider; retry infinito; registrar transcript para calcular custo; modelo hardcoded fora de `model_configs`/env.
