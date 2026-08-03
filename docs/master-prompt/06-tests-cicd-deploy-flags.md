# 21. TESTES

## 21.1 Web

- unit tests;
- component tests;
- integration tests;
- Playwright E2E;
- visual regression das telas principais;
- axe;
- mobile viewports;
- auth;
- editor;
- billing test mode;
- admin;
- SEO metadata.

## 21.2 Worker

- pytest;
- unit de adapters;
- FFmpeg fixtures;
- chunking;
- merge;
- timeout;
- retry;
- cancellation;
- idempotency;
- provider fake;
- OpenAI integration opcional e marcada;
- SSRF;
- MIME;
- file size;
- cleanup.

## 21.3 Banco

- migrations desde zero;
- RLS;
- ownership;
- roles;
- quota atômica;
- ledger;
- concorrência;
- idempotência;
- webhook duplication;
- rollback lógico.

## 21.4 Custo e abuso

Testar explicitamente:

- duplo clique;
- reload;
- retries duplicados;
- duas instâncias concorrentes;
- conta e IP repetidos;
- orçamento diário encerrado;
- orçamento mensal encerrado;
- contador indisponível;
- free bloqueado e paid funcional;
- reserva maior que saldo;
- refund de job falho;
- plataforma cara em modo restricted.

---

# 22. CI/CD E GIT

## 22.1 Convenções

- branch em kebab-case;
- commits claros;
- uma linguagem por conjunto de commits;
- PR por fatia funcional;
- não alterar `main` diretamente;
- não fazer merge sem autorização explícita;
- não publicar produção nem alterar DNS sem autorização.

## 22.2 GitHub Actions

Crie workflows para:

- lint;
- typecheck;
- unit tests;
- build;
- Python lint/type/test;
- migrations;
- RLS/security tests;
- dependency audit;
- CodeQL;
- secret scan;
- E2E em ambiente apropriado;
- preview checks.

Evite disparar deploys desnecessários. Agrupe mudanças e respeite limites do Vercel.

## 22.3 Pre-merge gate

Crie skill/checklist que valide:

- produto;
- segurança;
- privacidade;
- custo;
- IA;
- billing;
- SEO;
- acessibilidade;
- mobile;
- testes;
- build;
- migrations;
- documentação;
- handoff;
- ausência de segredos;
- mergeabilidade.

---

# 23. DEPLOY E AMBIENTES

Ambientes:

- local;
- test;
- preview;
- staging;
- production.

Serviços:

- GitHub;
- Vercel para web/control plane;
- Supabase;
- Cloudflare DNS/Turnstile/R2 quando configurado;
- container host para worker;
- OpenAI;
- e-mail transacional;
- gateway de pagamento;
- observabilidade.

Crie:

- `.env.example` completo;
- validação tipada de env;
- setup local;
- Docker Compose;
- seed;
- conta demo;
- provider fake de OpenAI;
- provider fake de billing;
- storage local;
- scripts de setup;
- checklist de produção.

Variáveis devem ser documentadas por serviço, ambiente, sensibilidade e obrigatoriedade.

Exemplos de grupos:

```text
APP
SUPABASE
OPENAI_FREE
OPENAI_PAID
STORAGE
WORKER
TURNSTILE
BILLING
EMAIL
ANALYTICS
SENTRY
ADMIN
```

Não exponha chaves secretas com prefixos públicos.

---

# 24. FEATURE FLAGS

Centralize flags. Nunca espalhe leitura de env diretamente pelo frontend.

Flags iniciais possíveis:

- `link_ingestion_enabled`;
- `youtube_adapter_enabled`;
- `tiktok_adapter_enabled`;
- `instagram_adapter_enabled`;
- `facebook_adapter_enabled`;
- `x_adapter_enabled`;
- `vimeo_adapter_enabled`;
- `loom_adapter_enabled`;
- `free_ai_enabled`;
- `free_native_captions_enabled`;
- `diarization_enabled`;
- `batch_enabled`;
- `public_transcripts_enabled`;
- `teams_enabled`;
- `api_enabled`;
- `seo_cms_enabled`;
- `auto_free_budget_growth_enabled`;
- `maintenance_mode`;
- `openai_enabled`.

Fallback seguro obrigatório.

---
