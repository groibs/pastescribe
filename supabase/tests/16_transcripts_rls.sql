-- RLS de transcripts/transcript_segments — service_role-only até a
-- UI da Onda 4.3 introduzir o primeiro consumidor autenticado real.
begin;
select plan(6);

insert into auth.users (id, email)
values ('a1111111-1111-1111-1111-111111111111', 'alice@example.com');

set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select throws_ok($$ select * from public.transcripts $$, '42501', null, 'anon não lê transcripts');
select throws_ok($$ select * from public.transcript_segments $$, '42501', null, 'anon não lê transcript_segments');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$ select * from public.transcripts $$, '42501', null, 'authenticated ainda não lê transcripts');
select throws_ok($$ select * from public.transcript_segments $$, '42501', null, 'authenticated ainda não lê segmentos');
select throws_ok(
  $$ insert into public.transcripts (job_id, workspace_id, language, source, model, text)
     values (gen_random_uuid(), gen_random_uuid(), 'pt-br', 'ai', 'fake', 'conteúdo') $$,
  '42501', null,
  'authenticated não grava transcript diretamente'
);
reset role;

set local role service_role;
select is((select count(*)::int from public.transcripts), 0, 'service_role acessa transcripts normalmente');

reset role;
select * from finish();
rollback;
