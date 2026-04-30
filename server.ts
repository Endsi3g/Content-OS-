import express from "express";
import { PrismaClient } from '@prisma/client';
import path from 'path';
import http from 'http';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, loadDbUser, AuthenticatedRequest, isAdmin, getUserWorkspaceIds, getWorkspaceRole } from './middleware/auth';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const api = express.Router();

// --- YouTube OAuth ---
api.get('/auth/youtube/url', (req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'YouTube integration not configured' });
  }
  const redirectUri = req.query.redirect_uri as string || `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent',
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

api.get(['/auth/youtube/callback', '/auth/youtube/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`<html><body><script>
      if(window.opener){window.opener.postMessage({type:'YOUTUBE_AUTH_ERROR',error:'${error}'},'*');window.close();}
      else{window.location.href='/';}
    </script></body></html>`);
  }

  if (!code) return res.status(400).send('Missing authorization code');

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || 'Token exchange failed');
    }
    res.send(`<html><body><script>
      if(window.opener){window.opener.postMessage({type:'YOUTUBE_AUTH_SUCCESS',tokens:${JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      })}},window.opener.location.origin);window.close();}
      else{window.location.href='/';}
    </script></body></html>`);
  } catch (e) {
    res.status(500).send(`Token exchange failed: ${String(e)}`);
  }
});

// --- Auth Sync (public — called during login) ---
api.post('/auth/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

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
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Protected routes (requireAuth + loadDbUser middleware) ---
api.use(requireAuth);
api.use(loadDbUser);

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
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/workspaces/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, inviterEmail } = req.body;

    const inviter = await prisma.user.findUnique({ where: { email: inviterEmail } });
    if (!inviter) return res.status(404).json({ error: 'Inviter not found' });

    const token = randomBytes(32).toString('hex');

    const invite = await prisma.invitation.create({
      data: {
        email,
        workspaceId: id,
        role: role || 'editor',
        token,
        invitedById: inviter.id,
      },
    });

    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol;
    const host = req.get('host') || 'localhost:3000';
    res.json({ success: true, invite, inviteLink: `${protocol}://${host}/?invite=${token}` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
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
  } catch (e) {
    res.status(500).json({ error: String(e) });
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
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const users = await prisma.user.findMany();
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`,
      bio: u.bio,
      status: 'active',
    }));
    res.json(mappedUsers);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/users/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const { email, bio, avatarUrl, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    // Ownership check: users can only edit their own profile
    if (req.dbUser && req.dbUser.email !== email && !isAdmin(req)) {
      return res.status(403).json({ error: 'Cannot edit another user\'s profile' });
    }
    const user = await prisma.user.update({
      where: { email },
      data: { bio, avatarUrl, name },
      include: { workspaces: { include: { workspace: true } } },
    });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/users/:id/role', async (req: AuthenticatedRequest, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: String(e) });
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
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/scripts/:id', async (req, res) => {
  try {
    const updatedScript = await prisma.script.update({
      where: { id: req.params.id },
      data: { content: req.body.content, version: { increment: 1 } },
    });
    res.json({ success: true, script: updatedScript });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/scripts/:id/timeline', async (req, res) => {
  try {
    const { timestamp, note, segment } = req.body;
    const timeline = await prisma.timeline.create({
      data: { scriptId: req.params.id, timestamp, note, segment },
    });
    res.json({ success: true, timeline });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Assets ---
api.get('/assets/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, asset });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/assets/import-youtube', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

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
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`);
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

    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return res.status(500).json({ error: 'No users found' });

    const project = await prisma.project.create({
      data: {
        title,
        sourceType: 'youtube',
        sourceUrl: url,
        ownerId: firstUser.id,
        assets: { create: { type: 'video', storagePath: url, duration, thumbnailUrl } },
      },
      include: { assets: true },
    });
    res.json({ success: true, project });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- AI Coach (real Claude call via server-side key) ---
