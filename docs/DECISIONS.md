# Decisões — PasteScribe

## Formato

Cada decisão deve registrar data, status, contexto, decisão, consequências e condição de revisão.

## Decisões ativas

### 2026-08-03 — Nome do produto

- **Status:** ativa
- **Decisão:** usar a marca **PasteScribe**.
- **Razão:** comunica diretamente a ação principal — colar um link e obter texto — sem limitar a marca a uma plataforma específica.

### 2026-08-03 — Referência visual

- **Status:** ativa
- **Decisão:** usar o Google Stitch como referência visual e de fluxo, não como código de produção.
- **Consequência:** reconstruir componentes com design system, acessibilidade, responsividade e arquitetura reais.

### 2026-08-03 — Stack-base

- **Status:** ativa, sujeita à validação da Onda 0
- **Decisão:** GitHub + Next.js/Vercel para web/control plane; Supabase para auth, Postgres, RLS e dados; Cloudflare para proteção/Turnstile e possíveis serviços; OpenAI para transcrição e inteligência; worker de mídia separado da Vercel.
- **Consequência:** scraping/download/FFmpeg não deve rodar nas Functions da Vercel.

### 2026-08-03 — Gratuito adaptativo

- **Status:** ativa
- **Decisão:** gratuito controlado por orçamento, com amostra curta e estados Normal/Economy/Restricted/Blocked.
- **Consequência:** nenhum limite público fixo deve obrigar custo ilimitado. Paid permanece disponível quando free for suspenso.

### 2026-08-03 — Orçamento inicial

- **Status:** ativa
- **Decisão:** projetar a operação inicial para aproximadamente R$ 500/mês, com tetos internos e reserva.

### 2026-08-03 — Workflow de agentes

- **Status:** ativa
- **Decisão:** GitHub é a fonte de verdade. Claude Code constrói em branches/PRs; Codex e outros agentes revisam e corrigem. Uma frente por vez. Sem merge automático em `main`.

### 2026-08-03 — Multilíngue

- **Status:** ativa
- **Decisão:** arquitetura internacional desde o início; priorizar inglês, português do Brasil e espanhol no primeiro ciclo.

### 2026-08-03 — Conteúdo e scraping

- **Status:** ativa
- **Decisão:** não implementar scraping evasivo, acesso a conteúdo privado, DRM ou contorno de proteção. Adapters precisam ser verificáveis, substituíveis e ter upload como fallback.

### 2026-08-03 — Onda 0: worker de mídia

- **Status:** ativa
- **Decisão:** worker separado em Python 3.11+ com FastAPI (health/endpoints internos), Pydantic, httpx, `uv` para dependências, FFmpeg/ffprobe, containerizado em Docker. Host de produção a definir (Railway/Render/Fly/VPS); código agnóstico de provedor.
- **Razão:** ecossistema de mídia maduro em Python; isolamento do plano web (Vercel não processa mídia).

### 2026-08-03 — Onda 0: fila inicial

- **Status:** ativa
- **Decisão:** fila durável em tabela própria no PostgreSQL (`transcription_jobs`) com claim atômico `FOR UPDATE SKIP LOCKED`, lease/heartbeat, retries finitos, dead-letter, prioridade e `idempotency_key`, atrás de interface `QueuePort`.
- **Razão:** custo zero adicional e transacionalidade com a reserva de orçamento (job + reserva na mesma transação). pgmq/Supabase Queues fica como rota de migração sem reescrever domínio.

### 2026-08-03 — Onda 0: provider de pagamento

- **Status:** ativa (parcial)
- **Decisão:** abstração `BillingPort` com provider fake local primeiro; primeira integração real em Stripe **test mode** (Onda 9). A escolha comercial final (Stripe live vs. Paddle/MoR vs. Mercado Pago) continua pendente com o dono — ver `docs/HANDOFF.md`.

### 2026-08-03 — Onda 0: storage temporário de mídia

