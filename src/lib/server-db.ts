import fs from "fs";
import path from "path";
import crypto from "crypto";
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
} from "./seed-data";
import {
  PermissionCode,
  PortalDatabaseState,
  UsuarioAdmin,
} from "@/types/portal";

interface StoredCredential {
  user_id: string;
  email: string;
  password_hash: string; // formato saltHex:derivedKeyHex
  recovery_code_hash?: string;
  recovery_expires_at?: number;
}

interface InternalDatabaseFile extends PortalDatabaseState {
  credentials: StoredCredential[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE_PATH = path.join(DATA_DIR, "alcatrazz-db.json");

function getSessionSecret(): string {
  return (
    process.env.ALCATRAZZ_SESSION_SECRET ||
    "zephira-world-alcatrazz-royal-hmac-secret-2026"
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derived, keyBuffer);
}

export interface SessionPayload {
  user_id: string;
  email: string;
  nome: string;
  nickname_in_game: string;
  cargo_id: string;
  cargo_nome: string;
  permissoes: PermissionCode[];
  exp: number;
}

export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function createInitialDb(): InternalDatabaseFile {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return {
    cargos: INITIAL_CARGOS,
    permissoes: INITIAL_PERMISSOES,
    jogadores: INITIAL_JOGADORES,
    avisos: INITIAL_AVISOS,
    eventos: INITIAL_EVENTOS,
    participacoes: INITIAL_PARTICIPACOES,
    pontuacoes: INITIAL_PONTUACOES,
    usuarios: INITIAL_USUARIOS_ADMIN,
    historico_administrativo: INITIAL_HISTORICO_ADMIN,
    credentials: [],
    storage_mode: isSupabaseConfigured ? "supabase" : "local_server_db",
    last_updated: new Date().toISOString(),
  };
}

export function readServerDb(): InternalDatabaseFile {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial = createInitialDb();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as InternalDatabaseFile;
    return parsed;
  } catch {
    return createInitialDb();
  }
}

export function writeServerDb(db: InternalDatabaseFile): PortalDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.last_updated = new Date().toISOString();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao gravar banco de dados local:", err);
  }
  return getPublicPortalState(db);
}

export function getPublicPortalState(db?: InternalDatabaseFile): PortalDatabaseState {
  const source = db || readServerDb();
  const { credentials: _omitted, ...publicState } = source;
  void _omitted;
  return publicState;
}

export function resolveUserPermissions(
  user: UsuarioAdmin,
  db: InternalDatabaseFile
): { cargoNome: string; permissoes: PermissionCode[] } {
  const cargo = db.cargos.find((c) => c.id === user.cargo_id);
  const cargoPerms = cargo ? cargo.permissoes_padrao : [];
  const merged = Array.from(new Set([...cargoPerms, ...(user.permissoes_extras || [])]));
  return {
    cargoNome: cargo ? cargo.nome : "Administrador",
    permissoes: merged,
  };
}

export function recordAuditLog(
  db: InternalDatabaseFile,
  acao: string,
  modulo: string,
  detalhes: string,
  session: SessionPayload
) {
  db.historico_administrativo.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    acao,
    modulo,
    detalhes,
    autor_nome: session.nome,
    autor_cargo: session.cargo_nome,
    created_at: new Date().toISOString(),
  });
}
