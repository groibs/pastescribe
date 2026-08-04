# Decisões — PasteScribe

Cada decisão registra status, contexto, decisão, consequência e condição de revisão. O histórico completo permanece no Git; este arquivo consolida as decisões ativas que governam o estado atual.

## Produto e operação

### 2026-08-03 — Nome e tese do produto

- **Status:** ativa.
- **Decisão:** usar PasteScribe e preservar a tese **“Paste any video. Get useful text.”**
- **Consequência:** transcrição e texto útil são o núcleo; saídas adicionais não podem reposicionar silenciosamente o produto.

### 2026-08-03 — Referência visual

- **Status:** ativa.
- **Decisão:** Google Stitch é referência de hierarquia/fluxo, não código de produção.
- **Consequência:** reconstruir com design system, responsividade e acessibilidade reais.

### 2026-08-03 — Gratuito adaptativo e orçamento inicial

- **Status:** ativa.
- **Decisão:** operar inicialmente perto de R$ 500/mês, com gratuito controlado por orçamento e estados Normal/Economy/Restricted/Blocked.
- **Consequência:** nenhum benefício gratuito cria obrigação de custo ilimitado; paid continua funcionando quando free é reduzido.

### 2026-08-03 — Multilíngue

- **Status:** ativa.
- **Decisão:** arquitetura internacional desde o início, priorizando inglês, pt-BR e espanhol.

### 2026-08-03 — Conteúdo, scraping e propriedade

- **Status:** ativa.
- **Decisão:** não implementar scraping evasivo, conteúdo privado, DRM ou contorno de proteção. Adapters exigem análise por plataforma e upload como fallback.

## Workflow e infraestrutura

### 2026-08-03 — Git/PR e merge automático

- **Status:** ativa.
- **Decisão:** nunca trabalhar diretamente em `main`; uma PR por fatia mergeável. O dono autorizou merge automático quando `checks`, `db-migrations-rls` e deploy estiverem verdes.
- **Pausa obrigatória:** projeto Supabase real, produção/DNS, CI vermelho ou decisão arquitetural significativa/ambígua.

### 2026-08-03 — Stack e separação web/worker

- **Status:** ativa.
- **Decisão:** Next.js/Vercel para web/control plane; Supabase para Auth/Postgres/RLS; worker Python 3.11+/FastAPI/uv com FFmpeg fora da Vercel; storage S3-compatible; providers atrás de portas e fakes.
- **Consequência:** Vercel não executa FFmpeg, downloads longos ou processamento pesado.

### 2026-08-03 — Worker de mídia

- **Status:** ativa.
- **Decisão:** worker containerizado, agnóstico de host; host definitivo permanece a confirmar.
- **Revisão:** início da Onda 4.2c e escolha de ambiente de produção.

### 2026-08-03 — Fila inicial

- **Status:** ativa.
- **Decisão:** fila durável em PostgreSQL, com tabelas de domínio, `FOR UPDATE SKIP LOCKED`, lease/heartbeat, retries, prioridade, dead-letter e idempotência, atrás de `QueuePort`.
- **Consequência:** sem Redis inicial; migração física futura não altera o domínio.

### 2026-08-03 — Storage temporário

- **Status:** ativa.
- **Decisão:** `StoragePort`; dev/test local, produção alvo R2; URLs assinadas, TTL e exclusão automática. Supabase Storage apenas para objetos pequenos.

### 2026-08-03 — Supabase local no sandbox

- **Status:** ativa.
- **Decisão:** testar migrations/RLS em PostgreSQL nativo quando Docker Hub estiver bloqueado. Projeto Supabase real só é alterado com autorização explícita.

### 2026-08-03 — Tipos de banco manuais

- **Status:** ativa, revisar quando geração oficial estiver disponível.
- **Decisão:** `packages/database` espelha migrations manualmente; toda migration atualiza os tipos no mesmo PR.

### 2026-08-03 — Infra free tier e domínio

- **Status:** ativa.
- **Decisão:** Vercel/Supabase free no início; site noindex até domínio e gate de lançamento. Nenhum serviço pago novo sem decisão.

