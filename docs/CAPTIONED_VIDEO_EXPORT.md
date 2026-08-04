# Exportação de vídeo com legendas inseridas — planejamento canônico

Criado em 2026-08-04. Status: **planejado, não implementado**.

Este documento registra a funcionalidade comercial e os limites arquiteturais necessários para que o PasteScribe possa, futuramente, exportar uma nova versão do vídeo com as legendas inseridas diretamente nos frames.

## 1. Posicionamento e prioridade

A tese principal permanece:

> Paste any video. Get useful text.

A exportação de vídeo legendado é uma saída adicional, não um reposicionamento para editor de vídeo, ferramenta de repostagem ou plataforma de publicação.

Copy aceitável:

> Exportar o vídeo com as legendas inseridas.

Não usar “pronto para publicar”, “reposte este vídeo”, “conteúdo pronto para redes sociais” ou promessa de editor completo.

Prioridade:

- **P1 comercial:** recurso completo, por potencial de compra avulsa, aumento de receita por usuário, recorrência e progressão para pacotes/planos.
- **P0 arquitetural na Onda 4:** somente contratos e primitivas que evitem construir worker, jobs, storage, ledger e telemetria de forma incompatível com renderização futura.

## 2. Decisão de arquitetura de jobs

Não generalizar `transcription_jobs` e não inserir renderização dentro dela.

Decisão para o planejamento:

- `transcription_jobs` permanece específico do domínio de transcrição;
- a implementação futura cria `render_jobs` separados quando a Onda 6.4 realmente precisar de schema;
- transcrição e renderização compartilham primitivas do runtime do worker, storage temporário, ledger/uso e observabilidade;
- cada domínio mantém fila, estados, idempotência, retries, cancelamento e outputs próprios;
- uma fila física comum só pode ser considerada atrás de portas/adapters, sem fundir os modelos de domínio;
- nenhuma migration de renderização será criada nesta tarefa.

Razão: os ciclos de vida, autoridade financeira, inputs, outputs, falhas, TTL e retomada após pagamento são diferentes. Uma tabela genérica agora esconderia diferenças reais e ampliaria a Onda 4 sem consumidor.

Ponto de revisão explícita antes de schema irreversível: início da Onda 6.4.

## 3. Obrigações imediatas da Onda 4.2c

O worker ainda não existe. Ao construí-lo, deve nascer compatível com operações longas de mídia sem implementar o recurso completo:

- `FFmpegPort`/runner testável, sem comandos espalhados pelo domínio;
- `ffprobe` e execução FFmpeg com timeout;
- progresso estruturado e heartbeat;
- cancelamento cooperativo quando tecnicamente seguro;
- retries finitos e códigos de erro estáveis;
- limites de CPU, memória, disco, duração e tamanho de output;
- diretório temporário por operação e cleanup em sucesso, falha, cancelamento e timeout;
- execução sem rede para arquivos locais;
- telemetria comum de mídia: tipo de operação, duração, wall time, tentativas, bytes de entrada/saída, codec, frame rate, largura, altura e resultado;
- storage capaz de representar futuros outputs temporários e URLs assinadas, sem transformar `media_assets` em uma abstração genérica antes da necessidade;
- fixture curta de FFmpeg para inserir uma legenda simples apenas se couber na fatia 4.2c sem deslocar seu aceite principal.

Não entram na 4.2c: editor, presets reais, billing, checkout, `render_jobs`, exportação MP4 para usuário ou benefício gratuito.

## 4. Jornada de produto

A transcrição continua sendo a ação principal.

Depois que o transcript estiver disponível:

1. usuário vê e edita a transcrição;
2. abaixo dela, em área secundária: “Veja como as legendas ficam no vídeo”;
3. escolhe preset e fonte;
4. visualiza aproximadamente 15 segundos;
5. vê uma oferta discreta: “Baixar vídeo completo com legendas”;
6. recebe preço avulso calculado para aquele vídeo;
7. pode comprar aquela exportação, usar pacote ou franquia de plano.

A prévia não substitui o editor de transcrição, não vira CTA principal e não cria uma timeline de edição.

## 5. Prévia de até 15 segundos

Solução preferencial:

- player normal com legendas sobrepostas no navegador para troca instantânea de controles;
- timestamps reais do transcript;
- renderização curta real apenas quando necessária para demonstrar limitações do arquivo final;
- sem renderização a cada mount, reload, troca de fonte, cor ou preset;
- qualquer processamento servidor deve ser idempotente e cacheável por versão do transcript, preset versionado, settings validados e janela temporal.

A prévia deve funcionar em mobile, respeitar `prefers-reduced-motion`, contraste, safe areas, teclado e leitores de tela. Controles precisam de labels e o resultado não pode depender somente de cor.

## 6. Editor ultrassimples e presets

Primeira versão:

