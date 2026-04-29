import express from "express";
import { PrismaClient } from '@prisma/client';
import path from 'path';
import http from 'http';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/tmp/data.db';
  console.log('Using default DATABASE_URL: file:/tmp/data.db');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const api = express.Router();

// --- Business Logic API Routes (Connected to Prisma & UI) ---

api.get('/auth/youtube/url', (req, res) => {
  const redirectUri = req.query.redirect_uri as string || `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID || '12345-dummy.apps.googleusercontent.com',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

api.get(['/auth/youtube/callback', '/auth/youtube/callback/'], async (req, res) => {
  // Exchange token logic would go here
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'YOUTUBE_AUTH_SUCCESS' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>YouTube Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

// --- Auth and Workspace APIs ---
api.post('/auth/sync', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { workspaces: { include: { workspace: true } } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: (email === 'quebecsaas@gmail.com' || email === 'olivier@contentos.com') ? 'admin' : 'viewer',
        },
        include: { workspaces: { include: { workspace: true } } }
      });
    } else {
      // Update name if provided and missing
      if (name && !user.name) {
        user = await prisma.user.update({
          where: { email },
          data: { name },
          include: { workspaces: { include: { workspace: true } } }
        });
      }
      // Force admin role if they are the special users but got stuck as viewer
      if ((email === 'quebecsaas@gmail.com' || email === 'olivier@contentos.com') && user.role !== 'admin') {
        user = await prisma.user.update({
          where: { email },
          data: { role: 'admin' },
          include: { workspaces: { include: { workspace: true } } }
        });
      }
    }

    // Ensure the user has at least one workspace
    if (user.workspaces.length === 0) {
      // Find default workspace or create one
      let defaultWorkspace = await prisma.workspace.findFirst();
      if (!defaultWorkspace) {
        defaultWorkspace = await prisma.workspace.create({
          data: { name: 'Default Workspace' }
        });
      }

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: defaultWorkspace.id,
          role: user.role === 'admin' ? 'admin' : 'member'
        }
      });

      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { workspaces: { include: { workspace: true } } }
      }) as any;
    }

    res.json({ success: true, user });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Teams & Users APIs ---
api.get('/workspaces', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await prisma.user.findUnique({
      where: { email: String(email) },
      include: {
        workspaces: {
          include: { workspace: true }
        }
      }
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
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const invite = await prisma.invitation.create({
      data: {
        email,
        workspaceId: id,
        role: role || 'editor',
        token,
        invitedById: inviter.id
      }
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
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
      include: { workspace: true, invitedBy: true }
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
      include: { workspace: true }
    });
    
    if (!invite || invite.status !== 'pending' || invite.email !== email) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } }
    });
    
    if (!existing) {
      // Add to workspace
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: invite.workspaceId,
          role: invite.role
        }
      });
    }
    
    // Update invite status
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: 'accepted' }
    });
    
    res.json({ success: true, workspace: invite.workspace });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    // Map to TeamMember format expected by frontend
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role, 
      avatar: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`,
      bio: u.bio,
      status: 'active'
    }));
    res.json(mappedUsers);
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/users/profile', async (req, res) => {
  try {
    const { email, bio, avatarUrl, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.update({
      where: { email },
      data: { bio, avatarUrl, name },
      include: { workspaces: { include: { workspace: true } } }
    });
    res.json({ success: true, user });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });
    res.json({ success: true, user });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

