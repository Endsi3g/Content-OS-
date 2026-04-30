# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm install           # Install dependencies
npm run dev           # Start Vite dev server + Express backend on port 3000

# Production
npm run build         # Build SPA to dist/ + bundle server to dist/server.cjs
npm run start         # Run migrations then start production server

# Lint / Type-check
npm run lint          # tsc --noEmit (TypeScript type checking only — no ESLint)

# Utilities
npm run clean         # Remove dist/
npm run preview       # Preview Vite build locally
npm run electron:dev  # Electron desktop dev mode
npm run electron:build # Build Electron executable

# Docker
docker-compose up     # Full stack: app + PostgreSQL on port 3000
docker-compose down
```

## Architecture

**Monorepo:** Single codebase with React SPA (Vite) frontend and Express + Node.js backend, both served from port 3000. In dev, Vite middleware proxies through Express; in prod, Express serves the built SPA.

**Frontend** (`src/`):
- `src/store.tsx` — Central React Context (1000+ lines) holding global state: workspaces, assets, clips, scripts, undo/redo stack, theme, language. All views consume this context.
- `src/App.tsx` — Root router: switches `currentView` (state in store) to render one of 18+ page-level components.
- `src/views/` — Full-page view components (Overview, ContentDatabase, EditorWorkspace, AICoach, Settings, TeamView, etc.)
- `src/components/` — Reusable UI components (Sidebar, modals, Editor, etc.)
- `src/contexts/AuthContext.tsx` — Firebase client-side auth; wraps the entire app.
- `src/lib/api.ts` — Centralized HTTP client that auto-injects Firebase Bearer tokens.
- `src/services/` — `aiService.ts` (client-side Gemini chat/transcription), `metricoolService.ts` (analytics).
- `src/types.ts` — All TypeScript interfaces (Asset, Clip, Script, Workspace, Team, Role, etc.).
- `src/data.ts` — Mock/seed data used in dev before a backend connection is established.
- `src/i18n.ts` — Translations for EN, ES, FR, PT, DE.

**Backend** (`server.ts` + `middleware/`):
- `server.ts` — Express app: REST routes under `/api/*`, YouTube OAuth under `/auth/youtube/*`, WebSocket upgrade at `/collaboration` (Hocuspocus for real-time script editing).
- `middleware/auth.ts` — Firebase Admin SDK JWT verification applied to protected routes.
- All AI coaching calls go through `POST /api/ai/coach/edit` (server-side Gemini key).

**Database** (`prisma/`):
- Prisma 5 ORM with PostgreSQL (production) or SQLite (dev).
- 20 models: User, Workspace, WorkspaceMember, Invitation, Project, Asset, Script, Timeline, Clip, ClipReview, Comment, C2cDevice, C2cUpload, Presentation, AiInteraction, Idea, CustomRole, etc.
- Migrations run automatically on `npm run start` via `prisma migrate deploy`.

**Real-time Collaboration:**
- Yjs (CRDT) + Hocuspocus WebSocket server handle multi-user script editing with live cursors.
- WebSocket endpoint: `/collaboration` (upgraded from HTTP by Express).

**Authentication:**
- Firebase Client SDK (frontend) for login/signup.
- Firebase Admin SDK (backend) to verify JWTs on every protected API call.
- `ADMIN_EMAILS` env var bootstraps admin users on first login.

**AI:**
- Server-side `GEMINI_API_KEY` → AI Coach script editing endpoint.
- Client-side `VITE_GEMINI_API_KEY` → in-browser chat and audio transcription.

## Key Environment Variables

Copy `.env.example` → `.env`. Critical variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Server-side Firebase Admin auth |
| `VITE_FIREBASE_*` (6 vars) | Client-side Firebase config |
| `GEMINI_API_KEY` | Server AI coaching |
| `VITE_GEMINI_API_KEY` | Client Gemini chat/transcription |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_API_KEY` | YouTube import & OAuth |
| `ADMIN_EMAILS` | Comma-separated emails to bootstrap as admins |
| `DISABLE_HMR` | Set to `true` to disable Vite HMR (e.g., in AI Studio) |

## Build Notes

- **Vite manual chunks:** vendor, three.js, Firebase, GSAP, recharts, PDF, drag-drop are split into separate chunks for optimal caching.
- **Server bundle:** `server.ts` is compiled with esbuild into `dist/server.cjs` (single file for Cloud Run).
- **Prisma binaries:** Pre-generated for `linux-musl` (Cloud Run) and `darwin` (local Mac).
- **Production entrypoint:** `prisma migrate deploy && node dist/server.cjs`

## Deployment

**Google Cloud Run** is the target production platform. The Dockerfile uses a two-stage build: (1) build stage runs Vite + esbuild, (2) lean runtime stage copies only production artifacts and `node_modules`. Database is Cloud SQL (PostgreSQL) via `DATABASE_URL`.

Health endpoints available at `/health`, `/healthz`, and `/api/health`.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
