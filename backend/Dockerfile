# Backend Dockerfile
# Multi-stage build: build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
# Copy migrations folder (needed for migration scripts)
COPY --from=builder /app/src/database/migrations ./src/database/migrations

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
