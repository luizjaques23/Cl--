"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Edit3,
  Trash2,
  Eye,
  Shield,
  Calendar,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  AlertTriangle,
  Crown,
} from "lucide-react";
import {
  Cargo,
  Jogador,
  PermissionCode,
  PlayerClass,
  PlayerStatus,
  PlayerTribe,
} from "@/types/portal";
import { RoleBadge, renderClassIcon } from "./RoleBadge";

const CLASSES_PRISTON: PlayerClass[] = [
  "Cavaleiro",
  "Pike",
  "Atalanta",
  "Sacerdotisa",
  "Mago",
  "Mecânico",
  "Lutador",
  "Arqueira",
  "Assassina",
  "Xamã",
  "Guerreira",
];

interface MembersSectionProps {
  jogadores: Jogador[];
  cargos: Cargo[];
  canManagePlayers: boolean;
  onSavePlayer: (player: Partial<Jogador>) => Promise<void>;
  onDeletePlayer: (id: string) => Promise<void>;
  onOpenAdminAuth: () => void;
}

export function MembersSection({
  jogadores,
  cargos,
  canManagePlayers,
  onSavePlayer,
  onDeletePlayer,
  onOpenAdminAuth,
}: MembersSectionProps) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("todas");
  const [cargoFilter, setCargoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [minLevel, setMinLevel] = useState<string>("");

  const [selectedPlayer, setSelectedPlayer] = useState<Jogador | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Jogador> | null>(
    null
  );
  const [deletingPlayer, setDeletingPlayer] = useState<Jogador | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cargoMap = useMemo(() => {
    const map = new Map<string, Cargo>();
    cargos.forEach((c) => map.set(c.id, c));
    return map;
  }, [cargos]);

  const filteredPlayers = useMemo(() => {
    return jogadores
      .filter((j) => {
        if (
          search.trim() &&
          !j.nickname.toLowerCase().includes(search.trim().toLowerCase())
        ) {
          return false;
        }
        if (classFilter !== "todas" && j.classe !== classFilter) {
          return false;
        }
        if (cargoFilter !== "todos" && j.cargo_id !== cargoFilter) {
          return false;
        }
        if (statusFilter !== "todos" && j.status !== statusFilter) {
          return false;
        }
        if (minLevel && j.level < Number(minLevel)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const cA = cargoMap.get(a.cargo_id)?.nivel_hierarquia ?? 99;
        const cB = cargoMap.get(b.cargo_id)?.nivel_hierarquia ?? 99;
        if (cA !== cB) return cA - cB;
        return b.level - a.level;
      });
  }, [jogadores, search, classFilter, cargoFilter, statusFilter, minLevel, cargoMap]);

  const openNewPlayerModal = () => {
    setEditingPlayer({
      nickname: "",
      classe: "Cavaleiro",
      tribo: "Morion",
      level: 140,
      cargo_id: cargos[cargos.length - 1]?.id || "cargo-recruta",
      data_entrada: new Date().toISOString().split("T")[0],
      avatar_url: "/assets/alcatrazz-crest.jpg",
      status: "ativo",
      observacoes_administrativas: "",
      pontuacao: 1500,
      participacoes_eventos: 1,
      contribuicao_cla: 200,
      is_lider_destaque: false,
    });
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setSubmitting(true);
    try {
      await onSavePlayer(editingPlayer);
      setEditingPlayer(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlayer) return;
    setSubmitting(true);
    try {
      await onDeletePlayer(deletingPlayer.id);
      setDeletingPlayer(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: PlayerStatus) => {
    if (status === "ativo") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
          <CheckCircle2 className="w-3 h-3" /> Ativo
        </span>
      );
    }
    if (status === "afastado") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-700/50">
          <Clock className="w-3 h-3" /> Afastado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-700/50">
        <XCircle className="w-3 h-3" /> Inativo
      </span>
    );
  };

  return (
    <section id="membros" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#790D16]/30 border border-[#D6A33A]/40 text-[#D6A33A] text-xs uppercase tracking-widest mb-3">
            <Shield className="w-3.5 h-3.5" /> Exército Imortal • Priston Tale
          </div>
          <h2 className="font-medieval text-3xl sm:text-4xl font-extrabold gold-text-gradient tracking-wide">
            SISTEMA DE MEMBROS & GUERREIROS
          </h2>
          <p className="text-stone-400 mt-2 max-w-2xl text-sm sm:text-base">
            Consulte o efetivo oficial da irmandade ALCATRAZZ. Filtre por classe de
            combate, patente hierárquica, nível ou pesquise guerreiros pelo nickname.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManagePlayers ? (
            <button
              onClick={openNewPlayerModal}
              className="btn-royal-gold px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medieval tracking-wider uppercase"
            >
              <UserPlus className="w-4 h-4" /> Alistar Guerreiro
            </button>
          ) : (
            <button
              onClick={onOpenAdminAuth}
              className="btn-blood-crimson px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medieval tracking-wider uppercase"
            >
              <Crown className="w-4 h-4 text-[#D6A33A]" /> Gerenciar Efetivo (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros Medievais */}
      <div className="medieval-card rounded-xl p-4 sm:p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pesquisa por Nickname */}
          <div className="lg:col-span-2 relative">
            <label className="block text-xs uppercase tracking-wider text-[#D6A33A] mb-1.5 font-medieval">
              Pesquisar por Nickname
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: LordZephira, ValkyriaBlood..."
                className="input-medieval w-full pl-10 text-sm"
              />
            </div>
          </div>

          {/* Filtro por Classe */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#D6A33A] mb-1.5 font-medieval">
              Classe
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="input-medieval w-full text-sm"
            >
              <option value="todas">Todas as Classes</option>
              {CLASSES_PRISTON.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Cargo */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#D6A33A] mb-1.5 font-medieval">
              Cargo / Patente
            </label>
            <select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="input-medieval w-full text-sm"
            >
              <option value="todos">Todos os Cargos</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Level Mínimo e Status */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D6A33A] mb-1.5 font-medieval">
                Level Mín.
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={minLevel}
                onChange={(e) => setMinLevel(e.target.value)}
                placeholder="Ex: 150"
                className="input-medieval w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D6A33A] mb-1.5 font-medieval">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-medieval w-full text-sm"
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="afastado">Afastado</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#D6A33A]" />
            <span>
              Exibindo <strong className="text-stone-200">{filteredPlayers.length}</strong> de{" "}
              <strong className="text-stone-200">{jogadores.length}</strong> integrantes cadastrados
            </span>
          </div>
          {(search ||
            classFilter !== "todas" ||
            cargoFilter !== "todos" ||
            statusFilter !== "todos" ||
            minLevel) && (
            <button
              onClick={() => {
                setSearch("");
                setClassFilter("todas");
                setCargoFilter("todos");
                setStatusFilter("todos");
                setMinLevel("");
              }}
              className="text-[#D6A33A] hover:underline"
            >
              Limpar filtros ativos
            </button>
          )}
        </div>
      </div>

      {/* Grid de Cards de Membros */}
      {jogadores.length === 0 ? (
        <div className="medieval-card rounded-2xl p-12 text-center border-2 border-dashed border-[#D6A33A]/40">
          <Shield className="w-14 h-14 text-[#D6A33A]/60 mx-auto mb-3" />
          <h3 className="font-medieval text-2xl text-stone-100 font-bold mb-2">
            Nenhum Guerreiro Alistado no Clã Ainda
          </h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto mb-6">
            O efetivo oficial da ALCATRAZZ aguarda o cadastro de seus membros. O Líder pode cadastrar novos guerreiros e salvar diretamente com a senha de confirmação (232356).
          </p>
          <button
            onClick={openNewPlayerModal}
            className="btn-royal-gold px-6 py-3 rounded-xl text-xs font-medieval uppercase tracking-wider inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Alistar Primeiro Guerreiro
          </button>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="medieval-card rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-[#D6A33A]/50 mx-auto mb-3" />
          <h3 className="font-medieval text-xl text-stone-200">
            Nenhum guerreiro encontrado com estes filtros
          </h3>
          <p className="text-stone-400 text-sm mt-1">
            Ajuste os critérios de busca por nickname, classe, level ou cargo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => {
            const cargo = cargoMap.get(player.cargo_id);
            return (
              <div
                key={player.id}
                className="medieval-card rounded-xl p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card: Avatar, Nickname, Level e Cargo */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={player.avatar_url || "/assets/alcatrazz-crest.jpg"}
                        alt={player.nickname}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-[#D6A33A]/70 shadow-gold-glow"
                      />
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-gradient-to-r from-[#790D16] to-[#D66A19] text-white font-medieval font-bold text-xs border border-[#D6A33A]">
                        Lv.{player.level}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medieval text-lg font-bold text-stone-100 truncate group-hover:text-[#D6A33A] transition-colors">
                          {player.nickname}
                        </h3>
                        {player.is_exemplo && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-stone-800/90 text-[#D6A33A] border border-[#D6A33A]/30 uppercase tracking-wider shrink-0">
                            Exemplo
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <RoleBadge cargo={cargo} size="sm" />
                        {renderStatusBadge(player.status)}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-stone-300">
                        <span className="inline-flex items-center gap-1 text-[#D6A33A]">
                          {renderClassIcon(player.classe, "w-3.5 h-3.5")}
                          {player.classe}
                        </span>
                        <span className="text-stone-600">•</span>
                        <span className="text-stone-400">{player.tribo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Métricas do Guerreiro */}
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-stone-800/80 text-center">
                    <div className="bg-black/40 rounded-lg p-2 border border-stone-800/80">
                      <div className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3 text-[#D6A33A]" /> Pontos
                      </div>
                      <div className="font-medieval font-bold text-sm text-[#D6A33A] mt-0.5">
                        {player.pontuacao.toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2 border border-stone-800/80">
                      <div className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-[#D66A19]" /> Eventos
                      </div>
                      <div className="font-medieval font-bold text-sm text-stone-200 mt-0.5">
                        {player.participacoes_eventos}
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2 border border-stone-800/80">
                      <div className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" /> Entrada
                      </div>
                      <div className="font-semibold text-xs text-stone-300 mt-1">
                        {new Date(player.data_entrada + "T12:00:00").toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                    </div>
                  </div>

                  {player.observacoes_administrativas && (
                    <p className="mt-3 text-xs text-stone-400 line-clamp-2 italic bg-black/30 p-2.5 rounded border-l-2 border-[#790D16]">
                      {player.observacoes_administrativas}
                    </p>
                  )}
                </div>

                {/* Ações do Card */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-stone-800/60">
                  <button
                    onClick={() => setSelectedPlayer(player)}
                    className="flex-1 py-1.5 px-3 rounded bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/70 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D6A33A]" /> Consultar Ficha
                  </button>

                  {canManagePlayers && (
                    <>
                      <button
                        onClick={() => setEditingPlayer({ ...player })}
                        className="p-1.5 rounded bg-[#D6A33A]/15 hover:bg-[#D6A33A]/30 text-[#D6A33A] border border-[#D6A33A]/40 transition"
                        title="Editar Jogador"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPlayer(player)}
                        className="p-1.5 rounded bg-[#790D16]/30 hover:bg-[#790D16]/60 text-rose-300 border border-rose-800/50 transition"
                        title="Remover Jogador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Consulta Detalhada do Guerreiro */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="medieval-card rounded-2xl max-w-lg w-full p-6 relative border-2 border-[#D6A33A]/60">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedPlayer.avatar_url || "/assets/alcatrazz-crest.jpg"}
                alt={selectedPlayer.nickname}
                className="w-20 h-20 rounded-xl object-cover border-2 border-[#D6A33A]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medieval text-2xl font-bold gold-text-gradient">
                    {selectedPlayer.nickname}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-[#790D16] text-[#D6A33A] font-medieval text-xs font-bold border border-[#D6A33A]/40">
                    Lv. {selectedPlayer.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RoleBadge cargo={cargoMap.get(selectedPlayer.cargo_id)} />
                  {renderStatusBadge(selectedPlayer.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-black/50 p-3 rounded-lg border border-stone-800">
                <span className="text-xs text-stone-400 block">Classe & Tribo</span>
                <span className="font-semibold text-stone-100">
                  {selectedPlayer.classe} ({selectedPlayer.tribo})
                </span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border border-stone-800">
                <span className="text-xs text-stone-400 block">Data de Alistamento</span>
                <span className="font-semibold text-stone-100">
                  {new Date(
                    selectedPlayer.data_entrada + "T12:00:00"
                  ).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border border-stone-800">
                <span className="text-xs text-stone-400 block">Pontuação Geral</span>
                <span className="font-medieval font-bold text-[#D6A33A]">
                  {selectedPlayer.pontuacao.toLocaleString("pt-BR")} pts
                </span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border border-stone-800">
                <span className="text-xs text-stone-400 block">
                  Presenças em SoD / Eventos
                </span>
                <span className="font-semibold text-stone-100">
                  {selectedPlayer.participacoes_eventos} participações (Contrib.:{" "}
                  {selectedPlayer.contribuicao_cla})
                </span>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded-lg border border-stone-800 mb-6">
              <span className="text-xs uppercase tracking-wider text-[#D6A33A] font-medieval block mb-1">
                Observações Administrativas
              </span>
              <p className="text-sm text-stone-300">
                {selectedPlayer.observacoes_administrativas ||
                  "Sem observações adicionais registradas pelo conselho."}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              {canManagePlayers && (
                <button
                  onClick={() => {
                    const p = selectedPlayer;
                    setSelectedPlayer(null);
                    setEditingPlayer({ ...p });
                  }}
                  className="btn-royal-gold px-4 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  Editar Registro
                </button>
              )}
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Jogador */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="medieval-card rounded-2xl max-w-xl w-full p-6 relative border-2 border-[#D6A33A]/60 my-8">
            <button
              onClick={() => setEditingPlayer(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-medieval text-2xl font-bold gold-text-gradient mb-1">
              {editingPlayer.id ? "Editar Guerreiro" : "Alistar Novo Guerreiro"}
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Preencha os dados oficiais do membro para o registro do clã ALCATRAZZ.
            </p>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Nickname In-Game *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlayer.nickname || ""}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, nickname: e.target.value })
                    }
                    placeholder="Ex: ArchangelPT"
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Classe (Priston Tale) *
                  </label>
                  <select
                    value={editingPlayer.classe || "Cavaleiro"}
                    onChange={(e) => {
                      const cls = e.target.value as PlayerClass;
                      const morionClasses: PlayerClass[] = [
                        "Cavaleiro",
                        "Atalanta",
                        "Sacerdotisa",
                        "Mago",
                        "Xamã",
                      ];
                      const tribo: PlayerTribe = morionClasses.includes(cls)
                        ? "Morion"
                        : "Tempskron";
                      setEditingPlayer({ ...editingPlayer, classe: cls, tribo });
                    }}
                    className="input-medieval w-full text-sm"
                  >
                    {CLASSES_PRISTON.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Level Atual *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={200}
                    value={editingPlayer.level ?? 140}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        level: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Cargo no Clã *
                  </label>
                  <select
                    value={editingPlayer.cargo_id || ""}
                    onChange={(e) =>
                      setEditingPlayer({ ...editingPlayer, cargo_id: e.target.value })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Status do Membro
                  </label>
                  <select
                    value={editingPlayer.status || "ativo"}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        status: e.target.value as PlayerStatus,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="afastado">Afastado</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Data de Entrada
                  </label>
                  <input
                    type="date"
                    value={editingPlayer.data_entrada || ""}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        data_entrada: e.target.value,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Pontuação de Mérito
                  </label>
                  <input
                    type="number"
                    value={editingPlayer.pontuacao ?? 1000}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        pontuacao: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    URL da Foto / Avatar
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.avatar_url || ""}
                    onChange={(e) =>
                      setEditingPlayer({
                        ...editingPlayer,
                        avatar_url: e.target.value,
                      })
                    }
                    placeholder="/assets/alcatrazz-crest.jpg"
                    className="input-medieval w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Observações Administrativas
                </label>
                <textarea
                  rows={3}
                  value={editingPlayer.observacoes_administrativas || ""}
                  onChange={(e) =>
                    setEditingPlayer({
                      ...editingPlayer,
                      observacoes_administrativas: e.target.value,
                    })
                  }
                  placeholder="Especialidade em SoD, horário disponível, builds e histórico em Bless Castle..."
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-6 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  {submitting ? "Salvando..." : "Salvar Guerreiro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="medieval-card rounded-2xl max-w-md w-full p-6 border-2 border-[#790D16]">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="font-medieval text-xl font-bold">
                Confirmar Remoção do Clã
              </h3>
            </div>
            <p className="text-sm text-stone-300 mb-6">
              Tem certeza que deseja remover o guerreiro{" "}
              <strong className="text-[#D6A33A]">{deletingPlayer.nickname}</strong> (
              {deletingPlayer.classe} Lv.{deletingPlayer.level}) dos registros da
              ALCATRAZZ? Esta operação ficará registrada no histórico administrativo.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingPlayer(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="btn-blood-crimson px-5 py-2 rounded-lg text-xs font-medieval uppercase"
              >
                {submitting ? "Removendo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
