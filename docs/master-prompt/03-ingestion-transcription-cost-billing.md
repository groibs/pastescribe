# 9. INGESTÃO DE LINKS E ARQUIVOS

Esta é uma das áreas mais sensíveis do produto.

## 9.1 Arquitetura de adapters

Crie uma interface de adapter por plataforma com capacidades explícitas:

- `canHandle(url)`;
- `validate(url)`;
- `resolveMetadata()`;
- `getNativeCaptions()`;
- `acquireAuthorizedMedia()`;
- `supportsAudioAcquisition`;
- `supportsNativeCaptions`;
- `requiresUserAuth`;
- `riskLevel`;
- `availabilityStatus`.

As plataformas devem ser ativadas por feature flag e status operacional.

## 9.2 Restrições obrigatórias

Não implemente:

- bypass de DRM;
- acesso a vídeos privados;
- uso de cookies roubados;
- contorno de login;
- rotação de proxies para burlar bloqueios;
- evasão de anti-bot;
- quebra de paywall;
- acesso a conteúdo removido;
- download de fontes não autorizadas;
- armazenamento público de mídia de terceiros.

Prefira APIs oficiais e métodos autorizados. Quando uma fonte não puder ser suportada de forma confiável e compatível, ofereça upload manual e deixe o adapter desativado.

## 9.3 SSRF e segurança de URL

Implemente proteção completa:

- apenas `http` e `https`;
- allowlist de hostnames suportados para ingestão automática;
- rejeitar localhost;
- rejeitar IPs privados, reservados, link-local e metadata endpoints;
- resolver DNS antes da conexão;
- validar cada redirect;
- limitar redirects;
- evitar DNS rebinding;
- limitar tamanho e tempo de resposta;
- validar MIME real;
- bloquear portas não permitidas;
- egress restrito no worker;
- timeouts;
- logs sem URLs sensíveis completas quando desnecessário;
- testes automatizados de SSRF.

## 9.4 Upload

- URLs assinadas;
- limite de tamanho;
- limite de duração;
- tipos permitidos;
- sniffing de MIME;
- nome de arquivo sanitizado;
- upload resumível quando necessário;
- checksum;
- status;
- cancelamento;
- antivírus opcional/pluggable;
- quarentena;
- exclusão automática;
- nunca confiar apenas na extensão.

---

# 10. PIPELINE DE TRANSCRIÇÃO

## 10.1 Máquina de estados

Implemente estados claros:

```text
created
validating
awaiting_user_confirmation
queued
resolving_metadata
fetching_captions
acquiring_media
extracting_audio
normalizing_audio
transcribing
diarizing
postprocessing
indexing
completed
failed
cancel_requested
cancelled
expired
```

Cada transição deve ser validada no servidor e auditável.

## 10.2 Processamento

- tente legenda nativa primeiro quando disponível e permitido;
- use transcrição de áudio apenas quando necessário;
- normalize áudio para formato eficiente;
- divida arquivos quando necessário;
- preserve offsets de tempo;
- use overlap controlado entre chunks;
- reconcilie segmentos;
- impeça duplicação de texto;
- identifique idioma;
- aceite idioma informado pelo usuário;
- aplique glossário;
- persista resultado bruto e versão limpa separadamente;
- registre modelo, prompt version, custo, duração e latência.

## 10.3 OpenAI

Use a API oficial de áudio do lado do servidor/worker.

Mantenha modelos configuráveis por ambiente e banco, sem espalhar nomes pelo código.

Política inicial sugerida, sujeita a verificação na documentação oficial:

- modelo econômico de transcrição como padrão;
- modelo de maior qualidade como opção premium ou fallback;
- modelo com diarização para identificação de falantes quando solicitado;
- Responses API com Structured Outputs para resumos, capítulos e derivados estruturados.

Regras:

- chave apenas no servidor;
- projetos/chaves separados para free e paid quando configurados;
- timeout;
- retry finito;
- idempotência;
- observabilidade;
- uso/custo persistidos;
- prompts versionados;
- respostas estruturadas validadas;
- fallback seguro;
- nenhuma chamada em `useEffect` por montagem;
- reload não gera custo;
- duplo clique não gera custo;
- uma ação lógica deve gerar no máximo uma operação cobrada, salvo retry controlado;
- transcript é dado não confiável e não pode instruir o sistema a executar ferramentas.

## 10.4 Prompt injection

O conteúdo transcrito pode conter instruções maliciosas.

Toda ação de IA deve:

- tratar o transcript como conteúdo delimitado;
- ignorar instruções contidas dentro dele;
- não executar ferramentas por ordem do transcript;
- não revelar prompts internos;
- usar schemas;
- limitar tamanho;
- registrar apenas métricas seguras;
- não enviar segredos ou dados de outros usuários.

## 10.5 Qualidade e avaliação

Crie fixtures multilíngues e um pequeno conjunto de avaliação para:

- precisão básica;
- timestamps;
- chunk merge;
- speakers;
- pontuação;
- nomes próprios/glossário;
- áudio ruim;
- silêncio;
- múltiplos idiomas;
- falha parcial.

Registre métricas no admin sem guardar conteúdo sensível desnecessariamente.

---

# 11. GOVERNADOR DE CUSTOS DO GRATUITO

O proprietário possui orçamento inicial total de aproximadamente **R$ 500 por mês** para começar. O sistema jamais pode depender de “torcer para ninguém abusar”.

