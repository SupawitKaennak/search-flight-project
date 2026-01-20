# Backend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install postgresql-client for pg_isready
RUN apk add --no-cache postgresql-client

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# Copy migrations SQL files to both locations (for compiled and tsx usage)
COPY --from=builder /app/src/database/migrations ./dist/database/migrations
COPY --from=builder /app/src/database/migrations ./src/database/migrations
# Copy source TypeScript files and dependencies for running with tsx
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
