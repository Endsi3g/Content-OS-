# Content OS — Railway Deployment Guide

## Prerequisites
- [Railway CLI](https://docs.railway.app/develop/cli) installed
- Railway account ($5/mo Hobby plan)
- Firebase project configured (see `INTEGRATIONS.md`)
- Git repository pushed to GitHub

## Step 1 — Initialize Railway Project
```bash
railway login
railway init
```

## Step 2 — Add PostgreSQL
```bash
railway add --plugin postgresql
```
Railway will provision a managed PostgreSQL instance and set `DATABASE_URL` automatically.

## Step 3 — Configure Environment Variables
In Railway dashboard → Variables, add all production values:

```
# Database (auto-set by Railway PostgreSQL plugin)
# DATABASE_URL=postgresql://...

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Claude AI
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-3-7-sonnet-latest

# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-...

# YouTube
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_API_KEY=xxx

# Admin
ADMIN_EMAILS=you@gmail.com

# App
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-app.railway.app
```

## Step 4 — Deploy
```bash
railway up
```

Railway will:
1. Detect the `Dockerfile` and build the image
2. Run Prisma migrations automatically (via Dockerfile `RUN npx prisma generate`)
3. Start the server on port 3000

## Step 5 — Run Initial Migration
After first deploy:
```bash
railway run npx prisma migrate deploy
```

## Step 6 — Custom Domain (optional)
1. Railway dashboard → Settings → Custom Domain
2. Add your domain (e.g., `app.yourdomain.com`)
3. Add CNAME record pointing to Railway's provided domain
4. Update `ALLOWED_ORIGINS` to include your custom domain

## Step 7 — Verify
```bash
curl https://your-app.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}
```

## Troubleshooting

### Database connection issues
```bash
railway run npx prisma db push
```

### View logs
```bash
railway logs
```

### Rebuild
```bash
railway up --force
```
