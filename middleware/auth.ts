import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Safely get apps array depending on how ESM loaded firebase-admin
const apps = admin.apps || (admin as any).default?.apps || [];

if (!apps.length && process.env.VITE_MOCK_MODE !== 'true') {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    // Dev mode without Firebase Admin credentials — token verification is skipped.
    // Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY for production.
    admin.initializeApp({ projectId: projectId || 'dev' });
    console.warn('Firebase Admin: credentials not fully configured — token verification disabled.');
  }
} else if (process.env.VITE_MOCK_MODE === 'true') {
  console.log('[Mock Mode] Skipping Firebase Admin initialization.');
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  workspaces: { workspaceId: string; role: string }[];
}

export interface AuthenticatedRequest extends Request {
  firebaseUid?: string;
  firebaseEmail?: string;
  dbUser?: DbUser;
}

// ── Middleware: requireAuth ──────────────────────────────────────────────────

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Skip auth verification if Firebase Admin credentials are not configured (dev mode)
  if (admin.apps[0]?.options?.credential?.constructor?.name === 'ComputedAppOptions' ||
      !process.env.FIREBASE_CLIENT_EMAIL) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUid = decoded.uid;
    req.firebaseEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Middleware: loadDbUser ───────────────────────────────────────────────────
// Must be called after requireAuth. Loads the DB user and workspace memberships.

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

export async function loadDbUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // In dev mode without Firebase credentials, try to load user from query/body email
  const email = req.firebaseEmail || (req.query.email as string) || (req.body?.email as string);
  if (!email) {
    // If no email available, allow request to proceed without dbUser (for dev mode)
    next();
    return;
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          select: { workspaceId: true, role: true },
        },
      },
    });

    if (user) {
      req.dbUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaces: user.workspaces,
      };
    }
    next();
  } catch (e) {
    console.error('loadDbUser error:', e);
    next(); // Don't block request on DB failures
  }
}

// ── RBAC Helpers ─────────────────────────────────────────────────────────────

/** Returns true if the user has global admin role */
export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.dbUser?.role === 'admin';
}

/** Middleware: blocks non-admin users with 403 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/** Returns the list of workspace IDs the user has access to */
export function getUserWorkspaceIds(dbUser?: DbUser): string[] {
  if (!dbUser) return [];
  return dbUser.workspaces.map(w => w.workspaceId);
}

/** Returns the user's role in a specific workspace, or null if not a member */
export function getWorkspaceRole(dbUser: DbUser | undefined, workspaceId: string): string | null {
  if (!dbUser) return null;
  const membership = dbUser.workspaces.find(w => w.workspaceId === workspaceId);
  return membership?.role ?? null;
}

/** Middleware factory: checks if user is a member of the workspace in req.params.id */
export function requireWorkspaceMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const workspaceId = req.params.id;
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID required' });
  }
  // Global admins always pass
  if (isAdmin(req)) {
    next();
    return;
  }
  const role = getWorkspaceRole(req.dbUser, workspaceId);
  if (!role) {
    return res.status(403).json({ error: 'Not a member of this workspace' });
  }
  next();
}
