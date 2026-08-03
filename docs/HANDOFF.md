# HANDOFF — PasteScribe

Última atualização: **2026-08-03** (Onda 0 + fatia 1.1 + fatia 1.2 mergeadas; Onda 2 fatia 2.1 em revisão)

## Branch e base

- Base: `main` (PRs #2 e #3 já mergeadas a pedido do dono)
- Branch desta entrega: `claude/pastescribe-wave-0-vqgzet` (recriada a partir do `main` pós-merge)
- Estado: Onda 2 fatia 2.1 (migration inicial + RLS testada) implementada e verificada; PR aberta aguardando revisão. **Não fazer merge sem autorização.**

## Infraestrutura já criada pelo dono (2026-08-03)

- Projeto Vercel conectado ao repositório (free/Hobby), sem domínio próprio ainda.
- Projeto Supabase criado (free tier). URL/chaves não vivem no repositório.
- **Corrigido:** deploy da Vercel falhava por Root Directory incorreto (dashboard → `apps/web`) — sem mudança de código.
- **Esclarecido com o dono:** "Supabase local" (docs/ARCHITECTURE.md) é o ambiente onde o Claude Code roda para testar migrations/RLS, não a máquina do dono. Neste sandbox específico, o `supabase start` (Docker) não funciona porque o pull de imagens do Docker Hub é bloqueado pela política de rede do ambiente — solução adotada: PostgreSQL nativo (via `apt`) + pgTAP, ver abaixo. Decisão completa em `docs/DECISIONS.md`.

## O que esta entrega contém (Onda 2, fatia 2.1)

**Migrations** (`supabase/migrations/`):

- `0001_initial_schema.sql` — `profiles`, `workspaces`, `workspace_members` (enum `workspace_role`: owner/admin/editor/viewer), `workspace_invites`, `feature_flags`, `app_settings`; triggers `set_updated_at`, `handle_new_workspace` (todo workspace nasce com o criador como owner) e `handle_new_user` (todo signup nasce com perfil + workspace pessoal — dispara o trigger anterior).
- `0002_workspace_rls.sql` — RLS deny-by-default em todas as tabelas; `workspace_role_rank`/`is_workspace_member` (`SECURITY DEFINER`, `search_path` fixo) como único ponto de verdade sobre pertencimento; GRANTs explícitos por tabela (o Supabase atual **não** auto-expõe tabelas novas a `anon`/`authenticated` — cada tabela alcançável pelo client precisa de GRANT + policy concordando); `app_settings` sem GRANT nenhum para client (só `service_role`); `feature_flags` com leitura pública (nunca guarda segredo).

**Regra de negócio testada:** admin não pode alterar/remover a linha de um `owner` (só transferência de propriedade dedicada, Onda 11); qualquer não-owner pode sair sozinho; owner não pode sair sozinho (evita workspace órfão).

**Harness de teste local** (`supabase/tests/`, `scripts/test-db-local.sh`):

- `fixtures/00_local_auth_shim.sql` — reproduz o contrato estável do schema `auth` do Supabase (users, `auth.uid()`, `auth.role()`, papéis `anon`/`authenticated`/`service_role`, incluindo o default privilege de `service_role` sobre tabelas futuras) **só para teste local — nunca aplicar no Supabase real**, que já fornece isso de verdade.
- 6 arquivos pgTAP (`01`–`06`) cobrindo profiles, workspaces, workspace_members (incluindo a proteção do owner), workspace_invites, feature_flags/app_settings (anon/authenticated/service_role) e o trigger de signup.
- **46/46 testes passando** neste sandbox via `bash scripts/test-db-local.sh`.

**CI:** novo job `db-migrations-rls` em `.github/workflows/ci.yml` — instala PostgreSQL + pgTAP no runner (com internet normal do GitHub Actions, sem a restrição deste sandbox) e roda o mesmo `scripts/test-db-local.sh`, garantindo paridade entre verificação local e CI.

**Docs atualizados:** `docs/DATABASE.md` (funções/triggers entregues), `docs/DECISIONS.md` (esclarecimento sobre "Supabase local").

## Comandos executados e resultados

```bash
bash scripts/test-db-local.sh   # ok — 46 testes pgTAP (profiles, workspaces, members, invites, flags/settings, trigger)
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # ok — inalterado (54 testes JS/TS)
```

## Como testar

```bash
# lado banco (requer PostgreSQL local com extensão pgtap — ver README do script)
bash scripts/test-db-local.sh

# lado web (inalterado desde a fatia 1.2)
pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## O que ficou de fora (deliberado)

- Aplicação das migrations no projeto Supabase real do dono — só acontece com confirmação explícita dele, quando o auth SSR (fatia 2.2) estiver pronto para usar.
- Auth SSR (`@supabase/ssr`), telas de login/sessão, dashboard autenticado, admin base — fatias 2.2/2.3.
- Fluxo de aceite de convite por token (`workspace_invites`) — chega com a feature de equipes (Onda 11); a tabela existe mas só é gerenciável por admin/owner hoje.
- `packages/database` (tipos gerados do Supabase) — chega junto com a fatia 2.2, quando o client TS passar a consultar essas tabelas.

## Riscos e limitações

- O shim local de `auth` é uma aproximação do contrato público do Supabase (`auth.uid()`/`auth.role()` via `request.jwt.claims`) — fiel ao comportamento documentado, mas nunca testado contra o GoTrue real. Primeira aplicação no projeto real do dono deve ser acompanhada de perto.
- `handle_new_user` usa `raw_user_meta_data ->> 'full_name'`/`'locale'` — nomes de campo a confirmar contra o que o fluxo de signup real (Onda 2.2, magic link/Google) efetivamente envia.
- CI ainda não foi executado de verdade (job novo, será validado no primeiro push/PR desta fatia).

## Restrições que não podem ser violadas (inalteradas)

Não trabalhar em `main`; não fazer merge sem autorização; não alterar DNS/produção; não inserir segredos; não liberar IA gratuita sem os gates da Onda 3; não aplicar migration no projeto Supabase real sem confirmação explícita do dono.

## Decisões manuais pendentes (dono)

- Confirmar quando aplicar `0001`/`0002` no projeto Supabase real (`yeupkcstbewufpptiypp`) — recomendo esperar a fatia 2.2 (auth SSR) para testar de ponta a ponta de uma vez.
- Demais pendências inalteradas (provider de pagamento, host do worker, domínio).

## Próximo passo exato

1. Dono revisa/mergeia a PR desta fatia (2.1).
2. Nova branch para **fatia 2.2**: `@supabase/ssr`, magic link + Google + senha opcional, `packages/database` com tipos gerados, e — só então, com autorização — aplicar as migrations no projeto Supabase real.
3. Fatia 2.3: dashboard autenticado mínimo + base do `/admin` (papel server-side).

## Documentos de memória atualizados nesta sessão

`docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md` (este).
