# Content OS Deployment & User Guide

## Overview
Content OS is a premium workspace for video content operations, featuring real-time collaborative script editing, asset management, and AI-powered workflows.

## Quick Start (Development)
1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Setup environment:**
    Copy `.env.example` to `.env` and fill in your keys.
3.  **Run in development mode:**
    ```bash
    npm run dev
    ```

## Deployment Guide (Google Cloud Run)
Content OS is optimized for deployment on Google Cloud Run.

### 1. Build Process
The build command generates a production-ready React SPA and bundles the Express server:
```bash
npm run build
```
This produces a `dist/` directory containing the frontend assets and `dist/server.cjs`.

### 2. Environment Variables
Ensure the following environment variables are set in your deployment environment:
-   `DATABASE_URL`: Typically set to `file:/tmp/data.db` for Cloud Run (non-persistent storage). For persistent storage, use a managed database like Cloud SQL (requires changing Prisma provider to `postgresql`).
-   `GEMINI_API_KEY`: Required for AI-powered features.

### 3. Database Management
The `npm start` command automatically triggers `prisma db push` to ensure the internal database is in sync with the schema.

## Key Features
-   **Dashboard:** High-level overview of workspace activity and metrics.
-   **Assets:** Central library for all video files and media.
-   **Scripts:** Real-time collaborative editor using Tiptap + Yjs. Supports multiple users simultaneously.
-   **Team:** Manage workspace members and permissions.
-   **Knowledge Base:** Store documents and reference materials for AI context.

## Troubleshooting
-   **WebSocket Connectivity:** Ensure your load balancer/proxy supports long-lived WebSocket connections on the `/collaboration` path.
-   **Database Access:** In serverless environments, ensure the `DATABASE_URL` points to a writable directory like `/tmp` if using SQLite.
