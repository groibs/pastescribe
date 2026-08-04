-- PasteScribe — Onda 4 fatia 4.2c-c: RLS deny-by-default para
-- transcripts. Nesta fatia só o worker persiste resultados via funções
-- SECURITY DEFINER. A leitura do usuário chega na Onda 4.3, junto com
-- o primeiro consumidor real e testes de workspace.

alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;

revoke all on public.transcripts from anon, authenticated;
revoke all on public.transcript_segments from anon, authenticated;

comment on table public.transcripts is
  'Privado por padrão: service_role/funções internas até a policy de leitura da Onda 4.3.';
comment on table public.transcript_segments is
  'Privado por padrão: service_role/funções internas até a policy de leitura da Onda 4.3.';
