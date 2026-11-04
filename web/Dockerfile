# SavvyBot Web Application Dockerfile
# Multi-stage build for production

# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source files
COPY . .

# Build the application
RUN npm run build

# ============================================
# STAGE 2: Runtime
# ============================================
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs

# Copy built files from builder
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nodejs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./tsconfig.json

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Remove build dependencies
RUN apk del python3 make g++

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Expose port
EXPOSE ${PORT}

# Start the application
CMD ["npm", "start"]