### 2026-08-03 — Next.js 16 `proxy.ts`

- **Status:** ativa.
- **Decisão:** usar `proxy.ts` para refresh de sessão, seguindo a convenção da versão atual.

### 2026-08-03 — Estado de auth do header

- **Status:** ativa.
- **Decisão:** páginas públicas preservam SSG; header resolve sessão no client. Rotas autenticadas validam sessão no server.

### 2026-08-03 — Contraste e token de texto

- **Status:** ativa.
- **Decisão:** `text-outline` não é cor de texto legível normal; usar tokens com contraste AA. Opacidade não pode reduzir texto abaixo do limiar.

## IA, billing e custo

### 2026-08-03 — Provider de billing

- **Status:** parcial.
- **Decisão:** `BillingPort` com fake primeiro; integração real em test mode na Onda 9. Provider comercial final permanece a confirmar.

### 2026-08-03 — Modelos OpenAI de referência

- **Status:** ativa, revalidar antes da Onda 5.
- **Decisão:** mini como padrão econômico, modelo padrão como qualidade/fallback e diarize quando necessário. Configuração nunca hardcoded.

### 2026-08-03 — Schema de ledger/orçamento/quota

- **Status:** ativa.
- **Decisão:** ledger append-only, saldo como cache, orçamento em centavos de BRL, custo real também em micros USD, quota durável e RLS server-only.
- **Consequência:** corrections/refunds são lançamentos compensatórios; nenhum client concede saldo.

### 2026-08-03 — Admin sem billing prematuro

- **Status:** ativa.
- **Decisão:** a fatia 3.3 entregou admin/kill switches/orçamento; customer/subscription/payment events esperam o primeiro fluxo real de checkout.

## Onda 4 — upload e fila de transcrição

### 2026-08-04 — R2 real, upload direto e quarentena

- **Status:** ativa.
- **Decisão:** upload presignado direto ao storage; servidor valida tamanho real, MIME por bytes e scan pluggable; falha apaga o objeto antes de rejeitar.
- **Corte:** duração/decompression bomb real pertencem ao worker FFmpeg.

### 2026-08-04 — `transcription_jobs` e RLS

- **Status:** ativa.
- **Decisão:** fila específica de transcrição; RLS habilitada e sem policy de client até a UI 4.3 exigir leitura por workspace.
- **Consequência:** web/worker usam service role; nenhuma exposição antecipada.

### 2026-08-04 — `job_steps`, tentativas e lease expirado

- **Status:** ativa.
- **Decisão:** `job_steps` audita transições; não criar `job_attempts` sem consumidor. Reap automático de lease expirado espera scheduler real.
- **Risco aceito:** worker morto pode exigir intervenção até existir sweeper.

### 2026-08-04 — Separar enqueue da reserva de orçamento

- **Status:** ativa.
- **Decisão:** `enqueue_job` cria job sem reserva; worker descobre duração real e chama `reserve_job_budget`. Se o free não couber, vai para `awaiting_user_confirmation` sem cobrança.
- **Consequência:** client nunca declara duração autoritativa; retomada após pagamento será definida na Onda 9.

### 2026-08-04 — Enqueue automático pós-upload

- **Status:** ativa.
- **Decisão:** `POST /api/uploads/[id]/complete` valida o asset, consome quota de enqueue e chama `enqueue_job`. Falha de enqueue não desfaz a validação do asset; resposta separa `job` e `jobError`.
- **Verificação:** tipagem e pgTAP verdes; ciclo HTTP real permanece pendente até o Supabase real receber migrations/configuração.

## Exportação de vídeo com legendas inseridas

### 2026-08-04 — Prioridade e posicionamento

- **Status:** ativa como planejamento; recurso não implementado.
- **Contexto:** exportar MP4 legendado aumenta valor e receita sem precisar alterar a tese central.
- **Decisão:** classificar o recurso completo como **P1 comercial**. Durante a Onda 4, apenas incompatibilidades arquiteturais são **P0**.
- **Consequência:** a copy comunica somente “Exportar o vídeo com as legendas inseridas”; não usar “pronto para publicar”, repostagem ou editor completo.

