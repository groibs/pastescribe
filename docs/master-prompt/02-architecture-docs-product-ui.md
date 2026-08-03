# 5. STACK E ARQUITETURA RECOMENDADAS

Valide esta arquitetura na pesquisa. Só altere se houver motivo forte e documentado.

## 5.1 Monorepo

Use um monorepo com:

- `pnpm` para TypeScript;
- Turborepo ou ferramenta equivalente para tarefas do monorepo;
- `uv` para Python;
- Docker para serviços locais e worker;
- Supabase CLI para banco local e migrations.

Estrutura sugerida:

```text
pastescribe/
├── apps/
│   ├── web/                 # Next.js: site, app, dashboard, API de controle
│   └── worker/              # Python: ingestão, FFmpeg, transcrição e pós-processamento
├── packages/
│   ├── ui/                  # design system
│   ├── config/              # config tipada e feature flags
│   ├── contracts/           # schemas, eventos e tipos compartilhados
│   ├── database/            # tipos gerados e helpers de banco
│   ├── ai/                  # abstração de providers, prompts e métricas
│   ├── billing/             # planos, créditos e provider de pagamento
│   ├── analytics/           # eventos permitidos e adapters
│   ├── storage/             # local/S3/R2
│   ├── i18n/                # mensagens e helpers de locale
│   └── observability/       # logs, traces e erros
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── content/
│   ├── seo/
│   ├── blog/
│   └── help/
├── docs/
├── .claude/
│   ├── MEMORY_MAP.md
│   └── skills/
├── stitch-reference/
├── scripts/
├── docker-compose.yml
├── CLAUDE.md
├── README.md
└── pnpm-workspace.yaml
```

## 5.2 Web e control plane

Use:

- Next.js App Router;
- TypeScript estrito;
- React;
- Tailwind CSS;
- componentes acessíveis baseados em Radix UI ou solução equivalente;
- Zod para validação e contratos;
- React Hook Form quando aplicável;
- Supabase SSR para autenticação;
- server components por padrão;
- client components apenas onde há interação real;
- rotas server-side para operações sensíveis;
- nenhum segredo no navegador.

A aplicação web roda na Vercel, mas **não** deve fazer download pesado, scraping, FFmpeg ou processamento longo dentro de funções da Vercel.

## 5.3 Worker de mídia

Use um serviço separado, containerizado, preferencialmente em Python, com:

- FastAPI para healthcheck e endpoints internos mínimos;
- FFmpeg/ffprobe;
- cliente OpenAI oficial;
- Pydantic;
- `httpx` ou equivalente seguro;
- fila durável no PostgreSQL;
- processamento assíncrono;
- locks e idempotência;
- retries finitos;
- timeouts;
- cancelamento;
- telemetria;
- limpeza automática de arquivos temporários.

O worker deve poder rodar localmente em Docker e ser implantado em Railway, Render, Fly.io, VPS ou outro container host. Não amarre o código a um único provedor.

## 5.4 Banco, autenticação e storage

Use Supabase para:

- PostgreSQL;
- Auth;
- RLS;
- migrations;
- funções SQL atômicas;
- realtime apenas onde trouxer valor real;
- storage de pequenos arquivos quando adequado.

Para mídia temporária, implemente uma abstração S3-compatible:

- backend local em desenvolvimento;
- Cloudflare R2 ou S3-compatible em produção;
- URLs assinadas;
- TTL;
- exclusão automática.

Não use Supabase Storage de forma ingênua para guardar permanentemente vídeos e áudios grandes.

## 5.5 Fila sem custo desnecessário

Comece com fila durável no PostgreSQL, sem Redis obrigatório.

Implemente:

- tabela de jobs;
- função SQL atômica para claim com `FOR UPDATE SKIP LOCKED` ou mecanismo equivalente;
- lease/heartbeat;
- retry count;
- `next_attempt_at`;
- dead-letter state;
- prioridade;
- cancelamento;
- idempotency key;
- ownership;
- reserva de custo.

