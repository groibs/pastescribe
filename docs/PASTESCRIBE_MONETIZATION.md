# PasteScribe — Monetização e gratuito adaptativo

Documento canônico inicial. Valores definitivos dependem de telemetria real de custos e conversão.

## Restrição financeira inicial

Orçamento operacional inicial aproximado do proprietário:

> **R$ 500 por mês**

Esse valor cobre operação, testes, infraestrutura variável e degustação. O produto deve falhar fechado antes de ultrapassar o teto interno.

## Princípio central

O gratuito serve para provar:

- qualidade;
- velocidade;
- clareza da interface;
- utilidade das transformações;
- confiança no resultado.

Ele não deve substituir o pago nem criar obrigação de custo recorrente ilimitado.

## Estrutura inicial de orçamento

Configuração inicial sugerida e ajustável:

- R$ 150: transcrição gratuita por IA;
- R$ 150: obtenção/conversão/processamento;
- R$ 100: banco, filas, storage e monitoramento;
- R$ 100: reserva para falhas e picos.

São tetos internos, não promessas públicas.

## Degustação inicial

### Sem conta

- análise do link;
- detecção de plataforma, duração e idioma;
- extração de legenda existente quando barata e permitida;
- amostra curta de IA, inicialmente próxima de 45 segundos;
- resultado real, não demo falsa.

### E-mail verificado

- ampliar a amostra até um total configurável, inicialmente próximo de 3 minutos;
- liberar uma transformação curta;
- degustação única, com controles antifraude.

### Depois da amostra

Ofertas contextuais:

1. concluir o vídeo específico;
2. comprar pacote de créditos;
3. assinar um plano recorrente.

Assinatura não é obrigatória para uso ocasional.

## Estados adaptativos do gratuito

- **Normal:** amostra padrão.
- **Economy:** amostra reduzida.
- **Restricted:** apenas legendas existentes e upload elegível; IA gratuita limitada.
- **Blocked:** IA gratuita suspensa; clientes pagos continuam funcionando.

A mudança de estado deve ser controlada pelo servidor e pelo orçamento real.

## Governador de custos

Antes de iniciar job gratuito:

1. estimar custo máximo;
2. validar usuário/sessão, IP e dispositivo;
3. reservar orçamento atomicamente;
4. validar limite diário e mensal;
5. validar concorrência e idempotência;
6. somente então iniciar.

Depois:

- registrar custo real;
- devolver reserva excedente;
- não cobrar por falha imputável ao sistema;
- impedir repetição indevida;
- atualizar métricas por fonte, país e conversão.

## Crescimento financiado pelo pago

O fundo gratuito pode crescer com margem já consolidada:

> Fundo gratuito do próximo período = base protegida + percentual configurável da margem de contribuição anterior.

Referência inicial:

- base protegida: R$ 150;
- reinvestimento: até 20% da margem de contribuição;
- só ampliar benefícios após consistência, não por um único mês positivo.

## Produtos pagos

- conclusão avulsa de um vídeo;
- pacotes de créditos sem vencimento curto;
- plano Creator;
- plano Pro;
- plano Teams/Agency;
- API separada.

## Regras bloqueantes

- Nenhum “ilimitado” sem proteção real.
- Usuário vê minutos/créditos compreensíveis, não tokens.
- Quota e preço vêm do servidor.
- Webhooks de pagamento são idempotentes.
- Ledger é append-only ou equivalente auditável.
- Reembolso e falha corrigem saldo por lançamento compensatório.
- OpenAI gratuita e paga devem ser separáveis operacionalmente.
- O custo gratuito precisa ser medido por pagante adquirido, não apenas por usuário grátis.
