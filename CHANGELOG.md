# Changelog — Content OS

Toutes les modifications notables apportées à ce projet sont documentées ici.

---

## [1.0.0] — 2026-04-30

### Production Release

#### Core — AI Engine
- Migration complète de Google Gemini vers **Claude 4.5 Haiku** (Anthropic).
- Toutes les interactions IA (Coach, Clip Analysis, Transcription) passent par l'API Anthropic Messages.
- Support client-side via `@anthropic-ai/sdk` et server-side via les routes `/api/ai/*`.

#### Core — Multiplayer & Temps Réel
- Intégration de **Hocuspocus** pour la collaboration en temps réel.
- `WorkspacePresence.tsx` : indicateur de présence avec avatars en ligne.
- `NotificationBell.tsx` : notifications push via le canal WebSocket Awareness.

#### Core — Uploads & Storage
- Migration des uploads simulés vers **Firebase Storage** (`uploadBytesResumable`).
- Upload direct navigateur vers GCS (pas de transit serveur).

#### Security — RBAC
- Application stricte de `loadDbUser` sur toutes les routes CRUD.
- Isolation des données par workspace (tenant-scoped).
- Validation des variables Firebase au démarrage en production.

#### Electron Desktop (.EXE)
- **Tray System** : Minimisation dans la barre des taches, menu contextuel.
- **Notifications natives** Windows 10/11 via l'API Notification d'Electron.
- **Raccourcis globaux** : `Ctrl+Shift+Space` (show/hide), `Ctrl+Shift+N` (nouveau script), `Ctrl+Shift+U` (upload).
- **Auto-Launch** : Demarrage automatique avec Windows via `auto-launch`.
- **Import natif** de dossiers de rushes et fichiers video.
- **IPC Bridge** securise via `contextBridge` + hook React `useElectron()`.
- **Packaging** : Configuration `electron-builder` pour installateur NSIS Windows.

#### Testing
- Suite **Playwright E2E** complete (API, App Shell, Features).
- Configuration multi-navigateurs (Chromium + Firefox).
- Scripts PowerShell d'automatisation (`test-local.ps1`, `e2e-test.ps1`, `clean-system.ps1`).

#### Infrastructure & Deploy
- `railway.toml` pour deploiement Railway.
- `docker-compose.yml` avec PostgreSQL, Redis, FreeFrame.
- `Dockerfile` multi-stage pour build de production.

#### Documentation
- Reorganisation dans `/docs` avec categories :
  - `docs/deployment/` : Guide Railway
  - `docs/integrations/` : Firebase, Claude AI, Google Drive, YouTube, Metricool
  - `docs/electron/` : Documentation complete de l'app desktop et roadmap EXE-only

---

## [0.1.0] — 2026-04-29

### Initial Production Pass (PR #1)

- Elimination de toutes les valeurs hardcodees.
- Ajout de PostgreSQL via Prisma ORM.
- Ajout de Firebase Admin SDK pour l'authentification serveur.
- Integration FreeFrame (review collaboratif).
- Docker Compose pour l'environnement local.
- Securisation des endpoints publics.

---

## [0.0.1] — 2026-04-28

### Initial Commit

- Structure initiale du projet React 19 + Vite + Express.
- UI prototype avec Tailwind CSS, Framer Motion, Three.js.
- Store Zustand avec donnees mock.
