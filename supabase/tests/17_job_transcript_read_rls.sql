-- Onda 4.3a — leitura de jobs, steps, transcripts e segmentos por
-- membership do workspace. Nenhuma escrita direta pelo client.
begin;
select plan(20);

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('b2222222-2222-2222-2222-222222222222', 'bob@example.com'),
  ('c3333333-3333-3333-3333-333333333333', 'carol@example.com');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into public.workspaces (name, created_by)
values ('Equipe de Alice', 'a1111111-1111-1111-1111-111111111111');
reset role;

set local role service_role;
insert into public.workspace_members (workspace_id, user_id, role)
values (
  (select id from public.workspaces where name = 'Equipe de Alice'),
  'b2222222-2222-2222-2222-222222222222',
  'viewer'
);

insert into public.media_assets (
  workspace_id, created_by, storage_key, status,
  declared_content_type, declared_size_bytes,
  actual_content_type, actual_size_bytes, validated_at, expires_at
) values (
  (select id from public.workspaces where name = 'Equipe de Alice'),
  'a1111111-1111-1111-1111-111111111111',
  'uploads/team/read-rls.mp4', 'validated',
  'video/mp4', 2048, 'video/mp4', 2048, now(), now() + interval '1 day'
);

select public.enqueue_job(
  (select id from public.workspaces where name = 'Equipe de Alice'),
  'a1111111-1111-1111-1111-111111111111',
  'upload',
  'read-rls-job',
  (select id from public.media_assets where storage_key = 'uploads/team/read-rls.mp4')
);

insert into public.transcripts (job_id, workspace_id, language, source, model, text)
select
  job.id,
  job.workspace_id,
  'pt-br',
  'ai',
  'fake-transcriber-v1',
  'Trecho privado do workspace.'
from public.transcription_jobs job
where job.idempotency_key = 'read-rls-job';

insert into public.transcript_segments (transcript_id, position, start_ms, end_ms, text)
select id, 0, 0, 1200, 'Trecho privado do workspace.'
from public.transcripts
where text = 'Trecho privado do workspace.';
reset role;

-- Membro viewer lê todas as quatro superfícies.
set local role authenticated;
set local request.jwt.claims to '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from public.transcription_jobs where idempotency_key = 'read-rls-job'), 1, 'viewer lê job do workspace');
select is((select count(*)::int from public.job_steps step join public.transcription_jobs job on job.id = step.job_id where job.idempotency_key = 'read-rls-job'), 1, 'viewer lê steps do job');
select is((select count(*)::int from public.transcripts where text = 'Trecho privado do workspace.'), 1, 'viewer lê transcript');
select is((select count(*)::int from public.transcript_segments where text = 'Trecho privado do workspace.'), 1, 'viewer lê segmentos');

select throws_ok(
  $$ update public.transcription_jobs set state = 'completed' where idempotency_key = 'read-rls-job' $$,
  '42501', null,
  'viewer não altera job diretamente'
);
select throws_ok(
  $$ update public.transcripts set text = 'alterado' where text = 'Trecho privado do workspace.' $$,
  '42501', null,
  'viewer não altera transcript diretamente'
);
select throws_ok(
  $$ delete from public.transcript_segments where text = 'Trecho privado do workspace.' $$,
  '42501', null,
  'viewer não apaga segmento diretamente'
);
select throws_ok(
  $$ insert into public.job_steps (job_id, from_state, to_state, actor)
     select id, 'queued', 'completed', 'web' from public.transcription_jobs where idempotency_key = 'read-rls-job' $$,
  '42501', null,
  'viewer não insere step diretamente'
);
reset role;

-- Estranho autenticado não enxerga nenhuma superfície.
set local role authenticated;
set local request.jwt.claims to '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.transcription_jobs where idempotency_key = 'read-rls-job'), 0, 'estranho não lê job');
select is((select count(*)::int from public.job_steps), 0, 'estranho não lê steps');
select is((select count(*)::int from public.transcripts), 0, 'estranho não lê transcript');
select is((select count(*)::int from public.transcript_segments), 0, 'estranho não lê segmentos');
reset role;

-- Anônimo não recebe privilégio de SELECT.
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select throws_ok($$ select * from public.transcription_jobs $$, '42501', null, 'anon não acessa jobs');
select throws_ok($$ select * from public.job_steps $$, '42501', null, 'anon não acessa steps');
select throws_ok($$ select * from public.transcripts $$, '42501', null, 'anon não acessa transcripts');
select throws_ok($$ select * from public.transcript_segments $$, '42501', null, 'anon não acessa segmentos');
reset role;

-- Owner mantém acesso e service role continua escrevendo.
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.transcription_jobs where idempotency_key = 'read-rls-job'), 1, 'owner lê o próprio job');
select is((select count(*)::int from public.transcripts where text = 'Trecho privado do workspace.'), 1, 'owner lê o transcript');
reset role;

set local role service_role;
select lives_ok(
  $$ update public.transcripts set language = 'pt-br' where text = 'Trecho privado do workspace.' $$,
  'service role continua escrevendo'
);
select is((select count(*)::int from public.transcript_segments), 1, 'service role continua lendo segmentos');
reset role;

select * from finish();
rollback;
