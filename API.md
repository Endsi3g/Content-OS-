# Content OS - API & Architecture Strategy

## Core Backend Architecture Decision
Given the requirements for robust API performance, ease of deployment, and strict type-safety, we are adopting a **Hono-based dedicated backend server** over Next.js App Router API handlers.

### Why Hono + Node/Express (Standalone) over Next.js Route Handlers?
1. **Portability & Edge-Readiness:** Hono is ultra-fast, lightweight, and can run anywhere (Node.js, Cloudflare Workers, Deno, Bun). Extracting the API from Next.js avoids vendor lock-in to Vercel's edge network.
2. **Modularity:** An independent backend allows us to clearly separate stateful data integrations (Prisma, background jobs like Opus Clip syncing) from the frontend compilation layer.
3. **AI Agent Interoperability (Openclaw):** A standalone REST/JSON server makes it dramatically easier for external AI models, Claude instances, and programmatic agents to connect to our endpoints without dealing with Next.js specific routing artifacts. We can expose standard OpenAPI Swagger documentation directly.

**Current Architecture:**
- **Frontend App:** React SPA (Vite) / Next.js Client Layer
- **Private App Routes:** Handled natively by the Frontend UI Router (React Router / Next.js pages)
- **Public / Data API (`/api/*`):** Provided by **Hono**, handling all critical business operations.

---

## Database Schema Model (Prisma + PostgreSQL)
Our source of truth is a PostgreSQL database managed via Prisma. This guarantees type-safety across the entire stack.

### Key Entities
1. **User / CustomRole / Permissions:** For RBAC, distinguishing between Admin, Editor, and Viewer. Includes AI permissions.
2. **Project & Asset (Video):** Core entities ingested from Drive/YouTube/Fathom.
3. **Script & Timeline:** The structured text associated with a project. Tiptap's JSON output or Markdown is stored in the `Script` model. Timestamps are linked via relation.
4. **Clip & ClipReview:** Extracted clips by Opus/AI and the notes tied to them.
5. **AI Interaction Trace:** Auditing capabilities that track exactly what Claude/Opus did, storing prompts and parsed model responses.

---

## Editor & Video Player Integration

### Kibo Editor (TipTap) Connection
- **Real-time Collaboration:** The editor now uses **Yjs** and **Hocuspocus** for true CRDT-based multi-user collaboration. 
- **Persistence:** Document state is synced via WebSockets to the Hocuspocus server layer, which manages document persistence and awareness (cursors, active users).
- **AI Assist Commands:** Highlighting text and requesting AI completion triggers `POST /api/ai/coach/edit` passing the surrounding script context.
- **Sync Strategy:** Legacy debounced auto-save has been replaced by a more robust real-time synchronization layer that prevents editing conflicts.

### Video Player Connection
- **Video Source Metadata:** Handled gracefully. When an asset opens, we query `GET /api/assets/:id` to find the correct `storagePath` or `videoUrl`.
- **Timelines / Metadata tagging:** As the user interacts with the Video Player, time-codes can be generated and injected into the Editor (`POST /api/scripts/:id/timeline`).

---

## Environment Setup for External Deployment
- Backend endpoints will authenticate requests via JWT or session cookies depending on the gateway.
- Background tasks (like Cron for Opus Sync or Analytics Sync) shall hit specific internal secure routes or be executed via Redis queues.
