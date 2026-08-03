-- PasteScribe — Onda 3 fatia 3.3 (recorte): base do /admin.
-- docs/ARCHITECTURE.md: "admin validado server-side por papel em
-- banco, não por UI"; docs/DATABASE.md regra 6: "admin não é RLS
-- bypass no client — rotas admin usam service role no servidor após
-- verificação de papel".
--
-- `platform_admins` é uma allowlist simples — não confundir com
-- workspace_members.role (que é por workspace; isto é global, "quem
-- pode ver/mexer no painel operacional do produto inteiro"). Sem seed:
-- não há como saber o auth.users.id real do dono neste ambiente — o
-- primeiro admin é inserido manualmente uma vez (docs/HANDOFF.md tem o
-- comando exato).
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

-- ---------------------------------------------------------------------
-- Kill switches globais (docs/AI_CALL_MATRIX.md regra 5). Nascem
-- desligados — fallback seguro é sempre "sem chamada de IA", nunca o
-- contrário. feature_flags já existe desde a fatia 2.1 (leitura
-- pública, escrita só service_role); só faltavam as linhas.
-- ---------------------------------------------------------------------
insert into public.feature_flags (key, enabled, description) values
  ('openai_enabled', false, 'Kill switch global — desligado corta toda chamada à OpenAI (free e paid). docs/AI_CALL_MATRIX.md.'),
  ('free_ai_enabled', false, 'Kill switch do gratuito — desligado corta só o free; paid continua funcionando. docs/AI_CALL_MATRIX.md.');
