# Changelog

All notable changes to **Content OS** will be documented in this file.

## [Unreleased] - 2026-04-29

### Added
- **Real-time Collaboration:** Integrated Hocuspocus server and Tiptap Collaboration extension for multi-user editing.
- **Presence & Cursors:** Added collaborative cursors and awareness indicators to show who is editing each script.
- **Express Backend:** Migrated to a robust Express-based server (Hono-compatible architecture) to support WebSockets and shared state.
- **Database Persistence:** Integrated Prisma with SQLite for persistent storage of workspaces, assets, scripts, and team members.
- **Cloud Run Readiness:** Configured production build process and environment variable support for Google Cloud Run deployment.
- **Health Checks:** Added `/health` and `/api/health` endpoints for monitoring and deployment verification.

### Improved
- **Deployment Scripts:** Enhanced `package.json` to handle database initialization and migrations automatically in containerized environments.
- **Environment Handling:** Added `.env.example` and dynamic `DATABASE_URL` routing to ensure correct file system access in read-only environments (using `/tmp` for SQLite when needed).
- **Editor UI:** Refined the script editing experience with live status indicators and better toolbars.

### Fixed
- **HMR Port Conflicts:** Disabled Vite HMR in production-mode dev builds to avoid common port 24678 conflicts.
- **Prisma Client Issues:** Resolved initialization and generation errors in the build pipeline.