- fonte em lista pequena e licenciada;
- tamanho;
- cor principal;
- cor de destaque;
- posição inferior, central ou superior;
- contorno, sombra ou caixa de fundo;
- máximo aproximado de palavras por bloco;
- preview;
- reset para o preset original.

Não criar timeline, keyframes, cortes, múltiplas camadas, reposicionamento livre ou editor equivalente a CapCut.

Presets iniciais candidatos:

- Clássica;
- Social Bold;
- Palavra em destaque;
- Karaokê;
- Caixa;
- Minimalista;
- Podcast/Falante.

Nomes finais pertencem ao design system. Presets não copiam nomes, assets, identidade ou aparência exata de TikTok, Instagram, CapCut ou outra marca.

No MVP, preservar a proporção original. Reframing, 9:16, 4:5, 1:1, remoção de silêncios e cortes automáticos são features separadas.

## 7. Contratos conceituais

Os contratos devem viver em schemas versionados quando implementados. Não guardar settings arbitrários sem validação.

### Render preset

- `preset_id` estável;
- `preset_version` imutável;
- nome localizado;
- capabilities permitidas;
- defaults;
- licença das fontes/assets;
- hash/versionamento para reprodução e auditoria.

### Render settings

- `schema_version`;
- `preset_id` e `preset_version`;
- fonte permitida;
- tamanho dentro de faixa;
- cores validadas;
- posição enumerada;
- tratamento de fundo enumerado;
- palavras máximas por bloco dentro de faixa;
- resolução e política de scaling autorizadas pelo servidor.

### Render quote

- identificador opaco;
- workspace/usuário elegível;
- transcript e mídia de origem;
- duração, resolução, codec, frame rate e complexidade considerados;
- custo protegido;
- preço, moeda, impostos/taxas quando aplicáveis;
- expiração;
- versão da política de preço;
- hash dos parâmetros autorizados.

### Render job e output

- operação idempotente;
- referência ao quote/entitlement;
- mídia e transcript versionados;
- preset/settings versionados;
- estado, progresso, lease, tentativas, cancelamento e erro;
- métricas estimadas e reais;
- output MP4 temporário;
- storage key opaca, bytes, checksum, resolução, codec, duração;
- expiração e URL assinada de curta duração.

### Entitlement, uso e compra

- autoridade exclusiva do servidor;
- origem `free_once|single_purchase|pack|plan`;
- reserva, captura, liberação e estorno idempotentes;
- categoria de custo de renderização separada da transcrição;
- compra confirmada somente por evento confiável do provider.

Nenhuma dessas tabelas é criada antes da fatia que tenha consumidor real.

## 8. Renderização completa — Onda 6.4

A renderização final deve:

- usar o vídeo original disponível no pipeline;
- inserir legendas diretamente nos frames;
- gerar MP4 e preservar áudio;
- oferecer inicialmente 720p e 1080p conforme entitlement;
- usar FFmpeg no worker;
- ser idempotente;
- expor progresso;
- permitir cancelamento seguro;
- ter retry finito;
- não cobrar duas vezes;
- não reiniciar por reload;
- aplicar timeout e limites de recursos;
- armazenar resultado temporariamente;
- entregar por URL assinada;
- aplicar TTL e exclusão automática;
- registrar custo estimado e real;
- devolver reserva excedente;
- liberar/estornar crédito em falha interna.

A implementação paga só pode ser ativada depois dos gates de billing, quota, orçamento, abuso e feature flags.

## 9. Oferta gratuita

Oferta planejada:

- uma exportação completa gratuita;
- conta com e-mail verificado;
- vídeo de até 2 minutos;
- máximo 720p;
- presets gratuitos limitados;
- benefício único, não renovável automaticamente;
- sujeito a orçamento global, limite diário, limite mensal, concorrência, sinais de abuso, feature flag e kill switch.

Não usar IP como identidade única. Combinar entitlement durável, conta verificada, Turnstile, sessão/dispositivo, IP como sinal secundário, limites globais e sinais de abuso.

Normal/Economy/Restricted/Blocked também governam esta oferta. Clientes pagos não podem ser interrompidos pelo orçamento do gratuito.

## 10. Preço, custo e margem

Preço não será hardcoded agora e não será calculado apenas por megabytes.

Entradas principais:

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

Política configurável, sem CMS complexo:

- preço mínimo comercial;
- custo protegido;
- margem de contribuição desejada;
- arredondamento comercial;
- faixas por duração;
- moeda;
- impostos;
- descontos de pacote;
- experimentos de preço por configuração/flag server-side.

Definições que não podem ser confundidas:

- markup de 30%: `preço = custo × 1,30`;
- margem de contribuição de 30%: `(receita líquida - custo variável) / receita líquida = 0,30`;
- margem após gateway: receita líquida já desconta taxa fixa e percentual antes do cálculo.

Renderização não é chamada de IA. Seus custos não entram artificialmente na matriz de IA. Um documento separado de custo de mídia será criado quando a Onda 4.2c produzir medições reais de CPU, wall time, disco, bytes e egress; antes disso, este documento guarda apenas a política e as variáveis.

