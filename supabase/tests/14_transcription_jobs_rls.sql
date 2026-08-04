-- RLS de transcription_jobs/job_steps — service_role-only por enquanto
-- (docs/DECISIONS.md: mesmo raciocínio de budget_periods na fatia 3.1 —
-- sem consumidor client real ainda, policy de leitura por workspace
-- entra junto com a fatia 4.3).
begin;
select plan(6);

insert into auth.users (id, email) values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

-- ---------------------------------------------------------------------
-- anon: nenhuma tabela nova é alcançável.
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok($$ select * from public.transcription_jobs $$, '42501', null, 'anon não lê transcription_jobs');
select throws_ok($$ select * from public.job_steps $$, '42501', null, 'anon não lê job_steps');

reset role;

-- ---------------------------------------------------------------------
-- authenticated: mesma regra — nenhum grant, nem para o próprio job.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$ select * from public.transcription_jobs $$, '42501', null, 'authenticated não lê transcription_jobs (nem o próprio job — sem UI ainda)');
select throws_ok($$ select * from public.job_steps $$, '42501', null, 'authenticated não lê job_steps');
select throws_ok(
  $$ insert into public.transcription_jobs (workspace_id, created_by, media_asset_id, idempotency_key)
     values (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', gen_random_uuid(), 'direct-insert') $$,
  '42501',
  null,
  'authenticated não consegue criar job direto — só via reserve_free_budget_and_enqueue (SECURITY DEFINER)'
);

reset role;

-- ---------------------------------------------------------------------
-- service_role: bypassa RLS normalmente (já exercitado a fundo em
-- 13_transcription_jobs_queue.sql — aqui só confirma o acesso básico).
-- ---------------------------------------------------------------------
set local role service_role;

select is(
  (select count(*)::int from public.transcription_jobs),
  0,
  'service_role lê transcription_jobs normalmente (vazio nesta transação isolada)'
);

reset role;
select * from finish();
rollback;
