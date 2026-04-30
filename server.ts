import express from "express";
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import http from 'http';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { requireAuth, verifyWsToken, AuthenticatedRequest } from './middleware/auth';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const genai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// In-memory store for YouTube OAuth state tokens (CSRF protection)
// Each entry is removed after use or after 10 minutes
const pendingOAuthStates = new Map<string, number>();
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const ytImportLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const api = express.Router();

// --- YouTube OAuth ---
api.get('/auth/youtube/url', (req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'YouTube integration not configured' });
  }

  const state = randomBytes(16).toString('hex');
  pendingOAuthStates.set(state, Date.now() + OAUTH_STATE_TTL_MS);

  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

api.get(['/auth/youtube/callback', '/auth/youtube/callback/'], async (req, res) => {
  const { code, error, state } = req.query;

  // Validate CSRF state
  const stateStr = String(state || '');
  const stateExpiry = pendingOAuthStates.get(stateStr);
  const stateValid = stateExpiry !== undefined && Date.now() < stateExpiry;
  pendingOAuthStates.delete(stateStr);

  if (!stateValid) {
    return res.status(400).send('<html><body><p>Invalid or expired OAuth state. Please try again.</p></body></html>');
  }

  if (error) {
    const safeError = String(error).replace(/['"<>&]/g, '');
    return res.send(`<html><body><script>
      if(window.opener){window.opener.postMessage({type:'YOUTUBE_AUTH_ERROR',error:'${safeError}'},'${ALLOWED_ORIGINS[0] || '*'}');window.close();}
      else{window.location.href='/';}
    </script></body></html>`);
  }

  if (!code) return res.status(400).send('Missing authorization code');

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).send('YouTube integration not configured');
  }

  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok) {
      console.error('YouTube token exchange failed:', tokenData);
      return res.status(502).send('Token exchange failed');
    }
    const origin = ALLOWED_ORIGINS[0] || '*';
    res.send(`<html><body><script>
      if(window.opener){window.opener.postMessage({type:'YOUTUBE_AUTH_SUCCESS',tokens:${JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      })}},${JSON.stringify(origin)});window.close();}
      else{window.location.href='/';}
    </script></body></html>`);
  } catch (err) {
    console.error('YouTube OAuth callback error:', err);
    res.status(500).send('An error occurred during authentication');
  }
});

