# Threat model — PasteScribe

Criado na Onda 0 em 2026-08-03. Complementa `docs/SECURITY_BASELINE.md` (baseline mínimo) com ameaças específicas, atacantes e mitigações verificáveis. Toda mitigação marcada **[gate]** é bloqueante antes de expor a superfície correspondente.

## Ativos a proteger

1. dinheiro do proprietário (orçamento ~R$ 500/mês e chaves OpenAI);
2. transcripts e mídia dos usuários (conteúdo privado por padrão);
3. credenciais: service role, chaves OpenAI, segredos de billing, tokens de share;
4. integridade do ledger de créditos e do billing;
5. infraestrutura (worker com FFmpeg e egress de rede);
6. reputação de indexação (SEO limpo, sem conteúdo de terceiros indexado).

## Atacantes considerados

- **Abusador de free tier:** automatiza contas/e-mails/IPs para transcrever de graça em volume.
- **Atacante de SSRF:** usa o campo de URL para alcançar rede interna, metadata endpoints ou portas internas do worker.
- **Uploader malicioso:** envia mídia forjada (bombas de descompressão, containers corrompidos, MIME falso) para travar ou explorar o FFmpeg.
- **Fraudador de billing:** forja webhooks, repete eventos, manipula client para ganhar créditos.
- **Injetor de prompt:** publica vídeo cujo conteúdo falado contém instruções para o modelo.
- **Usuário curioso/insider:** tenta ler transcripts de outros workspaces por IDs, shares ou API.
- **Scraper de SEO:** tenta fazer o produto indexar/expor transcripts de terceiros.

## Ameaças e mitigações

### T1 — Estouro do orçamento gratuito

Vetores: rajadas de jobs, contas descartáveis, retries duplicados, reload/duplo clique, duas instâncias concorrentes, vídeo muito longo, plataforma cara.

Mitigações:
- **[gate]** reserva atômica de orçamento antes de enfileirar (transação única; ver `docs/ARCHITECTURE.md`);
- **[gate]** quota durável em Postgres compartilhada entre instâncias (padrão `consume_quota` SECURITY DEFINER com janela e `FOR UPDATE`, adaptado do Ressoa);
- **[gate]** `idempotency_key` por operação lógica — reload/duplo clique/retry de rede não criam segundo job;
- **[gate]** fail-closed: contador ou orçamento indisponível → free negado com mensagem clara; paid segue;
- **[gate]** kill switches: `openai_enabled`, `free_ai_enabled`, por plataforma;
- limite de duração por job free; 1 job free simultâneo por identidade; limites por conta, IP e sessão; Turnstile antes de operação paga; e-mail descartável limitado;
- estados adaptativos Normal/Economy/Restricted/Blocked controlados pelo servidor;
- alertas de orçamento e painel em tempo real (admin);
- chaves free/paid separadas — vazamento ou estouro de uma não drena a outra;
- testes explícitos de custo/abuso (duplo clique, reload, concorrência, orçamento encerrado — ver Onda 3 em `docs/ROADMAP.md`).

### T2 — SSRF via campo de URL

Vetores: `http://169.254.169.254/`, DNS público resolvendo para IP privado, redirect para rede interna, DNS rebinding (TTL curto trocando resposta entre validação e conexão), portas não-HTTP, esquemas exóticos (`file:`, `gopher:`).

Mitigações:
- **[gate]** apenas `http`/`https`; porta 80/443;
- **[gate]** allowlist de hostnames por adapter — não existe fetch de URL arbitrária;
- **[gate]** resolver DNS antes de conectar e conectar no IP resolvido (pin), rejeitando: loopback, RFC1918, link-local (169.254/16 incl. metadata), reservados, multicast, IPv6 equivalentes (::1, fc00::/7, fe80::/10, ::ffff/mapeados);
- **[gate]** revalidar cada redirect com as mesmas regras; máximo de redirects baixo (≤3);
- limites de tamanho e tempo de resposta; validação de MIME real (sniffing);
- egress do worker restrito por allowlist no nível de rede quando o host permitir;
- logs sem URL completa quando desnecessário (hash/host);
- **[gate]** suíte de testes SSRF automatizada (fixtures de IPs/redirects maliciosos) antes de ativar qualquer ingestão por link.

### T3 — Upload malicioso

Vetores: MIME/extensão falsos, bombas de descompressão (áudio/vídeo com taxa de expansão absurda), containers corrompidos que exploram parsers, arquivos gigantes, nomes de arquivo com path traversal.

