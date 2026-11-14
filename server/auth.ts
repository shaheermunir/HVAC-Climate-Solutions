import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AdminUser } from '../src/types';
import { getDb, persistDatabase } from './db';
import {
  CanonicalStaffRole,
  PermissionKey,
  UserRole,
  getAllowedTabsForUser,
  getDashboardRouteForRole,
  hasPermission,
  normalizeStaffRole,
  resolveUserPermissions,
} from '../src/shared/rbac';
import {
  PersistedSession,
  PersistedResetToken,
  persistSessionToMySql,
  getSessionByTokenHashFromMySql,
  deleteSessionByTokenHashFromMySql,
  deleteUserSessionsFromMySql,
  persistResetTokenToMySql,
  getResetTokenByHashFromMySql,
  markResetTokenUsedInMySql,
} from './mysql-repository';

export type { CanonicalStaffRole, PermissionKey, UserRole };
export { normalizeStaffRole, resolveUserPermissions };

export const SESSION_COOKIE_NAME = 'hvac_session';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
export const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export interface AuthenticatedSession {
  tokenHash: string;
  user: AdminUser;
  role: CanonicalStaffRole;
  permissions: PermissionKey[];
  expiresAt: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedSession;
  userRole?: UserRole;
  rawRole?: string;
}

const memorySessions = new Map<string, PersistedSession>();

// ========================================================
// PASSWORD HASHING (SCRYPT) & VALIDATION
// ========================================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const N = 16384;
  const r = 8;
  const p = 1;
  const keylen = 64;
  const derived = crypto.scryptSync(password, salt, keylen, { N, r, p }).toString('hex');
  return `scrypt$${N}$${r}$${p}$${salt}$${derived}`;
}

export function isValidScryptHash(storedHash?: string | null): boolean {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  return parts.length === 6 && parts[0] === 'scrypt' && parts[4].length >= 16 && parts[5].length === 128;
}

export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !isValidScryptHash(storedHash)) return false;
  try {
    const parts = storedHash!.split('$');
    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = parts[4];
    const expectedHex = parts[5];

    if (!N || !r || !p || !salt || !expectedHex) return false;
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, expectedBuf.length, { N, r, p });
    if (derivedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'Password must include at least one letter.' };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, error: 'Password must include at least one number or special character.' };
  }
  return { valid: true };
}

export function hashOpaqueToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// ========================================================
// USER SANITIZATION & SETUP STATUS
// ========================================================

export function sanitizeUser(user: AdminUser) {
  const { passwordHash: _ph, password: _pw, ...rest } = user as AdminUser & { password?: string };
  const role = normalizeStaffRole(user.role);
  const permissions = resolveUserPermissions({ ...user, role });
  return {
    ...rest,
    role,
    permissions,
    allowedTabs: getAllowedTabsForUser({ role, permissions }),
    redirectRoute: getDashboardRouteForRole(role),
  };
}

export function hasConfiguredSuperAdmin(users: AdminUser[]): boolean {
  return users.some(
    (u) =>
      normalizeStaffRole(u.role) === 'super_admin' &&
      u.status === 'active' &&
      isValidScryptHash(u.passwordHash)
  );
}

export function needsInitialSetup(users: AdminUser[]): boolean {
  return !hasConfiguredSuperAdmin(users);
}

// ========================================================
// SESSION TOKEN EXTRACTION & LIFECYCLE
// ========================================================

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) result[key] = val;
  }
  return result;
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token.length >= 32) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken && cookieToken.length >= 32) {
    return cookieToken;
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  if (isProd) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export async function createSessionForUser(
  user: AdminUser,
  req: Request,
  res: Response
): Promise<{ token: string; expiresAt: string }> {
  const token = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const sessionRecord: PersistedSession = {
    tokenHash,
    userId: user.id,
    expiresAt,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 250) || undefined,
    ipAddress: req.ip || req.socket?.remoteAddress || undefined,
  };

  memorySessions.set(tokenHash, sessionRecord);

  const db = getDb();
  if (!Array.isArray(db.sessions)) db.sessions = [];
  db.sessions.push(sessionRecord);
  if (db.sessions.length > 500) {
    db.sessions = db.sessions.slice(-500);
  }
  persistDatabase();

  await persistSessionToMySql(sessionRecord);
  setSessionCookie(res, token);

  return { token, expiresAt };
}

export async function revokeSessionByToken(rawToken: string | null): Promise<void> {
  if (!rawToken) return;
  const tokenHash = hashOpaqueToken(rawToken);
  memorySessions.delete(tokenHash);

  const db = getDb();
  if (Array.isArray(db.sessions)) {
    db.sessions = db.sessions.filter((s) => s.tokenHash !== tokenHash);
    persistDatabase();
  }

  await deleteSessionByTokenHashFromMySql(tokenHash);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  for (const [k, s] of memorySessions.entries()) {
    if (s.userId === userId) {
      memorySessions.delete(k);
    }
  }
  const db = getDb();
  if (Array.isArray(db.sessions)) {
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    persistDatabase();
  }
  await deleteUserSessionsFromMySql(userId);
}