- **Status:** ativa
- **Decisão:** abstração S3-compatible (`StoragePort`); dev/test com backend local (MinIO ou filesystem), produção alvo Cloudflare R2 (ativação com autorização de custo). URLs assinadas, TTL curto, exclusão automática. Supabase Storage só para arquivos pequenos.

### 2026-08-03 — Onda 0: modelos OpenAI de referência

- **Status:** ativa, revalidar na conta antes da Onda 5
- **Decisão:** `gpt-4o-mini-transcribe` como padrão econômico (≈US$0,003/min), `gpt-4o-transcribe` como qualidade/fallback (≈US$0,006/min), `gpt-4o-transcribe-diarize` para falantes; derivados via Responses API + Structured Outputs. Modelos configuráveis em `model_configs`/env, nunca hardcoded.
- **Fonte:** pesquisa 2026-08-03 (`docs/RESEARCH_REPORT.md` §2).

### 2026-08-03 — Onda 0: estrutura do monorepo

- **Status:** ativa
- **Decisão:** pnpm workspaces + Turborepo; `apps/web` (Next.js 16, TS estrito, Tailwind 4) e `apps/worker` (Python/uv); packages `config`, `contracts`, `ui`, `database`, `ai`, `billing`, `storage`, `analytics`, `i18n`, `observability`; `supabase/` para migrations. Layout completo em `docs/ARCHITECTURE.md`.

### 2026-08-03 — Onda 0: retenção inicial

- **Status:** ativa
- **Decisão:** mídia temporária com TTL curto e exclusão automática; transcripts persistem até exclusão pelo usuário; analytics com retenção de 90 dias; exports com TTL curto. Política completa em `docs/DATABASE.md` §Retenção. Valores exatos de TTL configuráveis em `app_settings`.

### 2026-08-03 — "Supabase local" da Onda 2 é ambiente de desenvolvimento, não a máquina do dono

- **Status:** ativa
- **Contexto:** o dono não tem como rodar Docker/Supabase CLI na própria máquina agora. `docs/ARCHITECTURE.md` já previa "ambiente local: Supabase CLI local" para desenvolvimento/teste de migrations e RLS — isso se refere ao ambiente onde o Claude Code roda (este sandbox), não ao computador do dono. Testado nesta sessão: o Docker daemon sobe no sandbox, mas o pull de imagens do Docker Hub (`production.cloudfront.docker.com`) é bloqueado pela política de rede do ambiente (403 no proxy) — logo `supabase start` (stack completo via Docker Compose) não funciona aqui. `apt-get`/`archive.ubuntu.com` funciona normalmente.
- **Decisão:** escrever e testar migrations/RLS com **PostgreSQL nativo** (via `apt`, sem Docker) neste sandbox, simulando o contexto de RLS do Supabase (papéis `anon`/`authenticated`/`service_role`, `request.jwt.claims`, `auth.uid()`) em vez de depender do stack completo (Auth/Storage/Realtime) do `supabase start`. A aplicação real do schema no projeto Supabase hospedado do dono (`yeupkcstbewufpptiypp`) acontece via `supabase db push`/SQL Editor, sempre com confirmação explícita antes de tocar no projeto real.
- **Consequência:** o dono não precisa instalar nada. Se ele tiver Docker na própria máquina no futuro, pode rodar `supabase start` normalmente para desenvolvimento local completo — não é obrigatório.

### 2026-08-03 — `packages/database`: tipos escritos à mão, não gerados via CLI

