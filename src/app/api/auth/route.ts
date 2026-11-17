import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import {
  hashPassword,
  readServerDb,
  recordAuditLog,
  resolveUserPermissions,
  SessionPayload,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
  writeServerDb,
} from "@/lib/server-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COOKIE_NAME = "alcatrazz_session";

function setSessionCookie(session: SessionPayload) {
  const token = signSessionToken(session);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  const db = readServerDb();

  return NextResponse.json({
    authenticated: Boolean(session),
    session: session || null,
    has_registered_credentials: db.credentials.length > 0,
    demo_admins: db.usuarios
      .filter((u) => u.ativo)
      .map((u) => {
        const { cargoNome, permissoes } = resolveUserPermissions(u, db);
        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          nickname_in_game: u.nickname_in_game,
          cargo_nome: cargoNome,
          permissoes,
          has_password: db.credentials.some(
            (c) => c.email.toLowerCase() === u.email.toLowerCase()
          ),
        };
      }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = readServerDb();

    if (action === "logout") {
      cookies().delete(COOKIE_NAME);
      return NextResponse.json({ ok: true, message: "Sessão encerrada com segurança." });
    }

    if (action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        return NextResponse.json(
          { error: "Informe o e-mail administrativo e a senha." },
          { status: 400 }
        );
      }

      // 1. Se Supabase estiver configurado, tenta autenticar no Supabase Auth primeiro
      const supabase = createSupabaseServerClient();
      if (supabase) {
        const { data: supaData, error: supaError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (!supaError && supaData.user) {
          const matchedAdmin =
            db.usuarios.find((u) => u.email.toLowerCase() === email) ||
            db.usuarios[0];
          const { cargoNome, permissoes } = resolveUserPermissions(
            matchedAdmin,
            db
          );
          const session: SessionPayload = {
            user_id: matchedAdmin.id,
            email: matchedAdmin.email,
            nome: matchedAdmin.nome,
            nickname_in_game: matchedAdmin.nickname_in_game,
            cargo_id: matchedAdmin.cargo_id,
            cargo_nome: cargoNome,
            permissoes,
            exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
          };
          setSessionCookie(session);
          recordAuditLog(
            db,
            "Login via Supabase Auth",
            "Segurança",
            `Administrador ${session.nome} autenticou-se via Supabase.`,
            session
          );
          writeServerDb(db);
          return NextResponse.json({ ok: true, session });
        }
      }

      // 2. Validação criptográfica no servidor (scrypt + timingSafeEqual)
      const user = db.usuarios.find(
        (u) => u.email.toLowerCase() === email && u.ativo
      );
      if (!user) {
        return NextResponse.json(
          { error: "Administrador não encontrado ou acesso inativo." },
          { status: 401 }
        );
      }

      const cred = db.credentials.find(
        (c) => c.email.toLowerCase() === email
      );
      if (!cred) {
        return NextResponse.json(
          {
            error:
              "Esta conta demonstrativa ainda não possui senha definida. Defina uma senha na aba 'Definir Senha / Primeiro Acesso' ou utilize o acesso de demonstração.",
            needs_setup: true,
          },
          { status: 401 }
        );
      }

      const isValid = verifyPassword(password, cred.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Credenciais inválidas. Verifique seu e-mail e senha." },
          { status: 401 }
        );
      }

      user.ultimo_acesso = new Date().toISOString();
      const { cargoNome, permissoes } = resolveUserPermissions(user, db);
      const session: SessionPayload = {
        user_id: user.id,
        email: user.email,
        nome: user.nome,
        nickname_in_game: user.nickname_in_game,
        cargo_id: user.cargo_id,
        cargo_nome: cargoNome,
        permissoes,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
      };

      setSessionCookie(session);
      recordAuditLog(
        db,
        "Autenticação Administrativa",
        "Segurança",
        `Login criptográfico realizado por ${user.nome} (${cargoNome}).`,
        session
      );
      writeServerDb(db);

      return NextResponse.json({ ok: true, session });
    }

    if (action === "setup_password") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const nome = String(body.nome || "").trim();
      const nickname = String(body.nickname || "").trim();

      if (!email || password.length < 6) {
        return NextResponse.json(
          { error: "Informe um e-mail válido e uma senha com no mínimo 6 caracteres." },
          { status: 400 }
        );
      }

      let user = db.usuarios.find((u) => u.email.toLowerCase() === email);
      const existingCred = db.credentials.find(
        (c) => c.email.toLowerCase() === email
      );

      if (existingCred) {
        return NextResponse.json(
          {
            error:
              "Esta conta já possui senha criptografada registrada. Utilize o Login ou a Recuperação de Senha.",
          },
          { status: 400 }
        );
      }

      if (!user) {
        user = {
          id: `adm-${Date.now()}`,
          nome: nome || "Comandante ALCATRAZZ",
          email,
          nickname_in_game: nickname || "AdminAlcatrazz",
          cargo_id: "cargo-lider",
          permissoes_extras: [
            "gerenciar_jogadores",
            "gerenciar_cargos",
            "gerenciar_avisos",
            "gerenciar_eventos",
            "atualizar_ranking",
            "gerenciar_admins",
            "ver_auditoria",
          ],
          ativo: true,
          ultimo_acesso: new Date().toISOString(),
          is_exemplo: false,
          created_at: new Date().toISOString(),
        };
        db.usuarios.push(user);
      } else {
        user.ultimo_acesso = new Date().toISOString();
      }

      db.credentials.push({
        user_id: user.id,
        email: user.email.toLowerCase(),
        password_hash: hashPassword(password),
      });

      const { cargoNome, permissoes } = resolveUserPermissions(user, db);
      const session: SessionPayload = {
        user_id: user.id,
        email: user.email,
        nome: user.nome,
        nickname_in_game: user.nickname_in_game,
        cargo_id: user.cargo_id,
        cargo_nome: cargoNome,
        permissoes,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
      };

      setSessionCookie(session);
      recordAuditLog(
        db,
        "Configuração de Credencial Criptográfica",
        "Segurança",
        `Credencial scrypt configurada no servidor para ${user.nome} (${user.email}).`,
        session
      );
      writeServerDb(db);

      return NextResponse.json({ ok: true, session });
    }

    if (action === "activate_demo_session") {
      const adminId = String(body.admin_id || "adm-1");
      const user =
        db.usuarios.find((u) => u.id === adminId && u.ativo) || db.usuarios[0];

      if (!user) {
        return NextResponse.json(
          { error: "Perfil administrativo demonstrativo não encontrado." },
          { status: 404 }
        );
      }

      user.ultimo_acesso = new Date().toISOString();
      const { cargoNome, permissoes } = resolveUserPermissions(user, db);
      const session: SessionPayload = {
        user_id: user.id,
        email: user.email,
        nome: user.nome,
        nickname_in_game: user.nickname_in_game,
        cargo_id: user.cargo_id,
        cargo_nome: cargoNome,
        permissoes,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
      };

      setSessionCookie(session);
      recordAuditLog(
        db,
        "Sessão Demonstrativa Autenticada",
        "Segurança",
        `Sessão oficial de demonstração iniciada como ${user.nome} (${cargoNome}).`,
        session
      );
      writeServerDb(db);

      return NextResponse.json({ ok: true, session });
    }

    if (action === "request_recovery") {
      const email = String(body.email || "").trim().toLowerCase();
      const user = db.usuarios.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return NextResponse.json(
          { error: "Nenhuma conta administrativa encontrada para este e-mail." },
          { status: 404 }
        );
      }

      const recoveryCode = String(crypto.randomInt(100000, 999999));
      let cred = db.credentials.find((c) => c.email.toLowerCase() === email);
      if (!cred) {
        cred = {
          user_id: user.id,
          email: user.email.toLowerCase(),
          password_hash: hashPassword(crypto.randomBytes(16).toString("hex")),
        };
        db.credentials.push(cred);
      }

      cred.recovery_code_hash = hashPassword(recoveryCode);
      cred.recovery_expires_at = Date.now() + 1000 * 60 * 15; // 15 min
      writeServerDb(db);

      return NextResponse.json({
        ok: true,
        message:
          "Código criptográfico de recuperação gerado pelo servidor (válido por 15 minutos).",
        recovery_preview_code: recoveryCode,
      });
    }

    if (action === "reset_password") {
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.code || "").trim();
      const newPassword = String(body.new_password || "");

      if (!email || !code || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Informe o e-mail, o código de 6 dígitos e a nova senha (mín. 6 caracteres)." },
          { status: 400 }
        );
      }

      const cred = db.credentials.find((c) => c.email.toLowerCase() === email);
      if (
        !cred ||
        !cred.recovery_code_hash ||
        !cred.recovery_expires_at ||
        Date.now() > cred.recovery_expires_at
      ) {
        return NextResponse.json(
          { error: "Código de recuperação expirado ou inválido." },
          { status: 400 }
        );
      }

      if (!verifyPassword(code, cred.recovery_code_hash)) {
        return NextResponse.json(
          { error: "Código de verificação incorreto." },
          { status: 400 }
        );
      }

      cred.password_hash = hashPassword(newPassword);
      delete cred.recovery_code_hash;
      delete cred.recovery_expires_at;

      const user = db.usuarios.find((u) => u.email.toLowerCase() === email)!;
      const { cargoNome, permissoes } = resolveUserPermissions(user, db);
      const session: SessionPayload = {
        user_id: user.id,
        email: user.email,
        nome: user.nome,
        nickname_in_game: user.nickname_in_game,
        cargo_id: user.cargo_id,
        cargo_nome: cargoNome,
        permissoes,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
      };

      setSessionCookie(session);
      recordAuditLog(
        db,
        "Redefinição de Senha",
        "Segurança",
        `Senha redefinida com sucesso via token para ${user.nome}.`,
        session
      );
      writeServerDb(db);

      return NextResponse.json({ ok: true, session });
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (err) {
    console.error("Erro na rota /api/auth:", err);
    return NextResponse.json(
      { error: "Falha interna ao processar autenticação." },
      { status: 500 }
    );
  }
}
