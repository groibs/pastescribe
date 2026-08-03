---
name: pastescribe-product-simulation
description: Simulação de produto e UX do PasteScribe antes de dar qualquer fluxo como pronto. Use ao concluir tela ou fluxo (colar link, upload, processamento, editor, paywall, export) para percorrer as jornadas reais como usuários reais, incluindo estados de falha, quota esgotada e mobile. Produz lista de fricções priorizadas.
---

# PasteScribe — Simulação de produto e UX

Percorrer de verdade (não imaginar) os fluxos no app rodando, como as personas fariam. Relatar fricções antes de dar pronto.

## Personas de teste

1. **Criadora apressada (mobile):** cola link do próprio vídeo no celular, quer legendas SRT; tolera ~30s de espera sem feedback antes de abandonar.
2. **Jornalista cética (desktop):** upload de entrevista longa; quer timestamps confiáveis e busca; testa editar e exportar DOCX.
3. **Estudante sem dinheiro:** espreme o free; encontra o paywall; a oferta precisa ser clara e sem pegadinha.
4. **Dev de agência:** avalia API e limites; lê pricing e docs procurando o custo real por minuto.

## Jornadas obrigatórias por fluxo tocado

- caminho feliz completo, do primeiro clique ao valor entregue;
- **estados adversos:** URL inválida, plataforma não suportada (a mensagem oferece upload?), arquivo grande demais, quota/orçamento esgotado (free em Economy/Restricted/Blocked), job falho (o usuário entende o que fazer? não foi cobrado?), sem conexão no meio;
- **reentrada:** sair durante processamento e voltar; reload em cada tela (nada duplica, nada cobra de novo);
- **mobile 375px:** o fluxo inteiro, com teclado virtual aberto onde houver input.

## O que relatar

```
# Simulação — <fluxo>
persona/jornada: ...
fricções P0 (bloqueiam valor ou geram desconfiança): ...
fricções P1 (atrito real, não bloqueante): ...
estados adversos sem tratamento: ...
promessas da UI que o backend não cumpre: ...
```

Fricção P0 sem correção = fluxo não está pronto. Placeholder enganoso (botão que finge funcionar, dado fake sem selo de demo) é sempre P0.
