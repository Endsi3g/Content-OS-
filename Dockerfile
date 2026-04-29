# syntax=docker/dockerfile:1

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build: prisma generate + vite frontend + esbuild server
# VITE_FIREBASE_* and other VITE_ vars must be passed as build args for production builds
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_FIRESTORE_DATABASE_ID
ARG VITE_GEMINI_API_KEY
ARG VITE_GEMINI_CHAT_MODEL=gemini-2.0-flash
ARG VITE_GEMINI_FAST_MODEL=gemini-2.0-flash
ARG VITE_FREEFRAME_URL
ARG VITE_METRICOOL_API_KEY

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_FIRESTORE_DATABASE_ID=$VITE_FIREBASE_FIRESTORE_DATABASE_ID
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_GEMINI_CHAT_MODEL=$VITE_GEMINI_CHAT_MODEL
ENV VITE_GEMINI_FAST_MODEL=$VITE_GEMINI_FAST_MODEL
ENV VITE_FREEFRAME_URL=$VITE_FREEFRAME_URL
ENV VITE_METRICOOL_API_KEY=$VITE_METRICOOL_API_KEY

RUN npm run build

# ── Stage 2: Production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.cjs"]
