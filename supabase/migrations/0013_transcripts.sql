-- PasteScribe — Onda 4 fatia 4.2c-c: resultado persistido da transcrição.
--
-- O transcript é domínio próprio, ligado 1:1 ao job concluído. O texto
-- bruto e os segmentos são privados por padrão; a primeira policy de
-- leitura por workspace chega junto com a UI da Onda 4.3.

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.transcription_jobs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  language text not null check (char_length(language) between 2 and 35),
  source text not null check (source in ('ai', 'native_captions')),
  model text,
  text text not null check (char_length(text) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source = 'ai' and model is not null) or source = 'native_captions')
);

create trigger set_updated_at before update on public.transcripts
  for each row execute function public.set_updated_at();

create index transcripts_workspace_created_idx
  on public.transcripts (workspace_id, created_at desc);

comment on table public.transcripts is
  'Resultado privado e idempotente de um transcription_job; 1:1 por job.';

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  position integer not null check (position >= 0),
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null check (end_ms >= start_ms),
  text text not null check (char_length(text) > 0),
  speaker_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transcript_id, position)
);

create trigger set_updated_at before update on public.transcript_segments
  for each row execute function public.set_updated_at();

create index transcript_segments_timeline_idx
  on public.transcript_segments (transcript_id, start_ms, position);

comment on table public.transcript_segments is
  'Segmentos ordenados com timestamps reais; conteúdo privado, editável apenas em ondas posteriores.';
