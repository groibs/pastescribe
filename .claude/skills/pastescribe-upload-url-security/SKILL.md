---
name: pastescribe-upload-url-security
description: Gate de segurança obrigatório para qualquer código que aceite URL externa, faça fetch/download, processe upload de mídia, execute FFmpeg/ffprobe ou gere URL assinada no PasteScribe. Impõe proteção SSRF completa, validação real de mídia, limites de recursos e retenção curta. Bloqueante antes de expor superfície de ingestão.
---

# PasteScribe — Segurança de upload e URL

Aplicar sempre que o diff tocar: campo/parsing de URL, adapters de plataforma, cliente HTTP do worker, upload, storage, FFmpeg/ffprobe, ou limpeza de temporários. Referência completa: `docs/THREAT_MODEL.md` (T2, T3) e `docs/SECURITY_BASELINE.md`.

## 1. URL externa (SSRF) — bloqueante

- [ ] só `http`/`https`, portas 80/443; qualquer outro esquema rejeitado;
- [ ] hostname na **allowlist do adapter** — não existe fetch de URL arbitrária no produto;
- [ ] DNS resolvido antes de conectar e conexão pinada no IP resolvido;
- [ ] IP rejeitado se: loopback, RFC1918, link-local/metadata (169.254.0.0/16), reservado, multicast, ::1, fc00::/7, fe80::/10, IPv4-mapped;
- [ ] cada redirect revalidado com as mesmas regras; máximo 3;
- [ ] limites de tempo total, tamanho de resposta e content-type esperado;
- [ ] DNS rebinding coberto (resolução única pinada, não re-resolver entre check e uso);
- [ ] logs sem URL completa quando desnecessário (host/hash);
- [ ] testes automatizados com fixtures maliciosas (metadata endpoint, redirect interno, rebinding) passando.

## 2. Upload — bloqueante

- [ ] URL assinada com limite de tamanho imposto pelo storage;
- [ ] MIME real por sniffing; extensão nunca é confiada;
- [ ] nome de arquivo sanitizado; objeto salvo com UUID;
- [ ] duração validada via ffprobe antes de processar; teto por plano;
- [ ] taxa de expansão limitada (decompression bomb);
- [ ] mídia entra em bucket temporário (quarentena) e só sai validada;
- [ ] antivírus pluggable pela interface (ativação opcional, nunca removida);
- [ ] TTL e exclusão automática do original.

## 3. Processamento (FFmpeg/worker) — bloqueante

- [ ] FFmpeg/ffprobe sem acesso à rede, com limites de CPU, memória, disco e tempo;
- [ ] arquivos temporários em diretório por job, sempre limpos (inclusive em falha);
- [ ] egress do worker restrito à allowlist (plataformas, OpenAI, storage);
- [ ] endpoints internos do worker com HMAC; nada público sem autenticação forte;
- [ ] cancelamento interrompe o processamento de verdade (não só marca estado).

## 4. O que nunca implementar

Bypass de DRM/login/paywall; cookies de terceiros; rotação de proxies para burlar bloqueio; evasão de anti-bot; acesso a conteúdo privado/removido; armazenamento público de mídia de terceiros. Fonte não suportável de forma compatível → adapter desativado + upload manual como caminho.

## Saída

Relatar PASS/FAIL por seção com evidência (teste/arquivo). FAIL em item bloqueante = não abrir PR da superfície afetada.