Mantenha uma interface para migrar futuramente para outro sistema de filas sem reescrever o domínio.

---

# 6. DOCUMENTAÇÃO E MEMÓRIA OPERACIONAL

Crie desde o primeiro commit uma governança semelhante à dos projetos Ressoa e Rezenhaí, adaptada ao PasteScribe.

## 6.1 Arquivos canônicos obrigatórios

Crie:

```text
CLAUDE.md
.claude/MEMORY_MAP.md
docs/HANDOFF.md
docs/PASTESCRIBE_POSITIONING.md
docs/PASTESCRIBE_BRIEFING.md
docs/PASTESCRIBE_DESIGN_SYSTEM.md
docs/PASTESCRIBE_ARCHITECTURE.md
docs/PASTESCRIBE_DATABASE.md
docs/PASTESCRIBE_MONETIZATION.md
docs/PASTESCRIBE_COPY.md
docs/AI_CALL_MATRIX.md
docs/AI_COST_MODEL.md
docs/PLATFORM_ADAPTERS.md
docs/SECURITY.md
docs/PRIVACY_DATA_RETENTION.md
docs/SEO.md
docs/ANALYTICS_EVENTS.md
docs/FEATURE_FLAGS.md
docs/OPERATIONS_RUNBOOK.md
docs/RESEARCH_REPORT.md
docs/IMPLEMENTATION_PLAN.md
docs/ROADMAP.md
docs/DECISIONS.md
docs/LESSONS_LEARNED.md
docs/PENDING_FEATURES.md
```

## 6.2 Hierarquia da verdade

Defina em `CLAUDE.md` e no mapa de memória:

1. código, migrations e configuração real;
2. documentos canônicos atuais;
3. skills procedurais;
4. relatórios e handoffs históricos.

Em caso de conflito, não invente. Marque **A confirmar** e cheque o código.

## 6.3 Handoff vivo

`docs/HANDOFF.md` deve conter:

- branch e base;
- estado atual;
- objetivo da entrega em andamento;
- o que foi concluído;
- o que falta;
- ordem obrigatória;
- bloqueios;
- riscos;
- instruções de teste;
- PRs;
- decisões pendentes;
- configuração manual faltante;
- última atualização.

Leia no início de toda sessão e atualize antes de encerrar.

## 6.4 Skills locais do PasteScribe

Crie e adapte skills em `.claude/skills/`, pelo menos:

- `pastescribe-scope-budget-delivery`
- `pastescribe-ai-usage-governance`
- `pastescribe-media-ingestion-security`
- `pastescribe-cost-governor-review`
- `pastescribe-ui-premium`
- `pastescribe-visual-polish`
- `pastescribe-delight-motion`
- `pastescribe-accessibility-review`
- `pastescribe-seo-programmatic-quality`
- `pastescribe-product-simulation`
- `pastescribe-ux-lab`
- `pastescribe-feature-backlog`
- `pastescribe-pre-merge-check`

Adapte os bons procedimentos dos outros repositórios, mas remova linguagem e regras específicas daqueles produtos.

---

# 7. DEFINIÇÃO DO PRODUTO

## 7.1 Públicos principais

- criadores de conteúdo;
- social media;
- jornalistas;
- pesquisadores;
- estudantes;
- professores;
- podcasters;
- agências;
- equipes de marketing;
- desenvolvedores via API.

## 7.2 Proposta de valor

O PasteScribe deve competir por:

- velocidade até o primeiro resultado;
- clareza de preço;
- múltiplas fontes;
- transcrição e transformação no mesmo fluxo;
- bom editor;
- exportação útil;
- facilidade de uso sem cadastro inicial;
- API bem documentada;
- internacionalização real;
- segurança e privacidade;
- transparência sobre minutos e custos.

## 7.3 O que não deve ser prometido

