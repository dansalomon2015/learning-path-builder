# Backend Dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files for workspace support
COPY package.json package-lock.json ./
# Copy workspace package.json files
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
# Copy shared package source (needed as dependency)
COPY packages/shared/src ./packages/shared/src

# Install dependencies for all workspaces (production only)
# Note: We install all workspaces but only copy what we need later
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files for workspace support
COPY package.json package-lock.json ./
# Copy workspace package.json files
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
# Copy shared package source (needed as dependency)
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Install all dependencies (including dev) for building
# Install from root to handle workspaces properly
RUN npm ci

# Copy source code for both packages
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

# Build shared package first (dependency of backend)
WORKDIR /app/packages/shared
RUN npm run build

# Build the backend
WORKDIR /app/packages/backend
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy the built application
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/package.json ./packages/shared/package.json

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "dist/index.js"]
