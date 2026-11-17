"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Crown,
  Swords,
  Flame,
  ScrollText,
  Menu,
  X,
  Lock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Compass,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Trophy,
  Instagram,
} from "lucide-react";
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
  PermissionCode,
  PortalDatabaseState,
} from "@/types/portal";
import { SessionPayload } from "@/lib/server-db";
import { MembersSection } from "@/components/MembersSection";
import { HierarchySection } from "@/components/HierarchySection";
import { NoticesSection } from "@/components/NoticesSection";
import { EventsSection } from "@/components/EventsSection";
import { RankingSection } from "@/components/RankingSection";
import { RoleBadge } from "@/components/RoleBadge";

interface PendingConfirmationAction {
  action: string;
  payload: unknown;
  successMsg: string;
  title: string;
  resolve: () => void;
  reject: (err: Error) => void;
}

export default function AlcatrazzOfficialPortal() {
  const [portalState, setPortalState] = useState<PortalDatabaseState>({
    cargos: INITIAL_CARGOS,
    permissoes: INITIAL_PERMISSOES,
    jogadores: INITIAL_JOGADORES,
    avisos: INITIAL_AVISOS,
    eventos: INITIAL_EVENTOS,
    participacoes: INITIAL_PARTICIPACOES,
    pontuacoes: INITIAL_PONTUACOES,
    usuarios: INITIAL_USUARIOS_ADMIN,
    historico_administrativo: INITIAL_HISTORICO_ADMIN,
    storage_mode: "local_server_db",
    last_updated: new Date().toISOString(),
  });

  const [session, setSession] = useState<SessionPayload | null>(null);
  const [demoAdmins, setDemoAdmins] = useState<
    {
      id: string;
      nome: string;
      email: string;
      nickname_in_game: string;
      cargo_nome: string;
      permissoes: PermissionCode[];
      has_password: boolean;
    }[]
  >([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);

  // Estado do Modal de Senha de Confirmação (232356)
  const [pendingAction, setPendingAction] =
    useState<PendingConfirmationAction | null>(null);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmingPin, setConfirmingPin] = useState(false);

  const notify = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchPortalData = useCallback(async () => {
    try {
      const res = await fetch("/api/portal", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as PortalDatabaseState;
        setPortalState(data);
        try {
          localStorage.setItem("alcatrazz_portal_backup", JSON.stringify(data));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      try {
        const cached = localStorage.getItem("alcatrazz_portal_backup");
        if (cached) {
          setPortalState(JSON.parse(cached));
        }
      } catch {
        // fallback to initial seed
      }
    }
  }, []);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session || null);
        setDemoAdmins(data.demo_admins || []);
      }
    } catch {
      // ignore network error
    }
  }, []);

  useEffect(() => {
    fetchPortalData();
    fetchAuthStatus();

    // Sincronização automática em tempo real a cada 6 segundos para todos os dispositivos
    const syncInterval = setInterval(() => {
      fetchPortalData();
    }, 6000);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [fetchPortalData, fetchAuthStatus]);

  // Executa ações públicas ou solicita a Senha de Confirmação (232356)
  const executeServerAction = (
    action: string,
    payload: unknown,
    successMsg: string,
    title = "Confirmar Alteração no Portal"
  ): Promise<void> => {
    // Confirmação de presença em evento não exige senha do líder
    if (action === "confirm_event_presence") {
      return sendActionToServer(action, payload, "", successMsg);
    }

    // Abre o Modal de Senha de Confirmação para qualquer cadastro/edição/exclusão
    return new Promise<void>((resolve, reject) => {
      setConfirmationPassword("");
      setPinError(null);
      setPendingAction({
        action,
        payload,
        successMsg,
        title,
        resolve,
        reject,
      });
    });
  };

  const sendActionToServer = async (
    action: string,
    payload: unknown,
    senhaConfirmacao: string,
    successMsg: string
  ) => {
    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        payload,
        senha_confirmacao: senhaConfirmacao,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Operação recusada.");
    }
    if (data.state) {
      setPortalState(data.state);
      try {
        localStorage.setItem(
          "alcatrazz_portal_backup",
          JSON.stringify(data.state)
        );
      } catch {
        // ignore
      }
    }
    notify("success", data.message || successMsg);
  };

  const handleConfirmPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAction) return;
    setConfirmingPin(true);
    setPinError(null);

    try {
      await sendActionToServer(
        pendingAction.action,
        pendingAction.payload,
        confirmationPassword,
        pendingAction.successMsg
      );
      pendingAction.resolve();
      setPendingAction(null);
      setConfirmationPassword("");
    } catch (err: any) {
      const msg =
        err?.message ||
        "Senha de confirmação incorreta! Verifique e tente novamente.";
      setPinError(msg);
      notify("error", msg);
    } finally {
      setConfirmingPin(false);
    }
  };

  const handleCancelConfirmation = () => {
    if (pendingAction) {
      pendingAction.reject(new Error("Cancelado pelo usuário"));
    }
    setPendingAction(null);
    setConfirmationPassword("");
    setPinError(null);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Dados em destaque na Página Inicial
  const liderCla =
    portalState.jogadores.find((j) => j.is_lider_destaque) ||
    portalState.jogadores.find((j) => j.cargo_id === "cargo-lider") ||
    (portalState.jogadores.length > 0 ? portalState.jogadores[0] : null);

  const proximosEventos = portalState.eventos
    .filter((e) => e.status !== "concluido")
    .slice(0, 3);

  const ultimosComunicados = [...portalState.avisos]
    .sort((a, b) => (a.fixado === b.fixado ? 0 : a.fixado ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#090909] text-stone-100 relative">
      {/* =====================================================================
          MODAL GLOBAL DE SENHA DE CONFIRMAÇÃO DO LÍDER (232356)
      ===================================================================== */}
      {pendingAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="medieval-card rounded-2xl max-w-md w-full p-6 sm:p-7 relative border-2 border-[#D6A33A] shadow-gold-glow-strong">
            <button
              onClick={handleCancelConfirmation}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#790D16] to-[#D66A19] border-2 border-[#D6A33A] flex items-center justify-center text-white shadow-gold-glow shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-medieval uppercase tracking-widest text-[#D6A33A] block">
                  Confirmação de Segurança
                </span>
                <h3 className="font-medieval text-xl font-bold text-white">
                  {pendingAction.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 mb-5 leading-relaxed">
              Digite a <strong className="text-[#D6A33A]">Senha de Confirmação do Líder</strong> para
              salvar esta informação. Após confirmar, os dados ficarão salvos
              automaticamente para todos os usuários que acessarem o site.
            </p>

            <form onSubmit={handleConfirmPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1.5">
                  Senha de Confirmação *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={confirmationPassword}
                  onChange={(e) => {
                    setConfirmationPassword(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Digite a senha de acesso..."
                  className="input-medieval w-full text-center text-lg tracking-[0.35em] font-mono py-3"
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleCancelConfirmation}
                  className="px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirmingPin}
                  className="btn-royal-gold px-6 py-2.5 rounded-lg text-xs font-medieval uppercase tracking-wider flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {confirmingPin ? "Salvando..." : "Confirmar & Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICAÇÃO TOAST GLOBAL */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-md animate-bounce">
          <div
            className={`px-5 py-3.5 rounded-xl border-2 shadow-2xl flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-[#111010] border-[#D6A33A] text-stone-100 shadow-gold-glow"
                : "bg-[#24070a] border-rose-500 text-rose-100 shadow-red-glow"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#D6A33A] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="text-stone-400 hover:text-white ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGAÇÃO MEDIEVAL FIXA */}
      <header className="sticky top-0 z-40 bg-[#090909]/90 backdrop-blur-md border-b border-[#D6A33A]/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo + Identificação */}
          <a
            href="#inicio"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <img
              src="/assets/alcatrazz-crest.jpg"
              alt="Brasão Oficial ALCATRAZZ"
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#D6A33A] shadow-gold-glow group-hover:scale-105 transition"
            />
            <div>
              <div className="font-medieval text-xl sm:text-2xl font-black tracking-widest gold-text-gradient leading-none">
                ALCATRAZZ
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#D66A19] font-semibold mt-1">
                Priston Tale • Portal Oficial
              </div>
            </div>
          </a>

          {/* Links Desktop */}
          <nav className="hidden xl:flex items-center gap-1">
            {[
              { label: "Início", href: "inicio" },
              { label: "História", href: "historia" },
              { label: "Membros", href: "membros" },
              { label: "Hierarquia", href: "hierarquia" },
              { label: "Mural", href: "mural" },
              { label: "Eventos & SoD", href: "eventos" },
              { label: "Ranking", href: "ranking" },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="px-3 py-2 rounded-lg text-xs font-medieval uppercase tracking-wider text-stone-300 hover:text-[#D6A33A] hover:bg-[#790D16]/20 transition"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Ações Rápidas à Direita */}
          <div className="hidden sm:flex items-center gap-2.5">
            {pwaInstallPrompt && (
              <button
                onClick={() => {
                  pwaInstallPrompt.prompt();
                  setPwaInstallPrompt(null);
                }}
                className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-[#D6A33A]/40 text-[#D6A33A] text-xs font-medieval uppercase flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Instalar App
              </button>
            )}

            <button
              onClick={() => scrollToSection("membros")}
              className="btn-blood-crimson px-3.5 py-2 rounded-lg text-xs font-medieval uppercase tracking-wider flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D6A33A]" /> + Cadastrar
              Membro
            </button>

            <button
              onClick={() => scrollToSection("ranking")}
              className="btn-royal-gold px-4 py-2 rounded-lg text-xs font-medieval uppercase tracking-wider flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" /> Ranking & Pontos
            </button>
          </div>

          {/* Botão Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 rounded-lg bg-stone-900 border border-[#D6A33A]/40 text-[#D6A33A]"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#0c0a0a] border-b-2 border-[#D6A33A]/50 px-4 pt-3 pb-6 space-y-2">
            {[
              { label: "Início", href: "inicio" },
              { label: "História & Tradição", href: "historia" },
              { label: "Sistema de Membros (Cadastrar)", href: "membros" },
              { label: "Hierarquia do Clã", href: "hierarquia" },
              { label: "Mural de Avisos", href: "mural" },
              { label: "Calendário & SoD", href: "eventos" },
              { label: "Ranking dos Guerreiros (Editar)", href: "ranking" },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medieval uppercase tracking-wider text-stone-200 hover:bg-[#790D16]/30 hover:text-[#D6A33A] flex items-center justify-between"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-[#D6A33A]" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* =====================================================================
          3. PÁGINA INICIAL CINEMATOGRÁFICA
      ===================================================================== */}
      <section
        id="inicio"
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-[#D6A33A]/30"
      >
        {/* Imagem de Fundo Medieval com Castelo e Atmosfera Sombria */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/assets/hero-castle.jpg')`,
          }}
        />
        {/* Camadas de Iluminação Sombria, Vermelho Sangue e Dourado */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/80 via-[#090909]/65 to-[#090909]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,#090909_95%)]" />

        {/* Partículas Discretas de Brasas / Fogo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="ember-particle absolute bottom-10 left-[15%] w-2 h-2 rounded-full bg-[#D66A19] blur-[1px]" />
          <span
            className="ember-particle absolute bottom-16 left-[35%] w-1.5 h-1.5 rounded-full bg-[#D6A33A]"
            style={{ animationDelay: "1.5s" }}
          />
          <span
            className="ember-particle absolute bottom-8 left-[65%] w-2.5 h-2.5 rounded-full bg-[#790D16]"
            style={{ animationDelay: "2.8s" }}
          />
          <span
            className="ember-particle absolute bottom-20 left-[82%] w-1.5 h-1.5 rounded-full bg-[#D66A19]"
            style={{ animationDelay: "0.7s" }}
          />
        </div>

        {/* Conteúdo Central Hero */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          {/* Identificação Oficial do Desenvolvedor */}
          <a
            href="https://www.instagram.com/luiz_jaques23?srtk=MW5pamVsYXJveG05aA%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-[#D6A33A]/60 text-[#D6A33A] hover:text-white hover:border-[#D6A33A] text-xs font-medieval uppercase tracking-[0.2em] mb-6 shadow-gold-glow transition group"
          >
            <Instagram className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform" />
            <span>Desenvolvido por Luiz Jaques</span>
          </a>

          {/* Brasão Oficial Exclusivo do Clã ALCATRAZZ */}
          <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 mb-6">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#790D16] via-[#D6A33A] to-[#D66A19] opacity-60 blur-xl animate-pulse" />
            <img
              src="/assets/alcatrazz-crest.jpg"
              alt="Brasão Oficial do Clã ALCATRAZZ"
              className="relative w-full h-full rounded-2xl object-cover border-2 border-[#D6A33A] shadow-gold-glow-strong"
            />
          </div>

          {/* Nome do Clã em Destaque */}
          <h1 className="font-medieval text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.12em] gold-text-gradient drop-shadow-[0_5px_25px_rgba(214,163,58,0.45)]">
            ALCATRAZZ
          </h1>

          {/* Slogan Oficial */}
          <p className="font-medieval text-base sm:text-xl lg:text-2xl tracking-[0.28em] text-[#D66A19] font-bold uppercase mt-3">
            &ldquo;ALCATRAZZ — HONRA, LEALDADE E PODER.&rdquo;
          </p>

          {/* Mensagem de Boas-Vindas */}
          <p className="max-w-3xl mx-auto text-stone-200 text-sm sm:text-lg mt-6 leading-relaxed font-normal">
            Bem-vindo à fortaleza oficial da irmandade{" "}
            <strong className="text-[#D6A33A]">ALCATRAZZ</strong>. Cadastre
            membros, atualize o Ranking de poder e organize nossas vitórias em{" "}
            <em>Priston Tale</em> diretamente pelo portal — todas as informações
            confirmadas com a senha do Líder ficam salvas automaticamente para
            todos os visitantes.
          </p>

          {/* Botões de Ação Principal */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={() => scrollToSection("ranking")}
              className="btn-royal-gold px-7 py-3.5 rounded-xl font-medieval text-sm uppercase tracking-widest flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" /> Ver & Editar Ranking
            </button>
            <button
              onClick={() => scrollToSection("membros")}
              className="btn-blood-crimson px-7 py-3.5 rounded-xl font-medieval text-sm uppercase tracking-widest flex items-center gap-2"
            >
              <Swords className="w-4 h-4 text-[#D6A33A]" /> Cadastrar / Gerenciar
              Membros ({portalState.jogadores.length})
            </button>
          </div>

          {/* Indicadores Rápidos na Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-14">
            <div className="medieval-card rounded-xl p-4 bg-black/80">
              <div className="font-medieval text-2xl sm:text-3xl font-extrabold text-[#D6A33A]">
                {portalState.jogadores.length}
              </div>
              <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">
                Integrantes Cadastrados
              </div>
            </div>
            <div className="medieval-card rounded-xl p-4 bg-black/80">
              <div className="font-medieval text-2xl sm:text-3xl font-extrabold text-[#D66A19]">
                {portalState.cargos.length}
              </div>
              <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">
                Patentes da Hierarquia
              </div>
            </div>
            <div className="medieval-card rounded-xl p-4 bg-black/80">
              <div className="font-medieval text-2xl sm:text-3xl font-extrabold text-stone-100">
                {
                  portalState.eventos.filter((e) => e.status !== "concluido")
                    .length
                }
              </div>
              <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">
                Próximas Operações / SoD
              </div>
            </div>
            <div className="medieval-card rounded-xl p-4 bg-black/80">
              <div className="font-medieval text-2xl sm:text-3xl font-extrabold text-[#D6A33A]">
                ATIVO
              </div>
              <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">
                Salvamento Automático
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          APRESENTAÇÃO INSTITUCIONAL, HISTÓRIA DO CLÃ, LÍDER E RESUMO RÁPIDO
      ===================================================================== */}
      <section
        id="historia"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Apresentação Institucional e História do Clã */}
          <div className="lg:col-span-7 medieval-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#790D16]/40 border border-[#D6A33A]/40 text-[#D6A33A] text-xs uppercase tracking-widest mb-4">
                <Compass className="w-3.5 h-3.5" /> Tradição & Legado • ALCATRAZZ
              </div>
              <h2 className="font-medieval text-2xl sm:text-3xl font-extrabold gold-text-gradient mb-4">
                A LENDA DA FORTALEZA ALCATRAZZ
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-stone-300 leading-relaxed">
                <p>
                  O clã <strong className="text-white">ALCATRAZZ</strong> nasceu da
                  união de veteranos de guerra decididos a construir mais do que
                  uma guilda: uma verdadeira dinastia militar dentro do universo
                  de <em>Priston Tale</em>.
                </p>
                <p>
                  Das planícies ancestrais de Ricarten e dos altares místicos de
                  Pillai até as areias escaldantes de Navisko, o nome ALCATRAZZ
                  tornou-se sinônimo de disciplina tática. Em{" "}
                  <strong className="text-[#D66A19]">
                    Siege of the Darkness (SoD)
                  </strong>
                  , nossos esquadrões operam com precisão cirúrgica para manter a
                  Coroa de Bellatra. Nos domingos de{" "}
                  <strong className="text-[#D6A33A]">Bless Castle</strong>, nossa
                  linha de frente jamais recua.
                </p>
                <p>
                  Cada membro alistado em nossas fileiras jura defender nosso
                  lema sagrado:{" "}
                  <em className="text-[#D6A33A] font-medieval">
                    Honra perante os aliados, Lealdade à irmandade e Poder
                    implacável contra os inimigos.
                  </em>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-stone-800 text-center">
              <div className="p-3 rounded-lg bg-black/50 border border-[#D6A33A]/20">
                <div className="font-medieval text-xs uppercase text-[#D6A33A]">
                  Pilar I
                </div>
                <div className="font-medieval font-bold text-base text-white mt-0.5">
                  HONRA
                </div>
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-[#D6A33A]/20">
                <div className="font-medieval text-xs uppercase text-[#D66A19]">
                  Pilar II
                </div>
                <div className="font-medieval font-bold text-base text-white mt-0.5">
                  LEALDADE
                </div>
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-[#D6A33A]/20">
                <div className="font-medieval text-xs uppercase text-[#D6A33A]">
                  Pilar III
                </div>
                <div className="font-medieval font-bold text-base text-white mt-0.5">
                  PODER
                </div>
              </div>
            </div>
          </div>

          {/* Destaque Especial para o Líder */}
          {liderCla ? (
            <div className="lg:col-span-5 medieval-card rounded-2xl p-6 sm:p-8 border-2 border-[#D6A33A] shadow-gold-glow flex flex-col justify-between bg-gradient-to-b from-[#790D16]/35 via-[#111010] to-[#090909]">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6A33A] text-black font-medieval font-extrabold text-xs uppercase">
                    <Crown className="w-4 h-4" /> Comandante Supremo
                  </span>
                  <span className="text-xs font-medieval text-[#D6A33A]">
                    Destaque da Liderança
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={liderCla.avatar_url || "/assets/alcatrazz-crest.jpg"}
                    alt={liderCla.nickname}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D6A33A] shadow-gold-glow"
                  />
                  <div>
                    <h3 className="font-medieval text-2xl sm:text-3xl font-black gold-text-gradient">
                      {liderCla.nickname}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1">
                      {liderCla.classe} ({liderCla.tribo}) •{" "}
                      <strong className="text-[#D6A33A]">
                        Level {liderCla.level}
                      </strong>
                    </p>
                    <div className="mt-2">
                      <RoleBadge
                        cargo={portalState.cargos.find(
                          (c) => c.id === liderCla.cargo_id
                        )}
                      />
                    </div>
                  </div>
                </div>

                <blockquote className="p-4 rounded-xl bg-black/60 border-l-4 border-[#D6A33A] text-xs sm:text-sm text-stone-200 italic mb-5">
                  &ldquo;Na ALCATRAZZ, nenhum guerreiro luta sozinho. Nossa força
                  em Bellatra e nas muralhas de Bless Castle vem da disciplina e
                  da irmandade do nosso clã.&rdquo;
                </blockquote>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-800 text-xs">
                <div className="bg-black/50 p-3 rounded-lg border border-stone-800">
                  <span className="text-stone-400 block">Pontuação de Comando</span>
                  <strong className="font-medieval text-base text-[#D6A33A]">
                    {liderCla.pontuacao.toLocaleString("pt-BR")} pts
                  </strong>
                </div>
                <div className="bg-black/50 p-3 rounded-lg border border-stone-800">
                  <span className="text-stone-400 block">Campanhas & SoD</span>
                  <strong className="font-medieval text-base text-white">
                    {liderCla.participacoes_eventos} vitórias
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-5 medieval-card rounded-2xl p-6 sm:p-8 border-2 border-dashed border-[#D6A33A]/40 flex flex-col justify-between text-center bg-black/50">
              <div className="my-auto py-8">
                <div className="w-16 h-16 rounded-2xl bg-[#790D16]/30 border border-[#D6A33A] flex items-center justify-center text-[#D6A33A] mx-auto mb-4 shadow-gold-glow">
                  <Crown className="w-8 h-8" />
                </div>
                <h3 className="font-medieval text-xl font-bold text-stone-100 mb-2">
                  Comando Supremo ALCATRAZZ
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto mb-6 leading-relaxed">
                  O posto de Líder Supremo está aguardando o primeiro cadastro. O Líder pode registrar os dados no Ranking ou no Sistema de Membros utilizando a senha de confirmação (232356).
                </p>
                <button
                  onClick={() => scrollToSection("ranking")}
                  className="btn-royal-gold px-5 py-2.5 rounded-lg text-xs font-medieval uppercase tracking-wider inline-flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" /> Cadastrar no Ranking
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumo Rápido na Home: Próximos Eventos e Últimos Comunicados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
          {/* Próximos Eventos */}
          <div className="medieval-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medieval text-lg font-bold text-[#D6A33A] flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#D66A19]" /> Próximos Eventos &
                SoD
              </h3>
              <button
                onClick={() => scrollToSection("eventos")}
                className="text-xs font-medieval uppercase text-[#D6A33A] hover:underline"
              >
                Ver Calendário Completo →
              </button>
            </div>
            <div className="space-y-3">
              {proximosEventos.length === 0 ? (
                <div className="p-6 rounded-xl bg-black/50 border border-dashed border-stone-800 text-center">
                  <p className="text-xs text-stone-400 mb-3">
                    Nenhuma operação agendada no momento.
                  </p>
                  <button
                    onClick={() => scrollToSection("eventos")}
                    className="btn-royal-gold px-4 py-2 rounded-lg text-[11px] font-medieval uppercase"
                  >
                    + Criar Evento / SoD
                  </button>
                </div>
              ) : (
                proximosEventos.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A]/50 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-medieval uppercase px-2 py-0.5 rounded bg-[#790D16]/50 text-[#D6A33A]">
                        {ev.categoria}
                      </span>
                      <h4 className="font-medieval font-bold text-sm text-stone-100 mt-1">
                        {ev.titulo}
                      </h4>
                      <p className="text-xs text-stone-400">
                        {new Date(ev.data_evento + "T12:00:00").toLocaleDateString(
                          "pt-BR"
                        )}{" "}
                        às {ev.horario} • Resp.: {ev.responsavel}
                      </p>
                    </div>
                    <button
                      onClick={() => scrollToSection("eventos")}
                      className="btn-royal-gold px-3 py-1.5 rounded-lg text-[11px] font-medieval uppercase shrink-0"
                    >
                      Participar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Últimos Comunicados */}
          <div className="medieval-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medieval text-lg font-bold text-[#D6A33A] flex items-center gap-2">
                <ScrollText className="w-5 h-5" /> Últimos Comunicados Oficiais
              </h3>
              <button
                onClick={() => scrollToSection("mural")}
                className="text-xs font-medieval uppercase text-[#D6A33A] hover:underline"
              >
                Abrir Mural →
              </button>
            </div>
            <div className="space-y-3">
              {ultimosComunicados.length === 0 ? (
                <div className="p-6 rounded-xl bg-black/50 border border-dashed border-stone-800 text-center">
                  <p className="text-xs text-stone-400 mb-3">
                    Nenhum comunicado publicado no mural ainda.
                  </p>
                  <button
                    onClick={() => scrollToSection("mural")}
                    className="btn-royal-gold px-4 py-2 rounded-lg text-[11px] font-medieval uppercase"
                  >
                    + Publicar Comunicado
                  </button>
                </div>
              ) : (
                ultimosComunicados.map((av) => (
                  <div
                    key={av.id}
                    className="p-3.5 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A]/50 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span className="text-[#D6A33A] font-semibold">
                        {av.categoria}
                      </span>
                      <span>
                        Por {av.autor} ({av.autor_cargo})
                      </span>
                    </div>
                    <h4 className="font-medieval font-bold text-sm text-stone-100">
                      {av.titulo}
                    </h4>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1">
                      {av.descricao}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SISTEMA DE MEMBROS (Desbloqueado + Senha de Confirmação ao Salvar)
      ===================================================================== */}
      <MembersSection
        jogadores={portalState.jogadores}
        cargos={portalState.cargos}
        canManagePlayers={true}
        onSavePlayer={(player) =>
          executeServerAction(
            "save_jogador",
            player,
            "Guerreiro salvo com sucesso!",
            "Confirmar Cadastro / Edição de Membro"
          )
        }
        onDeletePlayer={(id) =>
          executeServerAction(
            "delete_jogador",
            { id },
            "Guerreiro removido do clã.",
            "Confirmar Remoção de Membro"
          )
        }
      />

      {/* =====================================================================
          5. HIERARQUIA DO CLÃ (Desbloqueado + Senha de Confirmação ao Salvar)
      ===================================================================== */}
      <HierarchySection
        cargos={portalState.cargos}
        jogadores={portalState.jogadores}
        permissoes={portalState.permissoes}
        canManageRoles={true}
        onChangePlayerRole={(jogador_id, novo_cargo_id) =>
          executeServerAction(
            "change_jogador_cargo",
            { jogador_id, novo_cargo_id },
            "Patente hierárquica atualizada!",
            "Confirmar Promoção / Alteração de Cargo"
          )
        }
        onSaveCargo={(cargo) =>
          executeServerAction(
            "save_cargo",
            cargo,
            "Patente salva na hierarquia do clã!",
            "Confirmar Alteração de Patente"
          )
        }
        onDeleteCargo={(id) =>
          executeServerAction(
            "delete_cargo",
            { id },
            "Patente removida.",
            "Confirmar Exclusão de Patente"
          )
        }
      />

      {/* =====================================================================
          6. MURAL DE AVISOS (Desbloqueado + Senha de Confirmação ao Salvar)
      ===================================================================== */}
      <NoticesSection
        avisos={portalState.avisos}
        canManageNotices={true}
        onSaveNotice={(aviso) =>
          executeServerAction(
            "save_aviso",
            aviso,
            "Comunicado oficial publicado no Mural!",
            "Confirmar Publicação no Mural"
          )
        }
        onTogglePinNotice={(id) =>
          executeServerAction(
            "toggle_fixar_aviso",
            { id },
            "Destaque do comunicado atualizado!",
            "Confirmar Fixação de Comunicado"
          )
        }
        onDeleteNotice={(id) =>
          executeServerAction(
            "delete_aviso",
            { id },
            "Comunicado excluído.",
            "Confirmar Exclusão de Comunicado"
          )
        }
      />

      {/* =====================================================================
          7. CALENDÁRIO DE EVENTOS E SOD (Desbloqueado + Senha de Confirmação)
      ===================================================================== */}
      <EventsSection
        eventos={portalState.eventos}
        participacoes={portalState.participacoes}
        jogadores={portalState.jogadores}
        canManageEvents={true}
        onSaveEvent={(evt) =>
          executeServerAction(
            "save_evento",
            evt,
            "Operação salva no Calendário Oficial!",
            "Confirmar Agendamento de Evento / SoD"
          )
        }
        onDeleteEvent={(id) =>
          executeServerAction(
            "delete_evento",
            { id },
            "Evento removido.",
            "Confirmar Exclusão de Evento"
          )
        }
        onConfirmPresence={(payload) =>
          executeServerAction(
            "confirm_event_presence",
            payload,
            "Presença confirmada com sucesso!"
          )
        }
      />

      {/* =====================================================================
          8. RANKING DOS JOGADORES (Cadastro Direto + Senha de Confirmação)
      ===================================================================== */}
      <RankingSection
        jogadores={portalState.jogadores}
        cargos={portalState.cargos}
        pontuacoes={portalState.pontuacoes}
        canUpdateRanking={true}
        onUpdatePoints={(payload) =>
          executeServerAction(
            "update_ranking_points",
            payload,
            "Pontuação e ranking atualizados com sucesso!",
            "Confirmar Alteração no Ranking"
          )
        }
        onUpsertRankingPlayer={(player) =>
          executeServerAction(
            "upsert_ranking_entry",
            player,
            "Participante salvo no Ranking Oficial!",
            "Confirmar Cadastro no Ranking"
          )
        }
        onDeletePlayer={(id) =>
          executeServerAction(
            "delete_jogador",
            { id },
            "Participante removido do Ranking.",
            "Confirmar Remoção do Ranking"
          )
        }
      />

      {/* =====================================================================
          RODAPÉ OFICIAL — DESENVOLVIDO POR LUIZ JAQUES (INSTAGRAM)
      ===================================================================== */}
      <footer className="mt-auto bg-[#060505] border-t-2 border-[#D6A33A]/40 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/alcatrazz-crest.jpg"
              alt="Brasão ALCATRAZZ"
              className="w-14 h-14 rounded-xl object-cover border border-[#D6A33A]"
            />
            <div>
              <div className="font-medieval text-xl font-black gold-text-gradient tracking-widest">
                ALCATRAZZ HONRA • LEALDADE • PODER
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Portal Oficial do Clã de MMORPG (Universo Priston Tale)
              </p>
            </div>
          </div>

          <div className="text-center md:text-right flex flex-col items-center md:items-end gap-1.5">
            <a
              href="https://www.instagram.com/luiz_jaques23?srtk=MW5pamVsYXJveG05aA%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#833ab4]/25 via-[#fd1d1d]/25 to-[#fcb045]/25 border border-[#D6A33A]/50 text-[#D6A33A] hover:text-white hover:border-[#D6A33A] transition shadow-gold-glow group"
            >
              <Instagram className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform" />
              <span className="font-medieval text-sm font-bold tracking-wide">
                Desenvolvido por Luiz Jaques
              </span>
            </a>
            <p className="text-xs text-stone-500 mt-1">
              © {new Date().getFullYear()} ALCATRAZZ. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
