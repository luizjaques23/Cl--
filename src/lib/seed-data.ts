import {
  Aviso,
  Cargo,
  EventoCla,
  HistoricoAdministrativo,
  HistoricoPontuacao,
  Jogador,
  ParticipacaoEvento,
  Permissao,
  UsuarioAdmin,
} from "@/types/portal";

export const INITIAL_PERMISSOES: Permissao[] = [
  {
    id: "perm-jogadores",
    codigo: "gerenciar_jogadores",
    nome: "Gerenciar Jogadores",
    modulo: "Membros",
    descricao: "Cadastrar, editar, promover, alterar status e remover guerreiros do clã.",
  },
  {
    id: "perm-cargos",
    codigo: "gerenciar_cargos",
    nome: "Gerenciar Hierarquia e Cargos",
    modulo: "Hierarquia",
    descricao: "Criar e customizar cargos, insígnias, cores e permissões da hierarquia.",
  },
  {
    id: "perm-avisos",
    codigo: "gerenciar_avisos",
    nome: "Gerenciar Mural de Avisos",
    modulo: "Comunicados",
    descricao: "Publicar, editar, fixar e remover decretos e comunicados oficiais.",
  },
  {
    id: "perm-eventos",
    codigo: "gerenciar_eventos",
    nome: "Gerenciar Eventos & SoD",
    modulo: "Calendário",
    descricao: "Agendar, editar e gerenciar presenças em SoD, Bless Castle e Boss Raids.",
  },
  {
    id: "perm-ranking",
    codigo: "atualizar_ranking",
    nome: "Atualizar Ranking e Pontuações",
    modulo: "Ranking",
    descricao: "Atribuir ou deduzir pontos de mérito, participação em SoD e contribuição.",
  },
  {
    id: "perm-admins",
    codigo: "gerenciar_admins",
    nome: "Gerenciar Administradores",
    modulo: "Segurança",
    descricao: "Cadastrar novos administradores, redefinir acessos e delegar permissões.",
  },
  {
    id: "perm-auditoria",
    codigo: "ver_auditoria",
    nome: "Consultar Histórico Administrativo",
    modulo: "Auditoria",
    descricao: "Visualizar o registro completo de todas as operações administrativas.",
  },
];

export const INITIAL_CARGOS: Cargo[] = [
  {
    id: "cargo-lider",
    nome: "Líder",
    nivel_hierarquia: 1,
    cor_hex: "#D6A33A",
    simbolo: "Crown",
    descricao: "Comandante Supremo do Clã ALCATRAZZ. Autoridade máxima em decisões de guerra, alianças, Bless Castle e conselho administrativo.",
    permissoes_padrao: [
      "gerenciar_jogadores",
      "gerenciar_cargos",
      "gerenciar_avisos",
      "gerenciar_eventos",
      "atualizar_ranking",
      "gerenciar_admins",
      "ver_auditoria",
    ],
  },
  {
    id: "cargo-vice-lider",
    nome: "Vice-líder",
    nivel_hierarquia: 2,
    cor_hex: "#D66A19",
    simbolo: "Flame",
    descricao: "Braço direito do Líder. Assume o comando supremo na ausência do Líder e supervisiona diretamente o Alto Conselho.",
    permissoes_padrao: [
      "gerenciar_jogadores",
      "gerenciar_cargos",
      "gerenciar_avisos",
      "gerenciar_eventos",
      "atualizar_ranking",
      "ver_auditoria",
    ],
  },
  {
    id: "cargo-general",
    nome: "General",
    nivel_hierarquia: 3,
    cor_hex: "#ef4444",
    simbolo: "Swords",
    descricao: "Estrategista de guerra em Bless Castle e Siege of the Darkness (SoD). Coordena os esquadrões de ataque e defesa.",
    permissoes_padrao: [
      "gerenciar_jogadores",
      "gerenciar_avisos",
      "gerenciar_eventos",
      "atualizar_ranking",
      "ver_auditoria",
    ],
  },
  {
    id: "cargo-oficial",
    nome: "Oficial",
    nivel_hierarquia: 4,
    cor_hex: "#eab308",
    simbolo: "ShieldAlert",
    descricao: "Responsável pelo recrutamento, disciplina em campo, organização de grupos de Hunt/XP e confirmação de presença em eventos.",
    permissoes_padrao: ["gerenciar_jogadores", "gerenciar_avisos", "gerenciar_eventos"],
  },
  {
    id: "cargo-veterano",
    nome: "Veterano",
    nivel_hierarquia: 5,
    cor_hex: "#a855f7",
    simbolo: "Award",
    descricao: "Guerreiro de elite com histórico comprovado de lealdade, honra e grandes conquistas em nome da bandeira ALCATRAZZ.",
    permissoes_padrao: ["gerenciar_eventos"],
  },
  {
    id: "cargo-membro",
    nome: "Membro",
    nivel_hierarquia: 6,
    cor_hex: "#3b82f6",
    simbolo: "ShieldCheck",
    descricao: "Combatente oficial integrado à irmandade ALCATRAZZ, ativo nas campanhas de SoD, hunts e defesas de território.",
    permissoes_padrao: [],
  },
  {
    id: "cargo-recruta",
    nome: "Recruta",
    nivel_hierarquia: 7,
    cor_hex: "#9ca3af",
    simbolo: "Shield",
    descricao: "Aspirante em período probatório de avaliação de conduta, frequência em eventos e espírito coletivo.",
    permissoes_padrao: [],
  },
];

// Listas limpas — Prontas para a liderança cadastrar e salvar oficialmente
export const INITIAL_JOGADORES: Jogador[] = [];
export const INITIAL_AVISOS: Aviso[] = [];
export const INITIAL_EVENTOS: EventoCla[] = [];
export const INITIAL_PARTICIPACOES: ParticipacaoEvento[] = [];
export const INITIAL_PONTUACOES: HistoricoPontuacao[] = [];
export const INITIAL_USUARIOS_ADMIN: UsuarioAdmin[] = [];
export const INITIAL_HISTORICO_ADMIN: HistoricoAdministrativo[] = [];
