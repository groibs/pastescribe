-- RLS de public.media_assets — docs/DATABASE.md, skill
-- pastescribe-upload-url-security. editor+ cria; viewer+ lê; ninguém
-- pelo client decide status (só service_role).
begin;
select plan(10);

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('b2222222-2222-2222-2222-222222222222', 'bob@example.com');

-- Alice cria um workspace de time e convida bob como viewer.
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into public.workspaces (name, created_by) values ('Time', 'a1111111-1111-1111-1111-111111111111');
reset role;

set local role service_role;
insert into public.workspace_members (workspace_id, user_id, role)
values ((select id from public.workspaces where name = 'Time'), 'b2222222-2222-2222-2222-222222222222', 'viewer');
reset role;

-- ---------------------------------------------------------------------
-- Alice (owner = editor+) pede um upload no workspace de time.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.media_assets (
       workspace_id, created_by, storage_key, declared_content_type, declared_size_bytes, expires_at
     ) values (
       (select id from public.workspaces where name = 'Time'),
       'a1111111-1111-1111-1111-111111111111',
       'uploads/team/asset-1',
       'audio/mpeg', 1048576, now() + interval '1 day'
     ) $$,
  'alice (owner/editor+) consegue pedir upload no workspace de time'
);

select throws_ok(
  $$ insert into public.media_assets (
       workspace_id, created_by, storage_key, declared_content_type, declared_size_bytes, expires_at
     ) values (
       (select id from public.workspaces where name = 'Time'),
       'b2222222-2222-2222-2222-222222222222',
       'uploads/team/asset-fake',
       'audio/mpeg', 1024, now() + interval '1 day'
     ) $$,
  '42501',
  null,
  'alice não consegue criar um media_asset se passando por bob (created_by != auth.uid())'
);

reset role;

-- ---------------------------------------------------------------------
-- Bob (viewer) enxerga o asset de alice, mas não consegue criar um novo.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.media_assets where storage_key = 'uploads/team/asset-1'),
  1,
  'bob (viewer) enxerga o asset criado por alice'
);

select throws_ok(
  $$ insert into public.media_assets (
       workspace_id, created_by, storage_key, declared_content_type, declared_size_bytes, expires_at
     ) values (
       (select id from public.workspaces where name = 'Time'),
       'b2222222-2222-2222-2222-222222222222',
       'uploads/team/asset-bob',
       'audio/mpeg', 1024, now() + interval '1 day'
     ) $$,
  '42501',
  null,
  'bob (viewer) não consegue pedir upload — precisa ser editor+'
);

select throws_ok(
  $$ update public.media_assets set status = 'validated' where storage_key = 'uploads/team/asset-1' $$,
  '42501',
  null,
  'bob não consegue alterar o status de um asset — isso é só service_role'
);

reset role;

-- Alice também não pode se auto-validar pelo client.
set local role authenticated;
set local request.jwt.claims to '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ update public.media_assets set status = 'validated' where storage_key = 'uploads/team/asset-1' $$,
  '42501',
  null,
  'alice (dona do asset) também não pode alterar o próprio status — só service_role decide'
);

reset role;

-- ---------------------------------------------------------------------
-- Estranho sem vínculo com o workspace não enxerga nada.
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values ('c3333333-3333-3333-3333-333333333333', 'carol@example.com');
set local role authenticated;
set local request.jwt.claims to '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is(
  (select count(*)::int from public.media_assets where storage_key = 'uploads/team/asset-1'),
  0,
  'carol (fora do workspace) não enxerga o asset de alice'
);

reset role;

-- ---------------------------------------------------------------------
-- service_role: transita status normalmente (fluxo real de validação).
-- ---------------------------------------------------------------------
set local role service_role;

update public.media_assets
  set status = 'validated', actual_content_type = 'audio/mpeg', actual_size_bytes = 1048576, validated_at = now()
  where storage_key = 'uploads/team/asset-1';

select is(
  (select status from public.media_assets where storage_key = 'uploads/team/asset-1'),
  'validated',
  'service_role consegue validar o asset após checar tamanho/MIME reais'
);

-- constraint de status inválido é rejeitada mesmo por service_role.
select throws_ok(
  $$ insert into public.media_assets (
       workspace_id, created_by, storage_key, status, declared_content_type, declared_size_bytes, expires_at
     ) values (
       (select id from public.workspaces where name = 'Time'),
       'a1111111-1111-1111-1111-111111111111',
       'uploads/team/asset-bad-status',
       'not-a-real-status',
       'audio/mpeg', 1024, now() + interval '1 day'
     ) $$,
  '23514',
  null,
  'status fora do enum é rejeitado pela check constraint, mesmo via service_role'
);

select throws_ok(
  $$ insert into public.media_assets (
       workspace_id, created_by, storage_key, declared_content_type, declared_size_bytes, expires_at
     ) values (
       (select id from public.workspaces where name = 'Time'),
       'a1111111-1111-1111-1111-111111111111',
       'uploads/team/asset-negative',
       'audio/mpeg', -5, now() + interval '1 day'
     ) $$,
  '23514',
  null,
  'declared_size_bytes <= 0 é rejeitado pela check constraint'
);

reset role;

select * from finish();
rollback;
