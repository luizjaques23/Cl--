-- ============================================================================
-- PORTAL OFICIAL DO CLÃ ALCATRAZZ — ZEPHIRA WORLD
-- Schema PostgreSQL + Supabase RLS (Row-Level Security)
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. TABELA DE CARGOS (Hierarquia do Clã)
create table if not exists public.cargos (
  id text primary key,
  nome text not null unique,
  nivel_hierarquia integer not null unique, -- 1 = Líder (topo), 7 = Recruta
  cor_hex text not null default '#D6A33A',
  simbolo text not null default 'Crown',
  descricao text not null,
  permissoes_padrao text[] not null default '{}',
  is_exemplo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TABELA DE PERMISSÕES (RBAC Granular)
create table if not exists public.permissoes (
  id text primary key,
  codigo text not null unique,
  nome text not null,
  modulo text not null,
  descricao text not null,
  created_at timestamptz not null default now()
);

-- Relação Cargo <-> Permissões
create table if not exists public.cargo_permissoes (
  cargo_id text not null references public.cargos(id) on delete cascade,
  permissao_id text not null references public.permissoes(id) on delete cascade,
  primary key (cargo_id, permissao_id)
);

create index if not exists idx_cargo_permissoes_cargo_id on public.cargo_permissoes(cargo_id);
create index if not exists idx_cargo_permissoes_permissao_id on public.cargo_permissoes(permissao_id);

-- 3. TABELA DE USUÁRIOS ADMINISTRATIVOS (Vinculada a auth.users ou Auth Server)
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique, -- Referência opcional ao auth.users(id) do Supabase Auth
  nome text not null,
  email text not null unique,
  nickname_in_game text not null,
  cargo_id text not null references public.cargos(id) on delete restrict,
  permissoes_extras text[] not null default '{}',
  ativo boolean not null default true,
  ultimo_acesso timestamptz,
  is_exemplo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_usuarios_auth_user_id on public.usuarios(auth_user_id);
create index if not exists idx_usuarios_cargo_id on public.usuarios(cargo_id);

-- 4. TABELA DE JOGADORES (Sistema de Membros)
create table if not exists public.jogadores (
  id text primary key,
  nickname text not null unique,
  classe text not null, -- Lutador, Mecânico, Arqueira, Pike, Atalanta, Cavaleiro, Mago, Sacerdotisa, Assassina, Xamã, Guerreira
  tribo text not null default 'Tempskron', -- Tempskron / Morion
  level integer not null check (level >= 1 and level <= 200),
  cargo_id text not null references public.cargos(id) on delete restrict,
  data_entrada date not null default current_date,
  avatar_url text not null,
  status text not null check (status in ('ativo', 'inativo', 'afastado')) default 'ativo',
  observacoes_administrativas text default '',
  pontuacao integer not null default 0,
  participacoes_eventos integer not null default 0,
  contribuicao_cla integer not null default 0,
  is_lider_destaque boolean not null default false,
  is_exemplo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jogadores_nickname on public.jogadores(nickname);
create index if not exists idx_jogadores_classe on public.jogadores(classe);
create index if not exists idx_jogadores_cargo_id on public.jogadores(cargo_id);
create index if not exists idx_jogadores_level on public.jogadores(level desc);
create index if not exists idx_jogadores_pontuacao on public.jogadores(pontuacao desc);

-- 5. TABELA DE AVISOS (Mural de Comunicados)
create table if not exists public.avisos (
  id text primary key,
  titulo text not null,
  descricao text not null,
  autor text not null,
  autor_cargo text not null default 'Líder',
  data_publicacao timestamptz not null default now(),
  categoria text not null check (
    categoria in (
      'Avisos gerais',
      'Regras do clã',
      'Recrutamento',
      'Eventos',
      'Guerras',
      'Comunicados administrativos'
    )
  ),
  imagem_url text,
  prioridade text not null check (prioridade in ('baixa', 'normal', 'alta', 'urgente')) default 'normal',
  fixado boolean not null default false,
  is_exemplo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_avisos_categoria on public.avisos(categoria);
create index if not exists idx_avisos_fixado_data on public.avisos(fixado desc, data_publicacao desc);

-- 6. TABELA DE EVENTOS (Calendário de Eventos e SoD - Siege of the Darkness)
create table if not exists public.eventos (
  id text primary key,
  titulo text not null,
  descricao text not null,
  categoria text not null check (
    categoria in (
      'SoD (Siege of the Darkness)',
      'Bless Castle',
      'Hunt & Boss Raid',
      'Guerra de Clãs',
      'Treinamento PvP',
      'Reunião Geral'
    )
  ),
  data_evento date not null,
  horario text not null,
  local_mapa text not null default 'Navisko / Bellatra (SoD)',
  responsavel text not null,
  recompensa_pontos integer not null default 50,
  status text not null check (status in ('agendado', 'em_andamento', 'concluido', 'cancelado')) default 'agendado',
  destaque boolean not null default false,
  is_exemplo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_eventos_data on public.eventos(data_evento asc);
create index if not exists idx_eventos_categoria on public.eventos(categoria);

-- 7. TABELA DE PARTICIPAÇÕES EM EVENTOS
create table if not exists public.participacoes (
  id text primary key,
  evento_id text not null references public.eventos(id) on delete cascade,
  jogador_id text not null references public.jogadores(id) on delete cascade,
  nickname text not null,
  classe text not null,
  status_presenca text not null check (status_presenca in ('confirmado', 'pendente', 'ausente')) default 'confirmado',
  confirmado_em timestamptz not null default now(),
  unique (evento_id, jogador_id)
);

create index if not exists idx_participacoes_evento_id on public.participacoes(evento_id);
create index if not exists idx_participacoes_jogador_id on public.participacoes(jogador_id);

-- 8. TABELA DE PONTUAÇÕES (Histórico e Critérios do Ranking)
create table if not exists public.pontuacoes (
  id text primary key,
  jogador_id text not null references public.jogadores(id) on delete cascade,
  nickname text not null,
  pontos_alterados integer not null,
  criterio text not null check (
    criterio in ('Level', 'Pontuação', 'Participação em eventos', 'Contribuição ao clã')
  ),
  motivo text not null,
  autor_admin text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pontuacoes_jogador_id on public.pontuacoes(jogador_id);
create index if not exists idx_pontuacoes_created_at on public.pontuacoes(created_at desc);

-- 9. TABELA DE HISTÓRICO ADMINISTRATIVO (Audit Log)
create table if not exists public.historico_administrativo (
  id text primary key,
  acao text not null,
  modulo text not null,
  detalhes text not null,
  autor_nome text not null,
  autor_cargo text not null,
  ip_origem text default 'servidor-interno',
  created_at timestamptz not null default now()
);

create index if not exists idx_historico_created_at on public.historico_administrativo(created_at desc);

-- ============================================================================
-- FUNÇÃO AUXILIAR DE AUTORIZAÇÃO (SECURITY INVOKER)
-- ============================================================================
create or replace function public.is_authorized_admin()
returns boolean
language sql
security invoker
stable
as $$
  select coalesce(
    ((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean,
    exists (
      select 1
      from public.usuarios u
      where u.auth_user_id = (select auth.uid())
        and u.ativo = true
    )
  );
$$;

-- ============================================================================
-- GRANTS E ROW LEVEL SECURITY (RLS)
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant select on public.cargos, public.permissoes, public.cargo_permissoes, public.jogadores, public.avisos, public.eventos, public.participacoes, public.pontuacoes to anon, authenticated;
grant insert, update, delete on public.cargos, public.permissoes, public.cargo_permissoes, public.usuarios, public.jogadores, public.avisos, public.eventos, public.participacoes, public.pontuacoes, public.historico_administrativo to authenticated;
grant select on public.usuarios, public.historico_administrativo to authenticated;

alter table public.cargos enable row level security;
alter table public.permissoes enable row level security;
alter table public.cargo_permissoes enable row level security;
alter table public.usuarios enable row level security;
alter table public.jogadores enable row level security;
alter table public.avisos enable row level security;
alter table public.eventos enable row level security;
alter table public.participacoes enable row level security;
alter table public.pontuacoes enable row level security;
alter table public.historico_administrativo enable row level security;

-- Políticas de Leitura Pública (Portal do Clã)
create policy "Leitura publica de cargos" on public.cargos for select to anon, authenticated using (true);
create policy "Leitura publica de permissoes" on public.permissoes for select to anon, authenticated using (true);
create policy "Leitura publica de cargo_permissoes" on public.cargo_permissoes for select to anon, authenticated using (true);
create policy "Leitura publica de jogadores" on public.jogadores for select to anon, authenticated using (true);
create policy "Leitura publica de avisos" on public.avisos for select to anon, authenticated using (true);
create policy "Leitura publica de eventos" on public.eventos for select to anon, authenticated using (true);
create policy "Leitura publica de participacoes" on public.participacoes for select to anon, authenticated using (true);
create policy "Leitura publica de pontuacoes" on public.pontuacoes for select to anon, authenticated using (true);

-- Políticas de Escrita Administrativa (Apenas Administradores Autorizados)
create policy "Admin gerencia cargos insert" on public.cargos for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin gerencia cargos update" on public.cargos for update to authenticated using (public.is_authorized_admin()) with check (public.is_authorized_admin());
create policy "Admin gerencia cargos delete" on public.cargos for delete to authenticated using (public.is_authorized_admin());

create policy "Admin gerencia jogadores insert" on public.jogadores for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin gerencia jogadores update" on public.jogadores for update to authenticated using (public.is_authorized_admin()) with check (public.is_authorized_admin());
create policy "Admin gerencia jogadores delete" on public.jogadores for delete to authenticated using (public.is_authorized_admin());

create policy "Admin gerencia avisos insert" on public.avisos for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin gerencia avisos update" on public.avisos for update to authenticated using (public.is_authorized_admin()) with check (public.is_authorized_admin());
create policy "Admin gerencia avisos delete" on public.avisos for delete to authenticated using (public.is_authorized_admin());

create policy "Admin gerencia eventos insert" on public.eventos for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin gerencia eventos update" on public.eventos for update to authenticated using (public.is_authorized_admin()) with check (public.is_authorized_admin());
create policy "Admin gerencia eventos delete" on public.eventos for delete to authenticated using (public.is_authorized_admin());

create policy "Admin gerencia participacoes insert" on public.participacoes for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin gerencia participacoes update" on public.participacoes for update to authenticated using (public.is_authorized_admin()) with check (public.is_authorized_admin());
create policy "Admin gerencia participacoes delete" on public.participacoes for delete to authenticated using (public.is_authorized_admin());

create policy "Admin gerencia pontuacoes insert" on public.pontuacoes for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin visualiza usuarios" on public.usuarios for select to authenticated using (public.is_authorized_admin());
create policy "Admin gerencia usuarios insert" on public.usuarios for insert to authenticated with check (public.is_authorized_admin());
create policy "Admin gerencia usuarios update" on public.usuarios for update to authenticated using (public.is_authorized_admin()) with check (public.is_authorized_admin());

create policy "Admin visualiza historico" on public.historico_administrativo for select to authenticated using (public.is_authorized_admin());
create policy "Admin registra historico" on public.historico_administrativo for insert to authenticated with check (public.is_authorized_admin());
