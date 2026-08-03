# Security baseline — PasteScribe

Requisitos mínimos antes de expor processamento real.

## Segredos

- Segredos apenas no servidor e nos gerenciadores do ambiente.
- Nunca versionar `.env`, chaves OpenAI, service role, tokens de gateway, webhooks ou cookies.
- Validar variáveis de ambiente na inicialização.
- Separar ambientes e, quando útil, projetos/chaves de free e paid.

## Autorização e banco

- RLS em toda tabela com dados de usuário/workspace.
- Toda ação sensível valida autenticação e ownership no servidor.
- Client nunca concede plano, crédito, papel ou quota.
- Mudança de schema exige migration, índices, RLS, testes e documentação.
- Service role nunca chega ao bundle.

## Jobs e custo

- Idempotency key por operação lógica.
- Quota durável compartilhada entre instâncias.
- Reserva atômica de orçamento/crédito antes do job.
- Limite global, por usuário, sessão, IP e origem.
- Concorrência e retries finitos.
- Kill switches para OpenAI, free, adapters e manutenção.
- Falhar fechado se o contador crítico estiver indisponível.

## URLs e SSRF

- Allowlist de protocolos `http`/`https`.
- Bloquear localhost, redes privadas, metadata endpoints, IPs reservados e DNS rebinding.
- Resolver e revalidar destino após redirects.
- Limitar redirects, tempo, tamanho e content type.
- Não aceitar URL autenticada, privada, DRM ou que exija contorno.
- Adapters por plataforma; nada de fetch genérico irrestrito.

## Upload

- Limite de tamanho, duração, extensão e MIME real.
- Nome de arquivo não confiável.
- Upload direto para storage com URL assinada quando aplicável.
- Processamento em ambiente isolado.
- Limites de CPU, memória, disco, tempo e expansão.
- Proteção contra arquivos corrompidos, zip/decompression bombs e mídia maliciosa.
- Exclusão automática do original conforme política de retenção.

## Privacidade

- Não registrar transcript, áudio, vídeo, e-mail, links privados ou prompts em logs.
- Analytics sem PII.
- Rotas privadas e compartilhamentos controlados devem ser `noindex`.
- Usuário deve poder excluir dados.
- Política de retenção explícita e tecnicamente aplicada.

## Billing

- Webhooks assinados e idempotentes.
- Valores e produtos vêm de configuração do servidor.
- Ledger auditável; correções por lançamentos compensatórios.
- Não confiar no estado de sucesso do client.

## Dependências e CI

- Lockfile obrigatório.
- Scans de segredo e dependência.
- Renovate/Dependabot configurável.
- Testes de RLS, quota, idempotência, SSRF e webhook antes de produção.
