-- PasteScribe — RLS de transcription_jobs/job_steps.
-- docs/DATABASE.md §Estratégia de RLS, mesmo raciocínio da fatia 3.1
-- para as tabelas de billing (docs/DECISIONS.md): RLS habilitada em
-- ambas (defesa em profundidade) sem nenhuma policy — só `service_role`
-- alcança. Nenhum consumidor client existe ainda (a fatia 4.3, "UI de
-- processamento", é quem lê o estado do job na tela) — a policy de
-- SELECT para membros do workspace entra na mesma PR que ligar essa
-- tela, nunca antes, sem uso real para validar o desenho.

alter table public.transcription_jobs enable row level security;
revoke all on public.transcription_jobs from anon, authenticated;

alter table public.job_steps enable row level security;
revoke all on public.job_steps from anon, authenticated;
