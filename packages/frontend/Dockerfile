# Frontend Dockerfile
FROM node:22-alpine AS base

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files for workspace support
COPY package.json package-lock.json ./
# Copy workspace package.json files
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/
# Copy shared package source (needed as dependency)
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Install all dependencies (including dev) for building
# Install from root to handle workspaces properly
RUN npm ci

# Copy source code for both packages
COPY packages/shared/ ./packages/shared/
COPY packages/frontend/ ./packages/frontend/

# Build shared package first (dependency of frontend)
WORKDIR /app/packages/shared
RUN npm run build

# Build the frontend
WORKDIR /app/packages/frontend
RUN npm run build

# Production image, copy all the files and run nginx
FROM nginx:alpine AS runner

# Copy the built application
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
