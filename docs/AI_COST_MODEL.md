# Modelo de custo de IA — PasteScribe

Criado na Onda 0 em 2026-08-03. Tarifas verificadas em fontes públicas nesta data; **revalidar na página oficial de pricing da OpenAI e no Usage da conta antes de ativar qualquer chamada real** (Onda 5). Preço comercial é assunto de `docs/PASTESCRIBE_MONETIZATION.md`; este documento estabelece quanto custa entregar.

## 1. Unidade de cálculo

A unidade interna é o **segundo de mídia processada** (UI mostra minutos). Todo job registra: segundos, modelo, custo estimado, custo real, origem free|paid.

## 2. Tarifas de referência (verificadas 2026-08-03, confiança média — revalidar na conta)

| Item | Valor | Observação |
|---|---|---|
| `gpt-4o-mini-transcribe` | ≈ US$ 0,003/min (US$ 1,25/M tokens áudio in, US$ 5/M out) | padrão econômico |
| `gpt-4o-transcribe` | ≈ US$ 0,006/min (US$ 2,50/M in, US$ 10/M out) | qualidade/fallback |
| `gpt-4o-transcribe-diarize` | ≈ mesmo preço do `gpt-4o-transcribe` | falantes; sem taxa extra de diarização |
| Texto p/ derivados (resumo, capítulos) | a fixar na Onda 7 via `model_configs` | Responses API + Structured Outputs |
| Câmbio de planejamento | R$ 5,50/US$ | margem sobre o câmbio corrente; revalidar mensalmente |

Modelos ficam em `model_configs` (banco) e env — nunca hardcoded.

## 3. Custo por minuto transcrito (planejamento)

| Modelo | US$/min | R$/min (5,50) |
|---|---:|---:|
| mini | 0,003 | ≈ 0,0165 |
| padrão | 0,006 | ≈ 0,033 |
| diarize | 0,006 | ≈ 0,033 |

Fator de segurança de reserva: **1,5×** o custo estimado (cobre retry único, overlap de chunks e variação de tokenização). Reserva usa o teto; reconciliação devolve o excedente.

## 4. O que o orçamento free compra

Teto inicial de IA gratuita: **R$ 150/mês** (`docs/PASTESCRIBE_MONETIZATION.md`).

Com `gpt-4o-mini-transcribe` a R$ 0,0165/min e reserva 1,5×:

- pior caso (toda reserva consumida no teto): R$ 150 ÷ (0,0165 × 1,5) ≈ **6.060 min/mês** (~101 h);
- caso típico (custo real, excedente devolvido): ≈ **9.090 min/mês** (~151 h).

Degustação configurada inicialmente (via `free_tier_configs`, não hardcoded):

| Perfil | Amostra | Custo free máximo por identidade |
|---|---|---|
| Anônimo | ~45 s de prévia IA | ≈ R$ 0,012 |
| E-mail verificado | até 3 min totais (degustação única, não renovável) | ≈ R$ 0,05 |
| Legenda nativa | sem custo de IA (custo de ingestão ≈ 0 + infra) | ~R$ 0 |

Ou seja: o teto de R$ 150 comporta na ordem de **3.000 degustações verificadas completas/mês**. O limitador prático será abuso (identidades múltiplas), não o preço unitário — por isso T1 do `docs/THREAT_MODEL.md` é o gate principal, não a tarifa.

## 5. Derivados de texto (Onda 7)

Sem tarifa fixada ainda (**A confirmar** na Onda 7 com a página oficial de pricing). Regras que já valem:

- 1 ação lógica = 1 chamada estruturada (resumo+capítulos+títulos agrupáveis quando não degradar qualidade);
- derivado gerado é artefato persistido — reexibição nunca chama IA;
- derivado no free: 1 ação curta por degustação, dentro do mesmo orçamento reservado.

## 6. Distribuição do orçamento total (config inicial, ajustável no admin)

| Envelope | Teto/mês |
|---|---:|
| IA gratuita (free) | R$ 150 |
| Ingestão/processamento/worker | R$ 150 |
| Infra (banco, storage, monitoramento) | R$ 100 |
| Reserva/emergência | R$ 100 |

O worker host e o R2 devem operar dentro do envelope de R$ 150 + free tiers; nenhum serviço pago novo sem registro em `docs/DECISIONS.md`.

## 7. Crescimento financiado pelo pago

`free_budget_next_month = base(R$150) + 20% × margem_de_contribuição_mês_anterior`

- margem de contribuição = receita líquida − custo variável (IA, ingestão, taxas, impostos, reembolsos);
- aumento permanente só após 2 meses consecutivos sustentáveis;
- cálculo é recomendação exibida no admin; aplicação automática fica atrás de `auto_free_budget_growth_enabled` (default off) e auditada.

## 8. Telemetria obrigatória (a partir da Onda 5)

Por job: modelo, segundos, tokens, custo estimado, custo real, latência, retries, origem. Agregados no admin: custo/dia, custo/plataforma, custo/modelo, custo por usuário free, P50/P95, projeção de fim de mês, conversão free→pago, custo do free por pagante adquirido. Nunca conteúdo.

## 9. Gatilhos de revisão deste documento

- ativação real da OpenAI (Onda 5) — substituir estimativas por medições;
- mudança de tarifa/câmbio > 10%;
- inclusão de diarização, tradução ou derivados novos;
- primeiro mês com dados reais de conversão.