- **Status:** ativa, revisar quando Docker Hub deixar de estar bloqueado neste ambiente ou quando o dono aplicar as migrations no projeto real
- **Contexto:** `supabase gen types typescript --db-url ...` também depende de um container Docker internamente (mesmo apontando para um Postgres já acessível via TCP) — testado contra o Postgres nativo local desta sessão e bloqueado pelo mesmo motivo já registrado acima (pull de imagem do Docker Hub negado pela política de rede).
- **Decisão:** os tipos de `packages/database` são escritos à mão em `src/types.ts`, espelhando exatamente `supabase/migrations/0001_initial_schema.sql` e `0002_workspace_rls.sql` (mesmo formato que o gerador oficial produz: `Database.public.Tables.<tabela>.{Row,Insert,Update}` e `Enums`). Precisos porque as migrations foram escritas nesta mesma sessão.
- **Consequência:** toda mudança de schema precisa atualizar `packages/database/src/types.ts` manualmente no mesmo PR — sem isso, o tipo diverge do banco real silenciosamente. Quando o dono tiver acesso a Docker (local ou aplicando via CLI linkado ao projeto real), `supabase gen types` pode substituir a manutenção manual.

### 2026-08-03 — Infra inicial em free tier, sem domínio

- **Status:** ativa
- **Decisão:** começar em Vercel free (Hobby) e Supabase free; domínio ainda não comprado. Nenhum plano pago é ativado sem decisão do dono.
- **Consequências:** o site permanece `noindex` e sem DNS próprio; `APP_URL` continua vindo de config (nunca hardcode de domínio); limites do free tier (pausa de projeto Supabase por inatividade, limites de função da Vercel) são aceitos nesta fase; a compra do domínio `pastescribe.com` e o flip de indexação são gatilhos registrados em `docs/SEO.md` e no HANDOFF.
- **Revisão:** ao preparar o lançamento público (Onda 10+) ou ao esbarrar em limite real do free tier.

### 2026-08-03 — `proxy.ts` em vez de `middleware.ts` (Next.js 16)

- **Status:** ativa
- **Contexto:** o Next.js 16.2 (versão já usada em `apps/web`) marca `middleware.ts` como depreciado em favor de `proxy.ts` (mesmo runtime, exporta `proxy` em vez de `middleware`) — confirmado pelo próprio warning do `next build` local. A documentação oficial do Supabase para Next.js 16 já usa `proxy.ts` para o refresh de sessão (`supabase.auth.getUser()`), pelo mesmo motivo de sempre: Server Components não têm permissão de escrita em cookies, só o proxy/middleware tem.
- **Decisão:** `apps/web/proxy.ts` (não `middleware.ts`) faz o refresh de sessão Supabase, seguindo o padrão oficial (retorna o mesmo objeto `response` mutado dentro de `setAll`, nunca um `NextResponse.next()` novo depois).
- **Consequência:** nenhuma — é a convenção atual da versão do framework já em uso, sem mudança de comportamento.

### 2026-08-03 — Estado de auth no header lido no client, não no server

- **Status:** ativa
- **Contexto:** `/{locale}` e `/{locale}/pricing` são SSG (`generateStaticParams`). Ler a sessão no `SiteHeader` (server component) exigiria `cookies()` dentro de `getSupabaseServerClient()`, e o Next.js marca qualquer rota que alcance `cookies()` como dinâmica — perderíamos a pré-renderização estática dessas duas páginas, que é um objetivo já verificado e valioso deste projeto (CDN-cacheable, rápido, sem depender de um request por página).
- **Decisão:** o estado de auth no header (`Sign In`/`Get Started Free` vs. avatar+logout) vive em `AuthHeaderStatus` (`apps/web/app/_components/AuthHeaderStatus.tsx`), um client component que chama `supabase.auth.getUser()`/`onAuthStateChange()` no browser via `getSupabaseBrowserClient()` — nunca lê cookies no server para essa decisão de UI.
- **Consequência:** existe um instante (`user === undefined`, antes do primeiro `useEffect` resolver) em que o header não mostra nem o estado logado nem o deslogado — renderiza um espaço reservado vazio do mesmo tamanho para não pular layout. Aceitável: é sub-segundo e não esconde nem finge nenhum estado. `/{locale}/app` (rota realmente autenticada) não tem esse problema — lê a sessão no server normalmente, porque já é inerentemente dinâmica (não pode ser SSG de qualquer forma).

### 2026-08-03 — Achado real de contraste corrigido nesta sessão (não introduzido por ela)

