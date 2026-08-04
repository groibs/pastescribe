-- PasteScribe — Onda 4 fatia 4.1: bookkeeping do upload de mídia.
-- docs/DATABASE.md §Jobs e mídia: "media_assets — objetos no storage
-- temporário: bucket, chave, MIME real, tamanho, checksum, TTL, estado
-- de limpeza."
--
-- Fluxo (skill pastescribe-upload-url-security §2 — quarentena, valida,
-- libera ou apaga): nasce 'pending_upload' quando o servidor emite a
-- URL assinada; vira 'validated' só depois do servidor confirmar
-- tamanho real (headObject) e MIME real (sniffing) contra o objeto de
-- verdade no storage — nunca confiando no que o client declarou.
-- Client não escreve o veredito: só INSERT (pedir upload) e SELECT
-- (ver o próprio); a transição de status é sempre via service_role.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  storage_key text not null unique,
  -- Só metadado de exibição, sanitizado pelo servidor antes de gravar —
  -- NUNCA usado para montar storage_key/caminho (isso é sempre UUID).
  original_filename text check (original_filename is null or char_length(original_filename) <= 255),
  status text not null default 'pending_upload'
    check (status in ('pending_upload', 'validated', 'rejected', 'deleted')),
  declared_content_type text not null,
  declared_size_bytes bigint not null check (declared_size_bytes > 0),
  actual_content_type text,
  actual_size_bytes bigint,
  rejection_reason text,
  expires_at timestamptz not null,
  validated_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_assets_workspace_idx on public.media_assets (workspace_id, created_at);
create index media_assets_status_expiry_idx on public.media_assets (status, expires_at);

create trigger set_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: membro do workspace (editor+) pode pedir um upload; qualquer
-- membro (viewer+) enxerga os assets do próprio workspace. Nada além
-- disso pelo client — validar/rejeitar/apagar é sempre service_role
-- (docs/DATABASE.md regra 6, mesmo padrão do /admin).
-- ---------------------------------------------------------------------
alter table public.media_assets enable row level security;
revoke all on public.media_assets from anon, authenticated;
grant select, insert on public.media_assets to authenticated;

create policy media_assets_select_member
  on public.media_assets for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'viewer'));

create policy media_assets_insert_editor
  on public.media_assets for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id, 'editor')
    and created_by = auth.uid()
  );

-- Sem policy de update/delete para authenticated: transição de status
-- (validated/rejected/deleted) só por service_role, que bypassa RLS.