export async function resolveSessionRecord(tokenHash: string): Promise<PersistedSession | null> {
  const mem = memorySessions.get(tokenHash);
  if (mem) return mem;

  const db = getDb();
  if (Array.isArray(db.sessions)) {
    const found = db.sessions.find((s) => s.tokenHash === tokenHash);
    if (found) {
      memorySessions.set(tokenHash, found);
      return found;
    }
  }

  const mysqlSess = await getSessionByTokenHashFromMySql(tokenHash);
  if (mysqlSess) {
    memorySessions.set(tokenHash, mysqlSess);
    if (!Array.isArray(db.sessions)) db.sessions = [];
    if (!db.sessions.some((s) => s.tokenHash === tokenHash)) {
      db.sessions.push(mysqlSess);
      persistDatabase();
    }
    return mysqlSess;
  }

  return null;
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedSession | null> {
  // Never trust spoofable client headers like x-user-role
  const rawToken = extractTokenFromRequest(req);
  if (!rawToken) return null;

  const tokenHash = hashOpaqueToken(rawToken);
  const session = await resolveSessionRecord(tokenHash);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await revokeSessionByToken(rawToken);
    return null;
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user || user.status !== 'active') {
    await revokeSessionByToken(rawToken);
    return null;
  }

  const normalizedRole = normalizeStaffRole(user.role);
  if (normalizedRole === 'customer') {
    await revokeSessionByToken(rawToken);
    return null;
  }

  const permissions = resolveUserPermissions({ ...user, role: normalizedRole });
  return {
    tokenHash,
    user,
    role: normalizedRole,
    permissions,
    expiresAt: session.expiresAt,
  };
}

// ========================================================
// PASSWORD RECOVERY TOKEN HELPERS
// ========================================================

export async function createPasswordResetToken(userId: string): Promise<{ rawToken: string; expiresAt: string; record: PersistedResetToken }> {
  const rawToken = generateOpaqueToken(24);
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  const record: PersistedResetToken = {
    id: `rst-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    tokenHash,
    expiresAt,
    usedAt: null,
  };

  const db = getDb();
  if (!Array.isArray(db.resetTokens)) db.resetTokens = [];
  db.resetTokens.push(record);
  if (db.resetTokens.length > 200) {
    db.resetTokens = db.resetTokens.slice(-200);
  }
  persistDatabase();

  await persistResetTokenToMySql(record);
  return { rawToken, expiresAt, record };
}

export async function verifyAndConsumeResetToken(rawToken: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  if (!rawToken || rawToken.trim().length < 16) {
    return { valid: false, error: 'Invalid or malformed recovery token.' };
  }
  const tokenHash = hashOpaqueToken(rawToken.trim());
  const db = getDb();

  let record: PersistedResetToken | null = null;
  if (Array.isArray(db.resetTokens)) {
    record = db.resetTokens.find((t) => t.tokenHash === tokenHash) || null;
  }
  if (!record) {
    record = await getResetTokenByHashFromMySql(tokenHash);
  }

  if (!record) {
    return { valid: false, error: 'Recovery token is invalid or has already expired.' };
  }
  if (record.usedAt) {
    return { valid: false, error: 'This recovery token has already been used.' };
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return { valid: false, error: 'This recovery token has expired. Request a new one.' };
  }

  record.usedAt = new Date().toISOString();
  if (Array.isArray(db.resetTokens)) {
    const idx = db.resetTokens.findIndex((t) => t.id === record!.id);
    if (idx !== -1) db.resetTokens[idx] = record;
    persistDatabase();
  }
  await markResetTokenUsedInMySql(record.id);

  return { valid: true, userId: record.userId };
}

// ========================================================
// EXPRESS MIDDLEWARE
// ========================================================

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({
          error: 'Authentication required. Please log in with valid staff credentials.',
        });
      }
      const typedReq = req as AuthenticatedRequest;
      typedReq.auth = auth;
      typedReq.userRole = auth.role;
      typedReq.rawRole = auth.role;
      return next();
    } catch (err: any) {
      return res.status(500).json({ error: 'Authentication verification failed.' });
    }
  };
}

export function requirePermission(...required: PermissionKey[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({
          error: 'Authentication required. Please log in with valid credentials.',
        });
      }

      if (!hasPermission(auth.permissions, required)) {
        return res.status(403).json({
          error: 'Forbidden: Your account does not have permission to perform this action.',
          requiredPermissions: required,
          currentRole: auth.role,
        });
      }

      const typedReq = req as AuthenticatedRequest;
      typedReq.auth = auth;
      typedReq.userRole = auth.role;
      typedReq.rawRole = auth.role;
      return next();
    } catch {
      return res.status(500).json({ error: 'Authorization check failed.' });
    }
  };
}

export function requireRole(allowedRoles: (UserRole | string)[]) {
  const normalizedAllowed = allowedRoles.map((r) => normalizeStaffRole(r));
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({
          error: 'Authentication required.',
        });
      }

      if (!normalizedAllowed.includes(auth.role)) {
        return res.status(403).json({
          error: 'Forbidden: Insufficient role privileges.',
          requiredRoles: normalizedAllowed,
          currentRole: auth.role,
        });
      }

      const typedReq = req as AuthenticatedRequest;
      typedReq.auth = auth;
      typedReq.userRole = auth.role;
      typedReq.rawRole = auth.role;
      return next();
    } catch {
      return res.status(500).json({ error: 'Role verification failed.' });
    }
  };
}
