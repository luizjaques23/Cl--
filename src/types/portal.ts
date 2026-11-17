export type PlayerClass =
  | "Lutador"
  | "Mecânico"
  | "Arqueira"
  | "Pike"
  | "Atalanta"
  | "Cavaleiro"
  | "Mago"
  | "Sacerdotisa"
  | "Assassina"
  | "Xamã"
  | "Guerreira";

export type PlayerTribe = "Tempskron" | "Morion";

export type PlayerStatus = "ativo" | "inativo" | "afastado";

export type NoticeCategory =
  | "Avisos gerais"
  | "Regras do clã"
  | "Recrutamento"
  | "Eventos"
  | "Guerras"
  | "Comunicados administrativos";

export type NoticePriority = "baixa" | "normal" | "alta" | "urgente";

export type EventCategory =
  | "SoD (Siege of the Darkness)"
  | "Bless Castle"
  | "Hunt & Boss Raid"
  | "Guerra de Clãs"
  | "Treinamento PvP"
  | "Reunião Geral";

export type EventStatus = "agendado" | "em_andamento" | "concluido" | "cancelado";

export type PermissionCode =
  | "gerenciar_jogadores"
  | "gerenciar_cargos"
  | "gerenciar_avisos"
  | "gerenciar_eventos"
  | "atualizar_ranking"
  | "gerenciar_admins"
  | "ver_auditoria";

export interface Permissao {
  id: string;
  codigo: PermissionCode;
  nome: string;
  modulo: string;
  descricao: string;
}

export interface Cargo {
  id: string;
  nome: string;
  nivel_hierarquia: number; // 1 = Líder ... 7 = Recruta
  cor_hex: string;
  simbolo: string; // Crown, ShieldAlert, Swords, Award, ShieldCheck, Shield, UserPlus
  descricao: string;
  permissoes_padrao: PermissionCode[];
  is_exemplo?: boolean;
}

export interface Jogador {
  id: string;
  nickname: string;
  classe: PlayerClass;
  tribo: PlayerTribe;
  level: number;
  cargo_id: string;
  data_entrada: string; // YYYY-MM-DD
  avatar_url: string;
  status: PlayerStatus;
  observacoes_administrativas: string;
  pontuacao: number;
  participacoes_eventos: number;
  contribuicao_cla: number;
  is_lider_destaque?: boolean;
  is_exemplo?: boolean;
}

export interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  autor: string;
  autor_cargo: string;
  data_publicacao: string; // ISO
  categoria: NoticeCategory;
  imagem_url?: string;
  prioridade: NoticePriority;
  fixado: boolean;
  is_exemplo?: boolean;
}

export interface ParticipacaoEvento {
  id: string;
  evento_id: string;
  jogador_id: string;
  nickname: string;
  classe: PlayerClass;
  status_presenca: "confirmado" | "pendente" | "ausente";
  confirmado_em: string;
}

export interface EventoCla {
  id: string;
  titulo: string;
  descricao: string;
  categoria: EventCategory;
  data_evento: string; // YYYY-MM-DD
  horario: string; // HH:mm
  local_mapa: string;
  responsavel: string;
  recompensa_pontos: number;
  status: EventStatus;
  destaque: boolean;
  is_exemplo?: boolean;
}

export interface HistoricoPontuacao {
  id: string;
  jogador_id: string;
  nickname: string;
  pontos_alterados: number;
  criterio: "Level" | "Pontuação" | "Participação em eventos" | "Contribuição ao clã";
  motivo: string;
  autor_admin: string;
  created_at: string;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  nickname_in_game: string;
  cargo_id: string;
  permissoes_extras: PermissionCode[];
  ativo: boolean;
  ultimo_acesso?: string;
  is_exemplo?: boolean;
  created_at: string;
}

export interface HistoricoAdministrativo {
  id: string;
  acao: string;
  modulo: string;
  detalhes: string;
  autor_nome: string;
  autor_cargo: string;
  created_at: string;
}

export interface PortalDatabaseState {
  cargos: Cargo[];
  permissoes: Permissao[];
  jogadores: Jogador[];
  avisos: Aviso[];
  eventos: EventoCla[];
  participacoes: ParticipacaoEvento[];
  pontuacoes: HistoricoPontuacao[];
  usuarios: UsuarioAdmin[];
  historico_administrativo: HistoricoAdministrativo[];
  storage_mode: "supabase" | "local_server_db";
  last_updated: string;
}
