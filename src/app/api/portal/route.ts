import { NextRequest, NextResponse } from "next/server";
import {
  getPublicPortalState,
  readServerDb,
  verifySessionToken,
  writeServerDb,
} from "@/lib/server-db";
import {
  INITIAL_AVISOS,
  INITIAL_CARGOS,
  INITIAL_EVENTOS,
  INITIAL_HISTORICO_ADMIN,
  INITIAL_JOGADORES,
  INITIAL_PARTICIPACOES,
  INITIAL_PERMISSOES,
  INITIAL_PONTUACOES,
  INITIAL_USUARIOS_ADMIN,
} from "@/lib/seed-data";
import {
  Aviso,
  Cargo,
  EventoCla,
  Jogador,
  PlayerClass,
  PlayerTribe,
} from "@/types/portal";
import { cookies } from "next/headers";

const LEADER_CONFIRMATION_PIN = "232356";
const COOKIE_NAME = "alcatrazz_session";

export async function GET() {
  const db = readServerDb();
  return NextResponse.json(getPublicPortalState(db), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload, senha_confirmacao } = body;
    const db = readServerDb();

    // Confirmação pública de presença em eventos
    if (action === "confirm_event_presence") {
      const { evento_id, jogador_id, nickname, classe } = payload || {};
      if (!evento_id || (!jogador_id && !nickname)) {
        return NextResponse.json(
          { error: "Dados insuficientes para confirmar presença." },
          { status: 400 }
        );
      }

      const evt = db.eventos.find((e) => e.id === evento_id);
      if (!evt) {
        return NextResponse.json(
          { error: "Evento não encontrado." },
          { status: 404 }
        );
      }

      const resolvedPlayer =
        db.jogadores.find((j) => j.id === jogador_id) ||
        db.jogadores.find(
          (j) =>
            j.nickname.toLowerCase() === String(nickname || "").toLowerCase()
        );

      const finalId = resolvedPlayer
        ? resolvedPlayer.id
        : `jog-guest-${Date.now()}`;
      const finalNick = resolvedPlayer
        ? resolvedPlayer.nickname
        : String(nickname).trim();
      const finalClasse = resolvedPlayer
        ? resolvedPlayer.classe
        : classe || "Cavaleiro";

      const alreadyConfirmed = db.participacoes.find(
        (p) =>
          p.evento_id === evento_id &&
          (p.jogador_id === finalId ||
            p.nickname.toLowerCase() === finalNick.toLowerCase())
      );

      if (alreadyConfirmed) {
        return NextResponse.json(
          { error: `${finalNick} já está confirmado neste evento!` },
          { status: 400 }
        );
      }

      db.participacoes.push({
        id: `part-${Date.now()}`,
        evento_id,
        jogador_id: finalId,
        nickname: finalNick,
        classe: finalClasse,
        status_presenca: "confirmado",
        confirmado_em: new Date().toISOString(),
      });

      if (resolvedPlayer) {
        resolvedPlayer.participacoes_eventos += 1;
        resolvedPlayer.pontuacao += Math.round(evt.recompensa_pontos * 0.25);
      }

      const state = writeServerDb(db);
      return NextResponse.json({
        ok: true,
        message: `Presença de ${finalNick} confirmada em "${evt.titulo}"!`,
        state,
      });
    }

    // Reidratação automática caso o servidor serverless tenha reiniciado em frio (cold start)
    if (action === "hydrate_state") {
      const incoming = payload || {};
      const serverIsEmpty =
        db.jogadores.length === 0 &&
        db.avisos.length === 0 &&
        db.eventos.length === 0;
      const incomingTime = Date.parse(incoming.last_updated || "1970-01-01");
      const serverTime = Date.parse(db.last_updated || "1970-01-01");

      if (serverIsEmpty && incomingTime > serverTime) {
        if (Array.isArray(incoming.cargos) && incoming.cargos.length > 0) {
          db.cargos = incoming.cargos;
        }
        if (Array.isArray(incoming.jogadores)) db.jogadores = incoming.jogadores;
        if (Array.isArray(incoming.avisos)) db.avisos = incoming.avisos;
        if (Array.isArray(incoming.eventos)) db.eventos = incoming.eventos;
        if (Array.isArray(incoming.participacoes)) {
          db.participacoes = incoming.participacoes;
        }
        if (Array.isArray(incoming.pontuacoes)) {
          db.pontuacoes = incoming.pontuacoes;
        }
        const state = writeServerDb(db);
        return NextResponse.json({ ok: true, state });
      }
      return NextResponse.json({
        ok: true,
        state: getPublicPortalState(db),
      });
    }

    // Validação da Senha de Confirmação do Líder (232356)
    const token = cookies().get(COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    const pinValido = String(senha_confirmacao || "").trim() === LEADER_CONFIRMATION_PIN;

    if (!pinValido && !session) {
      return NextResponse.json(
        {
          error:
            "Senha de confirmação inválida! Digite a senha correta do Líder para salvar alterações.",
          invalid_pin: true,
        },
        { status: 401 }
      );
    }

    const logAction = (acao: string, modulo: string, detalhes: string) => {
      db.historico_administrativo.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        acao,
        modulo,
        detalhes,
        autor_nome: session?.nome || "Líder ALCATRAZZ (Senha Confirmada)",
        autor_cargo: session?.cargo_nome || "Líder",
        created_at: new Date().toISOString(),
      });
    };

    // 1. CADASTRAR OU EDITAR PESSOA DIRETO NO RANKING OU MEMBROS
    if (action === "save_jogador" || action === "upsert_ranking_entry") {
      const j = payload as Partial<Jogador> & { motivo_ranking?: string };
      if (!j.nickname || !j.classe) {
        return NextResponse.json(
          { error: "Nickname e Classe são obrigatórios." },
          { status: 400 }
        );
      }

      const morionClasses: PlayerClass[] = [
        "Cavaleiro",
        "Atalanta",
        "Sacerdotisa",
        "Mago",
        "Xamã",
      ];
      const resolvedTribo: PlayerTribe =
        j.tribo || (morionClasses.includes(j.classe) ? "Morion" : "Tempskron");

      const existingIdx = db.jogadores.findIndex(
        (item) =>
          item.id === j.id ||
          item.nickname.toLowerCase() === j.nickname!.trim().toLowerCase()
      );

      if (existingIdx >= 0) {
        const current = db.jogadores[existingIdx];
        const oldPts = current.pontuacao;
        const newPts =
          j.pontuacao !== undefined ? Number(j.pontuacao) : current.pontuacao;

        db.jogadores[existingIdx] = {
          ...current,
          nickname: j.nickname.trim(),
          classe: j.classe,
          tribo: resolvedTribo,
          level: Number(j.level) || current.level,
          cargo_id: j.cargo_id || current.cargo_id,
          data_entrada: j.data_entrada || current.data_entrada,
          avatar_url: j.avatar_url || current.avatar_url,
          status: j.status || current.status,
          observacoes_administrativas:
            j.observacoes_administrativas ?? current.observacoes_administrativas,
          pontuacao: newPts,
          participacoes_eventos:
            j.participacoes_eventos !== undefined
              ? Number(j.participacoes_eventos)
              : current.participacoes_eventos,
          contribuicao_cla:
            j.contribuicao_cla !== undefined
              ? Number(j.contribuicao_cla)
              : current.contribuicao_cla,
          is_lider_destaque:
            j.is_lider_destaque !== undefined
              ? Boolean(j.is_lider_destaque)
              : current.is_lider_destaque,
          is_exemplo: false,
        };

        if (newPts !== oldPts || action === "upsert_ranking_entry") {
          db.pontuacoes.unshift({
            id: `pts-${Date.now()}`,
            jogador_id: current.id,
            nickname: current.nickname,
            pontos_alterados: newPts - oldPts,
            criterio: "Pontuação",
            motivo:
              j.motivo_ranking ||
              `Dados atualizados no Ranking (${newPts.toLocaleString("pt-BR")} pts).`,
            autor_admin: "Líder ALCATRAZZ",
            created_at: new Date().toISOString(),
          });
        }

        logAction(
          "Atualização de Membro / Ranking",
          "Ranking & Membros",
          `Atualizado ${j.nickname} (Lv. ${j.level ?? current.level} • ${newPts} pts).`
        );
      } else {
        const newPlayer: Jogador = {
          id: `jog-${Date.now()}`,
          nickname: j.nickname.trim(),
          classe: j.classe,
          tribo: resolvedTribo,
          level: Number(j.level) || 140,
          cargo_id: j.cargo_id || "cargo-membro",
          data_entrada:
            j.data_entrada || new Date().toISOString().split("T")[0],
          avatar_url: j.avatar_url || "/assets/alcatrazz-crest.jpg",
          status: j.status || "ativo",
          observacoes_administrativas: j.observacoes_administrativas || "",
          pontuacao: Number(j.pontuacao) || 1500,
          participacoes_eventos: Number(j.participacoes_eventos) || 1,
          contribuicao_cla: Number(j.contribuicao_cla) || 200,
          is_lider_destaque: Boolean(j.is_lider_destaque),
          is_exemplo: false,
        };
        db.jogadores.unshift(newPlayer);

        db.pontuacoes.unshift({
          id: `pts-${Date.now()}`,
          jogador_id: newPlayer.id,
          nickname: newPlayer.nickname,
          pontos_alterados: newPlayer.pontuacao,
          criterio: "Pontuação",
          motivo:
            j.motivo_ranking ||
            `Novo guerreiro cadastrado diretamente no Ranking com ${newPlayer.pontuacao.toLocaleString("pt-BR")} pts.`,
          autor_admin: "Líder ALCATRAZZ",
          created_at: new Date().toISOString(),
        });

        logAction(
          "Novo Cadastro no Site",
          "Ranking & Membros",
          `Cadastrado ${newPlayer.nickname} (${newPlayer.classe} Lv. ${newPlayer.level} • ${newPlayer.pontuacao} pts).`
        );
      }

      const state = writeServerDb(db);
      return NextResponse.json({
        ok: true,
        message: "Informações salvas com sucesso e sincronizadas para todos!",
        state,
      });
    }

    if (action === "delete_jogador") {
      const { id } = payload || {};
      const target = db.jogadores.find((j) => j.id === id);
      if (!target) {
        return NextResponse.json(
          { error: "Jogador não encontrado." },
          { status: 404 }
        );
      }
      db.jogadores = db.jogadores.filter((j) => j.id !== id);
      db.participacoes = db.participacoes.filter((p) => p.jogador_id !== id);
      logAction(
        "Remoção de Jogador",
        "Membros",
        `Guerreiro ${target.nickname} removido do portal.`
      );
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    if (action === "change_jogador_cargo") {
      const { jogador_id, novo_cargo_id } = payload || {};
      const player = db.jogadores.find((j) => j.id === jogador_id);
      const cargo = db.cargos.find((c) => c.id === novo_cargo_id);
      if (!player || !cargo) {
        return NextResponse.json(
          { error: "Jogador ou cargo inválido." },
          { status: 404 }
        );
      }
      const oldCargo = db.cargos.find((c) => c.id === player.cargo_id);
      player.cargo_id = cargo.id;
      player.is_exemplo = false;

      logAction(
        "Alteração de Hierarquia",
        "Hierarquia",
        `${player.nickname} alterado de '${oldCargo?.nome || "Membro"}' para '${cargo.nome}'.`
      );
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    // 2. ATUALIZAÇÃO DE PONTOS NO RANKING
    if (action === "update_ranking_points") {
      const {
        jogador_id,
        pontos_alterados,
        pontuacao_absoluta,
        criterio,
        motivo,
        novo_level,
        participacoes_delta,
        contribuicao_delta,
      } = payload || {};

      const player = db.jogadores.find((j) => j.id === jogador_id);
      if (!player) {
        return NextResponse.json(
          { error: "Jogador não encontrado para atualização de ranking." },
          { status: 404 }
        );
      }

      const oldPts = player.pontuacao;
      if (pontuacao_absoluta !== undefined && pontuacao_absoluta !== "") {
        player.pontuacao = Math.max(0, Number(pontuacao_absoluta));
      } else {
        const deltaPts = Number(pontos_alterados) || 0;
        player.pontuacao = Math.max(0, player.pontuacao + deltaPts);
      }

      const finalDelta = player.pontuacao - oldPts;

      if (novo_level !== undefined && Number(novo_level) > 0) {
        player.level = Number(novo_level);
      }
      if (participacoes_delta !== undefined) {
        player.participacoes_eventos = Math.max(
          0,
          player.participacoes_eventos + Number(participacoes_delta)
        );
      }
      if (contribuicao_delta !== undefined) {
        player.contribuicao_cla = Math.max(
          0,
          player.contribuicao_cla + Number(contribuicao_delta)
        );
      }
      player.is_exemplo = false;

      db.pontuacoes.unshift({
        id: `pts-${Date.now()}`,
        jogador_id: player.id,
        nickname: player.nickname,
        pontos_alterados: finalDelta,
        criterio: criterio || "Pontuação",
        motivo: motivo || "Atualização confirmada pelo Líder no Ranking.",
        autor_admin: "Líder ALCATRAZZ",
        created_at: new Date().toISOString(),
      });

      logAction(
        "Atualização de Ranking",
        "Ranking",
        `${player.nickname}: ${finalDelta >= 0 ? "+" : ""}${finalDelta} pts (Total: ${player.pontuacao} pts) — ${motivo || "Mérito"}.`
      );

      const state = writeServerDb(db);
      return NextResponse.json({
        ok: true,
        message: `Ranking de ${player.nickname} salvo com sucesso!`,
        state,
      });
    }

    // 3. HIERARQUIA / CARGOS
    if (action === "save_cargo") {
      const c = payload as Partial<Cargo>;
      if (!c.nome) {
        return NextResponse.json(
          { error: "O nome do cargo é obrigatório." },
          { status: 400 }
        );
      }

      const idx = db.cargos.findIndex((item) => item.id === c.id);
      if (idx >= 0) {
        db.cargos[idx] = {
          ...db.cargos[idx],
          nome: c.nome.trim(),
          nivel_hierarquia:
            Number(c.nivel_hierarquia) || db.cargos[idx].nivel_hierarquia,
          cor_hex: c.cor_hex || db.cargos[idx].cor_hex,
          simbolo: c.simbolo || db.cargos[idx].simbolo,
          descricao: c.descricao || db.cargos[idx].descricao,
          permissoes_padrao:
            c.permissoes_padrao || db.cargos[idx].permissoes_padrao,
          is_exemplo: false,
        };
      } else {
        db.cargos.push({
          id: `cargo-${Date.now()}`,
          nome: c.nome.trim(),
          nivel_hierarquia:
            Number(c.nivel_hierarquia) || db.cargos.length + 1,
          cor_hex: c.cor_hex || "#D6A33A",
          simbolo: c.simbolo || "Shield",
          descricao: c.descricao || "Cargo estratégico do clã ALCATRAZZ.",
          permissoes_padrao: c.permissoes_padrao || [],
          is_exemplo: false,
        });
      }
      db.cargos.sort((a, b) => a.nivel_hierarquia - b.nivel_hierarquia);
      logAction("Salvar Patente", "Hierarquia", `Cargo '${c.nome}' salvo.`);
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    if (action === "delete_cargo") {
      const { id } = payload || {};
      const inUse = db.jogadores.some((j) => j.cargo_id === id);
      if (inUse) {
        return NextResponse.json(
          {
            error:
              "Não é possível excluir um cargo que possui jogadores vinculados.",
          },
          { status: 400 }
        );
      }
      db.cargos = db.cargos.filter((c) => c.id !== id);
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    // 4. MURAL DE AVISOS
    if (action === "save_aviso") {
      const a = payload as Partial<Aviso>;
      if (!a.titulo || !a.descricao || !a.categoria) {
        return NextResponse.json(
          { error: "Título, Descrição e Categoria são obrigatórios." },
          { status: 400 }
        );
      }

      const idx = db.avisos.findIndex((item) => item.id === a.id);
      if (idx >= 0) {
        db.avisos[idx] = {
          ...db.avisos[idx],
          titulo: a.titulo.trim(),
          descricao: a.descricao.trim(),
          categoria: a.categoria,
          prioridade: a.prioridade || db.avisos[idx].prioridade,
          imagem_url: a.imagem_url ?? db.avisos[idx].imagem_url,
          fixado:
            a.fixado !== undefined ? Boolean(a.fixado) : db.avisos[idx].fixado,
          is_exemplo: false,
        };
      } else {
        db.avisos.unshift({
          id: `aviso-${Date.now()}`,
          titulo: a.titulo.trim(),
          descricao: a.descricao.trim(),
          autor: a.autor || "Líder ALCATRAZZ",
          autor_cargo: "Líder",
          data_publicacao: new Date().toISOString(),
          categoria: a.categoria,
          imagem_url: a.imagem_url || undefined,
          prioridade: a.prioridade || "normal",
          fixado: Boolean(a.fixado),
          is_exemplo: false,
        });
      }

      logAction("Publicar Aviso", "Mural", `Comunicado '${a.titulo}' salvo.`);
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    if (action === "toggle_fixar_aviso") {
      const { id } = payload || {};
      const aviso = db.avisos.find((a) => a.id === id);
      if (aviso) {
        aviso.fixado = !aviso.fixado;
      }
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    if (action === "delete_aviso") {
      const { id } = payload || {};
      db.avisos = db.avisos.filter((a) => a.id !== id);
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    // 5. EVENTOS & SOD
    if (action === "save_evento") {
      const e = payload as Partial<EventoCla>;
      if (!e.titulo || !e.data_evento || !e.horario || !e.categoria) {
        return NextResponse.json(
          { error: "Título, Categoria, Data e Horário são obrigatórios." },
          { status: 400 }
        );
      }

      const idx = db.eventos.findIndex((item) => item.id === e.id);
      if (idx >= 0) {
        db.eventos[idx] = {
          ...db.eventos[idx],
          titulo: e.titulo.trim(),
          descricao: e.descricao || db.eventos[idx].descricao,
          categoria: e.categoria,
          data_evento: e.data_evento,
          horario: e.horario,
          local_mapa: e.local_mapa || db.eventos[idx].local_mapa,
          responsavel: e.responsavel || db.eventos[idx].responsavel,
          recompensa_pontos:
            Number(e.recompensa_pontos) || db.eventos[idx].recompensa_pontos,
          status: e.status || db.eventos[idx].status,
          destaque:
            e.destaque !== undefined
              ? Boolean(e.destaque)
              : db.eventos[idx].destaque,
          is_exemplo: false,
        };
      } else {
        db.eventos.push({
          id: `evt-${Date.now()}`,
          titulo: e.titulo.trim(),
          descricao: e.descricao || "",
          categoria: e.categoria,
          data_evento: e.data_evento,
          horario: e.horario,
          local_mapa: e.local_mapa || "Navisko — Arena de Bellatra (SoD)",
          responsavel: e.responsavel || "Líder ALCATRAZZ",
          recompensa_pontos: Number(e.recompensa_pontos) || 200,
          status: e.status || "agendado",
          destaque: Boolean(e.destaque),
          is_exemplo: false,
        });
      }

      logAction("Salvar Evento", "Calendário", `Evento '${e.titulo}' salvo.`);
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    if (action === "delete_evento") {
      const { id } = payload || {};
      db.eventos = db.eventos.filter((e) => e.id !== id);
      db.participacoes = db.participacoes.filter((p) => p.evento_id !== id);
      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    if (action === "reset_demo_data") {
      db.cargos = INITIAL_CARGOS;
      db.permissoes = INITIAL_PERMISSOES;
      db.jogadores = INITIAL_JOGADORES;
      db.avisos = INITIAL_AVISOS;
      db.eventos = INITIAL_EVENTOS;
      db.participacoes = INITIAL_PARTICIPACOES;
      db.pontuacoes = INITIAL_PONTUACOES;
      db.usuarios = INITIAL_USUARIOS_ADMIN;
      db.historico_administrativo = INITIAL_HISTORICO_ADMIN;

      const state = writeServerDb(db);
      return NextResponse.json({ ok: true, state });
    }

    return NextResponse.json(
      { error: "Operação desconhecida." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Erro na rota /api/portal:", err);
    return NextResponse.json(
      { error: "Erro interno ao salvar informações." },
      { status: 500 }
    );
  }
}
