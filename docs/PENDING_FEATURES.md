# Funcionalidades pendentes ou condicionadas

Este arquivo evita que escopo futuro seja implementado sem pré-condições.

| Feature | Estado | Pré-condição para retomar |
|---|---|---|
| Exportação de vídeo com legendas inseridas | **P1 comercial; P0 arquitetural parcial na Onda 4** | Onda 4 cria apenas primitivas compatíveis. Preview real começa em 6.3; `render_jobs`/MP4 em 6.4; ativação paga depende da Onda 9. Ver `docs/CAPTIONED_VIDEO_EXPORT.md` |
| Primeira exportação gratuita de vídeo legendado | Bloqueada | Conta verificada, entitlement durável único, Turnstile, orçamento global, estados adaptativos, concorrência, abuso, flags e kill switch |
| Recortes/reframing 9:16, 4:5 e 1:1 | Adiada | Renderização básica estável, demanda validada e análise separada de UX/custo |
| Remoção de silêncios/cortes automáticos | Adiada | Não faz parte do MVP de vídeo legendado; requer feature e modelo de custo próprios |
| Editor avançado de vídeo/timeline | Fora do posicionamento atual | Só reavaliar com mudança explícita de produto; não entra silenciosamente |
| Link adapters para todas as redes | Condicionada | Pesquisa técnica/jurídica por plataforma, testes e fallback por upload |
| Transcrição OpenAI pública | Bloqueada | Ledger, quota durável, budget reservation, idempotência, rate limit, kill switch e telemetria |
| Diarização premium | Adiada | Validar qualidade, custo e UX com fixtures reais |
| Pagamentos reais | Adiada | Provider definido, test mode, ledger e webhooks idempotentes |
| API pública | Adiada | Auth, quotas, jobs e billing estáveis |
| Equipes e workspaces avançados | Adiada | Fluxo individual e ownership consolidados |
| Integrações com Notion/Drive/Slack | Adiada | Core estável e demanda validada |
| Extensão de navegador | Adiada | Fluxo web e adapters estáveis |
| MCP | Adiada | API pública e segurança consolidadas |
| Publicação de transcripts | Bloqueada por padrão | Apenas conteúdo próprio/autorizado, verificação de propriedade e controles de indexação |
| SEO programático em escala | Condicionada | Templates com conteúdo único, quality gate e dados de busca reais |
| Mais de 3 idiomas de interface | Adiada | Dados de aquisição/conversão e suporte |
| Infra paga avançada | Condicionada | Exceder free tiers ou existir requisito de confiabilidade/capacidade |