- suporte irrestrito a “qualquer site da internet”;
- acesso a conteúdo privado;
- contorno de DRM;
- contorno de autenticação;
- contorno de bloqueios de plataforma;
- precisão perfeita;
- transcrição humana quando não houver revisão humana;
- uso ilimitado sem política justa e proteções;
- armazenamento permanente de mídia por padrão.

Use linguagem como:

> “Vídeos públicos de fontes compatíveis ou arquivos enviados por você.”

---

# 8. FLUXOS E TELAS OBRIGATÓRIOS

Reconstrua e complete as telas do Stitch. Todas precisam de desktop, tablet e mobile quando aplicável.

## 8.1 Site público

### Homepage

- header;
- seletor de idioma;
- login;
- CTA;
- hero com campo universal de URL;
- upload;
- plataformas suportadas;
- demonstração real do editor;
- como funciona;
- mais que transcrição;
- casos de uso;
- confiança e privacidade;
- pricing resumido;
- FAQ;
- CTA final;
- footer completo.

### Features

Demonstrações reais de:

- transcrição por link;
- upload;
- timestamps;
- speakers;
- editor;
- busca;
- capítulos;
- resumo;
- tradução;
- exportação;
- conteúdos derivados;
- lote;
- API.

### Pricing

- Free;
- pagamento para concluir um vídeo;
- pacotes de créditos;
- Creator;
- Pro;
- Teams/Agency;
- mensal/anual;
- comparação;
- FAQ;
- custo por minuto claro;
- nenhuma assinatura obrigatória.

Valores devem vir de configuração e banco, não de números espalhados no frontend. Marque preços iniciais como `draft` até aprovação.

### API

- explicação;
- quickstart;
- exemplos;
- autenticação;
- webhooks;
- status;
- limites;
- erros;
- referência OpenAPI;
- botão para criar chave.

### Soluções

Crie templates de alta qualidade para:

- creators;
- journalists;
- researchers;
- students;
- educators;
- podcasters;
- agencies;
- marketing teams.

### Conteúdo

- blog;
- artigo;
- guias;
- comparações;
- central de ajuda;
- changelog;
- status;
- contato;
- privacidade;
- termos;
- política de remoção;
- exclusão de dados.

## 8.2 SEO por plataforma

Crie rotas e templates de conteúdo realmente únicos para:

- YouTube transcript generator;
- TikTok transcript generator;
- Instagram transcript generator;
- Facebook video to text;
- X video transcript;
- Vimeo transcript;
- Loom transcript;
- video URL to text;
- audio URL to text.

Cada página deve possuir:

- ferramenta funcional configurada para a plataforma;
- conteúdo específico;
- limitações reais;
- formatos aceitos;
- passo a passo;
- exemplos;
- casos de uso;
- FAQ específico;
- links internos;
- CTA;
- metadata e schema adequados.

Não gere doorway pages trocando apenas o nome da plataforma.

## 8.3 SEO por resultado

Crie páginas para:

- video to text;
- video summarizer;
- video to article;
- video to script;
- video to subtitles;
- video to SRT;
- video to VTT;
- video to notes;
- video translation;
- remove timestamps;
- TXT to SRT;
- SRT to VTT;
- transcript word counter;
- subtitle reading speed checker.

Ferramentas simples devem funcionar de verdade, preferencialmente no navegador quando não houver custo de backend.

## 8.4 Autenticação

- login;
- cadastro;
- magic link;
- Google;
- senha opcional;
- confirmação de e-mail;
- recuperação;
- nova senha;
- sessões e dispositivos;
- exclusão de conta.

## 8.5 Onboarding

Perguntas rápidas e opcionais:

- finalidade;
- frequência;
- plataformas;
- idioma;
- individual ou equipe.

O onboarding deve terminar diretamente em “Cole seu primeiro vídeo”.

## 8.6 Dashboard

