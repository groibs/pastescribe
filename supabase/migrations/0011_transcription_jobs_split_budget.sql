-- PasteScribe — Onda 4 fatia 4.2a (correção): separa "criar o job" de
-- "reservar orçamento". docs/DECISIONS.md explica o porquê: a duração
-- real de uma mídia (upload ou link) só é conhecida depois de um passo
-- determinístico e gratuito do próprio pipeline (ffprobe no worker
-- para upload; metadata pública da plataforma para link) — nunca antes
-- disso, e nunca por valor declarado pelo cliente. `queued` (criar o
-- job) e `transcribing` (a etapa que custa dinheiro) deixam de ser o
-- mesmo instante.
--
-- Também prepara source_kind='url' estruturalmente (coluna + check),
-- sem construir nenhum adapter/fetch/SSRF ainda — isso continua sendo
-- Onda 8. Nenhuma rota hoje cria um job com source_kind='url'.

alter table public.transcription_jobs
  add column duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  add column source_url text;

alter table public.transcription_jobs
  alter column media_asset_id drop not null;

alter table public.transcription_jobs
  drop constraint transcription_jobs_source_kind_check;

alter table public.transcription_jobs
  add constraint transcription_jobs_source_kind_check check (source_kind in ('upload', 'url'));

alter table public.transcription_jobs
  add constraint transcription_jobs_source_consistency_check check (
    (source_kind = 'upload' and media_asset_id is not null and source_url is null)
    or
    (source_kind = 'url' and source_url is not null and media_asset_id is null)
  );

comment on column public.transcription_jobs.duration_seconds is
  'Duração REAL, descoberta pelo worker (ffprobe) ou por metadata da plataforma — nunca declarada pelo client. Populada por reserve_job_budget, antes disso é null.';
comment on column public.transcription_jobs.source_url is
  'Só para source_kind=url — ainda sem nenhum adapter/rota que crie um job assim (Onda 8). Sem normalização/dedup ainda (isso é media_sources, quando existir).';
