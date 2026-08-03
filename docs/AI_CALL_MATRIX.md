# Matriz de chamadas de IA — PasteScribe

Criada na Onda 0 em 2026-08-03. **Estado atual: nenhuma chamada de IA existe no código.** Esta matriz é o contrato que toda implementação futura deve respeitar e manter atualizado no mesmo PR que alterar uma operação.

## Princípio

IA só é chamada quando o valor depende de transcrição, compreensão ou geração. Interface, navegação, validação, formatação, conversão de formato (SRT↔VTT, remover timestamps, contagem de palavras) e reexibição de resultado já gerado são **determinísticos e gratuitos para sempre**.

## Regras invioláveis (herdadas do prompt-mestre e validadas no padrão Ressoa)

1. Nenhuma chamada em reload, montagem de componente, animação, duplo clique ou texto fixo.
2. Uma ação lógica = no máximo uma operação cobrada (retry controlado incluído no custo da operação, nunca ilimitado).
3. Resultado persistido é reutilizado; regeneração exige mudança real de entrada ou pedido explícito.
4. Toda operação passa por: autorização → quota durável → reserva de orçamento (free) ou débito de crédito (paid) → idempotência → chamada → reconciliação.
5. `openai_enabled=false` corta tudo; `free_ai_enabled=false` corta só o free.
6. Transcript é conteúdo não confiável: nunca instrui o sistema (ver T5 no `docs/THREAT_MODEL.md`).
7. Modelos vêm de `model_configs`/env, nunca hardcoded.

## Matriz planejada

| Operação | IA? | Modelo padrão (config) | Free | Paid | Onda | Reutilização/fallback |
|---|---|---|---|---|---|---|
| Detectar plataforma e validar URL | Não | — | sem limite | sem limite | 4/8 | regra local (adapter) |
| Resolver metadados (título, duração, idioma) | Não | — | limitado por rate limit | sem limite | 8 | cache por URL normalizada |
| Extrair legenda nativa | Não (sem IA; custo ≈ 0) | — | quando permitido pela política | sim | 8 | cache por mídia |
| Transcrever áudio (upload) | **Sim** | `gpt-4o-mini-transcribe` | prévia 45 s anônimo; 3 min verificados (degustação única) | por créditos/franquia | 4 (fake) / 5 (real) | resultado persistido; provider fake local em dev/test |
| Transcrever áudio (link) | **Sim** | idem | idem | idem | 8 | idem |
| Diarização (falantes) | **Sim** | `gpt-4o-transcribe-diarize` | não | opção premium | 5+ | persistida com o transcript |
| Detecção de idioma | Não→Híbrida | metadado/ffprobe primeiro | incluída | incluída | 4 | só chama IA se metadado não resolver, dentro da mesma operação de transcrição |
| Resumo | **Sim** | Responses + Structured Outputs (a fixar) | 1 ação curta por degustação | por franquia/créditos | 7 | artefato versionado; nunca regenera em reexibição |
| Capítulos / pontos principais / citações / títulos | **Sim** | idem | dentro da mesma ação curta quando agrupável | idem | 7 | idem |
| Tradução | **Sim** | a fixar | não | por franquia/créditos | 7 | por idioma-alvo, persistida |
| Artigo/roteiro/thread/carrossel/notas/ata | **Sim** | idem | não | idem | 7 | idem |
| Glossário aplicado | Não (pós-processamento) | — | incluído | incluído | 5 | regra local sobre texto |
| Edição no editor, busca, undo, merge de parágrafos | Não | — | sem limite | sem limite | 6 | local |
| Export TXT/MD/DOCX/PDF/SRT/VTT/JSON | Não | — | sem limite | sem limite | 6 | conversão determinística |
| Ferramentas SEO client-side (TXT→SRT, SRT→VTT, contador, reading speed) | Não | — | sem limite | sem limite | 10 | 100% navegador |

## Contrato de degustação (config em `free_tier_configs`, nunca hardcoded na copy)

| Regra | Comportamento |
|---|---|
| Anônimo | metadados + legenda nativa barata quando permitida + ~45 s de prévia IA, com Turnstile antes da operação paga |
| Verificado | até 3 min totais de IA, **degustação única, sem reset diário/mensal** |
| Falha do sistema | não consome degustação nem crédito |
| Reload/duplo clique/retry de rede | não consomem (idempotency key) |
| Orçamento esgotado | estado adaptativo muda (Economy→Restricted→Blocked); paid não é afetado |
| Depois da amostra | mostrar texto real gerado + minutos restantes + ofertas contextuais (concluir vídeo, créditos, assinatura) |

## Modo local/fake

`AI_PROVIDER=fake` (default em dev/test/CI): transcrição determinística a partir de fixtures, com timestamps sintéticos; latência simulada; custo zero; identificado na UI como demonstração quando exposto. Caminho de ativação real documentado em `.env.example` e bloqueado pelos gates da Onda 3/5.

## Atualização

Toda mudança de operação de IA atualiza esta matriz e, com nova evidência de custo, o `docs/AI_COST_MODEL.md`, no mesmo PR.