## 11. Modelo comercial — decisão adiada com alternativas explícitas

A interface pode usar:

1. minutos separados para transcrição e renderização;
2. créditos únicos, com débito diferente por operação;
3. combinação simples: franquias separadas em planos e créditos avulsos para excedente.

Não escolher silenciosamente. A decisão será tomada na Onda 9 com telemetria real, comparação de compreensão, margem, suporte e risco de saldo opaco.

Progressão prevista:

1. preview de 15 segundos;
2. primeira exportação gratuita elegível;
3. compra avulsa;
4. pacote de minutos de renderização;
5. plano recorrente.

## 12. Feature flags

Planejadas, seguindo convenções reais e fallback `false`:

- `captioned_video_preview_enabled`;
- `captioned_video_render_enabled`;
- `free_captioned_video_export_enabled`;
- `caption_presets_enabled`;
- `caption_render_checkout_enabled`.

A flag de preview não autoriza renderização final. A flag de render não autoriza checkout. A flag de gratuito não ignora orçamento ou abuso. Com qualquer flag ausente/indisponível, o recurso fica desligado e a transcrição permanece funcional.

## 13. Segurança e abuso

Superfícies adicionais:

- consumo excessivo de CPU/memória/disco;
- arquivos enormes ou corrompidos;
- codecs e containers maliciosos;
- decompression bombs;
- retries provocados;
- renderização duplicada;
- downloads excessivos;
- storage abandonado;
- quote adulterado;
- pagamento confirmado apenas pelo client;
- reutilização do benefício gratuito;
- múltiplas contas;
- mudança de duração, resolução ou settings após o quote.

Mitigações bloqueantes:

- sandbox e limites do FFmpeg;
- validação server-side de mídia, quote, settings, entitlement e saldo;
- idempotência em quote, reserva, compra, job e captura;
- quote expirável e vinculado a parâmetros imutáveis;
- URLs assinadas curtas e limite de downloads proporcional;
- cleanup/sweeper de outputs e temporários;
- rate limits e concorrência por conta, operação e global;
- Turnstile e sinais de abuso no benefício gratuito;
- paid separado do orçamento free;
- logs sem mídia, transcript, URL assinada ou PII.

## 14. Analytics sem PII

Eventos planejados:

- `caption_preview_opened`;
- `caption_preset_selected`;
- `caption_preview_completed`;
- `caption_render_quote_viewed`;
- `caption_render_checkout_started`;
- `caption_render_purchased`;
- `caption_render_started`;
- `caption_render_completed`;
- `caption_render_failed`;
- `free_caption_render_redeemed`;
- `render_pack_purchased`;
- `render_plan_upgrade_started`.

Props permitidas usam apenas IDs de catálogo, buckets de duração/latência/preço, resolução, origem do entitlement, resultado e códigos de erro estáveis. Nunca URL, transcript, texto da legenda, nome de arquivo, e-mail, IP bruto ou dados de pagamento.

## 15. Inserção nas ondas

### Onda 4.2c — worker e pipeline

Somente as primitivas da seção 3. O aceite principal continua upload → claim → ffprobe → reserva → provider fake → complete/fail, sem desvio para billing ou editor.

### Onda 6.1

Editor de transcrição e player sincronizado.

### Onda 6.2

TXT, Markdown, DOCX, PDF, SRT, VTT e JSON.

### Onda 6.3

Preview secundário no navegador, presets, fontes, cores, posição, aproximadamente 15 segundos, mobile, acessibilidade e analytics sem PII.

### Onda 6.4

`render_jobs`, FFmpeg, MP4, progresso, cancelamento, download assinado, TTL, idempotência, reserva de custo, entitlement/provider fake e flags. Nenhum pagamento real ativo.

### Onda 9

Quote de preço, compra avulsa, captura server-side, pacotes, planos, benefício gratuito único, webhooks idempotentes, refunds, chargebacks, reconciliação, saldo, retomada após pagamento e funil de analytics.

### Onda 10

Comunicação secundária em features, pricing, FAQ, páginas de legendas/exports e ferramentas relevantes. A homepage preserva a tese principal.

Copy aceitável:

> Exporte como texto, SRT, VTT ou vídeo com as legendas inseridas.

## 16. Gates de ativação

Não afirmar disponibilidade antes da implementação. Ativação exige:

- worker 4.2c estável e medido;
- editor/timestamps reais;
- schemas versionados;
- `render_jobs` e outputs testados;
- limites de recursos e cleanup;
- idempotência e cancelamento;
- storage com TTL e URL assinada;
- ledger/uso separado para render;
- orçamento e abuso do gratuito;
- billing fake antes do real;
- webhooks/reconciliação antes de captura real;
- flags e kill switches testados nos dois estados;
- checks de segurança, a11y, código e documentação verdes.