### 2026-08-04 — `render_jobs` separado; nenhuma generalização prematura

- **Status:** ativa, revisão obrigatória antes da primeira migration de renderização.
- **Contexto:** transcrição e renderização têm estados, inputs, outputs, TTL, custo, entitlement, retomada e falhas diferentes.
- **Decisão:** manter `transcription_jobs` específico. A Onda 6.4 cria futuramente `render_jobs` separado, compartilhando apenas runtime do worker, storage, ledger de uso e observabilidade. Uma fila física comum só pode existir atrás de adapters, sem tabela de domínio genérica.
- **Consequência:** nenhuma migration, estado ou coluna de renderização agora; não forçar render em `transcription_jobs` para reaproveitar código.

### 2026-08-04 — Obrigações imediatas do worker

- **Status:** ativa para o desenho da 4.2c.
- **Decisão:** o worker nasce com runner/porta de FFmpeg testável, progresso, heartbeat, timeout, cancelamento cooperativo, limites de CPU/memória/disco/duração/bytes, cleanup e telemetria de mídia.
- **Corte:** editor, presets, MP4 para usuário, `render_jobs`, checkout e billing não entram na 4.2c.

### 2026-08-04 — Prévia e implementação por ondas

- **Status:** ativa como roadmap.
- **Decisão:** 6.1 editor/player; 6.2 exports de texto/legenda; 6.3 preview no navegador de até ~15 s; 6.4 render MP4 com provider/entitlement fake; 9.3 quote/compra avulsa; 9.4 pacotes/planos/benefício gratuito; 10 comunicação secundária.
- **Consequência:** nenhuma promessa pública antes dos gates e flags.

### 2026-08-04 — Presets e settings versionados

- **Status:** ativa para o desenho da 6.3/6.4.
- **Decisão:** presets imutáveis por versão; settings em schema estrito/versionado; fontes pequenas, licenciadas e allowlisted. Não guardar JSON arbitrário nem copiar identidade de outras marcas.

### 2026-08-04 — Gratuito de renderização

- **Status:** planejado, bloqueado.
- **Decisão:** uma exportação gratuita, conta verificada, até 2 minutos, 720p, presets limitados, entitlement durável único, Turnstile, orçamento, concorrência, sinais de abuso, flag e kill switch. IP é apenas sinal secundário.
- **Consequência:** Economy/Restricted/Blocked podem reduzir/suspender free sem afetar paid.

### 2026-08-04 — Preço e unidade comercial

- **Status:** decisão parcial; valores e unidade de UI a confirmar na Onda 9.
- **Decisão:** quote considera duração, resolução, codec, frame rate, preset, scaling, processamento, storage, egress, retries, gateway, impostos e reserva. Não calcular só por MB e não hardcode preço final.
- **Alternativas abertas:** minutos separados, créditos únicos com pesos ou combinação simples.
- **Consequência:** transcrição e renderização mantêm categorias internas de custo separadas em qualquer alternativa.

### 2026-08-04 — Custo de mídia separado de IA

- **Status:** ativa.
- **Decisão:** FFmpeg/storage/egress não entram na matriz de chamadas de IA. Documento específico de custo de mídia só será criado após a 4.2c produzir medições reais.

### 2026-08-04 — Flags, segurança e analytics

- **Status:** planejado.
- **Decisão:** flags de preview, presets, render, free e checkout nascem `false` quando houver consumidor. Threat model inclui exaustão de CPU, mídia maliciosa, render duplicado, quote adulterado, download excessivo e abuso do free. Analytics usa catálogo fechado sem conteúdo/PII.

Planejamento detalhado e critérios: `docs/CAPTIONED_VIDEO_EXPORT.md`.

## A confirmar

- host definitivo do worker;
- provider de pagamento comercial final;
- estratégia técnica/jurídica por plataforma;
- tarifas dos derivados de texto;
- unidade comercial final entre minutos separados, créditos ou combinação;
- política e valores de preço após telemetria real;
- desenho final das tabelas de renderização, sujeito a revisão explícita na 6.4.