- campo de novo link;
- upload;
- saldo/minutos;
- plano;
- jobs ativos;
- recentes;
- ações rápidas;
- templates;
- uso mensal;
- avisos claros;
- estados de conta nova, free, paga, sem saldo e falha.

## 8.7 Nova transcrição

Abas:

- Link;
- Upload;
- Importar;
- Lote.

Pré-análise:

- thumbnail;
- título;
- fonte;
- duração;
- idioma;
- legenda existente;
- necessidade de IA;
- custo estimado;
- créditos necessários;
- qualidade;
- diarização;
- glossário;
- idioma de saída;
- confirmação de direitos.

## 8.8 Processamento

Mostre progresso real por etapas:

1. validação;
2. metadados;
3. aquisição autorizada;
4. extração do áudio;
5. normalização;
6. transcrição;
7. identificação de falantes;
8. pós-processamento;
9. indexação;
10. conclusão.

Permita:

- sair da página;
- voltar depois;
- receber e-mail;
- cancelar;
- tentar novamente quando seguro;
- reportar falha.

## 8.9 Editor principal

Desktop:

- sidebar do app;
- cabeçalho da transcrição;
- player/preview;
- transcript editável;
- painel de ações de IA.

Mobile:

- player recolhível;
- transcript como foco;
- ações em abas ou bottom sheet;
- toolbar fixa sem cobrir conteúdo;
- teclado tratado corretamente.

Editor:

- timestamps clicáveis;
- segmentos;
- speakers;
- edição inline;
- busca e substituição;
- salvar automático;
- histórico de versões;
- seleção contextual;
- notas;
- desfazer/refazer;
- atalhos;
- remover timestamps;
- unir/separar parágrafos;
- correção sem destruir o original.

Player:

- play/pause;
- velocidade;
- volume;
- avançar/voltar;
- timestamp;
- sincronização com segmento;
- waveform opcional;
- atalhos de teclado;
- acessibilidade.

## 8.10 Inteligência sobre o transcript

Ações:

- resumo;
- pontos principais;
- capítulos;
- citações;
- perguntas e respostas;
- artigo;
- roteiro;
- thread;
- carrossel;
- notas de estudo;
- ata;
- tradução;
- glossário;
- títulos.

Resultados devem ser artefatos separados e versionados. Nunca sobrescrever a transcrição original.

## 8.11 Exportação

- TXT;
- Markdown;
- DOCX;
- PDF;
- SRT;
- VTT;
- JSON.

Opções:

- timestamps;
- speakers;
- título;
- resumo;
- intervalo;
- idioma;
- estilo de parágrafo;
- encoding.

## 8.12 Histórico, pastas e compartilhamento

- lista/tabela/cards;
- busca;
- filtros;
- ordenação;
- pastas;
- favoritos;
- ações em massa;
- link privado;
- convite;
- read/edit;
- validade;
- revogação;
- auditoria.

## 8.13 Conta, uso e faturamento

- perfil;
- preferências;
- idioma;
- glossário;
- uso;
- créditos;
- ledger;
- plano;
- renovação;
- compras;
- faturas;
- método de pagamento;
- segurança;
- integrações;
- chaves de API.

## 8.14 Equipes

- workspaces;
- membros;
- convites;
- owner/admin/editor/viewer;
- consumo por membro;
- pastas compartilhadas;
- billing;
- auditoria;
- transferência de propriedade.

## 8.15 Admin interno

Crie `/admin` protegido por papel e validação server-side.

Telas:

- visão geral;
- usuários;
- workspaces;
- planos;
- assinaturas;
- pagamentos;
- créditos;
- ledger;
- jobs;
- falhas;
- plataformas;
- adapters;
- filas;
- custos;
- OpenAI;
- storage;
- abuso;
- bloqueios;
- cupons;
- suporte;
- SEO/content;
- idiomas;
- feature flags;
- auditoria;
- configurações globais.

---
