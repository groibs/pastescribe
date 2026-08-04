# PasteScribe — Briefing canônico inicial

## Produto

PasteScribe é uma solução internacional para transformar vídeos e áudios em texto útil.

Entrada:

- link público compatível;
- upload de vídeo;
- upload de áudio;
- futuramente API e processamento em lote.

Saídas:

- transcrição limpa;
- timestamps;
- falantes;
- capítulos;
- resumo;
- citações;
- tradução;
- TXT, Markdown, DOCX, PDF, SRT, VTT e JSON;
- formatos derivados como artigo, roteiro, thread, carrossel e notas;
- futuramente, exportação adicional do vídeo original com as legendas inseridas diretamente na imagem.

A exportação de vídeo legendado é uma saída adicional e secundária. Não transforma o PasteScribe em editor de vídeo, ferramenta de repostagem ou plataforma de publicação.

## Proposta de valor

**Paste any video. Get useful text.**

Em português:

**Cole qualquer vídeo. Receba o texto pronto para usar.**

A transcrição é a entrada. O valor do produto está em organizar, editar, transformar, exportar e reutilizar o conteúdo com rapidez.

A formulação futura aceitável para a saída adicional é:

> Exportar o vídeo com as legendas inseridas.

Não usar “pronto para publicar”, “reposte este vídeo”, “conteúdo pronto para redes sociais” ou promessa de editor completo.

## Públicos principais

- criadores de conteúdo;
- social media e agências;
- jornalistas;
- pesquisadores;
- estudantes e professores;
- podcasters;
- equipes de marketing e conteúdo;
- desenvolvedores via API.

## Posicionamento

O produto deve parecer:

- rápido;
- claro;
- confiável;
- internacional;
- técnico sem ser hostil;
- premium sem excessos;
- simples sem parecer limitado.

Não deve parecer:

- clone genérico de transcritor;
- template de dashboard;
- ferramenta com estética clichê de IA;
- serviço que promete compatibilidade impossível com “qualquer fonte” sem ressalvas;
- plataforma baseada em scraping evasivo;
- editor de vídeo complexo ou suíte de publicação.

## Promessa operacional responsável

Comunicar compatibilidade com vídeos públicos das principais plataformas e upload de arquivos, sujeita a disponibilidade técnica, direitos e políticas da fonte.

Não prometer acesso a:

- conteúdo privado;
- paywalls;
- DRM;
- vídeos removidos;
- fontes que bloqueiem acesso legítimo;
- qualquer URL arbitrária da internet.

## Fluxo principal

1. Usuário cola link ou envia arquivo.
2. Sistema identifica fonte, duração, idioma e disponibilidade de legenda.
3. Exibe custo/consumo antes de processar.
4. Reserva quota/orçamento.
5. Cria job idempotente.
6. Processa por adapter/worker.
7. Entrega transcript editável.
8. Usuário transforma, exporta ou compartilha.
9. Pagamento aparece de forma contextual quando necessário.

Depois que a transcrição estiver disponível, uma área secundária poderá permitir preview curto de legendas sobre o vídeo e oferecer a exportação completa do vídeo legendado. A transcrição continua sendo o foco da tela e a ação principal.

## Idiomas

Arquitetura multilíngue desde o início. Lançamento inicial prioriza:

- inglês;
- português do Brasil;
- espanhol.

Expansão posterior baseada em Search Console, conversão e capacidade de suporte.

## Prioridade da exportação de vídeo legendado

- **P1 comercial:** funcionalidade completa, por potencial de compra avulsa, pacotes e planos.
- **P0 arquitetural durante a Onda 4:** apenas as primitivas do worker, storage, jobs longos, ledger de uso e telemetria que evitem incompatibilidade futura.

Planejamento detalhado: `docs/CAPTIONED_VIDEO_EXPORT.md`.
