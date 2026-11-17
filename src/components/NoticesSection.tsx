"use client";

import React, { useState, useMemo } from "react";
import {
  ScrollText,
  Pin,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Flame,
  Calendar,
  User,
  X,
} from "lucide-react";
import { Aviso, NoticeCategory, NoticePriority } from "@/types/portal";

const NOTICE_CATEGORIES: NoticeCategory[] = [
  "Avisos gerais",
  "Regras do clã",
  "Recrutamento",
  "Eventos",
  "Guerras",
  "Comunicados administrativos",
];

interface NoticesSectionProps {
  avisos: Aviso[];
  canManageNotices: boolean;
  onSaveNotice: (aviso: Partial<Aviso>) => Promise<void>;
  onTogglePinNotice: (id: string) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
}

export function NoticesSection({
  avisos,
  canManageNotices,
  onSaveNotice,
  onTogglePinNotice,
  onDeleteNotice,
}: NoticesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [editingNotice, setEditingNotice] = useState<Partial<Aviso> | null>(
    null
  );
  const [deletingNotice, setDeletingNotice] = useState<Aviso | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredNotices = useMemo(() => {
    return [...avisos]
      .filter((a) =>
        selectedCategory === "Todas" ? true : a.categoria === selectedCategory
      )
      .sort((a, b) => {
        if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
        return (
          new Date(b.data_publicacao).getTime() -
          new Date(a.data_publicacao).getTime()
        );
      });
  }, [avisos, selectedCategory]);

  const renderPriorityBadge = (prioridade: NoticePriority) => {
    switch (prioridade) {
      case "urgente":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-950/90 text-rose-300 border border-rose-600/60 shadow-red-glow">
            <Flame className="w-3 h-3 text-[#D66A19]" /> Urgente
          </span>
        );
      case "alta":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-950/90 text-[#D6A33A] border border-[#D6A33A]/50">
            Alta Prioridade
          </span>
        );
      case "baixa":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-stone-900 text-stone-400 border border-stone-700">
            Informativo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-stone-800 text-stone-200 border border-stone-700">
            Normal
          </span>
        );
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    setSubmitting(true);
    try {
      await onSaveNotice(editingNotice);
      setEditingNotice(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNotice) return;
    setSubmitting(true);
    try {
      await onDeleteNotice(deletingNotice.id);
      setDeletingNotice(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="mural"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D6A33A]/15"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#790D16]/30 border border-[#D6A33A]/40 text-[#D6A33A] text-xs uppercase tracking-widest mb-3">
            <ScrollText className="w-3.5 h-3.5" /> Decretos do Conselho
          </div>
          <h2 className="font-medieval text-2xl sm:text-4xl font-extrabold gold-text-gradient tracking-wide">
            MURAL DE AVISOS & COMUNICADOS
          </h2>
          <p className="text-stone-400 mt-2 max-w-2xl text-xs sm:text-base">
            Acompanhe as convocações de guerra, regras do clã, editais de
            recrutamento e decretos oficiais publicados pela liderança ALCATRAZZ.
          </p>
        </div>

        {canManageNotices && (
          <button
            onClick={() =>
              setEditingNotice({
                titulo: "",
                descricao: "",
                categoria: "Avisos gerais",
                prioridade: "normal",
                imagem_url: "",
                fixado: false,
              })
            }
            className="btn-royal-gold w-full md:w-auto justify-center px-5 py-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medieval uppercase tracking-wider min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Publicar Comunicado
          </button>
        )}
      </div>

      {/* Abas de Categorias */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["Todas", ...NOTICE_CATEGORIES].map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medieval uppercase tracking-wider transition border ${
                active
                  ? "bg-gradient-to-r from-[#790D16] to-[#a1131f] text-[#D6A33A] border-[#D6A33A] shadow-gold-glow"
                  : "bg-[#121010] text-stone-400 border-stone-800 hover:border-[#D6A33A]/40 hover:text-stone-200"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid de Comunicados */}
      {filteredNotices.length === 0 ? (
        <div className="medieval-card rounded-2xl p-12 text-center border-2 border-dashed border-[#D6A33A]/40">
          <ScrollText className="w-14 h-14 text-[#D6A33A]/60 mx-auto mb-3" />
          <h3 className="font-medieval text-2xl text-stone-100 font-bold mb-2">
            Nenhum Comunicado no Mural no Momento
          </h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto mb-6">
            O conselho do clã ainda não publicou decretos ou avisos. O Líder pode publicar novas mensagens oficiais e salvar com a senha de confirmação (232356).
          </p>
          <button
            onClick={() =>
              setEditingNotice({
                titulo: "",
                descricao: "",
                categoria: "Avisos gerais",
                prioridade: "normal",
                imagem_url: "",
                fixado: false,
              })
            }
            className="btn-royal-gold px-6 py-3 rounded-xl text-xs font-medieval uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Publicar Primeiro Comunicado
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotices.map((aviso) => (
            <article
              key={aviso.id}
              className={`medieval-card rounded-xl overflow-hidden flex flex-col justify-between ${
                aviso.fixado
                  ? "border-2 border-[#D6A33A] shadow-gold-glow"
                  : ""
              }`}
            >
              <div>
                {aviso.imagem_url && (
                  <div className="relative h-44 w-full overflow-hidden border-b border-[#D6A33A]/30">
                    <img
                      src={aviso.imagem_url}
                      alt={aviso.titulo}
                      className="w-full h-full object-cover opacity-80 hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {aviso.fixado && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D6A33A] text-black font-medieval font-bold text-[11px] uppercase">
                          <Pin className="w-3 h-3" /> Fixado
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded bg-[#790D16]/40 border border-[#D6A33A]/30 text-[#D6A33A] text-xs font-medium">
                        {aviso.categoria}
                      </span>
                      {renderPriorityBadge(aviso.prioridade)}
                    </div>

                    {aviso.is_exemplo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800 uppercase">
                        Exemplo
                      </span>
                    )}
                  </div>

                  <h3 className="font-medieval text-xl font-bold text-stone-100 mb-2">
                    {aviso.titulo}
                  </h3>
                  <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-line">
                    {aviso.descricao}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-black/50 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-stone-300">
                    <User className="w-3.5 h-3.5 text-[#D6A33A]" />
                    <strong>{aviso.autor}</strong> ({aviso.autor_cargo})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    {new Date(aviso.data_publicacao).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {canManageNotices && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePinNotice(aviso.id)}
                      className={`p-1.5 rounded border transition ${
                        aviso.fixado
                          ? "bg-[#D6A33A] text-black border-[#D6A33A]"
                          : "bg-stone-900 text-stone-300 border-stone-700 hover:border-[#D6A33A]"
                      }`}
                      title={aviso.fixado ? "Desafixar" : "Fixar no Topo"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingNotice({ ...aviso })}
                      className="p-1.5 rounded bg-[#D6A33A]/15 hover:bg-[#D6A33A]/30 text-[#D6A33A] border border-[#D6A33A]/40 transition"
                      title="Editar Comunicado"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingNotice(aviso)}
                      className="p-1.5 rounded bg-[#790D16]/30 hover:bg-[#790D16]/60 text-rose-300 border border-rose-800/50 transition"
                      title="Excluir Comunicado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal de Publicação / Edição */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="medieval-card rounded-2xl max-w-lg w-full p-6 relative border-2 border-[#D6A33A]/60 my-8">
            <button
              onClick={() => setEditingNotice(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-medieval text-2xl font-bold gold-text-gradient mb-1">
              {editingNotice.id ? "Editar Comunicado" : "Novo Comunicado Oficial"}
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Publique avisos, regras, convocações de guerra ou recrutamento.
            </p>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Título do Comunicado *
                </label>
                <input
                  type="text"
                  required
                  value={editingNotice.titulo || ""}
                  onChange={(e) =>
                    setEditingNotice({ ...editingNotice, titulo: e.target.value })
                  }
                  placeholder="Ex: Convocação Oficial para o Bless Castle"
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editingNotice.categoria || "Avisos gerais"}
                    onChange={(e) =>
                      setEditingNotice({
                        ...editingNotice,
                        categoria: e.target.value as NoticeCategory,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    {NOTICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Prioridade
                  </label>
                  <select
                    value={editingNotice.prioridade || "normal"}
                    onChange={(e) =>
                      setEditingNotice({
                        ...editingNotice,
                        prioridade: e.target.value as NoticePriority,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    <option value="baixa">Baixa / Informativo</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta Prioridade</option>
                    <option value="urgente">Urgente / Guerra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Descrição Completa *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingNotice.descricao || ""}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      descricao: e.target.value,
                    })
                  }
                  placeholder="Escreva o conteúdo detalhado do decreto..."
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  URL de Imagem Ilustrativa (Opcional)
                </label>
                <input
                  type="text"
                  value={editingNotice.imagem_url || ""}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      imagem_url: e.target.value,
                    })
                  }
                  placeholder="Ex: /assets/hero-castle.jpg"
                  className="input-medieval w-full text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingNotice.fixado)}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      fixado: e.target.checked,
                    })
                  }
                  className="rounded border-stone-700"
                />
                Fixar este comunicado no topo do Mural de Avisos
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-6 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  {submitting ? "Publicando..." : "Salvar Comunicado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {deletingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="medieval-card rounded-2xl max-w-md w-full p-6 border-2 border-[#790D16]">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-medieval text-xl font-bold">
                Excluir Comunicado
              </h3>
            </div>
            <p className="text-sm text-stone-300 mb-6">
              Deseja realmente remover o comunicado{" "}
              <strong className="text-[#D6A33A]">{deletingNotice.titulo}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingNotice(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="btn-blood-crimson px-5 py-2 rounded-lg text-xs font-medieval uppercase"
              >
                {submitting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
