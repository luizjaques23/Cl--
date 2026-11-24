"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  UserPlus,
  History,
  BarChart3,
  Users,
  Crown,
  ScrollText,
  Calendar,
  Trophy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
} from "lucide-react";
import {
  Cargo,
  Permissao,
  PermissionCode,
  PortalDatabaseState,
  UsuarioAdmin,
} from "@/types/portal";
import { SessionPayload } from "@/lib/server-db";

interface DemoAdminSummary {
  id: string;
  nome: string;
  email: string;
  nickname_in_game: string;
  cargo_nome: string;
  permissoes: PermissionCode[];
  has_password: boolean;
}

interface AdminPanelSectionProps {
  portalState: PortalDatabaseState;
  session: SessionPayload | null;
  demoAdmins: DemoAdminSummary[];
  onAuthChanged: () => Promise<void>;
  onSaveAdminUser: (
    user: Partial<UsuarioAdmin> & { password?: string }
  ) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onNotify: (type: "success" | "error", msg: string) => void;
}

export function AdminPanelSection({
  portalState,
  session,
  demoAdmins,
  onAuthChanged,
  onSaveAdminUser,
  onResetDemoData,
  onNotify,
}: AdminPanelSectionProps) {
  const [authTab, setAuthTab] = useState<"login" | "setup" | "recovery">(
    "login"
  );
  const [email, setEmail] = useState("comando@zephiraworld.com");
  const [password, setPassword] = useState("");
  const [nomeSetup, setNomeSetup] = useState("Luiz Jaques (Comandante Zephira)");
  const [nickSetup, setNickSetup] = useState("LordZephira");

  const [recoveryCode, setRecoveryCode] = useState("");
  const [generatedPreviewCode, setGeneratedPreviewCode] = useState<
    string | null
  >(null);
  const [newPassword, setNewPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Abas internas do Painel Admin autenticado
  const [adminSubTab, setAdminSubTab] = useState<
    "dashboard" | "admins" | "historico"
  >("dashboard");

  // Novo Administrador Form
  const [newAdminForm, setNewAdminForm] = useState<{
    nome: string;
    email: string;
    nickname_in_game: string;
    cargo_id: string;
    password: string;
    permissoes_extras: PermissionCode[];
  }>({
    nome: "",
    email: "",
    nickname_in_game: "",
    cargo_id: "cargo-oficial",
    password: "",
    permissoes_extras: ["gerenciar_jogadores", "gerenciar_eventos"],
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needs_setup) {
          setAuthTab("setup");
        }
        onNotify("error", data.error || "Falha no login.");
        return;
      }
      setPassword("");
      await onAuthChanged();
      onNotify("success", `Bem-vindo ao Trono de Comando, ${data.session.nome}!`);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setup_password",
          email,
          password,
          nome: nomeSetup,
          nickname: nickSetup,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Erro ao definir credencial.");
        return;
      }
      setPassword("");
      await onAuthChanged();
      onNotify(
        "success",
        "Senha criptografada (scrypt) gravada no servidor e sessão iniciada!"
      );
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleActivateDemoSession = async (adminId: string) => {
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "activate_demo_session",
          admin_id: adminId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Erro ao ativar sessão.");
        return;
      }
      await onAuthChanged();
      onNotify(
        "success",
        `Sessão autenticada no servidor como ${data.session.nome} (${data.session.cargo_nome})!`
      );
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleRequestRecovery = async () => {
    if (!email) {
      onNotify("error", "Informe o e-mail administrativo primeiro.");
      return;
    }
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_recovery", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Falha ao gerar código.");
        return;
      }
      setGeneratedPreviewCode(data.recovery_preview_code);
      setRecoveryCode(data.recovery_preview_code || "");
      onNotify("success", data.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          email,
          code: recoveryCode,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Erro ao redefinir senha.");
        return;
      }
      setGeneratedPreviewCode(null);
      setNewPassword("");
      await onAuthChanged();
      onNotify("success", "Senha redefinida com sucesso e sessão iniciada!");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    setLoadingAuth(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      await onAuthChanged();
      onNotify("success", "Sessão administrativa encerrada com segurança.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveAdminUser(newAdminForm);
    setNewAdminForm({
      nome: "",
      email: "",
      nickname_in_game: "",
      cargo_id: "cargo-oficial",
      password: "",
      permissoes_extras: ["gerenciar_jogadores", "gerenciar_eventos"],
    });
  };

  const toggleExtraPerm = (code: PermissionCode) => {
    const exists = newAdminForm.permissoes_extras.includes(code);
    setNewAdminForm({
      ...newAdminForm,
      permissoes_extras: exists
        ? newAdminForm.permissoes_extras.filter((p) => p !== code)
        : [...newAdminForm.permissoes_extras, code],
    });
  };

  // Estatísticas para o Dashboard Administrativo
  const totalPlayers = portalState.jogadores.length;
  const activePlayers = portalState.jogadores.filter(
    (j) => j.status === "ativo"
  ).length;
  const avgLevel =
    totalPlayers > 0
      ? Math.round(
          portalState.jogadores.reduce((acc, j) => acc + j.level, 0) /
            totalPlayers
        )
      : 0;
  const totalPoints = portalState.jogadores.reduce(
    (acc, j) => acc + j.pontuacao,
    0
  );
  const scheduledEvents = portalState.eventos.filter(
    (e) => e.status === "agendado"
  ).length;

  return (
    <section
      id="admin"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#D6A33A]/15"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#790D16]/30 border border-[#D6A33A]/40 text-[#D6A33A] text-xs uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Segurança Criptográfica
            Server-Side
          </div>
          <h2 className="font-medieval text-3xl sm:text-4xl font-extrabold gold-text-gradient tracking-wide">
            PAINEL ADMINISTRATIVO & CONSELHO
          </h2>
          <p className="text-stone-400 mt-2 max-w-2xl text-sm sm:text-base">
            Centro de comando protegido por autenticação no servidor (HMAC-SHA256
            HttpOnly + scrypt / Supabase Auth) e controle granular de permissões
            (RBAC).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-[#D6A33A]/30 text-xs text-stone-300">
            <Database className="w-3.5 h-3.5 text-[#D6A33A]" />
            Motor Ativo:{" "}
            <strong className="text-[#D6A33A]">
              {portalState.storage_mode === "supabase"
                ? "Supabase PostgreSQL"
                : "Servidor Local Persistente + Cache"}
            </strong>
          </span>

          {session && (
            <button
              onClick={handleLogout}
              disabled={loadingAuth}
              className="btn-blood-crimson px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Encerrar Sessão
            </button>
          )}
        </div>
      </div>

      {/* CASO NÃO AUTENTICADO: TELA DE LOGIN / CONFIGURAÇÃO DE SENHA / RECUPERAÇÃO */}
      {!session ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulário de Autenticação Real no Servidor */}
          <div className="lg:col-span-7 medieval-card rounded-2xl p-6 sm:p-8 border-2 border-[#D6A33A]/50">
            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-stone-800">
              <button
                onClick={() => setAuthTab("login")}
                className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 transition ${
                  authTab === "login"
                    ? "bg-[#D6A33A] text-black font-bold"
                    : "bg-stone-900 text-stone-300 hover:bg-stone-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Login Oficial
              </button>
              <button
                onClick={() => setAuthTab("setup")}
                className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 transition ${
                  authTab === "setup"
                    ? "bg-[#D6A33A] text-black font-bold"
                    : "bg-stone-900 text-stone-300 hover:bg-stone-800"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Definir Senha / Primeiro
                Acesso
              </button>
              <button
                onClick={() => setAuthTab("recovery")}
                className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 transition ${
                  authTab === "recovery"
                    ? "bg-[#D6A33A] text-black font-bold"
                    : "bg-stone-900 text-stone-300 hover:bg-stone-800"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" /> Recuperar Senha
              </button>
            </div>

            {authTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <h3 className="font-medieval text-xl font-bold text-stone-100">
                  Acesso ao Conselho Administrativo
                </h3>
                <p className="text-xs text-stone-400">
                  Autenticação validada no servidor sem senhas fixas expostas no
                  código-fonte.
                </p>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    E-mail Administrativo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="comando@zephiraworld.com"
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Senha Criptográfica
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha cadastrada..."
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthTab("recovery")}
                    className="text-xs text-[#D6A33A] hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="btn-royal-gold px-6 py-2.5 rounded-lg text-xs font-medieval uppercase tracking-wider"
                  >
                    {loadingAuth ? "Validando..." : "Entrar no Painel"}
                  </button>
                </div>
              </form>
            )}

            {authTab === "setup" && (
              <form onSubmit={handleSetupPassword} className="space-y-4">
                <h3 className="font-medieval text-xl font-bold text-stone-100">
                  Configurar Credencial no Servidor (scrypt)
                </h3>
                <p className="text-xs text-stone-400">
                  Como o portal não utiliza senhas fixas no código-fonte, você pode
                  definir agora sua senha criptografada para uma conta existente ou
                  criar seu próprio usuário Líder.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Seu Nome / Título
                    </label>
                    <input
                      type="text"
                      value={nomeSetup}
                      onChange={(e) => setNomeSetup(e.target.value)}
                      className="input-medieval w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Nickname no Clã
                    </label>
                    <input
                      type="text"
                      value={nickSetup}
                      onChange={(e) => setNickSetup(e.target.value)}
                      className="input-medieval w-full text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    E-mail Administrativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    Definir Nova Senha (mín. 6 caracteres) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Escolha uma senha forte..."
                    className="input-medieval w-full text-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="btn-royal-gold px-6 py-2.5 rounded-lg text-xs font-medieval uppercase tracking-wider"
                  >
                    {loadingAuth
                      ? "Criptografando..."
                      : "Registrar Senha & Autenticar"}
                  </button>
                </div>
              </form>
            )}

            {authTab === "recovery" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <h3 className="font-medieval text-xl font-bold text-stone-100">
                  Recuperação Segura de Senha
                </h3>
                <p className="text-xs text-stone-400">
                  Gere um token criptográfico temporário no servidor para redefinir
                  sua senha administrativa.
                </p>

                <div>
                  <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                    E-mail Administrativo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-medieval flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRequestRecovery}
                      disabled={loadingAuth}
                      className="btn-blood-crimson px-4 py-2 rounded-lg text-xs font-medieval uppercase shrink-0"
                    >
                      Gerar Token
                    </button>
                  </div>
                </div>

                {generatedPreviewCode && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/60 text-xs text-emerald-200">
                    Token criptográfico gerado pelo servidor para homologação:{" "}
                    <strong className="font-mono text-sm text-[#D6A33A]">
                      {generatedPreviewCode}
                    </strong>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Código de 6 Dígitos *
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Ex: 482910"
                      className="input-medieval w-full text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                      Nova Senha *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha..."
                      className="input-medieval w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="btn-royal-gold px-6 py-2.5 rounded-lg text-xs font-medieval uppercase tracking-wider"
                  >
                    Redefinir Senha & Entrar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Instruções de Segurança do Líder */}
          <div className="lg:col-span-5 medieval-card rounded-2xl p-6 sm:p-8 border border-[#D6A33A]/40">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#D6A33A]/20 text-[#D6A33A] text-xs font-medieval uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Segurança do Clã
            </div>
            <h3 className="font-medieval text-xl font-bold text-stone-100 mb-2">
              Controle do Líder & Senha Oficial
            </h3>
            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
              O portal está limpo e pronto para uso oficial. Todas as adições de membros, alterações no ranking, publicação de comunicados e criação de eventos solicitam a <strong className="text-[#D6A33A]">Senha de Confirmação do Líder</strong> diretamente pela interface do site.
            </p>

            <div className="p-4 rounded-xl bg-black/60 border border-[#D6A33A]/30 space-y-2 text-xs mb-4">
              <div className="flex items-center gap-2 text-[#D6A33A] font-medieval font-bold">
                <KeyRound className="w-4 h-4" /> Acesso Restrito à Liderança
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                Qualquer alteração confirmada pela liderança fica salva permanentemente e sincronizada para todos os dispositivos em tempo real.
              </p>
            </div>

            {demoAdmins.length > 0 && (
              <div className="space-y-3 pt-2">
                {demoAdmins.map((adm) => (
                  <div
                    key={adm.id}
                    className="bg-black/60 p-4 rounded-xl border border-stone-800 hover:border-[#D6A33A]/60 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="font-medieval text-sm text-[#D6A33A]">
                        {adm.nome}
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-[#790D16]/50 text-stone-200 border border-[#D6A33A]/30 text-[11px] font-medieval">
                        {adm.cargo_nome}
                      </span>
                    </div>
                    <button
                      onClick={() => handleActivateDemoSession(adm.id)}
                      disabled={loadingAuth}
                      className="w-full btn-royal-gold py-2 rounded-lg text-xs font-medieval uppercase mt-2"
                    >
                      Autenticar como {adm.nickname_in_game}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PAINEL ADMINISTRATIVO AUTENTICADO */
        <div className="space-y-8">
          {/* Barra Superior do Administrador Logado */}
          <div className="medieval-card rounded-2xl p-6 border-2 border-[#D6A33A] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#790D16] to-[#D66A19] border-2 border-[#D6A33A] flex items-center justify-center text-white shadow-gold-glow">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Sessão Autenticada
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[#D6A33A] text-black font-medieval font-bold text-xs uppercase">
                    {session.cargo_nome}
                  </span>
                </div>
                <h3 className="font-medieval text-xl font-bold text-white mt-1">
                  {session.nome} ({session.nickname_in_game})
                </h3>
                <p className="text-xs text-stone-400">
                  Permissões no Servidor:{" "}
                  <span className="text-[#D6A33A]">
                    {session.permissoes.join(", ")}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAdminSubTab("dashboard")}
                className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 border transition ${
                  adminSubTab === "dashboard"
                    ? "bg-[#D6A33A] text-black font-bold border-[#D6A33A]"
                    : "bg-black/60 text-stone-300 border-stone-800"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Dashboard & Atalhos
              </button>
              <button
                onClick={() => setAdminSubTab("admins")}
                className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 border transition ${
                  adminSubTab === "admins"
                    ? "bg-[#D6A33A] text-black font-bold border-[#D6A33A]"
                    : "bg-black/60 text-stone-300 border-stone-800"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Administradores (
                {portalState.usuarios.length})
              </button>
              <button
                onClick={() => setAdminSubTab("historico")}
                className={`px-4 py-2 rounded-lg text-xs font-medieval uppercase flex items-center gap-1.5 border transition ${
                  adminSubTab === "historico"
                    ? "bg-[#D6A33A] text-black font-bold border-[#D6A33A]"
                    : "bg-black/60 text-stone-300 border-stone-800"
                }`}
              >
                <History className="w-3.5 h-3.5" /> Histórico de Alterações (
                {portalState.historico_administrativo.length})
              </button>
            </div>
          </div>

          {adminSubTab === "dashboard" && (
            <div className="space-y-8">
              {/* Indicadores Estatísticos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="medieval-card rounded-xl p-5">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span>Efetivo Total do Clã</span>
                    <Users className="w-4 h-4 text-[#D6A33A]" />
                  </div>
                  <div className="font-medieval text-3xl font-extrabold text-white">
                    {totalPlayers}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">
                    {activePlayers} guerreiros ativos em combate
                  </div>
                </div>

                <div className="medieval-card rounded-xl p-5">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span>Level Médio da Tropa</span>
                    <Crown className="w-4 h-4 text-[#D66A19]" />
                  </div>
                  <div className="font-medieval text-3xl font-extrabold text-[#D6A33A]">
                    Lv. {avgLevel}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Elite Tempskron & Morion
                  </div>
                </div>

                <div className="medieval-card rounded-xl p-5">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span>Poder Acumulado (Ranking)</span>
                    <Trophy className="w-4 h-4 text-[#D6A33A]" />
                  </div>
                  <div className="font-medieval text-3xl font-extrabold text-white">
                    {totalPoints.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Pontos de honra e SoD combinados
                  </div>
                </div>

                <div className="medieval-card rounded-xl p-5">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span>Operações Agendadas</span>
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-medieval text-3xl font-extrabold text-emerald-400">
                    {scheduledEvents}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {portalState.participacoes.length} confirmações registradas
                  </div>
                </div>
              </div>

              {/* Atalhos de Gerenciamento Rápido */}
              <div className="medieval-card rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="font-medieval text-lg font-bold text-[#D6A33A]">
                      Módulos Operacionais Liberados para sua Patente
                    </h4>
                    <p className="text-xs text-stone-400">
                      Com sua sessão autenticada, os botões de criação, edição e
                      exclusão estão desbloqueados diretamente em cada seção do
                      portal:
                    </p>
                  </div>
                  <button
                    onClick={onResetDemoData}
                    className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-medieval uppercase flex items-center gap-1.5 self-start"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#D6A33A]" /> Restaurar
                    Dados [EXEMPLO]
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <a
                    href="#membros"
                    className="p-4 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A] transition group"
                  >
                    <Users className="w-6 h-6 text-[#D6A33A] mb-2" />
                    <div className="font-medieval font-bold text-sm text-white group-hover:text-[#D6A33A]">
                      Gerenciar Jogadores
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Cadastrar, editar fichas e remover membros.
                    </p>
                  </a>

                  <a
                    href="#hierarquia"
                    className="p-4 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A] transition group"
                  >
                    <Crown className="w-6 h-6 text-[#D66A19] mb-2" />
                    <div className="font-medieval font-bold text-sm text-white group-hover:text-[#D6A33A]">
                      Gerenciar Cargos
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Promover, rebaixar e customizar patentes.
                    </p>
                  </a>

                  <a
                    href="#mural"
                    className="p-4 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A] transition group"
                  >
                    <ScrollText className="w-6 h-6 text-[#D6A33A] mb-2" />
                    <div className="font-medieval font-bold text-sm text-white group-hover:text-[#D6A33A]">
                      Gerenciar Avisos
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Publicar, fixar e excluir decretos.
                    </p>
                  </a>

                  <a
                    href="#eventos"
                    className="p-4 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A] transition group"
                  >
                    <Calendar className="w-6 h-6 text-emerald-400 mb-2" />
                    <div className="font-medieval font-bold text-sm text-white group-hover:text-[#D6A33A]">
                      Eventos & SoD
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Criar agendas de SoD, Bless Castle e Raids.
                    </p>
                  </a>

                  <a
                    href="#ranking"
                    className="p-4 rounded-xl bg-black/60 border border-stone-800 hover:border-[#D6A33A] transition group"
                  >
                    <Trophy className="w-6 h-6 text-[#D6A33A] mb-2" />
                    <div className="font-medieval font-bold text-sm text-white group-hover:text-[#D6A33A]">
                      Atualizar Ranking
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Conceder ou deduzir pontos de mérito.
                    </p>
                  </a>
                </div>
              </div>
            </div>
          )}

          {adminSubTab === "admins" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 medieval-card rounded-xl p-6">
                <h4 className="font-medieval text-lg font-bold gold-text-gradient mb-1">
                  Cadastrar / Atualizar Administrador
                </h4>
                <p className="text-xs text-stone-400 mb-4">
                  Delegue acesso administrativo e permissões específicas.
                </p>

                {!session.permissoes.includes("gerenciar_admins") ? (
                  <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-700 text-xs text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Sua patente atual ({session.cargo_nome}) não possui a
                    permissão &apos;gerenciar_admins&apos;.
                  </div>
                ) : (
                  <form onSubmit={handleCreateAdminSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                        Nome Completo / Título *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAdminForm.nome}
                        onChange={(e) =>
                          setNewAdminForm({ ...newAdminForm, nome: e.target.value })
                        }
                        placeholder="Ex: Oficial Titan"
                        className="input-medieval w-full text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={newAdminForm.email}
                          onChange={(e) =>
                            setNewAdminForm({
                              ...newAdminForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="oficial@zephiraworld.com"
                          className="input-medieval w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                          Nickname *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminForm.nickname_in_game}
                          onChange={(e) =>
                            setNewAdminForm({
                              ...newAdminForm,
                              nickname_in_game: e.target.value,
                            })
                          }
                          placeholder="TitanAegis"
                          className="input-medieval w-full text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                          Cargo Vinculado
                        </label>
                        <select
                          value={newAdminForm.cargo_id}
                          onChange={(e) =>
                            setNewAdminForm({
                              ...newAdminForm,
                              cargo_id: e.target.value,
                            })
                          }
                          className="input-medieval w-full text-sm"
                        >
                          {portalState.cargos.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                          Senha Inicial (Opcional)
                        </label>
                        <input
                          type="password"
                          value={newAdminForm.password}
                          onChange={(e) =>
                            setNewAdminForm({
                              ...newAdminForm,
                              password: e.target.value,
                            })
                          }
                          placeholder="Mín. 6 dígitos"
                          className="input-medieval w-full text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-[#D6A33A] font-medieval mb-1">
                        Permissões Extras
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {portalState.permissoes.map((p) => {
                          const active =
                            newAdminForm.permissoes_extras.includes(p.codigo);
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => toggleExtraPerm(p.codigo)}
                              className={`p-2 rounded border text-left text-[11px] transition ${
                                active
                                  ? "bg-[#790D16]/40 border-[#D6A33A] text-white"
                                  : "bg-black/40 border-stone-800 text-stone-400"
                              }`}
                            >
                              {p.nome}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full btn-royal-gold py-2.5 rounded-lg text-xs font-medieval uppercase mt-2"
                    >
                      Salvar Administrador
                    </button>
                  </form>
                )}
              </div>

              <div className="lg:col-span-7 medieval-card rounded-xl p-6">
                <h4 className="font-medieval text-lg font-bold text-[#D6A33A] mb-4">
                  Administradores Cadastrados ({portalState.usuarios.length})
                </h4>
                <div className="space-y-3">
                  {portalState.usuarios.map((u) => {
                    const cargo = portalState.cargos.find(
                      (c) => c.id === u.cargo_id
                    );
                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-xl bg-black/50 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="font-medieval text-stone-100">
                              {u.nome}
                            </strong>
                            <span className="text-xs px-2 py-0.5 rounded bg-[#790D16]/40 text-[#D6A33A] border border-[#D6A33A]/30">
                              {cargo?.nome || "Admin"}
                            </span>
                            {u.is_exemplo && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800 uppercase">
                                Exemplo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            {u.email} • Nickname: <strong>{u.nickname_in_game}</strong>
                          </div>
                        </div>
                        <div className="text-right text-xs text-stone-400">
                          <div>Status: {u.ativo ? "Ativo" : "Inativo"}</div>
                          {u.ultimo_acesso && (
                            <div className="text-[11px] text-stone-500">
                              Último acesso:{" "}
                              {new Date(u.ultimo_acesso).toLocaleDateString(
                                "pt-BR"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {adminSubTab === "historico" && (
            <div className="medieval-card rounded-xl p-6">
              <h4 className="font-medieval text-lg font-bold text-[#D6A33A] mb-4 flex items-center gap-2">
                <History className="w-5 h-5" /> Histórico Administrativo e
                Auditoria (Audit Log)
              </h4>
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                {portalState.historico_administrativo.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-black/60 border border-stone-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-[#790D16]/50 text-[#D6A33A] font-medieval font-bold uppercase text-[10px]">
                          {item.modulo}
                        </span>
                        <strong className="text-stone-100 text-sm">
                          {item.acao}
                        </strong>
                      </div>
                      <p className="text-stone-300">{item.detalhes}</p>
                    </div>
                    <div className="text-right text-stone-400 shrink-0">
                      <div className="text-[#D6A33A] font-semibold">
                        {item.autor_nome} ({item.autor_cargo})
                      </div>
                      <div className="text-[11px]">
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
