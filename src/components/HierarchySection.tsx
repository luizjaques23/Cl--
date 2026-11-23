"use client";

import React, { useState } from "react";
import {
  Crown,
  ChevronUp,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  Shield,
  Users,
  X,
  Check,
} from "lucide-react";
import { Cargo, Jogador, Permissao, PermissionCode } from "@/types/portal";
import { RoleBadge, renderRankIcon } from "./RoleBadge";

const AVAILABLE_SYMBOLS = [
  "Crown",
  "Flame",
  "Swords",
  "ShieldAlert",
  "Award",
  "ShieldCheck",
  "Shield",
  "Star",
];

interface HierarchySectionProps {
  cargos: Cargo[];
  jogadores: Jogador[];
  permissoes: Permissao[];
  canManageRoles: boolean;
  onChangePlayerRole: (jogadorId: string, novoCargoId: string) => Promise<void>;
  onSaveCargo: (cargo: Partial<Cargo>) => Promise<void>;
  onDeleteCargo: (id: string) => Promise<void>;
}

export function HierarchySection({
  cargos,
  jogadores,
  permissoes,
  canManageRoles,
  onChangePlayerRole,
  onSaveCargo,
  onDeleteCargo,
}: HierarchySectionProps) {
  const [editingCargo, setEditingCargo] = useState<Partial<Cargo> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedCargos = [...cargos].sort(
    (a, b) => a.nivel_hierarquia - b.nivel_hierarquia
  );

  const handlePromoteOrDemote = async (
    player: Jogador,
    direction: "promote" | "demote"
  ) => {
    const currentIndex = sortedCargos.findIndex((c) => c.id === player.cargo_id);
    if (currentIndex === -1) return;
    const targetIndex =
      direction === "promote" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCargos.length) return;
    await onChangePlayerRole(player.id, sortedCargos[targetIndex].id);
  };

  const togglePermissao = (code: PermissionCode) => {
    if (!editingCargo) return;
    const current = editingCargo.permissoes_padrao || [];
    const exists = current.includes(code);
    setEditingCargo({
      ...editingCargo,
      permissoes_padrao: exists
        ? current.filter((p) => p !== code)
        : [...current, code],
    });
  };

  const handleSaveCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCargo) return;
    setSubmitting(true);
    try {
      await onSaveCargo(editingCargo);
      setEditingCargo(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="hierarquia"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D6A33A]/15"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src="/assets/alcatrazz-crest.jpg"
            alt="Logo Oficial ALCATRAZZ"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#D6A33A] shadow-gold-glow shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#581c87]/40 border border-[#a855f7]/50 text-[#e879f9] text-xs uppercase tracking-widest mb-2">
              <Crown className="w-3.5 h-3.5" /> Cadeia de Comando Imperial
            </div>
            <h2 className="font-medieval text-2xl sm:text-4xl font-extrabold gold-text-gradient tracking-wide">
              HIERARQUIA OFICIAL DO CLÃ
            </h2>
            <p className="text-stone-400 mt-1.5 max-w-2xl text-xs sm:text-base">
              A estrutura de autoridade da ALCATRAZZ é forjada em mérito, disciplina e
              lealdade em campo de batalha. Cada patente detém insígnias e atribuições
              exclusivas.
            </p>
          </div>
        </div>

        {canManageRoles && (
          <button
            onClick={() =>
              setEditingCargo({
                nome: "",
                nivel_hierarquia: sortedCargos.length + 1,
                cor_hex: "#D6A33A",
                simbolo: "Shield",
                descricao: "",
                permissoes_padrao: [],
              })
            }
            className="btn-royal-gold px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medieval uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Criar Nova Patente
          </button>
        )}
      </div>

      {/* Pirâmide / Escada Hierárquica */}
      <div className="space-y-5">
        {sortedCargos.map((cargo, idx) => {
          const membrosCargo = jogadores.filter((j) => j.cargo_id === cargo.id);
          return (
            <div
              key={cargo.id}
              className="medieval-card rounded-xl p-5 sm:p-6 transition-all"
              style={{
                borderLeft: `4px solid ${cargo.cor_hex}`,
              }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${cargo.cor_hex}20`,
                      borderColor: `${cargo.cor_hex}70`,
                      color: cargo.cor_hex,
                      boxShadow: `0 0 18px ${cargo.cor_hex}30`,
                    }}
                  >
                    {renderRankIcon(cargo.simbolo, "w-6 h-6")}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                        Nível {cargo.nivel_hierarquia}
                      </span>
                      <h3
                        className="font-medieval text-xl font-bold tracking-wide"
                        style={{ color: cargo.cor_hex }}
                      >
                        {cargo.nome}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs text-stone-400 bg-black/50 px-2.5 py-0.5 rounded-full border border-stone-800">
                        <Users className="w-3.5 h-3.5 text-[#D6A33A]" />
                        {membrosCargo.length} integrante(s)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-300 mt-1">
                      {cargo.descricao}
                    </p>
                  </div>
                </div>

                {/* Permissões e Ações Administrativas da Patente */}
                <div className="flex flex-wrap items-center gap-2">
                  {cargo.permissoes_padrao.length > 0 ? (
                    <span className="text-[11px] px-2.5 py-1 rounded bg-[#790D16]/30 text-[#D6A33A] border border-[#D6A33A]/30">
                      {cargo.permissoes_padrao.length} permissão(ões) administrativa(s)
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-1 rounded bg-stone-900 text-stone-400 border border-stone-800">
                      Patente de Combatente
                    </span>
                  )}

                  {canManageRoles && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => setEditingCargo({ ...cargo })}
                        className="p-1.5 rounded bg-[#D6A33A]/15 hover:bg-[#D6A33A]/30 text-[#D6A33A] border border-[#D6A33A]/40 transition"
                        title="Customizar Cargo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {membrosCargo.length === 0 && (
                        <button
                          onClick={() => onDeleteCargo(cargo.id)}
                          className="p-1.5 rounded bg-[#790D16]/30 hover:bg-[#790D16]/60 text-rose-300 border border-rose-800/50 transition"
                          title="Excluir Cargo Vazio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Guerreiros neste Cargo */}
              <div className="mt-4">
                {membrosCargo.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">
                    Nenhum guerreiro designado para esta patente no momento.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {membrosCargo.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-2 bg-black/50 p-2.5 rounded-lg border border-stone-800/90 hover:border-[#D6A33A]/40 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={player.avatar_url || "/assets/alcatrazz-crest.jpg"}
                            alt={player.nickname}
                            className="w-9 h-9 rounded-md object-cover border border-[#D6A33A]/50"
                          />
                          <div className="min-w-0">
                            <div className="font-medieval font-bold text-sm text-stone-100 truncate">
                              {player.nickname}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              {player.classe} • Lv.{player.level}
                            </div>
                          </div>
                        </div>

                        {canManageRoles && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => handlePromoteOrDemote(player, "promote")}
                              className="p-1 rounded bg-emerald-950/70 hover:bg-emerald-900 disabled:opacity-30 text-emerald-400 border border-emerald-700/50"
                              title="Promover Patente"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === sortedCargos.length - 1}
                              onClick={() => handlePromoteOrDemote(player, "demote")}
                              className="p-1 rounded bg-amber-950/70 hover:bg-amber-900 disabled:opacity-30 text-amber-400 border border-amber-700/50"
                              title="Rebaixar Patente"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Cargo */}
      {editingCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="medieval-card rounded-2xl max-w-lg w-full p-6 relative border-2 border-[#D6A33A]/60 my-8">
            <button
              onClick={() => setEditingCargo(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-medieval text-2xl font-bold gold-text-gradient mb-1">
              {editingCargo.id ? "Personalizar Patente" : "Criar Nova Patente"}
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Configure o nome, cor metálica, símbolo e permissões desta patente.
            </p>

            <form onSubmit={handleSaveCargoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Nome do Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCargo.nome || ""}
                    onChange={(e) =>
                      setEditingCargo({ ...editingCargo, nome: e.target.value })
                    }
                    placeholder="Ex: Comandante de SoD"
                    className="input-medieval w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Nível (Ordem)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingCargo.nivel_hierarquia ?? 1}
                    onChange={(e) =>
                      setEditingCargo({
                        ...editingCargo,
                        nivel_hierarquia: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Cor Identificadora (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCargo.cor_hex || "#D6A33A"}
                      onChange={(e) =>
                        setEditingCargo({ ...editingCargo, cor_hex: e.target.value })
                      }
                      className="w-10 h-10 rounded bg-black border border-stone-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingCargo.cor_hex || "#D6A33A"}
                      onChange={(e) =>
                        setEditingCargo({ ...editingCargo, cor_hex: e.target.value })
                      }
                      className="input-medieval flex-1 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Símbolo / Insígnia
                  </label>
                  <select
                    value={editingCargo.simbolo || "Shield"}
                    onChange={(e) =>
                      setEditingCargo({ ...editingCargo, simbolo: e.target.value })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    {AVAILABLE_SYMBOLS.map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Descrição e Responsabilidades
                </label>
                <textarea
                  rows={2}
                  value={editingCargo.descricao || ""}
                  onChange={(e) =>
                    setEditingCargo({ ...editingCargo, descricao: e.target.value })
                  }
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-2">
                  Permissões Administrativas do Cargo
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {permissoes.map((p) => {
                    const checked = (
                      editingCargo.permissoes_padrao || []
                    ).includes(p.codigo);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePermissao(p.codigo)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                          checked
                            ? "bg-[#790D16]/40 border-[#D6A33A] text-stone-100"
                            : "bg-black/40 border-stone-800 text-stone-400"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-stone-200">{p.nome}</div>
                          <div className="text-[11px] text-stone-400">
                            {p.descricao}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            checked
                              ? "bg-[#D6A33A] border-[#D6A33A] text-black"
                              : "border-stone-700"
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingCargo(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-6 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  {submitting ? "Salvando..." : "Salvar Patente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
