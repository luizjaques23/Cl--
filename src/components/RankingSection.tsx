"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  SlidersHorizontal,
  UserPlus,
  Trash2,
  X,
  Lock,
} from "lucide-react";
import { Cargo, HistoricoPontuacao, Jogador, PlayerClass } from "@/types/portal";
import { RoleBadge, renderClassIcon } from "./RoleBadge";

type RankingCriterion =
  | "pontuacao"
  | "level"
  | "participacoes_eventos"
  | "contribuicao_cla";

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

interface RankingSectionProps {
  jogadores: Jogador[];
  cargos: Cargo[];
  pontuacoes: HistoricoPontuacao[];
  canUpdateRanking: boolean;
  onUpdatePoints: (payload: {
    jogador_id: string;
    pontos_alterados: number;
    pontuacao_absoluta?: number;
    criterio:
    | "Level"
    | "Pontuação"
    | "Participação em eventos"
    | "Contribuição ao clã";
    motivo: string;
    novo_level?: number;
    participacoes_delta?: number;
    contribuicao_delta?: number;
  }) => Promise<void>;
  onUpsertRankingPlayer?: (
    player: Partial<Jogador> & { motivo_ranking?: string }
  ) => Promise<void>;
  onDeletePlayer?: (id: string) => Promise<void>;
}