// --- Auth Sync (public — called during login) ---
api.post('/auth/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email is required' });

    let user = await prisma.user.findUnique({
      where: { email },
      include: { workspaces: { include: { workspace: true } } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: ADMIN_EMAILS.has(email) ? 'admin' : 'viewer',
        },
        include: { workspaces: { include: { workspace: true } } },
      });
    } else {
      if (name && !user.name) {
        user = await prisma.user.update({
          where: { email },
          data: { name },
          include: { workspaces: { include: { workspace: true } } },
        });
      }
      if (ADMIN_EMAILS.has(email) && user.role !== 'admin') {
        user = await prisma.user.update({
          where: { email },
          data: { role: 'admin' },
          include: { workspaces: { include: { workspace: true } } },
        });
      }
    }

    if (user.workspaces.length === 0) {
      let defaultWorkspace = await prisma.workspace.findFirst();
      if (!defaultWorkspace) {
        defaultWorkspace = await prisma.workspace.create({
          data: { name: 'Default Workspace' },
        });
      }
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: defaultWorkspace.id,
          role: user.role === 'admin' ? 'admin' : 'member',
        },
      });
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { workspaces: { include: { workspace: true } } },
      }) as any;
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('POST /auth/sync error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Protected routes (requireAuth middleware) ---
api.use(requireAuth);

const VALID_ROLES = new Set(['admin', 'editor', 'viewer', 'member']);

// --- Workspaces & Teams ---
api.get('/workspaces', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await prisma.user.findUnique({
      where: { email: String(email) },
      include: { workspaces: { include: { workspace: true } } },
    });
    res.json({ success: true, workspaces: user?.workspaces || [] });
  } catch (err) {
    console.error('GET /workspaces error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.post('/workspaces/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, inviterEmail } = req.body;

    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email is required' });
    const safeRole = VALID_ROLES.has(role) ? role : 'editor';

    const inviter = await prisma.user.findUnique({ where: { email: inviterEmail } });
    if (!inviter) return res.status(404).json({ error: 'Inviter not found' });

    const token = randomBytes(32).toString('hex');

    const invite = await prisma.invitation.create({
      data: {
        email,
        workspaceId: id,
        role: safeRole,
        token,
        invitedById: inviter.id,
      },
    });

    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol;
    const host = req.get('host') || 'localhost:3000';
    res.json({ success: true, invite, inviteLink: `${protocol}://${host}/?invite=${token}` });
  } catch (err) {
    console.error('POST /workspaces/:id/invite error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.get('/invites/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true, invitedBy: true },
    });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    res.json({ success: true, invite });
  } catch (err) {
    console.error('GET /invites/:token error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.post('/invites/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.body;

    const invite = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true },
    });
    if (!invite || invite.status !== 'pending' || invite.email !== email) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
    });
    if (!existing) {
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
      });
    }

    await prisma.invitation.update({ where: { id: invite.id }, data: { status: 'accepted' } });
    res.json({ success: true, workspace: invite.workspace });
  } catch (err) {
    console.error('POST /invites/:token/accept error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email)}`,
      bio: u.bio,
      status: 'active',
    }));
    res.json(mappedUsers);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.patch('/users/profile', async (req, res) => {
  try {
    const { email, bio, avatarUrl, name } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email is required' });

    // Validate avatarUrl if provided
    if (avatarUrl !== undefined && avatarUrl !== null) {
      try {
        const parsed = new URL(String(avatarUrl));
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return res.status(400).json({ error: 'Invalid avatar URL' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid avatar URL' });
      }
    }

    const user = await prisma.user.update({
      where: { email },
      data: { bio, avatarUrl, name },
      include: { workspaces: { include: { workspace: true } } },
    });
    res.json({ success: true, user });
  } catch (err) {
    console.error('PATCH /users/profile error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!VALID_ROLES.has(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });
    res.json({ success: true, user });
  } catch (err) {
    console.error('PATCH /users/:id/role error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Scripts & Timelines ---
api.get('/scripts/latest', async (req, res) => {
  try {
    const script = await prisma.script.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { timelines: true, project: true },
    });
    res.json({ success: true, script });
  } catch (err) {
    console.error('GET /scripts/latest error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.patch('/scripts/:id', async (req, res) => {
  try {
    const updatedScript = await prisma.script.update({
      where: { id: req.params.id },
      data: { content: req.body.content, version: { increment: 1 } },
    });
    res.json({ success: true, script: updatedScript });
  } catch (err) {
    console.error('PATCH /scripts/:id error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.post('/scripts/:id/timeline', async (req, res) => {
  try {
    const { timestamp, note, segment } = req.body;
    const timeline = await prisma.timeline.create({
      data: { scriptId: req.params.id, timestamp, note, segment },
    });
    res.json({ success: true, timeline });
  } catch (err) {
    console.error('POST /scripts/:id/timeline error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Assets ---
api.get('/assets/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, asset });
  } catch (err) {
    console.error('GET /assets/:id error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.post('/assets/import-youtube', ytImportLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });

    let videoId = '';
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('youtube.com')) {
        videoId = parsedUrl.searchParams.get('v') || '';
      } else if (parsedUrl.hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.slice(1);
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    if (!videoId) return res.status(400).json({ error: 'Could not extract YouTube video ID' });

    const apiKey = process.env.YOUTUBE_API_KEY;
    let title = 'Imported YouTube Video';
    let duration = 0;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    if (apiKey) {
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=snippet,contentDetails&key=${apiKey}`);
      if (ytRes.ok) {
        const ytData = await ytRes.json() as any;
        if (ytData.items?.length > 0) {
          title = ytData.items[0].snippet.title;
          thumbnailUrl = ytData.items[0].snippet.thumbnails?.high?.url || thumbnailUrl;
          const match = ytData.items[0].contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (match) {
            duration = (parseInt(match[1] || '0')) * 3600
                     + (parseInt(match[2] || '0')) * 60
                     + (parseInt(match[3] || '0'));
          }
        }
      }
    }

    const authenticatedReq = req as AuthenticatedRequest;
    let ownerId: string;
    if (authenticatedReq.firebaseEmail) {
      const owner = await prisma.user.findUnique({ where: { email: authenticatedReq.firebaseEmail } });
      ownerId = owner?.id || '';
    }
    if (!ownerId!) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) return res.status(500).json({ error: 'No users found' });
      ownerId = firstUser.id;
    }

    const project = await prisma.project.create({
      data: {
        title,
        sourceType: 'youtube',
        sourceUrl: url,
        ownerId,
        assets: { create: { type: 'video', storagePath: url, duration, thumbnailUrl } },
      },
      include: { assets: true },
    });
    res.json({ success: true, project });
  } catch (err) {
    console.error('POST /assets/import-youtube error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- AI Coach (real Gemini call via server-side key) ---
api.post('/ai/coach/edit', aiLimiter, async (req, res) => {
  try {
    const { selectedText, instruction } = req.body;
    if (!selectedText || typeof selectedText !== 'string') {
      return res.status(400).json({ error: 'selectedText is required' });
    }
    if (selectedText.length > 10_000) {
      return res.status(400).json({ error: 'selectedText too long (max 10,000 characters)' });
    }

    let improvedText = selectedText;

    if (genai) {
      const prompt = instruction
        ? `You are a professional script editor. ${instruction}\n\nText:\n${selectedText}\n\nReturn only the improved text, no commentary.`
        : `You are a professional script editor. Improve the clarity, flow, and impact of this script text while preserving its meaning:\n\n${selectedText}\n\nReturn only the improved text, no commentary.`;

      const response = await genai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.7 },
      });
      improvedText = response.text?.trim() || selectedText;
    } else {
      console.warn('GEMINI_API_KEY not set — AI Coach returning original text');
    }

    await prisma.aiInteraction.create({
      data: {
        prompt: selectedText.substring(0, 500),
        response: improvedText.substring(0, 2000),
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      },
    });

    res.json({ success: true, improvedText });
  } catch (err) {
    console.error('POST /ai/coach/edit error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- C2C ---
api.get('/c2c/devices', async (req, res) => {
  try {
    res.json({ success: true, devices: await prisma.c2cDevice.findMany() });
  } catch (err) {
    console.error('GET /c2c/devices error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.get('/c2c/uploads', async (req, res) => {
  try {
    const uploads = await prisma.c2cUpload.findMany({
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, uploads });
  } catch (err) {
    console.error('GET /c2c/uploads error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Presentations ---
api.get('/presentations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const presentation = id === 'default'
      ? await prisma.presentation.findFirst({ include: { videos: true } })
      : await prisma.presentation.findUnique({ where: { id }, include: { videos: true } });
    res.json({ success: true, presentation });
  } catch (err) {
    console.error('GET /presentations/:id error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.patch('/presentations/:id', async (req, res) => {
  try {
    const { passwordEnabled, downloadsEnabled } = req.body;
    const presentation = await prisma.presentation.update({
      where: { id: req.params.id },
      data: { passwordEnabled, downloadsEnabled },
    });
    res.json({ success: true, presentation });
  } catch (err) {
    console.error('PATCH /presentations/:id error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Comments ---
api.get('/assets/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { assetId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, comments });
  } catch (err) {
    console.error('GET /assets/:id/comments error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.post('/assets/:id/comments', async (req, res) => {
  try {
    const { timePct, timeStr, text, author, drawing } = req.body;
    const comment = await prisma.comment.create({
      data: {
        assetId: req.params.id,
        timePct,
        timeStr,
        text,
        author: author || 'Anonymous',
        drawing: drawing ? JSON.stringify(drawing) : null,
      },
    });
    res.json({ success: true, comment });
  } catch (err) {
    console.error('POST /assets/:id/comments error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

api.patch('/comments/:id/resolve', async (req, res) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { resolved: req.body.resolved },
    });
    res.json({ success: true, comment });
  } catch (err) {
    console.error('PATCH /comments/:id/resolve error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Express App Setup ---
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.set('trust proxy', 1);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_, res) => res.status(200).send('OK'));
  app.get('/healthz', (_, res) => res.status(200).send('OK'));
  app.get('/api/health', (_, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api', api);

  const httpServer = http.createServer(app);

  const hocuspocusServer = new Hocuspocus({ name: 'ContentOS-Collab' });
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (request: any, socket: any, head: any) => {
    if (!request.url?.startsWith('/collaboration')) {
      socket.destroy();
      return;
    }

    try {
      await verifyWsToken(request);
    } catch (err) {
      console.warn('WebSocket auth rejected:', (err as Error).message);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      hocuspocusServer.handleConnection(ws, request);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Server listening on port ${PORT}`);

    (async () => {
      try {
        const count = await prisma.project.count();
        if (count === 0) await seedDatabase();
      } catch (e: any) {
        console.error('DB check/seed failed:', e.message || e);
      }
    })();
  });
}

async function seedDatabase() {
  console.log('Seeding initial data...');
  try {
    const seedAdminEmail = Array.from(ADMIN_EMAILS)[0] || 'admin@contentos.app';

    await prisma.workspace.create({
      data: {
        name: 'Default Workspace',
        members: {
          create: {
            role: 'admin',
            user: {
              create: {
                email: seedAdminEmail,
                name: 'Admin',
                role: 'admin',
                projects: {
                  create: {
                    title: 'Introduction to Content OS',
                    sourceType: 'drive',
                    assets: {
                      create: {
                        type: 'video',
                        storagePath: 'https://cdn.pixabay.com/video/2016/11/14/6366-191146430_small.mp4',
                        duration: 120,
                        comments: {
                          create: {
                            timePct: 10,
                            timeStr: '00:12',
                            text: 'Great intro!',
                            author: 'Client',
                          },
                        },
                      },
                    },
                    scripts: {
                      create: {
                        content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Welcome to Content OS. Start editing your script here."}]}]}',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const c1 = await prisma.c2cDevice.create({ data: { name: 'RED V-Raptor A', status: 'recording', battery: 78, storage: 45, lastActive: 'Now' } });
    const c2 = await prisma.c2cDevice.create({ data: { name: 'ARRI Alexa Mini B', status: 'idle', battery: 92, storage: 62, lastActive: '2 min ago' } });
    await prisma.c2cUpload.create({ data: { name: 'A001_C014_0828XO_Proxy.mp4', deviceId: c1.id, size: '240 MB', status: 'uploading', progress: 45 } });
    await prisma.c2cUpload.create({ data: { name: 'A001_C013_0828XO_Proxy.mp4', deviceId: c1.id, size: '1.2 GB', status: 'completed', progress: 100 } });
    await prisma.c2cUpload.create({ data: { name: 'B042_C001_0828ZZ_Proxy.mp4', deviceId: c2.id, size: '850 MB', status: 'completed', progress: 100 } });

    await prisma.presentation.create({
      data: {
        title: 'Summer Campaign 2026',
        description: 'Please review the final deliverables for the upcoming campaign launch.',
        passwordEnabled: true,
        downloadsEnabled: true,
        videos: {
          create: [
            { title: '01_Hero_Montage_v3.mp4', duration: '01:45', thumbnail: 'https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?auto=format&fit=crop&q=80&w=600' },
            { title: '02_Interview_Sarah_Final.mp4', duration: '03:12', thumbnail: 'https://images.unsplash.com/photo-1516280440502-0c21eb79ce42?auto=format&fit=crop&q=80&w=600' },
            { title: '03_B-Roll_City_Night.mp4', duration: '00:58', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600' },
            { title: '04_Social_Teaser_Vertical.mp4', duration: '00:15', thumbnail: 'https://images.unsplash.com/photo-1526925539332-faa3372c0199?auto=format&fit=crop&q=80&w=600' },
          ],
        },
      },
    });
    console.log('Seeding complete.');
  } catch (e) {
    console.error('Seeding error:', e);
  }
}

startServer().catch(err => {
  console.error('FATAL: Failed to start server:', err);
  process.exit(1);
});
