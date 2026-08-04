-- PasteScribe — Onda 4 fatia 4.3a: primeiro consumidor autenticado
-- real de jobs e transcripts. Leitura por workspace; nenhuma escrita
-- direta do client. Cancelamento continua via função server-side.

revoke all on public.transcription_jobs from anon, authenticated;
revoke all on public.job_steps from anon, authenticated;
revoke all on public.transcripts from anon, authenticated;
revoke all on public.transcript_segments from anon, authenticated;

grant select on public.transcription_jobs to authenticated;
grant select on public.job_steps to authenticated;
grant select on public.transcripts to authenticated;
grant select on public.transcript_segments to authenticated;

create policy transcription_jobs_select_member
  on public.transcription_jobs for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'viewer'));

create policy job_steps_select_member
  on public.job_steps for select
  to authenticated
  using (
    exists (
      select 1
      from public.transcription_jobs job
      where job.id = job_steps.job_id
        and public.is_workspace_member(job.workspace_id, 'viewer')
    )
  );

create policy transcripts_select_member
  on public.transcripts for select
  to authenticated
  using (public.is_workspace_member(workspace_id, 'viewer'));

create policy transcript_segments_select_member
  on public.transcript_segments for select
  to authenticated
  using (
    exists (
      select 1
      from public.transcripts transcript
      where transcript.id = transcript_segments.transcript_id
        and public.is_workspace_member(transcript.workspace_id, 'viewer')
    )
  );

-- Sem INSERT/UPDATE/DELETE para authenticated. Resultado e estado
-- continuam exclusivos das funções SECURITY DEFINER/service_role.
