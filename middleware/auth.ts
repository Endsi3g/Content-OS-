import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
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
}

export interface AuthenticatedRequest extends Request {
  firebaseUid?: string;
  firebaseEmail?: string;
}

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