export function RankingSection({
  jogadores,
  cargos,
  pontuacoes,
  onUpdatePoints,
  onUpsertRankingPlayer,
  onDeletePlayer,
}: RankingSectionProps) {
  const [criterion, setCriterion] = useState<RankingCriterion>("pontuacao");
  const [adjustingPlayer, setAdjustingPlayer] = useState<Jogador | null>(null);
  const [modePts, setModePts] = useState<"somar" | "definir">("somar");
  const [deltaPts, setDeltaPts] = useState<string>("250");
  const [absolutoPts, setAbsolutoPts] = useState<string>("");
  const [criterioLabel, setCriterioLabel] = useState<
    "Level" | "Pontuação" | "Participação em eventos" | "Contribuição ao clã"
  >("Pontuação");
  const [motivo, setMotivo] = useState<string>("");
  const [novoLevel, setNovoLevel] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Modal de Cadastrar Nova Pessoa / Inserir Dados direto no Ranking
  const [newRankingEntry, setNewRankingEntry] = useState<{
    nickname: string;
    classe: PlayerClass;
    cargo_id: string;
    level: number;
    pontuacao: number;
    participacoes_eventos: number;
    contribuicao_cla: number;
    motivo_ranking: string;
  } | null>(null);

  const cargoMap = useMemo(() => {
    const m = new Map<string, Cargo>();
    cargos.forEach((c) => m.set(c.id, c));
    return m;
  }, [cargos]);

  const rankedPlayers = useMemo(() => {
    return [...jogadores].sort((a, b) => {
      if (b[criterion] !== a[criterion]) {
        return b[criterion] - a[criterion];
      }
      return b.pontuacao - a.pontuacao;
    });
  }, [jogadores, criterion]);

  const top1 = rankedPlayers[0];
  const top2 = rankedPlayers[1];
  const top3 = rankedPlayers[2];

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingPlayer) return;
    setSubmitting(true);
    try {
      await onUpdatePoints({
        jogador_id: adjustingPlayer.id,
        pontos_alterados: modePts === "somar" ? Number(deltaPts) || 0 : 0,
        pontuacao_absoluta:
          modePts === "definir" ? Number(absolutoPts) || 0 : undefined,
        criterio: criterioLabel,
        motivo:
          motivo.trim() ||
          "Atualização oficial de mérito no Ranking ALCATRAZZ.",
        novo_level: novoLevel ? Number(novoLevel) : undefined,
        participacoes_delta:
          criterioLabel === "Participação em eventos" ? 1 : undefined,
        contribuicao_delta:
          criterioLabel === "Contribuição ao clã"
            ? Math.max(50, Math.round((Number(deltaPts) || 100) * 0.5))
            : undefined,
      });
      setAdjustingPlayer(null);
      setMotivo("");
      setNovoLevel("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewRankingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRankingEntry || !onUpsertRankingPlayer) return;
    setSubmitting(true);
    try {
      await onUpsertRankingPlayer(newRankingEntry);
      setNewRankingEntry(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="ranking"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D6A33A]/15"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#790D16]/30 border border-[#D6A33A]/40 text-[#D6A33A] text-xs uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5" /> Panteão de Glória • Sincronizado em
            Tempo Real
          </div>
          <h2 className="font-medieval text-3xl sm:text-4xl font-extrabold gold-text-gradient tracking-wide">
            RANKING OFICIAL DOS JOGADORES
          </h2>
          <p className="text-stone-400 mt-2 max-w-2xl text-sm sm:text-base">
            Cadastre guerreiros, insira novas pontuações e atualize a
            classificação diretamente pelo site. Todas as alterações confirmadas
            com a senha do Líder ficam salvas para todos os dispositivos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              setNewRankingEntry({
                nickname: "",
                classe: "Cavaleiro",
                cargo_id: "cargo-membro",
                level: 150,
                pontuacao: 5000,
                participacoes_eventos: 10,
                contribuicao_cla: 500,
                motivo_ranking: "Cadastro direto no Ranking Oficial",
              })
            }
            className="btn-royal-gold px-5 py-3 rounded-xl text-xs sm:text-sm font-medieval uppercase tracking-wider flex items-center gap-2 shadow-gold-glow"
          >
            <UserPlus className="w-4 h-4" /> + Cadastrar no Ranking
          </button>
        </div>
      </div>

      {/* Seletor de Critérios do Ranking */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 bg-[#121010] p-4 rounded-xl border border-[#D6A33A]/30">
        <span className="text-xs font-medieval uppercase tracking-wider text-[#D6A33A]">
          Ordenar Classificação Por:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "pontuacao", label: "🏆 Pontuação Geral" },
            { id: "level", label: "⚔️ Level" },
            { id: "participacoes_eventos", label: "🔥 Participação em Eventos" },
            { id: "contribuicao_cla", label: "🛡️ Contribuição ao Clã" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCriterion(item.id as RankingCriterion)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medieval uppercase tracking-wider border transition ${criterion === item.id
                  ? "bg-gradient-to-r from-[#9e7019] via-[#D6A33A] to-[#b88422] text-black font-bold border-[#f5d77f] shadow-gold-glow"
                  : "bg-black/60 text-stone-300 border-stone-800 hover:border-[#D6A33A]/50"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* PÓDIO IMPERIAL (1º, 2º e 3º Lugares com Medalhas de Ouro, Prata e Bronze) */}
      {rankedPlayers.length === 0 ? (
        <div className="medieval-card rounded-2xl p-10 text-center border-2 border-dashed border-[#D6A33A]/40 mb-12">
          <div className="w-16 h-16 rounded-full bg-[#790D16]/40 border-2 border-[#D6A33A] flex items-center justify-center text-[#D6A33A] mx-auto mb-4 shadow-gold-glow">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="font-medieval text-2xl font-bold gold-text-gradient mb-2">
            O Panteão ALCATRAZZ Aguarda Seus Primeiros Conquistadores
          </h3>
          <p className="text-stone-400 text-sm max-w-xl mx-auto mb-6">
            Nenhum guerreiro registrado no ranking no momento. O Líder pode cadastrar novos guerreiros e definir pontuações diretamente pelo botão abaixo usando a senha de confirmação (232356).
          </p>
          <button
            onClick={() =>
              setNewRankingEntry({
                nickname: "",
                classe: "Cavaleiro",
                cargo_id: "cargo-membro",
                level: 150,
                pontuacao: 5000,
                participacoes_eventos: 1,
                contribuicao_cla: 500,
                motivo_ranking: "Primeiro guerreiro do Ranking Oficial",
              })
            }
            className="btn-royal-gold px-6 py-3 rounded-xl text-xs font-medieval uppercase tracking-wider inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Cadastrar Primeiro Guerreiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end mb-12">
          {/* 2º Lugar - Medalha de Prata */}
          {top2 && (
            <div className="medieval-card rounded-2xl p-6 border-2 border-slate-300/60 order-2 lg:order-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-300/20 border border-slate-300 text-slate-200 font-medieval font-bold text-xs uppercase">
                  <Medal className="w-4 h-4 text-slate-200" /> 2º Lugar • Prata
                </span>
                <span className="font-medieval font-bold text-sm text-slate-300">
                  Lv.{top2.level}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={top2.avatar_url || "/assets/alcatrazz-crest.jpg"}
                  alt={top2.nickname}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-slate-300"
                />
                <div>
                  <h3 className="font-medieval text-xl font-bold text-white">
                    {top2.nickname}
                  </h3>
                  <div className="text-xs text-stone-300 mb-1.5">
                    {top2.classe} • {top2.tribo}
                  </div>
                  <RoleBadge cargo={cargoMap.get(top2.cargo_id)} size="sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-stone-800 text-center text-xs">
                <div>
                  <span className="text-stone-400 block">Pontuação</span>
                  <strong className="font-medieval text-slate-200 text-sm">
                    {top2.pontuacao.toLocaleString("pt-BR")}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Eventos</span>
                  <strong className="font-medieval text-slate-200 text-sm">
                    {top2.participacoes_eventos}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Contribuição</span>
                  <strong className="font-medieval text-slate-200 text-sm">
                    {top2.contribuicao_cla}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 1º Lugar - Destaque Especial + Medalha de Ouro */}
          {top1 && (
            <div className="medieval-card rounded-2xl p-7 border-2 border-[#D6A33A] shadow-gold-glow-strong order-1 lg:order-2 relative overflow-hidden bg-gradient-to-b from-[#790D16]/40 via-[#141010] to-[#090909] lg:-translate-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#D6A33A] to-[#f5d77f] text-black font-medieval font-extrabold text-xs uppercase shadow-gold-glow">
                  <Crown className="w-4 h-4" /> 1º Lugar • Medalha de Ouro
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#790D16] text-[#D6A33A] border border-[#D6A33A] font-medieval font-bold text-xs">
                  Lv.{top1.level}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={top1.avatar_url || "/assets/alcatrazz-crest.jpg"}
                    alt={top1.nickname}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-[#D6A33A] shadow-gold-glow"
                  />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#D6A33A] text-black flex items-center justify-center font-bold shadow">
                    <Trophy className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <h3 className="font-medieval text-2xl font-extrabold gold-text-gradient">
                    {top1.nickname}
                  </h3>
                  <div className="text-xs text-stone-200 mb-2">
                    {top1.classe} • {top1.tribo}
                  </div>
                  <RoleBadge cargo={cargoMap.get(top1.cargo_id)} size="md" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[#D6A33A]/30 text-center text-xs">
                <div className="bg-black/50 p-2 rounded-lg border border-[#D6A33A]/30">
                  <span className="text-stone-400 block">Pontuação</span>
                  <strong className="font-medieval text-[#D6A33A] text-base">
                    {top1.pontuacao.toLocaleString("pt-BR")}
                  </strong>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-[#D6A33A]/30">
                  <span className="text-stone-400 block">Eventos/SoD</span>
                  <strong className="font-medieval text-stone-100 text-base">
                    {top1.participacoes_eventos}
                  </strong>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-[#D6A33A]/30">
                  <span className="text-stone-400 block">Contribuição</span>
                  <strong className="font-medieval text-[#D66A19] text-base">
                    {top1.contribuicao_cla}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 3º Lugar - Medalha de Bronze */}
          {top3 && (
            <div className="medieval-card rounded-2xl p-6 border-2 border-amber-700/70 order-3 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-800/30 border border-amber-600 text-amber-300 font-medieval font-bold text-xs uppercase">
                  <Medal className="w-4 h-4 text-amber-400" /> 3º Lugar • Bronze
                </span>
                <span className="font-medieval font-bold text-sm text-amber-400">
                  Lv.{top3.level}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={top3.avatar_url || "/assets/alcatrazz-crest.jpg"}
                  alt={top3.nickname}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-amber-600"
                />
                <div>
                  <h3 className="font-medieval text-xl font-bold text-white">
                    {top3.nickname}
                  </h3>
                  <div className="text-xs text-stone-300 mb-1.5">
                    {top3.classe} • {top3.tribo}
                  </div>
                  <RoleBadge cargo={cargoMap.get(top3.cargo_id)} size="sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-stone-800 text-center text-xs">
                <div>
                  <span className="text-stone-400 block">Pontuação</span>
                  <strong className="font-medieval text-amber-300 text-sm">
                    {top3.pontuacao.toLocaleString("pt-BR")}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Eventos</span>
                  <strong className="font-medieval text-stone-200 text-sm">
                    {top3.participacoes_eventos}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Contribuição</span>
                  <strong className="font-medieval text-stone-200 text-sm">
                    {top3.contribuicao_cla}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela de Classificação Geral */}
      <div className="medieval-card rounded-xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/70 border-b border-[#D6A33A]/30 text-[11px] font-medieval uppercase tracking-wider text-[#D6A33A]">
                <th className="py-3.5 px-4">Posição</th>
                <th className="py-3.5 px-4">Guerreiro (Nickname)</th>
                <th className="py-3.5 px-4">Classe</th>
                <th className="py-3.5 px-4">Cargo</th>
                <th className="py-3.5 px-4 text-center">Level</th>
                <th className="py-3.5 px-4 text-center">Eventos / SoD</th>
                <th className="py-3.5 px-4 text-center">Contribuição</th>
                <th className="py-3.5 px-4 text-right">Pontuação Total</th>
                <th className="py-3.5 px-4 text-right">Gerenciar no Ranking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/70 text-sm">
              {rankedPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-stone-400 italic text-sm"
                  >
                    Nenhum guerreiro cadastrado no ranking ainda. Clique em{" "}
                    <button
                      onClick={() =>
                        setNewRankingEntry({
                          nickname: "",
                          classe: "Cavaleiro",
                          cargo_id: "cargo-membro",
                          level: 150,
                          pontuacao: 5000,
                          participacoes_eventos: 1,
                          contribuicao_cla: 500,
                          motivo_ranking: "Primeiro guerreiro do Ranking Oficial",
                        })
                      }
                      className="text-[#D6A33A] font-medieval uppercase underline hover:text-[#f3c969] ml-1"
                    >
                      + Cadastrar no Ranking
                    </button>{" "}
                    para começar.
                  </td>
                </tr>
              ) : (
                rankedPlayers.map((player, index) => {
                  const pos = index + 1;
                  const cargo = cargoMap.get(player.cargo_id);
                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-[#790D16]/15 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medieval font-bold">
                        {pos === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#D6A33A] text-black text-xs">
                            🥇 1º
                          </span>
                        ) : pos === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-300 text-black text-xs">
                            🥈 2º
                          </span>
                        ) : pos === 3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-600 text-black text-xs">
                            🥉 3º
                          </span>
                        ) : (
                          <span className="text-stone-400 pl-2">#{pos}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.avatar_url || "/assets/alcatrazz-crest.jpg"}
                            alt={player.nickname}
                            className="w-9 h-9 rounded-lg object-cover border border-[#D6A33A]/40"
                          />
                          <div>
                            <div className="font-medieval font-bold text-stone-100">
                              {player.nickname}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              {player.tribo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-stone-200">
                          {renderClassIcon(
                            player.classe,
                            "w-3.5 h-3.5 text-[#D6A33A]"
                          )}
                          {player.classe}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <RoleBadge cargo={cargo} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center font-medieval font-bold text-stone-200">
                        Lv.{player.level}
                      </td>
                      <td className="py-3.5 px-4 text-center text-stone-300">
                        {player.participacoes_eventos}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#D66A19] font-semibold">
                        {player.contribuicao_cla}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medieval font-bold text-[#D6A33A] text-base">
                        {player.pontuacao.toLocaleString("pt-BR")} pts
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustingPlayer(player);
                              setNovoLevel(String(player.level));
                              setAbsolutoPts(String(player.pontuacao));
                            }}
                            className="px-3 py-1.5 rounded bg-[#D6A33A]/20 hover:bg-[#D6A33A]/40 text-[#D6A33A] border border-[#D6A33A]/50 text-xs font-medieval uppercase inline-flex items-center gap-1 transition"
                            title="Editar Pontos / Level"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Editar
                            Pontos
                          </button>
                          {onDeletePlayer && (
                            <button
                              onClick={() => onDeletePlayer(player.id)}
                              className="p-1.5 rounded bg-[#790D16]/30 hover:bg-[#790D16]/60 text-rose-300 border border-rose-800/50 transition"
                              title="Remover do Ranking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Últimas Atualizações Administrativas de Pontuação */}
      <div className="medieval-card rounded-xl p-5">
        <h3 className="font-medieval text-sm uppercase tracking-wider text-[#D6A33A] flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" /> Histórico Recente de Alterações no
          Ranking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pontuacoes.length === 0 ? (
            <div className="col-span-full py-4 text-center text-stone-500 italic text-xs">
              Nenhuma alteração de pontuação registrada ainda. Ao salvar novos pontos com a senha do Líder, o histórico aparecerá aqui.
            </div>
          ) : (
            pontuacoes.slice(0, 3).map((pt) => (
              <div
                key={pt.id}
                className="bg-black/50 p-3 rounded-lg border border-stone-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <strong className="font-medieval text-stone-100">
                    {pt.nickname}
                  </strong>
                  <span
                    className={`font-bold ${pt.pontos_alterados >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                      }`}
                  >
                    {pt.pontos_alterados >= 0 ? "+" : ""}
                    {pt.pontos_alterados} pts ({pt.criterio})
                  </span>
                </div>
                <p className="text-stone-400 line-clamp-2">{pt.motivo}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Cadastrar Nova Pessoa / Inserir Dados no Ranking */}
      {newRankingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="medieval-card rounded-2xl max-w-lg w-full p-6 relative border-2 border-[#D6A33A] my-8">
            <button
              onClick={() => setNewRankingEntry(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#790D16]/40 border border-[#D6A33A]/40 text-[#D6A33A] text-[11px] font-medieval uppercase mb-2">
              <Lock className="w-3 h-3" /> Protegido por Senha de Confirmação
            </div>
            <h3 className="font-medieval text-2xl font-bold gold-text-gradient mb-1">
              Cadastrar Guerreiro no Ranking
            </h3>
            <p className="text-xs text-stone-400 mb-5">
              Adicione um novo participante ou atualize seus dados diretamente na
              classificação geral do site.
            </p>

            <form onSubmit={handleNewRankingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Nome / Nickname *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRankingEntry.nickname}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        nickname: e.target.value,
                      })
                    }
                    placeholder="Ex: GuerreiroAlcatrazz"
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Classe *
                  </label>
                  <select
                    value={newRankingEntry.classe}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        classe: e.target.value as PlayerClass,
                      })
                    }
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
                    Cargo no Clã
                  </label>
                  <select
                    value={newRankingEntry.cargo_id}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        cargo_id: e.target.value,
                      })
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
                    Level *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={200}
                    value={newRankingEntry.level}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        level: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Pontuação no Ranking *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newRankingEntry.pontuacao}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        pontuacao: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Participações em Eventos / SoD
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newRankingEntry.participacoes_eventos}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        participacoes_eventos: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Contribuição ao Clã
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newRankingEntry.contribuicao_cla}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        contribuicao_cla: Number(e.target.value),
                      })
                    }
                    className="input-medieval w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Observação / Motivo
                  </label>
                  <input
                    type="text"
                    value={newRankingEntry.motivo_ranking}
                    onChange={(e) =>
                      setNewRankingEntry({
                        ...newRankingEntry,
                        motivo_ranking: e.target.value,
                      })
                    }
                    placeholder="Ex: Destaque semanal SoD"
                    className="input-medieval w-full text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setNewRankingEntry(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-6 py-2.5 rounded-lg text-xs font-medieval uppercase"
                >
                  Continuar & Confirmar com Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição / Atualização de Pontos */}
      {adjustingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="medieval-card rounded-2xl max-w-md w-full p-6 relative border-2 border-[#D6A33A]">
            <button
              onClick={() => setAdjustingPlayer(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-medieval text-xl font-bold gold-text-gradient mb-1">
              Atualizar Dados no Ranking
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Guerreiro:{" "}
              <strong className="text-stone-200">
                {adjustingPlayer.nickname}
              </strong>{" "}
              (Atual: {adjustingPlayer.pontuacao.toLocaleString("pt-BR")} pts)
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-black/60 border border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => setModePts("somar")}
                  className={`py-1.5 rounded font-medieval uppercase transition ${modePts === "somar"
                      ? "bg-[#D6A33A] text-black font-bold"
                      : "text-stone-400"
                    }`}
                >
                  Somar / Subtrair
                </button>
                <button
                  type="button"
                  onClick={() => setModePts("definir")}
                  className={`py-1.5 rounded font-medieval uppercase transition ${modePts === "definir"
                      ? "bg-[#D6A33A] text-black font-bold"
                      : "text-stone-400"
                    }`}
                >
                  Definir Total Exato
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {modePts === "somar" ? (
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Pontos (+/-) *
                    </label>
                    <input
                      type="number"
                      required
                      value={deltaPts}
                      onChange={(e) => setDeltaPts(e.target.value)}
                      placeholder="Ex: 250 ou -100"
                      className="input-medieval w-full text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Nova Pontuação Total *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={absolutoPts}
                      onChange={(e) => setAbsolutoPts(e.target.value)}
                      className="input-medieval w-full text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Atualizar Level
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={novoLevel}
                    onChange={(e) => setNovoLevel(e.target.value)}
                    className="input-medieval w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Critério do Mérito
                </label>
                <select
                  value={criterioLabel}
                  onChange={(e) =>
                    setCriterioLabel(
                      e.target.value as
                      | "Level"
                      | "Pontuação"
                      | "Participação em eventos"
                      | "Contribuição ao clã"
                    )
                  }
                  className="input-medieval w-full text-sm"
                >
                  <option value="Pontuação">Pontuação Geral</option>
                  <option value="Participação em eventos">
                    Participação em eventos (SoD / BC)
                  </option>
                  <option value="Contribuição ao clã">
                    Contribuição ao clã
                  </option>
                  <option value="Level">Avanço de Level</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Destaque na defesa do Bless Castle"
                  className="input-medieval w-full text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setAdjustingPlayer(null)}
                  className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-royal-gold px-5 py-2 rounded-lg text-xs font-medieval uppercase"
                >
                  Confirmar com Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
