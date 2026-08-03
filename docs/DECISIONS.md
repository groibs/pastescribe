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

## A confirmar na Onda 0

- framework e runtime exatos do worker;
- fila inicial;
- provider de pagamentos;
- estratégia autorizada por plataforma;
- política exata de retenção;
- modelos OpenAI e custos atuais;
- storage temporário;
- estrutura final do monorepo.