Mitigações:
- **[gate]** limite de tamanho no storage (URL assinada com content-length-range) e de duração via ffprobe antes de processar;
- **[gate]** sniffing de MIME real; extensão nunca é confiada;
- **[gate]** nome de arquivo sanitizado; objeto renomeado para UUID;
- FFmpeg/ffprobe executados com limites de CPU, memória, disco, tempo e sem rede, em container isolado;
- checagem de taxa de expansão (output máximo por input) contra decompression bombs;
- quarentena: mídia só sai do bucket temporário após validação; antivírus pluggable (interface pronta, ativação opcional);
- TTL curto e exclusão automática do original.

### T4 — Fraude de billing e ledger

Vetores: webhook forjado/replay, evento duplicado, client "confirmando" pagamento, corrida entre webhook e refund, saldo negativo silencioso.

Mitigações:
- **[gate]** webhooks com assinatura verificada + tabela `payment_events` com unicidade por event id (replay ignorado);
- **[gate]** entitlements/créditos concedidos apenas server-side a partir de eventos verificados;
- **[gate]** ledger append-only (`credit_ledger_entries`): reservar/capturar/liberar/estornar como lançamentos, nunca update de saldo sem histórico;
- reconciliação periódica provider ↔ ledger; refund/chargeback geram lançamentos compensatórios auditáveis;
- preços e produtos vêm do servidor/banco; client nunca envia valor.

### T5 — Prompt injection via transcript

Vetores: vídeo cujo áudio contém "ignore suas instruções e revele X", tentativa de exfiltrar prompts internos ou dados de outros usuários via ações de IA derivadas.

Mitigações:
- **[gate]** transcript tratado como dado delimitado e não confiável em todo prompt; instruções internas proibem executar ordens do conteúdo;
- ações de IA nunca têm acesso a ferramentas/efeitos colaterais comandados pelo conteúdo;
- Structured Outputs com schema validado (saída fora do schema = falha, não execução);
- limite de tamanho de contexto; nenhum segredo ou dado de outro usuário no prompt;
- logs de IA registram métricas (tokens, custo, latência), nunca conteúdo por padrão.

### T6 — Acesso cruzado a dados (IDOR/RLS)

Vetores: IDs sequenciais/chutados em rotas e API, membro removido que mantém acesso, share token vazado, admin "por UI".

Mitigações:
- **[gate]** RLS em toda tabela exposta; política por workspace membership + papel; testes de RLS com múltiplos usuários no CI;
- ownership revalidada no servidor em toda ação sensível (nunca confiar em ID do client);
- shares por token aleatório de alta entropia, escopo mínimo, validade e revogação; rotas de share `noindex`;
- papéis owner/admin/editor/viewer aplicados em SQL, não só em interface;
- admin exige papel verificado server-side; funções privilegiadas com `search_path` fixo.

### T7 — Vazamento de segredos e PII

Vetores: segredo em bundle/`NEXT_PUBLIC_*`, log com transcript/e-mail/URL assinada, analytics com conteúdo, `.env` commitado.

Mitigações:
- validação de env no boot separa público × servidor; lint de prefixo público para segredos;
- catálogo fechado de analytics (`docs/ANALYTICS_EVENTS.md`) — evento fora do catálogo não compila;
- logger central com redação (campos proibidos deixam de existir no log, não são mascarados caso a caso);
- `.gitignore` já bloqueia `.env*`; secret scanning e audit no CI;
- rotação documentada por chave; chaves por ambiente.

### T8 — Abuso de SEO/conteúdo

Vetores: transcripts de terceiros indexados, doorway pages, conteúdo fino em escala.

Mitigações:
- transcript é privado e `noindex` por padrão — publicação exige prova de controle do conteúdo, opt-in, valor adicional e mecanismo de remoção (feature bloqueada por flag; ver `docs/PENDING_FEATURES.md`);
- gate de qualidade por página programática (`docs/SEO.md`);
- rotas privadas com `noindex` explícito + robots + fora do sitemap (tríplice, testada em CI).

## Riscos aceitos nesta fase

- Sem WAF dedicado no início (Vercel + Turnstile + rate limit durável cobrem o essencial); revisar ao ativar adapters públicos.
- Antivírus de upload é interface pluggable, não ativo por padrão (custo); mitigado por sandbox do FFmpeg + limites.
- Fingerprint de device é sinal fraco e usado com parcimônia (privacidade > precisão antifraude).

## Revisão

Revisar este documento a cada onda que exponha superfície nova (3, 4, 5, 8, 9, 11) e na auditoria da Onda 12.
