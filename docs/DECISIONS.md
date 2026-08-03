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

## A confirmar (não bloqueiam as Ondas 1–7)

- estratégia autorizada de obtenção de legenda/áudio **por plataforma** (pesquisa técnica/jurídica da Onda 8; até lá, upload é o caminho universal);
- provider de pagamento comercial definitivo (MoR vs. Stripe live vs. Mercado Pago);
- host definitivo do worker;
- tarifa dos derivados de texto (fixar na Onda 7 com a página oficial de pricing).
