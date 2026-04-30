import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { IncomingMessage } from 'http';

let adminInitialized = false;

function initAdmin() {
  if (admin.apps.length > 0) {
    adminInitialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required in production.');
      process.exit(1);
    }
    // Development-only: warn clearly that auth is disabled
    console.warn(
      '\n⚠️  Firebase Admin SDK not configured — API authentication is DISABLED.\n' +
      '   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to enable.\n' +
      '   Do NOT run this way in production.\n'
    );
    admin.initializeApp({ projectId: projectId || 'dev-placeholder' });
    adminInitialized = false;
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  adminInitialized = true;
}

initAdmin();

export interface AuthenticatedRequest extends Request {
  firebaseUid?: string;
  firebaseEmail?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // In dev mode without Firebase creds, skip verification but log the request
  if (!adminInitialized) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Server misconfiguration: authentication not initialized' });
    }
    // Dev-only bypass — attach a mock identity so downstream code can rely on it
    req.firebaseUid = 'dev-user';
    req.firebaseEmail = req.body?.email || 'dev@localhost';
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token, true); // checkRevoked=true
    req.firebaseUid = decoded.uid;
    req.firebaseEmail = decoded.email;
    next();
  } catch (err: any) {
    const isExpired = err?.code === 'auth/id-token-expired';
    return res.status(401).json({
      error: isExpired ? 'Token expired — please refresh your session' : 'Invalid token',
    });
  }
}

/**
 * Verify a Firebase ID token from a WebSocket upgrade request.
 * Reads from the Authorization header or the token query parameter.
 * Returns the decoded token or throws.
 */
export async function verifyWsToken(request: IncomingMessage): Promise<admin.auth.DecodedIdToken> {
  if (!adminInitialized) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Authentication not initialized');
    }
    // Dev bypass — return a mock decoded token
    return { uid: 'dev-user', email: 'dev@localhost' } as any;
  }

  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const queryToken = url.searchParams.get('token');
  const headerToken = request.headers.authorization?.replace('Bearer ', '');
  const token = queryToken || headerToken;

  if (!token) throw new Error('No authentication token provided');

  return admin.auth().verifyIdToken(token, true);
}
