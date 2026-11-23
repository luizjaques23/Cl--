"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Flame,
  Swords,
  Clock,
  MapPin,
  UserCheck,
  Users,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Trophy,
  History,
  LayoutGrid,
  ListFilter,
} from "lucide-react";
import {
  EventCategory,
  EventoCla,
  EventStatus,
  Jogador,
  ParticipacaoEvento,
  PlayerClass,
} from "@/types/portal";

const EVENT_CATEGORIES: EventCategory[] = [
  "SoD (Siege of the Darkness)",
  "Bless Castle",
  "Hunt & Boss Raid",
  "Guerra de Clãs",
  "Treinamento PvP",
  "Reunião Geral",
];

interface EventsSectionProps {
  eventos: EventoCla[];
  participacoes: ParticipacaoEvento[];
  jogadores: Jogador[];
  canManageEvents: boolean;
  onSaveEvent: (evt: Partial<EventoCla>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onConfirmPresence: (payload: {
    evento_id: string;
    jogador_id?: string;
    nickname: string;
    classe: PlayerClass;
  }) => Promise<void>;
}

export function EventsSection({
  eventos,
  participacoes,
  jogadores,
  canManageEvents,
  onSaveEvent,
  onDeleteEvent,
  onConfirmPresence,
}: EventsSectionProps) {
  const [viewMode, setViewMode] = useState<"mensal" | "semanal" | "anteriores">(
    "mensal"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [confirmingEvent, setConfirmingEvent] = useState<EventoCla | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    jogadores[0]?.id || ""
  );
  const [customNickname, setCustomNickname] = useState<string>("");
  const [customClass, setCustomClass] = useState<PlayerClass>("Cavaleiro");

  const [editingEvent, setEditingEvent] = useState<Partial<EventoCla> | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const filteredEvents = useMemo(() => {
    return [...eventos]
      .filter((e) => {
        if (categoryFilter !== "Todas" && e.categoria !== categoryFilter) {
          return false;
        }
        if (viewMode === "anteriores") {
          return e.status === "concluido";
        }
        return e.status !== "concluido";
      })
      .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  }, [eventos, categoryFilter, viewMode]);

  const weeklyEvents = useMemo(() => {
    return filteredEvents.slice(0, 6);
  }, [filteredEvents]);

  const handleConfirmPresenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingEvent) return;
    setSubmitting(true);
    try {
      const chosenPlayer = jogadores.find((j) => j.id === selectedPlayerId);
      await onConfirmPresence({
        evento_id: confirmingEvent.id,
        jogador_id: chosenPlayer ? chosenPlayer.id : undefined,
        nickname: chosenPlayer ? chosenPlayer.nickname : customNickname,
        classe: chosenPlayer ? chosenPlayer.classe : customClass,
      });
      setConfirmingEvent(null);
      setCustomNickname("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    try {
      await onSaveEvent(editingEvent);
      setEditingEvent(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Dias do mês de Novembro 2026 para a grade interativa mensal
  const calendarDays = useMemo(() => {
    const days: { day: number; dateStr: string; events: EventoCla[] }[] = [];
    for (let d = 1; d <= 30; d++) {
      const dd = String(d).padStart(2, "0");
      const dateStr = `2026-11-${dd}`;
      const dayEvents = eventos.filter((ev) => ev.data_evento === dateStr);
      days.push({ day: d, dateStr, events: dayEvents });
    }
    return days;
  }, [eventos]);

  return (
    <section
      id="eventos"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D6A33A]/15"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src="/assets/alcatrazz-crest.jpg"
            alt="Logo Oficial ALCATRAZZ"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#D6A33A] shadow-gold-glow shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#581c87]/40 border border-[#a855f7]/50 text-[#e879f9] text-xs uppercase tracking-widest mb-2">
              <Flame className="w-3.5 h-3.5 text-[#e879f9]" /> Bellatra (SoD) & Bless
              Castle
            </div>
            <h2 className="font-medieval text-2xl sm:text-4xl font-extrabold gold-text-gradient tracking-wide">
              CALENDÁRIO DE EVENTOS & SoD
            </h2>
            <p className="text-stone-400 mt-1.5 max-w-2xl text-xs sm:text-base">
              Programação estratégica para <strong className="text-[#D6A33A]">Siege of the Darkness (SoD)</strong>,
              cercos de Bless Castle, incursões a Bosses e treinamentos táticos. Confirme
              sua presença com antecedência.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {canManageEvents && (
            <button
              onClick={() =>
                setEditingEvent({
                  titulo: "",
                  descricao: "",
                  categoria: "SoD (Siege of the Darkness)",
                  data_evento: "2026-11-21",
                  horario: "21:00",
                  local_mapa: "Navisko — Arena de Bellatra (SoD)",
                  responsavel: "LordZephira",
                  recompensa_pontos: 250,
                  status: "agendado",
                  destaque: true,
                })
              }
              className="btn-royal-gold w-full md:w-auto justify-center px-5 py-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medieval uppercase tracking-wider min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Criar Evento / SoD
            </button>
          )}
        </div>
      </div>

      {/* Controles de Visualização (Mensal, Semanal, Anteriores) e Categorias */}
      <div className="medieval-card rounded-xl p-4 sm:p-5 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode("mensal")}
            className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 border transition ${viewMode === "mensal"
                ? "bg-[#D6A33A] text-black font-bold border-[#D6A33A]"
                : "bg-black/60 text-stone-300 border-stone-800 hover:border-[#D6A33A]/50"
              }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Visão Mensal
          </button>
          <button
            onClick={() => setViewMode("semanal")}
            className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 border transition ${viewMode === "semanal"
                ? "bg-[#D6A33A] text-black font-bold border-[#D6A33A]"
                : "bg-black/60 text-stone-300 border-stone-800 hover:border-[#D6A33A]/50"
              }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Próximos / Semanal
          </button>
          <button
            onClick={() => setViewMode("anteriores")}
            className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 border transition ${viewMode === "anteriores"
                ? "bg-[#D6A33A] text-black font-bold border-[#D6A33A]"
                : "bg-black/60 text-stone-300 border-stone-800 hover:border-[#D6A33A]/50"
              }`}
          >
            <History className="w-3.5 h-3.5" /> Eventos Anteriores
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["Todas", ...EVENT_CATEGORIES].map((cat) => {
            const isSoD = cat.includes("SoD");
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${active
                    ? "bg-[#790D16] text-[#D6A33A] border-[#D6A33A]"
                    : isSoD
                      ? "bg-[#D66A19]/15 text-[#D66A19] border-[#D66A19]/40 hover:bg-[#D66A19]/25"
                      : "bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200"
                  }`}
              >
                {isSoD ? "🔥 SoD (Bellatra)" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade de Calendário Mensal Compacta (quando em modo Mensal) */}
      {viewMode === "mensal" && (
        <div className="medieval-card rounded-xl p-4 sm:p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medieval text-lg font-bold text-[#D6A33A] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" /> Mapa Tático Mensal — Novembro 2026
            </h3>
            <span className="text-xs text-stone-400">
              Dias marcados com chama possuem operações agendadas
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-7 lg:grid-cols-10 gap-1.5 sm:gap-2">
            {calendarDays.map((item) => {
              const hasEvent = item.events.length > 0;
              const hasSoD = item.events.some((ev) =>
                ev.categoria.includes("SoD")
              );
              return (
                <div
                  key={item.dateStr}
                  className={`p-2.5 rounded-lg border text-left transition min-h-[74px] flex flex-col justify-between ${hasSoD
                      ? "bg-gradient-to-br from-[#790D16]/60 to-[#D66A19]/30 border-[#D6A33A] shadow-gold-glow"
                      : hasEvent
                        ? "bg-[#790D16]/30 border-[#D6A33A]/60"
                        : "bg-black/40 border-stone-800/70 opacity-75"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medieval text-xs font-bold text-stone-300">
                      Dia {item.day}
                    </span>
                    {hasEvent && (
                      <Flame className="w-3.5 h-3.5 text-[#D66A19] shrink-0" />
                    )}
                  </div>
                  {hasEvent ? (
                    <div className="mt-1 space-y-1">
                      {item.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[10px] leading-tight font-semibold text-[#D6A33A] truncate"
                          title={ev.titulo}
                        >
                          {ev.horario} • {ev.titulo}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-600">Livre</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards de Eventos Detalhados */}
      {(viewMode === "semanal" ? weeklyEvents : filteredEvents).length === 0 ? (
        <div className="medieval-card rounded-2xl p-10 sm:p-12 text-center border-2 border-dashed border-[#a855f7]/45">
          <img
            src="/assets/alcatrazz-crest.jpg"
            alt="Logo Oficial ALCATRAZZ"
            className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D6A33A] mx-auto mb-4 shadow-gold-glow"
          />
          <h3 className="font-medieval text-2xl text-stone-100 font-bold mb-2">
            Nenhuma Operação Agendada no Momento
          </h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto mb-6">
            O calendário tático de Bellatra (SoD) e Bless Castle aguarda agendamentos. O Líder pode criar eventos e salvar diretamente com a senha de confirmação (232356).
          </p>
          <button
            onClick={() =>
              setEditingEvent({
                titulo: "",
                descricao: "",
                categoria: "SoD (Siege of the Darkness)",
                data_evento: new Date().toISOString().split("T")[0],
                horario: "21:00",
                local_mapa: "Navisko — Arena de Bellatra (SoD)",
                responsavel: "Líder ALCATRAZZ",
                recompensa_pontos: 250,
                status: "agendado",
                destaque: true,
              })
            }
            className="btn-royal-gold px-6 py-3 rounded-xl text-xs font-medieval uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Primeira Operação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(viewMode === "semanal" ? weeklyEvents : filteredEvents).map((evt) => {
            const isSoD = evt.categoria.includes("SoD");
            const confirmados = participacoes.filter(
              (p) => p.evento_id === evt.id
            );

            return (
              <div
                key={evt.id}
                className={`medieval-card rounded-xl p-6 flex flex-col justify-between ${isSoD
                    ? "border-2 border-[#D66A19] shadow-gold-glow"
                    : evt.destaque
                      ? "border-2 border-[#D6A33A]/80"
                      : ""
                  }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medieval font-bold uppercase ${isSoD
                            ? "bg-gradient-to-r from-[#790D16] to-[#D66A19] text-white border border-[#D6A33A]"
                            : "bg-[#790D16]/40 text-[#D6A33A] border border-[#D6A33A]/40"
                          }`}
                      >
                        {isSoD ? (
                          <Flame className="w-3.5 h-3.5" />
                        ) : (
                          <Swords className="w-3.5 h-3.5" />
                        )}
                        {evt.categoria}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-black/60 text-[#D6A33A] border border-[#D6A33A]/30 text-xs font-semibold">
                        <Trophy className="w-3 h-3" /> +{evt.recompensa_pontos} pts
                      </span>
                    </div>

                    {evt.is_exemplo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800 uppercase">
                        Exemplo
                      </span>
                    )}
                  </div>

                  <h3 className="font-medieval text-xl font-bold text-stone-100 mb-2">
                    {evt.titulo}
                  </h3>
                  <p className="text-sm text-stone-300 mb-4 leading-relaxed">
                    {evt.descricao}
                  </p>

                  {/* Metadados do Evento */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-black/50 p-3.5 rounded-lg border border-stone-800 text-xs mb-4">
                    <div className="flex items-center gap-2 text-stone-200">
                      <Clock className="w-4 h-4 text-[#D6A33A] shrink-0" />
                      <div>
                        <div className="text-[10px] text-stone-400">Data & Hora</div>
                        <div className="font-semibold">
                          {new Date(evt.data_evento + "T12:00:00").toLocaleDateString(
                            "pt-BR"
                          )}{" "}
                          às {evt.horario}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-stone-200">
                      <MapPin className="w-4 h-4 text-[#D66A19] shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] text-stone-400">Local / Mapa</div>
                        <div className="font-semibold truncate">{evt.local_mapa}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-stone-200">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-stone-400">Responsável</div>
                        <div className="font-semibold text-[#D6A33A]">
                          {evt.responsavel}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Guerreiros Confirmados */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                      <span className="inline-flex items-center gap-1.5 font-medieval uppercase text-[#D6A33A]">
                        <Users className="w-3.5 h-3.5" /> Guerreiros Confirmados (
                        {confirmados.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {confirmados.length === 0 ? (
                        <span className="text-xs text-stone-500 italic">
                          Seja o primeiro guerreiro a confirmar presença!
                        </span>
                      ) : (
                        confirmados.map((part) => (
                          <span
                            key={part.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-900/90 border border-stone-700/80 text-xs text-stone-200"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <strong>{part.nickname}</strong>
                            <span className="text-stone-400 text-[10px]">
                              ({part.classe})
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações do Evento */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-800/80">
                  {evt.status !== "concluido" ? (
                    <button
                      onClick={() => {
                        setSelectedPlayerId(jogadores[0]?.id || "");
                        setConfirmingEvent(evt);
                      }}
                      className="btn-royal-gold px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmar Presença
                    </button>
                  ) : (
                    <span className="text-xs font-medieval uppercase text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Operação Concluída
                    </span>
                  )}

                  {canManageEvents && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingEvent({ ...evt })}
                        className="p-2 rounded bg-[#D6A33A]/15 hover:bg-[#D6A33A]/30 text-[#D6A33A] border border-[#D6A33A]/40 transition"
                        title="Editar Evento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        className="p-2 rounded bg-[#790D16]/30 hover:bg-[#790D16]/60 text-rose-300 border border-rose-800/50 transition"
                        title="Excluir Evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Presença */}
      {confirmingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="medieval-card rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 relative border-2 border-[#D6A33A] my-4">
            <button
              onClick={() => setConfirmingEvent(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-medieval text-xl font-bold gold-text-gradient mb-1">
              Confirmar Presença em Operação
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              {confirmingEvent.titulo} ({confirmingEvent.horario})
            </p>

            <form onSubmit={handleConfirmPresenceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Selecione seu Guerreiro Cadastrado
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="input-medieval w-full text-sm"
                >
                  {jogadores.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nickname} ({j.classe} Lv.{j.level})
                    </option>
                  ))}
                  <option value="">Outro / Digitar Nickname Manualmente</option>
                </select>
              </div>

              {!selectedPlayerId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Seu Nickname *
                    </label>
                    <input
                      type="text"
                      required
                      value={customNickname}
                      onChange={(e) => setCustomNickname(e.target.value)}
                      placeholder="Ex: SparringPT"
                      className="input-medieval w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Classe
                    </label>
                    <select
                      value={customClass}
                      onChange={(e) =>
                        setCustomClass(e.target.value as PlayerClass)
                      }
                      className="input-medieval w-full text-sm"
                    >
                      <option value="Cavaleiro">Cavaleiro</option>
                      <option value="Pike">Pike</option>
                      <option value="Atalanta">Atalanta</option>
                      <option value="Sacerdotisa">Sacerdotisa</option>
                      <option value="Mago">Mago</option>
                      <option value="Mecânico">Mecânico</option>
                      <option value="Lutador">Lutador</option>
                      <option value="Arqueira">Arqueira</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setConfirmingEvent(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-5 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  {submitting ? "Confirmando..." : "Garantir Presença"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Evento */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="medieval-card rounded-2xl max-w-lg w-full p-6 relative border-2 border-[#D6A33A]/60 my-8">
            <button
              onClick={() => setEditingEvent(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-medieval text-2xl font-bold gold-text-gradient mb-1">
              {editingEvent.id ? "Editar Operação / SoD" : "Agendar Novo Evento / SoD"}
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Defina os detalhes táticos para o calendário oficial da ALCATRAZZ.
            </p>

            <form onSubmit={handleSaveEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.titulo || ""}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, titulo: e.target.value })
                  }
                  placeholder="Ex: Incursão SoD — Coroa de Bellatra"
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editingEvent.categoria || "SoD (Siege of the Darkness)"}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        categoria: e.target.value as EventCategory,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Status
                  </label>
                  <select
                    value={editingEvent.status || "agendado"}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        status: e.target.value as EventStatus,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  >
                    <option value="agendado">Agendado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído (Anterior)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingEvent.data_evento || ""}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        data_evento: e.target.value,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={editingEvent.horario || "21:00"}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        horario: e.target.value,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Responsável / Comandante
                  </label>
                  <input
                    type="text"
                    value={editingEvent.responsavel || ""}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        responsavel: e.target.value,
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Recompensa de Ranking (Pts)
                  </label>
                  <input
                    type="number"
                    value={editingEvent.recompensa_pontos ?? 250}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        recompensa_pontos: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Mapa / Ponto de Encontro
                </label>
                <input
                  type="text"
                  value={editingEvent.local_mapa || ""}
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      local_mapa: e.target.value,
                    })
                  }
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Descrição e Instruções Táticas
                </label>
                <textarea
                  rows={3}
                  value={editingEvent.descricao || ""}
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      descricao: e.target.value,
                    })
                  }
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-6 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  {submitting ? "Salvando..." : "Salvar Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
