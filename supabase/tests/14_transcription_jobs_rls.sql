-- RLS de transcription_jobs/job_steps.
-- A leitura autenticada por workspace é coberta em
-- 17_job_transcript_read_rls.sql. Este arquivo preserva os invariantes
-- negativos: anon não lê e authenticated não escreve diretamente.
begin;
select plan(4);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select throws_ok($$ select * from public.transcription_jobs $$, '42501', null, 'anon não lê transcription_jobs');
select throws_ok($$ select * from public.job_steps $$, '42501', null, 'anon não lê job_steps');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ insert into public.transcription_jobs (workspace_id, created_by, media_asset_id, idempotency_key)
     values (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', gen_random_uuid(), 'direct-insert') $$,
  '42501',
  null,
  'authenticated não consegue criar job direto — só via funções server-side'
);
reset role;

set local role service_role;
select is(
  (select count(*)::int from public.transcription_jobs),
  0,
  'service_role lê transcription_jobs normalmente (vazio nesta transação isolada)'
);
reset role;

select * from finish();
rollback;