api.post('/ai/coach/edit', async (req, res) => {
  try {
    const { selectedText, instruction } = req.body;
    if (!selectedText) return res.status(400).json({ error: 'selectedText is required' });

    let improvedText = selectedText;

    if (anthropic) {
      const prompt = instruction
        ? `You are a professional script editor. ${instruction}\n\nText:\n${selectedText}\n\nReturn only the improved text, no commentary.`
        : `You are a professional script editor. Improve the clarity, flow, and impact of this script text while preserving its meaning:\n\n${selectedText}\n\nReturn only the improved text, no commentary.`;

      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-4-5-haiku-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      improvedText = (response.content[0] as any).text?.trim() || selectedText;
    } else {
      console.warn('ANTHROPIC_API_KEY not set — AI Coach returning original text');
    }

    await prisma.aiInteraction.create({
      data: {
        prompt: selectedText.substring(0, 500),
        response: improvedText.substring(0, 2000),
        model: process.env.ANTHROPIC_MODEL || 'claude-4-5-haiku-latest',
      },
    });

    res.json({ success: true, improvedText });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- C2C ---
api.get('/c2c/devices', async (req, res) => {
  try {
    res.json({ success: true, devices: await prisma.c2cDevice.findMany() });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.get('/c2c/uploads', async (req, res) => {
  try {
    const uploads = await prisma.c2cUpload.findMany({
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, uploads });
  } catch (e) {
    res.status(500).json({ error: String(e) });
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
  } catch (e) {
    res.status(500).json({ error: String(e) });
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
  } catch (e) {
    res.status(500).json({ error: String(e) });
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
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/assets/:id/comments', async (req: AuthenticatedRequest, res) => {
  try {
    const { timePct, timeStr, text, drawing } = req.body;
    // Force author from authenticated user, not user-supplied
    const authorName = req.dbUser?.name || req.firebaseEmail || 'Anonymous';
    const comment = await prisma.comment.create({
      data: {
        assetId: req.params.id,
        timePct,
        timeStr,
        text,
        author: authorName,
        authorId: req.dbUser?.id || null,
        drawing: drawing ? JSON.stringify(drawing) : null,
      },
    });
    // Create notification for asset owner
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: req.params.id },
        include: { project: true },
      });
      if (asset && asset.project.ownerId !== req.dbUser?.id) {
        await prisma.notification.create({
          data: {
            userId: asset.project.ownerId,
            type: 'comment',
            title: 'New comment on your asset',
            body: `${authorName} commented: "${text.substring(0, 100)}"`,
            linkView: 'editor',
            linkId: req.params.id,
          },
        });
      }
    } catch { /* notification failure is non-critical */ }
    res.json({ success: true, comment });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/comments/:id/resolve', async (req: AuthenticatedRequest, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    // Only comment author or admin can resolve
    if (comment.authorId && comment.authorId !== req.dbUser?.id && !isAdmin(req)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { resolved: req.body.resolved },
    });
    res.json({ success: true, comment: updated });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Assets CRUD ---
api.get('/assets', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const workspaceIds = getUserWorkspaceIds(req.dbUser);
    const where = workspaceIds.length > 0
      ? { project: { workspaceId: { in: workspaceIds } } }
      : {};
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { project: { select: { title: true, workspaceId: true, ownerId: true } } },
      }),
      prisma.asset.count({ where }),
    ]);
    res.json({ success: true, assets, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/assets', async (req: AuthenticatedRequest, res) => {
  try {
    const { storagePath, type, title, projectId, duration, thumbnailUrl } = req.body;
    if (!storagePath || !type) return res.status(400).json({ error: 'storagePath and type are required' });

    let targetProjectId = projectId;
    if (!targetProjectId) {
      // Auto-create a project for standalone uploads
      const project = await prisma.project.create({
        data: {
          title: title || 'Uploaded Asset',
          sourceType: 'drive',
          ownerId: req.dbUser?.id || (await prisma.user.findFirst())!.id,
          workspaceId: getUserWorkspaceIds(req.dbUser)[0] || null,
        },
      });
      targetProjectId = project.id;
    }
    const asset = await prisma.asset.create({
      data: {
        projectId: targetProjectId,
        type,
        storagePath,
        duration: duration || null,
        thumbnailUrl: thumbnailUrl || null,
        status: 'processing',
      },
    });
    res.json({ success: true, asset });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/assets/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { title, status, thumbnailUrl, client, campaign } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (status !== undefined) data.status = status;
    if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
    // client/campaign are stored on the project level
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, asset });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.delete('/assets/:id', async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Projects CRUD ---
api.get('/projects', async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceIds = getUserWorkspaceIds(req.dbUser);
    const projects = await prisma.project.findMany({
      where: workspaceIds.length > 0 ? { workspaceId: { in: workspaceIds } } : {},
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assets: true, clips: true, scripts: true } } },
    });
    res.json({ success: true, projects });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.get('/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { assets: true, clips: true, scripts: true, owner: { select: { id: true, name: true, email: true } } },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, project });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/projects', async (req: AuthenticatedRequest, res) => {
  try {
    const { title, sourceType, sourceUrl, workspaceId } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const project = await prisma.project.create({
      data: {
        title,
        sourceType: sourceType || 'drive',
        sourceUrl,
        ownerId: req.dbUser?.id || (await prisma.user.findFirst())!.id,
        workspaceId: workspaceId || getUserWorkspaceIds(req.dbUser)[0] || null,
      },
    });
    res.json({ success: true, project });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.delete('/projects/:id', async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Scripts CRUD ---
api.get('/scripts', async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceIds = getUserWorkspaceIds(req.dbUser);
    const scripts = await prisma.script.findMany({
      where: workspaceIds.length > 0 ? { project: { workspaceId: { in: workspaceIds } } } : {},
      orderBy: { updatedAt: 'desc' },
      include: { project: { select: { title: true } } },
    });
    res.json({ success: true, scripts });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/scripts', async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId, content } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });
    const script = await prisma.script.create({
      data: { projectId, content: content || '{"type":"doc","content":[]}' },
    });
    res.json({ success: true, script });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.delete('/scripts/:id', async (req, res) => {
  try {
    await prisma.script.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Clips CRUD ---
api.get('/clips', async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceIds = getUserWorkspaceIds(req.dbUser);
    const clips = await prisma.clip.findMany({
      where: workspaceIds.length > 0 ? { project: { workspaceId: { in: workspaceIds } } } : {},
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { title: true } } },
    });
    res.json({ success: true, clips });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/clips', async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId, videoUrl, status } = req.body;
    if (!projectId || !videoUrl) return res.status(400).json({ error: 'projectId and videoUrl are required' });
    const clip = await prisma.clip.create({
      data: { projectId, videoUrl, status: status || 'draft' },
    });
    res.json({ success: true, clip });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/clips/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { status, videoUrl } = req.body;
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;
    const clip = await prisma.clip.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, clip });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.delete('/clips/:id', async (req, res) => {
  try {
    await prisma.clip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Comments Edit & Delete ---
api.patch('/comments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.authorId && comment.authorId !== req.dbUser?.id && !isAdmin(req)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { text: req.body.text },
    });
    res.json({ success: true, comment: updated });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.delete('/comments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.authorId && comment.authorId !== req.dbUser?.id && !isAdmin(req)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Notifications ---
api.get('/notifications', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.dbUser) return res.json({ success: true, notifications: [] });
    const notifications = await prisma.notification.findMany({
      where: { userId: req.dbUser.id, read: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, notifications });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/notifications/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ success: true, notification });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/notifications/read-all', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: 'User not found' });
    await prisma.notification.updateMany({
      where: { userId: req.dbUser.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Workspace Management ---
api.get('/workspaces/:id/members', async (req, res) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
    });
    res.json({ success: true, members });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.delete('/workspaces/:id/members/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const wsRole = getWorkspaceRole(req.dbUser, req.params.id);
    if (wsRole !== 'admin' && !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: req.params.id, userId: req.params.userId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/workspaces/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const wsRole = getWorkspaceRole(req.dbUser, req.params.id);
    if (wsRole !== 'admin' && !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id },
      data: { name: req.body.name },
    });
    res.json({ success: true, workspace });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Analytics Overview ---
api.get('/analytics/overview', async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const workspaceIds = getUserWorkspaceIds(req.dbUser);

    const assetsWhere = workspaceIds.length > 0
      ? { createdAt: { gte: since }, project: { workspaceId: { in: workspaceIds } } }
      : { createdAt: { gte: since } };

    const [assets, clips] = await Promise.all([
      prisma.asset.findMany({ where: assetsWhere, select: { createdAt: true } }),
      prisma.clip.findMany({
        where: workspaceIds.length > 0
          ? { createdAt: { gte: since }, project: { workspaceId: { in: workspaceIds } } }
          : { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    // Group by day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData: { name: string; assets: number; clips: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      chartData.push({
        name: dayNames[d.getDay()],
        assets: assets.filter(a => a.createdAt.toISOString().split('T')[0] === dayStr).length,
        clips: clips.filter(c => c.createdAt.toISOString().split('T')[0] === dayStr).length,
      });
    }

    // Week-over-week comparison
    const prevWeekSince = new Date();
    prevWeekSince.setDate(prevWeekSince.getDate() - days * 2);
    const prevWeekUntil = new Date();
    prevWeekUntil.setDate(prevWeekUntil.getDate() - days);
    const prevAssets = await prisma.asset.count({
      where: { createdAt: { gte: prevWeekSince, lt: prevWeekUntil } },
    });
    const currentAssets = assets.length;
    const assetTrend = prevAssets > 0
      ? Math.round(((currentAssets - prevAssets) / prevAssets) * 100)
      : currentAssets > 0 ? 100 : 0;

    res.json({ success: true, chartData, totalAssets: currentAssets, totalClips: clips.length, assetTrend });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- AI Clip Analysis (Claude) ---
api.post('/clips/analyze', async (req: AuthenticatedRequest, res) => {
  try {
    const { videoUrl, fileName } = req.body;
    if (!anthropic) {
      return res.status(503).json({ error: 'Claude AI not configured — set ANTHROPIC_API_KEY' });
    }
    const prompt = `You are a YouTube content strategist. Analyze this video file name and URL to generate optimized metadata.
File: ${fileName || 'video'}
URL: ${videoUrl || 'N/A'}

Respond in JSON format with these exact fields:
{
  "title": "A compelling, SEO-optimized YouTube title (max 70 chars)",
  "description": "A detailed YouTube description with timestamps (200-400 words)",
  "hashtags": "5-8 relevant hashtags separated by spaces",
  "transcription": "A plausible summary/transcription outline (200-300 words)"
}

Return ONLY valid JSON, no markdown fences.`;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-4-5-haiku-latest',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    let result = { title: '', description: '', hashtags: '', transcription: '' };
    try {
      const text = (response.content[0] as any).text?.trim() || '';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      result = JSON.parse(cleaned);
    } catch {
      result = {
        title: 'Generated Title — ' + (fileName || 'Video'),
        description: (response.content[0] as any).text?.substring(0, 500) || 'AI analysis completed.',
        hashtags: '#Content #Video #YouTube #Creator #AI',
        transcription: (response.content[0] as any).text?.substring(0, 800) || 'Transcription not available.',
      };
    }

    // Log AI interaction
    await prisma.aiInteraction.create({
      data: {
        prompt: prompt.substring(0, 500),
        response: JSON.stringify(result).substring(0, 2000),
        model: process.env.ANTHROPIC_MODEL || 'claude-4-5-haiku-latest',
        userId: req.dbUser?.id || null,
      },
    });

    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Google Drive OAuth (redirect flow) ---
api.get('/auth/google-drive/url', async (req: AuthenticatedRequest, res) => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'Google Drive integration not configured' });
  }
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google-drive/callback`;
  const state = randomBytes(16).toString('hex');
  // Store state in a cookie for CSRF verification
  res.cookie('drive_oauth_state', state, { httpOnly: true, maxAge: 600000, sameSite: 'lax' });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

api.get('/auth/google-drive/callback', async (req: AuthenticatedRequest, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect('/?drive_error=' + error);
  if (!code) return res.status(400).send('Missing authorization code');

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google-drive/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token exchange failed');

    // Store tokens in DB if we have a user
    if (req.dbUser) {
      await prisma.googleDriveToken.upsert({
        where: { userId: req.dbUser.id },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || undefined,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
        create: {
          userId: req.dbUser.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });
    }
    // Redirect back to app with success flag
    res.redirect('/?drive_connected=true');
  } catch (e) {
    res.redirect('/?drive_error=' + encodeURIComponent(String(e)));
  }
});

api.get('/drive/files', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: 'Authentication required' });
    const token = await prisma.googleDriveToken.findUnique({ where: { userId: req.dbUser.id } });
    if (!token) return res.status(404).json({ error: 'Google Drive not connected' });

    const driveRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=20&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,thumbnailLink,webViewLink)',
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );
    if (!driveRes.ok) {
      const err = await driveRes.json() as any;
      return res.status(driveRes.status).json({ error: err.error?.message || 'Drive API error' });
    }
    const data = await driveRes.json() as any;
    res.json({ success: true, files: data.files || [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/drive/import', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: 'Authentication required' });
    const { fileId, fileName, mimeType } = req.body;
    if (!fileId || !fileName) return res.status(400).json({ error: 'fileId and fileName required' });

    const type = mimeType?.startsWith('video/') ? 'video' : mimeType?.startsWith('audio/') ? 'audio' : 'document';
    const project = await prisma.project.create({
      data: {
        title: fileName,
        sourceType: 'drive',
        sourceUrl: `https://drive.google.com/file/d/${fileId}/view`,
        ownerId: req.dbUser.id,
        workspaceId: getUserWorkspaceIds(req.dbUser)[0] || null,
        assets: { create: { type, storagePath: `drive://${fileId}`, status: 'processing' } },
      },
      include: { assets: true },
    });
    res.json({ success: true, project });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Admin Openclaw Key ---
api.post('/admin/openclaw-key', async (req: AuthenticatedRequest, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
    const key = 'oc_live_' + randomBytes(32).toString('hex');
    res.json({ success: true, key });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Express App Setup ---
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.set('trust proxy', 1);
  app.use(express.json());

  app.get('/health', (_, res) => res.status(200).send('OK'));
  app.get('/healthz', (_, res) => res.status(200).send('OK'));
  app.get('/api/health', (_, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api', api);

  const httpServer = http.createServer(app);

  const hocuspocusServer = new Hocuspocus({ name: 'ContentOS-Collab' });
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: any, socket: any, head: any) => {
    if (request.url?.startsWith('/collaboration')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        hocuspocusServer.handleConnection(ws, request);
      });
    }
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
