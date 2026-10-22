-- Execute no SQL Editor do projeto Supabase antes de publicar esta funcionalidade.
-- Mantém a tabela e os registros existentes; não adivinha a dona de registros antigos.
begin;

create table if not exists public.respostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entrada text not null,
  resposta text not null,
  created_at timestamptz not null default now()
);

-- Compatibilidade com uma tabela já existente, sem apagar ou recriar dados.
alter table public.respostas add column if not exists id uuid default gen_random_uuid();
alter table public.respostas add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.respostas add column if not exists entrada text;
alter table public.respostas add column if not exists resposta text;
-- Registros antigos sem data permanecem sem data; não inventamos a data original.
alter table public.respostas add column if not exists created_at timestamptz;
alter table public.respostas alter column user_id set default auth.uid();
alter table public.respostas alter column created_at set default now();

-- Se uma coluna existente for incompatível, interrompa sem alterar os dados.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'respostas'
      and column_name = 'user_id' and udt_name = 'uuid'
  ) then
    raise exception 'A coluna respostas.user_id precisa ser uuid. Revise a estrutura existente antes de continuar.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'respostas'
      and column_name = 'created_at' and udt_name = 'timestamptz'
  ) then
    raise exception 'A coluna respostas.created_at precisa ser timestamptz. Revise a estrutura existente antes de continuar.';
  end if;
end $$;

create index if not exists respostas_user_created_at_idx
  on public.respostas (user_id, created_at desc);

alter table public.respostas enable row level security;
revoke all on public.respostas from public, anon;
grant select, insert on public.respostas to authenticated;

-- Necessário quando a tabela existente usa um id serial/identity.
do $$
declare sequencia text;
begin
  sequencia := pg_get_serial_sequence('public.respostas', 'id');
  if sequencia is not null then
    execute format('grant usage, select on sequence %s to authenticated', sequencia);
  end if;
end $$;

-- A política RESTRICTIVE também limita políticas permissivas que já existam.
-- TO PUBLIC abrange inclusive anon; auth.uid() nulo nunca permite ler uma linha.
drop policy if exists respostas_owner_guard on public.respostas;
create policy respostas_owner_guard on public.respostas
  as restrictive for all to public
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists respostas_select_own on public.respostas;
create policy respostas_select_own on public.respostas
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists respostas_insert_own on public.respostas;
create policy respostas_insert_own on public.respostas
  for insert to authenticated
  with check (user_id = (select auth.uid()));

commit;