- **Status:** ativa
- **Contexto:** ao rodar axe-core ao vivo contra o header (parte desta entrega), apareceram violações reais de `color-contrast` em elementos que esta sessão não tinha tocado: os spans inertes "API"/"Resources", os links do seletor de idioma para o locale não-ativo (ambos usavam o token `text-outline`, ~4.26:1 contra `bg-surface`, abaixo do mínimo de 4.5:1 para texto normal), e a seção de demo da home (`text-outline` no timestamp + `opacity-60` nas linhas de transcrição além da primeira, que reduz o contraste de qualquer cor por baixo do fundo).
- **Decisão:** trocar `text-outline` por `text-on-surface-variant` (já comprovadamente compatível, usado em outros lugares do mesmo header) nesses pontos, e remover o `opacity-60` das linhas de transcrição do demo em vez de tentar calibrar uma opacidade "seguramente" acima do limiar.
- **Consequência:** `text-outline` continua existindo como token (bom para ícones decorativos `aria-hidden` e estados `disabled` — isentos da regra de contraste do WCAG), mas não deve ser usado como cor de texto legível não-decorativo daqui pra frente. Verificado ao vivo: 0 violações em 8 combinações de página/locale após a correção.

### 2026-08-03 — Merge automático de PRs autorizado pelo dono a partir desta sessão

