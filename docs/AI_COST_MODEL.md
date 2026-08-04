# Modelo de custo de IA — PasteScribe

Criado na Onda 0 em 2026-08-03. Tarifas devem ser revalidadas na fonte oficial e na conta antes de ativar chamadas reais. Preço comercial pertence a `docs/PASTESCRIBE_MONETIZATION.md`.

## 1. Escopo deste documento

Este documento cobre operações de IA, principalmente transcrição e derivados de texto.

A exportação de vídeo com legendas inseridas **não é, por si, uma operação de IA**. CPU do FFmpeg, wall time, memória, disco, storage e egress pertencem ao domínio de processamento de mídia. Não lançar esses custos artificialmente na matriz de chamadas de IA.

A política inicial de mídia está em `docs/CAPTIONED_VIDEO_EXPORT.md`. Um documento canônico específico de custo de mídia/renderização só será criado depois que a Onda 4.2c produzir medições reais; criar números antes disso seria precisão falsa.

## 2. Unidade de cálculo da IA

A unidade interna de transcrição é o segundo de mídia processada. Todo job registra segundos, modelo, custo estimado, custo real e origem free|paid.

## 3. Tarifas de referência

| Item | Valor | Observação |
|---|---|---|
| `gpt-4o-mini-transcribe` | ≈ US$ 0,003/min | padrão econômico |
| `gpt-4o-transcribe` | ≈ US$ 0,006/min | qualidade/fallback |
| `gpt-4o-transcribe-diarize` | ≈ US$ 0,006/min | falantes |
| Texto para derivados | a fixar na Onda 7 | Responses API + Structured Outputs |
| Câmbio de planejamento | R$ 5,50/US$ | revalidar periodicamente |

Modelos ficam em configuração, nunca hardcoded.

## 4. Custo por minuto transcrito

| Modelo | US$/min | R$/min (5,50) |
|---|---:|---:|
| mini | 0,003 | ≈ 0,0165 |
| padrão | 0,006 | ≈ 0,033 |
| diarize | 0,006 | ≈ 0,033 |

Fator de segurança inicial de reserva: 1,5× o custo estimado. Reconciliação devolve excedente.

## 5. Orçamento free de IA

Teto inicial de IA gratuita: R$ 150/mês.

Com mini a R$ 0,0165/min e reserva 1,5×:

- pior caso: aproximadamente 6.060 min/mês;
- caso típico com excedente devolvido: aproximadamente 9.090 min/mês.

Degustação inicial:

| Perfil | Amostra | Custo máximo aproximado |
|---|---|---|
| Anônimo | ~45 s | ~R$ 0,012 |
| E-mail verificado | até 3 min totais | ~R$ 0,05 |
| Legenda nativa | sem IA | ~R$ 0 |

## 6. Derivados de texto

Sem tarifa fixada. Regras:

- uma ação lógica agrupa chamadas quando não degradar qualidade;
- artefato persistido não chama IA novamente na reexibição;
- derivados gratuitos ficam dentro de orçamento reservado.

## 7. Distribuição inicial do orçamento total

| Envelope | Teto/mês |
|---|---:|
| IA gratuita | R$ 150 |
| Ingestão/processamento/worker | R$ 150 |
| Infra | R$ 100 |
| Reserva | R$ 100 |

Renderização gratuita de vídeo, quando existir, compete pelo envelope de processamento/worker e pelo orçamento consolidado do gratuito, não pelo envelope de IA. Se custos reais mostrarem necessidade de envelope específico, isso exige decisão, migration/configuração e atualização documental.

## 8. Crescimento financiado pelo pago

`free_budget_next_month = base + percentual configurável da margem de contribuição anterior`

Margem de contribuição inclui todos os custos variáveis: IA, renderização, ingestão, storage, tráfego, gateway, impostos e reembolsos.

Aumentos permanentes exigem consistência, não um único mês positivo.

## 9. Telemetria obrigatória

### IA

Por job: modelo, segundos, tokens, custo estimado/real, latência, retries e origem.

### Mídia/renderização

Medida separadamente: operação, wall time, CPU aproximada quando disponível, memória máxima, disco temporário, bytes de entrada/saída, codec, frame rate, resolução, tentativas, storage e egress.

Admin consolidado pode somar os domínios para margem, mas não deve perder a categoria de custo original.

## 10. Gatilhos de revisão

- ativação real da OpenAI;
- mudança de tarifa/câmbio relevante;
- novos derivados;
- primeiro mês com conversão real;
- primeiras medições do worker 4.2c;
- implementação da Onda 6.4 ou oferta gratuita de renderização.