## 11.1 Distribuição inicial configurável

Use como configuração inicial, não como constante eterna:

- até R$ 150/mês para IA gratuita;
- até R$ 150/mês para ingestão/processamento/proxies autorizados;
- até R$ 100/mês para infraestrutura;
- R$ 100 de reserva/emergência.

Toda configuração deve poder ser alterada pelo admin.

## 11.2 Degustação inicial

Política inicial sugerida:

### Sem conta

- detectar fonte e metadata;
- entregar legenda nativa quando o custo for muito baixo e a política permitir;
- quando houver transcrição paga por IA, permitir aproximadamente 45 segundos de prévia;
- Turnstile antes da operação paga;
- limite por sessão, IP e device signals.

### E-mail verificado

- até três minutos totais de transcrição por IA como degustação única;
- uma ação curta de inteligência;
- não renovar diariamente;
- limite vitalício ou promocional por conta, sujeito à configuração.

### Depois

- mostrar texto real já gerado;
- mostrar minutos restantes;
- oferecer conclusão avulsa;
- oferecer créditos;
- oferecer assinatura.

Não hardcode promessas como “X minutos grátis para sempre”. A copy deve vir de configuração.

## 11.3 Reserva atômica antes do job

Antes de qualquer operação gratuita cobrada:

1. estime custo máximo;
2. verifique orçamento diário;
3. verifique orçamento mensal;
4. verifique quota individual;
5. verifique limite por plataforma;
6. verifique concorrência global;
7. reserve o custo em transação atômica;
8. só então enfileire o job.

Após o job:

- registre custo real;
- reconcilie a reserva;
- devolva excedente;
- registre falha e retry;
- não cobre do usuário por falha não causada por ele;
- não permita saldo negativo silencioso.

## 11.4 Estados adaptativos

Implemente estados configuráveis:

### Normal

- 45 segundos sem conta;
- até três minutos verificados.

### Economy

- prévia reduzida;
- limite verificado reduzido;
- filas mais lentas.

### Restricted

- apenas legenda nativa barata;
- upload/manual para certos casos;
- IA gratuita suspensa para plataformas caras.

### Blocked

- nenhuma nova IA gratuita;
- clientes pagos continuam funcionando;
- mensagem clara e oferta paga.

## 11.5 Limites e proteção

- chave free separada da paid;
- kill switch global;
- kill switch por plataforma;
- limite diário;
- limite mensal;
- limite por usuário;
- limite por IP;
- limite por device fingerprint com respeito à privacidade;
- e-mail descartável bloqueado ou limitado;
- uma operação gratuita simultânea por identidade;
- duração máxima;
- fila limitada;
- retries pequenos;
- budget alerts;
- fail-closed quando contador crítico falhar;
- painel em tempo real.

## 11.6 Crescimento financiado pelo pago

Implemente cálculo e recomendação administrativa:

```text
free_budget_next_month = base_free_budget + reinvestment_rate × contribution_margin_previous_month
```

Configuração inicial sugerida:

- base: R$ 150;
- reinvestimento: 20% da margem de contribuição;
- aumento permanente apenas após dois meses consecutivos sustentáveis;
- nunca usar faturamento bruto sem descontar custo variável, taxas, impostos e reembolsos.

O sistema pode recomendar o próximo orçamento, mas aumento automático deve ser feature-flagged e auditável.

## 11.7 Painel de custos

Mostrar:

- orçamento do mês;
- reservado;
- realizado;
- restante;
- custo por minuto;
- custo por plataforma;
- custo por modelo;
- custo por usuário free;
- conversão free→pago;
- CAC técnico do gratuito;
- P50/P95 de consumo;
- abuso;
- margem por plano;
- projeção de fim do mês.

---

# 12. MONETIZAÇÃO E BILLING

O sistema deve suportar desde o início quatro caminhos:

## 12.1 Free controlado

- legenda nativa barata;
- prévia curta;
- lead capture;
- uma transformação limitada;
- sem uso recorrente ilimitado.

## 12.2 Concluir este vídeo

Oferta contextual:

> “Restam 37 minutos. Conclua esta transcrição.”

O usuário pode pagar por aquela operação sem assinar.

## 12.3 Créditos

- compra avulsa;
- saldo em minutos/créditos compreensíveis;
- ledger imutável;
- validade configurável;
- não descontar por falha interna;
- estorno auditável;
- pacote e preço configuráveis.

## 12.4 Assinaturas

- Creator;
- Pro;
- Teams/Agency;
- franquia mensal;
- créditos extras;
- lote;
- diarização;
- traduções;
- IA derivada;
- API;
- prioridade;
- colaboração.

Não prometa “ilimitado” sem fair use, limites de abuso e margem comprovada.

## 12.5 Provider de pagamento

Crie uma abstração de billing.

Implemente inicialmente um provider em modo teste, preferencialmente Stripe, sem impedir futura adição de:

- Mercado Pago;
- Paddle/Merchant of Record;
- outro provider internacional.

Regras:

- checkout server-side;
- webhooks assinados;
- idempotência;
- eventos duplicados seguros;
- entitlements concedidos apenas no servidor;
- cliente nunca concede créditos;
- reconciliação;
- refund;
- chargeback;
- cancelamento;
- grace period;
- invoices;
- audit log.

Preços, moedas, impostos e planos devem ser configuráveis.

---