// 1. Script & Timeline APIs (Connects to Editor)
api.get('/scripts/latest', async (req, res) => {
  try {
    const script = await prisma.script.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { timelines: true, project: true },
    });
    res.json({ success: true, script });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/scripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const updatedScript = await prisma.script.update({
      where: { id },
      data: { content: body.content, version: { increment: 1 } },
    });
    res.json({ success: true, script: updatedScript });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/scripts/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const timeline = await prisma.timeline.create({
      data: {
        scriptId: id,
        timestamp: body.timestamp,
        note: body.note,
        segment: body.segment,
      },
    });
    res.json({ success: true, timeline });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

// 2. Asset / Video APIs (Connects to VideoPlayer)
api.get('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({
      where: { id },
    });
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

    // Ensure API key is present
    const apiKey = process.env.YOUTUBE_API_KEY;
    let title = 'Imported YouTube Video';
    let duration = 0;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    if (apiKey) {
      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`);
      const ytData = await ytRes.json();
      
      if (ytData.items && ytData.items.length > 0) {
        title = ytData.items[0].snippet.title;
        thumbnailUrl = ytData.items[0].snippet.thumbnails?.high?.url || thumbnailUrl;
        // Basic parse of ISO 8601 duration (e.g., PT1H2M10S) to seconds could go here
        // We'll leave duration 0 if not fully parsing, or implement a naive parse
        const durationStr = ytData.items[0].contentDetails.duration;
        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const h = parseInt(match[1] || '0');
          const m = parseInt(match[2] || '0');
          const s = parseInt(match[3] || '0');
          duration = h * 3600 + m * 60 + s;
        }
      }
    } else {
      console.warn('YOUTUBE_API_KEY not set. Using fallback metadata.');
    }

    // Default owner ID or we could pass user ID if auth was set up
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) return res.status(500).json({ error: 'No users found in database' });

    const project = await prisma.project.create({
      data: {
        title,
        sourceType: 'youtube',
        sourceUrl: url,
        ownerId: firstUser.id,
        assets: {
          create: {
            type: 'video',
            storagePath: url,
            duration,
            thumbnailUrl,
          }
        }
      },
      include: { assets: true }
    });

    res.json({ success: true, project });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 3. AI Interactions (Connects to Editor's context menu)
api.post('/ai/coach/edit', async (req, res) => {
  try {
    const body = req.body;
    
    // Let's mock a simple AI improvement
    const improvedText = `AI Improved: ${body.selectedText}`;
    
    await prisma.aiInteraction.create({
      data: {
        prompt: `Improve this script text: ${body.selectedText}`,
        response: improvedText,
      }
    });

    res.json({ success: true, improvedText });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- C2C APIs ---
api.get('/c2c/devices', async (req, res) => {
  try {
    const devices = await prisma.c2cDevice.findMany();
    res.json({ success: true, devices });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.get('/c2c/uploads', async (req, res) => {
  try {
    const uploads = await prisma.c2cUpload.findMany({
      include: { device: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, uploads });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Presentations APIs ---
api.get('/presentations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let presentation;
    if (id === 'default') {
      presentation = await prisma.presentation.findFirst({
        include: { videos: true }
      });
    } else {
      presentation = await prisma.presentation.findUnique({
        where: { id },
        include: { videos: true }
      });
    }
    res.json({ success: true, presentation });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/presentations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { passwordEnabled, downloadsEnabled } = req.body;
    const presentation = await prisma.presentation.update({
      where: { id },
      data: { passwordEnabled, downloadsEnabled }
    });
    res.json({ success: true, presentation });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Comments APIs ---
api.get('/assets/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { assetId: id },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, comments });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.post('/assets/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { timePct, timeStr, text, author, drawing } = req.body;
    const comment = await prisma.comment.create({
      data: {
        assetId: id,
        timePct,
        timeStr,
        text,
        author: author || 'Anonymous',
        drawing: drawing ? JSON.stringify(drawing) : null,
      }
    });
    res.json({ success: true, comment });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

api.patch('/comments/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;
    const comment = await prisma.comment.update({
      where: { id },
      data: { resolved }
    });
    res.json({ success: true, comment });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Express App Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check for Cloud Run
  app.get('/health', (req, res) => res.status(200).send('OK'));
  app.get('/healthz', (req, res) => res.status(200).send('OK'));
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

  // Mount API
  app.use('/api', api);

  const httpServer = http.createServer(app);

  const hocuspocusServer = new Hocuspocus({
    name: 'ContentOS-Collab',
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: any, socket: any, head: any) => {
    // Only handle collaboration path
    if (request.url?.startsWith('/collaboration')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        hocuspocusServer.handleConnection(ws, request);
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Disable HMR to avoid port conflicts in dev
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server process.env.NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Server process.cwd(): ${process.cwd()}`);
    console.log(`Server listening on port ${PORT}`);
    
    // Seed and start prisma-related tasks in background
    (async () => {
       try {
         console.log('Checking database connection...');
         const count = await prisma.project.count();
         console.log(`Database check successful. Project count: ${count}`);
         if (count === 0) {
            await seedDatabase();
         }
       } catch (e: any) {
         console.error('Database check/seed failed:', e.message || e);
         if (e.code) console.error('Prisma Error Code:', e.code);
         if (e.meta) console.error('Prisma Error Meta:', JSON.stringify(e.meta));
         console.error('Stack trace:', e.stack);
       }
    })();
  });
}

async function seedDatabase() {
    console.log('Seeding initial data...');
    try {
        await prisma.workspace.create({
          data: {
            name: 'Default Workspace',
            members: {
              create: {
                role: 'admin',
                user: {
                  create: {
                    email: 'admin@prisma.test',
                    name: 'Admin',
                    role: 'admin',
                    projects: {
                      create: {
                        title: 'Introduction to Prisma Hero',
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
                                author: 'Client'
                              }
                            }
                          }
                        },
                        scripts: {
                          create: {
                            content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is an initial script text to jumpstart the Editor. It is saved in SQLite Database and fully persistent!"}]}]}'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        // Seed C2C Data
        const c1 = await prisma.c2cDevice.create({ data: { name: 'RED V-Raptor A', status: 'recording', battery: 78, storage: 45, lastActive: 'Now' } });
        const c2 = await prisma.c2cDevice.create({ data: { name: 'ARRI Alexa Mini B', status: 'idle', battery: 92, storage: 62, lastActive: '2 min ago' } });
        await prisma.c2cUpload.create({ data: { name: 'A001_C014_0828XO_Proxy.mp4', deviceId: c1.id, size: '240 MB', status: 'uploading', progress: 45 } });
        await prisma.c2cUpload.create({ data: { name: 'A001_C013_0828XO_Proxy.mp4', deviceId: c1.id, size: '1.2 GB', status: 'completed', progress: 100 } });
        await prisma.c2cUpload.create({ data: { name: 'B042_C001_0828ZZ_Proxy.mp4', deviceId: c2.id, size: '850 MB', status: 'completed', progress: 100 } });
        
        // Seed Presentation Data
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
                 { title: '04_Social_Teaser_Vertical.mp4', duration: '00:15', thumbnail: 'https://images.unsplash.com/photo-1526925539332-faa3372c0199?auto=format&fit=crop&q=80&w=600' }
              ]
            }
          }
        });
        console.log('Seeding complete.');
    } catch (e) {
        console.error('Seeding error:', e);
    }
}

startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
