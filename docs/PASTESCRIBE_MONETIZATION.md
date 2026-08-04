# PasteScribe — Monetização e gratuito adaptativo

Documento canônico inicial. Valores definitivos dependem de telemetria real de custos e conversão.

## Restrição financeira inicial

Orçamento operacional inicial aproximado do proprietário:

> **R$ 500 por mês**

Esse valor cobre operação, testes, infraestrutura variável e degustação. O produto deve falhar fechado antes de ultrapassar o teto interno.

## Princípio central

O gratuito serve para provar qualidade, velocidade, clareza, utilidade e confiança. Não deve substituir o pago nem criar obrigação de custo recorrente ilimitado.

## Estrutura inicial de orçamento

Configuração inicial sugerida e ajustável:

- R$ 150: transcrição gratuita por IA;
- R$ 150: obtenção/conversão/processamento, incluindo CPU e mídia;
- R$ 100: banco, filas, storage e monitoramento;
- R$ 100: reserva para falhas e picos.

São tetos internos, não promessas públicas. A exportação de vídeo legendado consome principalmente o envelope de processamento/worker, storage e tráfego; não deve ser lançada artificialmente como chamada de IA.

## Degustação inicial de transcrição

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
- **Restricted:** apenas operações gratuitas baratas/elegíveis.
- **Blocked:** gratuito variável suspenso; clientes pagos continuam funcionando.

A mudança de estado é controlada pelo servidor e pelo orçamento real. Esses estados também governam futuramente a exportação gratuita de vídeo legendado.

## Governador de custos

Antes de iniciar qualquer job gratuito variável:

1. estimar custo máximo;
2. validar usuário/sessão, IP como sinal secundário e dispositivo;
3. validar entitlement durável quando houver benefício único;
4. reservar orçamento atomicamente;
5. validar limite diário, mensal e de concorrência;
6. somente então iniciar.

Depois:

- registrar custo real;
- devolver reserva excedente;
- não cobrar por falha imputável ao sistema;
- impedir repetição indevida;
- atualizar métricas de custo e conversão.

## Crescimento financiado pelo pago

O fundo gratuito pode crescer com margem já consolidada:

> Fundo gratuito do próximo período = base protegida + percentual configurável da margem de contribuição anterior.

Referência inicial:

- base protegida: R$ 150;
- reinvestimento: até 20% da margem de contribuição;
- só ampliar benefícios após consistência, não por um único mês positivo.

## Produtos pagos

- conclusão avulsa de uma transcrição;
- pacotes de créditos sem vencimento curto;
- plano Creator;
- plano Pro;
- plano Teams/Agency;
- API separada;
- futuramente, exportação avulsa de vídeo com legendas inseridas;
- futuramente, pacotes/franquias de minutos de renderização.

## Progressão comercial do vídeo legendado

1. preview de aproximadamente 15 segundos;
2. primeira exportação gratuita, quando elegível;
3. compra avulsa;
4. pacote de minutos de renderização;
5. plano recorrente.

A oferta aparece próxima da prévia, depois que o usuário viu o próprio resultado. A transcrição permanece o foco principal.

Exemplo estrutural futuro, sem preço hardcoded:

> Baixar vídeo completo com legendas  
> 1min42s · 1080p  
> R$ X

## Oferta gratuita de vídeo legendado

Planejada, não disponível:

- uma exportação completa gratuita;
- conta com e-mail verificado;
- duração máxima de 2 minutos;
- resolução máxima de 720p;
- presets gratuitos limitados;
- benefício único e não renovável automaticamente;
- feature flag e kill switch;
- sujeito a orçamento global, limite diário/mensal, concorrência, Turnstile e sinais de abuso.

IP não é identificador único. Pessoas diferentes no mesmo IP não devem ser bloqueadas automaticamente. O benefício depende de entitlement durável da conta e pode ser reduzido ou suspenso em Economy/Restricted/Blocked sem afetar clientes pagos.

## Política de preço da renderização

Preço final não será definido antes de medição. O quote deve considerar principalmente:

- duração;
- resolução;
- codec;
- frame rate;
- complexidade do preset;
- redimensionamento;
- tempo estimado de processamento;
- storage e tráfego;
- risco médio de retry;
- taxas do gateway;
- impostos;
- reserva operacional.

Não calcular somente por megabytes.

Configuração server-side, sem CMS complexo:

- preço mínimo comercial;
- custo protegido;
- margem de contribuição desejada;
- arredondamento comercial;
- faixas por duração;
- moeda;
- impostos;
- descontos de pacote;
- experimentos de preço sem deploy.

Definições:

- markup de 30%: preço = custo × 1,30;
- margem de contribuição de 30%: (receita líquida − custo variável) / receita líquida = 0,30;
- margem após gateway: taxa fixa e percentual são descontados antes de calcular a margem.

O objetivo é preço de baixo atrito sem vender abaixo do custo protegido ou perder margem depois de taxas.

## Minutos separados, créditos únicos ou modelo combinado

Alternativas ainda não decididas:

1. minutos separados de transcrição e renderização;
2. créditos únicos com débito diferente por operação;
3. franquias separadas nos planos e créditos avulsos para excedentes.

A decisão será tomada na Onda 9 com telemetria de custo, compreensão do usuário, margem e suporte. Não escolher silenciosamente.

Internamente, transcrição e renderização sempre têm categorias de custo separadas, mesmo que a interface futura use créditos únicos.

## Regras bloqueantes

- Nenhum “ilimitado” sem proteção real.
- Usuário vê unidades compreensíveis, não tokens ou CPU-seconds.
- Quota, quote, preço, entitlement e saldo vêm do servidor.
- Webhooks de pagamento são idempotentes.
- Ledger é append-only ou equivalente auditável.
- Reembolso e falha corrigem saldo por lançamento compensatório.
- Chaves e orçamentos free/paid são separáveis.
- Compra confirmada apenas por evento confiável do provider.
- Job de render não cobra duas vezes e não reinicia por reload.

Planejamento detalhado: `docs/CAPTIONED_VIDEO_EXPORT.md`.