- **Status:** ativa
- **Contexto:** até aqui, cada PR desta sessão esperou um "merge e continua" explícito do dono a cada vez (PRs #2–#7). O dono pediu diretamente no chat: "quando enviar o PR, daqui pra frente, pode ir criando o PR e automaticamente, dando merge e já começa o próximo."
- **Decisão:** a partir desta sessão, PRs abertas pelo Claude Code neste repositório são mergeadas automaticamente assim que os checks de CI (`checks`, `db-migrations-rls`, deploy da Vercel) estiverem verdes, sem esperar uma nova confirmação a cada PR. Continua exigindo pausa e pergunta explícita ao dono: qualquer coisa que toque o projeto Supabase real (aplicar migrations, mudar config de produção), CI vermelho, ou mudança arquiteturalmente significativa/ambígua.
- **Consequência:** o dono revisa o histórico de PRs/commits depois do fato, em vez de aprovar cada um antes do merge. Reversível a qualquer momento — basta o dono pedir para voltar ao fluxo anterior.

### 2026-08-03 — Onda 3 fatia 3.1: escopo e desenho do schema de billing/ledger/orçamento/quota

- **Status:** ativa
- **Contexto:** `docs/ROADMAP.md` divide a Onda 3 em 4 fatias; `docs/DATABASE.md` já trazia o desenho de alto nível desde a Onda 0. Esta fatia entrega só o que 3.1 pede: `plans`/`prices`, `credit_accounts`+ledger, `usage_ledger_entries`, `budget_periods`/`budget_reservations`, `free_tier_configs`, `quota_counters`, e as funções atômicas.
- **Decisões de desenho:**
  - `reserve_free_budget_and_enqueue(...)` (nome exato do `docs/DATABASE.md`) **não foi construída** — depende de `transcription_jobs`, que só existe na Onda 4. Em vez disso, esta fatia entrega `reserve_free_budget(...)` (só orçamento+quota, sem job) mais `capture_budget_reservation`/`release_budget_reservation` (reconciliação/refund) — funções completas e testadas hoje. A Onda 4 monta `reserve_free_budget_and_enqueue` chamando `reserve_free_budget` dentro da mesma transação da criação do job, e `complete_job`/`fail_job` chamam `capture_budget_reservation`/`release_budget_reservation` em vez de duplicar a lógica.
  - `budget_periods`/`budget_reservations` contabilizam em **centavos de BRL** (é como o negócio decide o teto — R$150/mês, `docs/AI_COST_MODEL.md`); `usage_ledger_entries` grava o custo real também em **micros de USD** (fiel à fatura real da OpenAI, sem depender de um câmbio congelado no passado). A conversão acontece na camada que chama `reserve_free_budget`/`capture_budget_reservation`, nunca dentro do banco.
  - `free_tier_configs` ficou só com `max_seconds_total` (segundos) — o "custo free máximo" do `docs/AI_COST_MODEL.md` §4 é ilustrativo (R$0,012/R$0,05), pequeno demais pra caber em `integer` de centavos sem perder precisão relevante; o cap de verdade por identidade é em segundos, e o cap de dinheiro fica inteiramente em `budget_periods` (que já é grande o bastante pra centavos inteiros fazerem sentido).
  - `abuse_signals`/`abuse_events` e `billing_customers`/`subscriptions`/`payment_events` **não entraram** — os primeiros não têm lógica de detecção real pra escrever ainda; os segundos são fatia 3.3, junto com o provider de billing fake.
  - Todas as tabelas novas nasceram **RLS habilitada, sem nenhuma policy** — só `service_role` alcança, nem `plans`/`prices` (que um dia serão de leitura pública, tipo `feature_flags`) nem `credit_accounts` (que um dia terá leitura do próprio saldo) ganharam policy agora, porque nenhum consumidor client existe ainda. A policy certa entra na PR que ligar o primeiro consumidor real — nunca antes, sem uso real pra validar o desenho.
- **Consequência:** nenhuma chamada de IA real é possível ainda (isso é Onda 5) — esta fatia é fundação pura. Testada com pgTAP cobrindo os cenários do prompt-mestre §21.4 que fazem sentido no nível de banco (idempotência/duplo clique, "concorrência" via verificação sequencial correta sob `FOR UPDATE` — não é um teste de conexões paralelas de verdade, mas verifica exatamente o invariante que `FOR UPDATE` torna seguro sob concorrência real —, orçamento diário/mensal encerrado, reserva maior que saldo, contador indisponível, refund de job falho, free bloqueado + paid funcional). "Conta e IP repetidos" e "plataforma cara em modo restricted" ficam pra quando existir a camada de aplicação que decide bucket/identity_key (Onda 4/5) e platform_adapters (Onda 8), respectivamente — não é comportamento do banco.

### 2026-08-03 — Onda 3 fatia 3.3 (recorte): base do `/admin` sem provider de billing fake

- **Status:** ativa
- **Contexto:** `docs/ROADMAP.md` define a fatia 3.3 como "billing provider fake + webhook idempotente + admin de orçamento/kill switches" — três coisas juntas. Sem um checkout real (Onda 9) não há nenhum evento de pagamento de verdade pra gerar; construir `billing_customers`/`subscriptions`/`payment_events`/`apply_payment_event` agora seria desenhar o contrato de um webhook sem nenhum consumidor real pra validar o formato — o mesmo risco já evitado antes com `/admin` vazio (fatia 2.3) e RLS pública de `plans`/`prices` (fatia 3.1).
- **Decisão:** este recorte entrega só a parte de admin/kill-switches: `platform_admins` (allowlist global — conceito novo, distinto de `workspace_members.role`), seed de `openai_enabled`/`free_ai_enabled` em `feature_flags` (nasce desligado, fallback seguro), e a página `/{locale}/admin` (toggle real dos kill switches, criação de `budget_periods`). O provider de billing fake fica pra quando houver um fluxo de checkout de verdade que precise emitir webhooks.
- **Desenho do gate de admin:** `requirePlatformAdmin()` (`apps/web/lib/admin/guard.ts`) é chamado tanto pela página quanto por **cada** Server Action de admin — nunca confia que a página já filtrou, porque uma Server Action é um endpoint chamável direto. Usa dois clients Supabase diferentes de propósito: `getSupabaseServerClient()` (sessão do usuário, só pra descobrir quem está logado) e `getSupabaseAdminClient()` (`service_role`, novo — `apps/web/lib/supabase/admin.ts`) pra checar `platform_admins` e ler/escrever `feature_flags`/`budget_periods`, já que essas tabelas são RLS-deny-all pro usuário autenticado comum. `admin.ts` importa `"server-only"` (pacote oficial da Vercel) — o build quebra se esse módulo for puxado por código de client component, camada extra além de `SUPABASE_SERVICE_ROLE_KEY` nunca ter prefixo `NEXT_PUBLIC_`.
- **Toggle é sempre estado explícito, nunca "flip":** os botões Enable/Disable do painel enviam o valor alvo (`enabled=true`/`enabled=false`) como campo do form, não um "inverta o que a página tinha renderizado" — evita qualquer ambiguidade se a página estiver com dado desatualizado no momento do clique.
- **Sem seed de `budget_periods`:** ao contrário de `free_tier_configs`/`feature_flags` (estruturais, atemporais), um `budget_period` é amarrado a um mês de calendário específico — semear um "mês atual" na migration seria sempre errado em algum momento (rebuild de um banco de dev meses depois herdaria um período velho). Criar o período do mês é ação do admin, real, pela própria página — não da migration.
- **Consequência:** o gratuito continua com fail-closed total até o dono logar em `/admin` e criar o primeiro `budget_period` — que por sua vez exige o dono já ter se auto-inserido em `platform_admins` via SQL Editor (comando exato em `docs/HANDOFF.md`, já que nenhuma migration sabe o `auth.users.id` real dele).

### 2026-08-04 — Onda 4 fatia 4.1: `StoragePort` sobre R2 real + upload presignado + quarentena pós-upload

- **Status:** ativa
- **Contexto:** funções Vercel serverless rodam em containers efêmeros sem filesystem persistente/compartilhado entre requests (`/tmp` não sobrevive entre invocações nem escala horizontal) — um adapter de storage em disco local não persistiria de verdade em produção. Rotear os bytes do upload por dentro de uma Route Handler do Next também não é viável no plano da Vercel para mídia de tamanho realista (limite de corpo de request). Isso foi levantado ao dono antes de qualquer código (`AskUserQuestion`), que escolheu criar a conta Cloudflare R2 agora em vez de adiar ou ficar só local.
- **Decisão:** `packages/storage` define `StoragePort` (interface: `createPresignedPut`, `headObject`, `getObjectRange`, `deleteObject`) com dois adapters — `s3-adapter.ts` (AWS SDK v3 contra R2, S3-compatível, `forcePathStyle: true`, região `"auto"`) para produção, e `local-adapter.ts` (filesystem, path-traversal protegido) só para dev/test, nunca em produção real (`apps/web/lib/storage/config.ts` retorna `null` se `STORAGE_PROVIDER=local` e `process.env.VERCEL === "1"` — fail-closed, não fallback silencioso). O fluxo de upload é: `POST /api/uploads` cria a linha `media_assets` (`pending_upload`) e devolve uma URL presignada de PUT direto pro storage (bytes nunca passam pela função Next); o client sobe direto pro R2; `POST /api/uploads/[id]/complete` faz a validação real pós-upload — `headObject` pro tamanho de verdade, `getObjectRange` + `file-type` (sniffing de magic bytes) pro MIME de verdade — nunca confiando no `declaredContentType`/`declaredSizeBytes` que o client mandou no início. Qualquer falha de validação apaga o objeto (`deleteObject`) antes de marcar `rejected` — nunca fica "meio válido" (padrão "quarentena, valida, libera ou apaga" da skill `pastescribe-upload-url-security` §2).
- **Recorte aceito:** a URL presignada de PUT **não** força o tamanho exato via assinatura SigV4 (o comportamento de assinatura de headers de `Content-Length` no presigner do AWS SDK v3 contra R2 não foi validado com confiança suficiente pra depender dele como controle de segurança). Em vez disso, o tamanho é garantido pelo `headObject` pós-upload com exclusão em caso de violação — mesmo resultado de segurança (nenhum objeto fora do limite fica utilizável), por um caminho "verifica depois de escrever" em vez de "assinatura impede de escrever". `AntivirusPort` é interface pluggable com `noopAntivirusScanner` como padrão (`docs/THREAT_MODEL.md` já registrava isso como risco aceito por custo). Validação de duração via `ffprobe` e proteção contra decompression bomb durante decodificação real ficam pra Onda 4.2, junto com o worker de FFmpeg — não dá pra validar duração de mídia sem decodificar, e isso não acontece nesta fatia.
- **Consequência:** as credenciais reais do bucket R2 (`pastescribe-media`) usadas para testar o adapter ao vivo nesta sessão vivem só em `.env.local` (gitignored, confirmado via `git check-ignore -v`) — são válidas só para uso local/desta sessão. O dono ainda precisa adicionar `STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` nas variáveis de ambiente do projeto Vercel real (nenhum acesso ao dashboard da Vercel existe nesta sessão) — sem isso, `getStoragePort()` devolve `null` em produção e os dois endpoints respondem `503 storage_not_configured`, fail-closed. O ciclo completo do `s3-adapter` (presigned PUT, `fetch` PUT real, `headObject`, `getObjectRange`, `deleteObject`, reconfirmação de exclusão) foi verificado ao vivo contra o bucket real nesta sessão; o fluxo HTTP completo autenticado (sessão real → `POST /api/uploads` → PUT real → `POST .../complete` → `media_assets` validado) **não** foi exercitado ponta a ponta aqui, porque este sandbox não tem projeto Supabase real configurado — só o caminho "não configurado" (503) foi verificado ao vivo nas duas rotas, mesma limitação já registrada para `/login`, `/app` e `/admin` nesta sessão.

### 2026-08-04 — Onda 4 fatia 4.2a: fatiar a fila (DB) separada do worker e da UI

- **Status:** ativa
- **Contexto:** `docs/ROADMAP.md` agrupa a Onda 4.2 inteira num só bullet — "Fila: `transcription_jobs` + `claim/heartbeat/complete/fail` + worker Python em Docker com provider fake + FFmpeg". Isso é grande demais pra uma fatia mergeável só (CLAUDE.md exige fatias verticais pequenas), e o worker Python/Docker/FFmpeg é uma frente bem diferente da fila em si — linguagem diferente, precisa decidir host (`docs/ARCHITECTURE.md` marca isso como "a definir" explicitamente), e esbarra no mesmo bloqueio de pull do Docker Hub já documentado na decisão de "Supabase local" da Onda 2.
- **Decisão:** cortar 4.2 em sub-fatias mergeáveis: **4.2a** (esta) entrega só a camada de banco — tabela `transcription_jobs`/`job_steps` + as 6 funções atômicas (`reserve_free_budget_and_enqueue`, `claim_next_job`, `heartbeat_job`, `advance_job_step`, `complete_job`, `fail_job`), testável de ponta a ponta com pgTAP sem precisar de worker nenhum. 4.2b liga isso à web (uma rota/Server Action chama `reserve_free_budget_and_enqueue` depois que um upload é validado). 4.2c é o worker Python/FFmpeg propriamente dito — quando chegar lá, a decisão de host (Railway/Render/Fly/VPS) e a estratégia de build sem depender de pull de imagem do Docker Hub neste sandbox voltam à mesa.
- **Consequência:** depois desta fatia, um `media_asset` validado ainda não gera nenhum job de verdade (nada chama `reserve_free_budget_and_enqueue` ainda) — a fila existe e está testada, mas sem consumidor real, o mesmo padrão já usado para `platform_admins`/`budget_periods` antes de terem UI.

### 2026-08-04 — `transcription_jobs`: RLS deny-all até existir uma tela que leia isso

- **Status:** ativa
- **Contexto:** mesma regra já registrada pra `budget_periods`/`budget_reservations` na Onda 3.1: "a policy certa entra na PR que ligar o primeiro consumidor real — nunca antes, sem uso real pra validar o desenho" (`docs/DATABASE.md` §Estratégia de RLS). A Onda 4.3 ("UI de processamento") é quem primeiro precisa que um usuário logado veja o estado do próprio job.
- **Decisão:** `transcription_jobs`/`job_steps` nascem com RLS habilitada e **nenhuma policy** — só `service_role` alcança (web via admin client, worker via service_role). Nenhum client `authenticated` lê/escreve nada nessas tabelas ainda, nem membro do próprio workspace.
- **Consequência:** a fatia 4.3 precisa adicionar a policy de SELECT por workspace (`is_workspace_member(workspace_id, 'viewer')`, mesmo padrão de `media_assets`) na mesma PR que constrói a tela — não antes.

### 2026-08-04 — `source_kind` trava em `'upload'`; `media_sources`/URL ficam pra quando existir adapter

- **Status:** ativa, revisar quando a Onda 8 (adapters de plataforma) começar
- **Contexto:** `docs/DATABASE.md` já documentava `transcription_jobs.source_kind: url|upload` desde a Onda 0, mas nenhum adapter de plataforma existe (`docs/ARCHITECTURE.md`: "Nenhum adapter é ativado antes de pesquisa técnica/jurídica específica por plataforma (Onda 8)") — um job `source_kind='url'` hoje ficaria parado pra sempre em `resolving_metadata` sem nada que o resolva. Construir `media_sources` (normalização de URL, dedup por hash, SSRF) agora seria exatamente o padrão já evitado várias vezes nesta sessão: superfície sem consumidor real (mesmo raciocínio de `billing_customers`/`abuse_signals`).
- **Decisão:** `transcription_jobs.source_kind` tem `check (source_kind in ('upload'))` — só o que já é real (Onda 4.1) — e `media_asset_id` é `not null` (não `media_source_id`, que nem existe ainda). Alargar o check constraint e adicionar a coluna/FK de `media_sources` é trabalho da migration que a Onda 8 escrever, junto com o primeiro adapter de verdade.
- **Consequência:** nenhuma — o desenho documentado desde a Onda 0 continua o alvo final; esta migration só entrega a fatia que já tem uso real.

### 2026-08-04 — `claim_next_job`/`advance_job_step`: sem reap de lease expirado, sem replicar o grafo de transições em SQL

- **Status:** ativa
- **Contexto:** um worker que crasha no meio de uma etapa ativa (ex.: `extracting_audio`) sem chamar `fail_job` deixa o job preso ali — `claim_next_job` só busca jobs em `state='queued'`, não jobs com lease vencido em outro estado. Corrigir isso direito precisa de um scheduler/cron que hoje não existe no projeto (nenhuma fatia até agora criou nada parecido). Além disso, a validação completa do grafo de `JOB_TRANSITIONS` (`packages/contracts/src/job-states.ts`) não foi replicada em PL/pgSQL — o worker é Python e não pode importar o pacote TS diretamente.
- **Decisão:** aceitar os dois cortes por ora. `advance_job_step` garante só o que o banco pode garantir sem duplicar lógica de negócio: lease pertence a quem está chamando, e o job não está num estado terminal — a validação "essa transição específica é permitida a partir daqui" fica por conta do worker, que precisa portar (não reinventar) a mesma máquina de estados documentada em `packages/contracts`. Reap de lease expirado fica para quando houver infraestrutura de scheduler real.
- **Consequência:** um worker travado (não apenas crashado — travado de verdade, sem nunca chamar heartbeat/fail) deixa o job parado até intervenção manual ou uma fatia futura que adicione o sweeper. Como nenhum worker existe ainda nesta fatia, o risco é teórico até a 4.2c.

## A confirmar (não bloqueiam as Ondas 1–7)

- estratégia autorizada de obtenção de legenda/áudio **por plataforma** (pesquisa técnica/jurídica da Onda 8; até lá, upload é o caminho universal);
- provider de pagamento comercial definitivo (MoR vs. Stripe live vs. Mercado Pago);
- host definitivo do worker;
- tarifa dos derivados de texto (fixar na Onda 7 com a página oficial de pricing).
