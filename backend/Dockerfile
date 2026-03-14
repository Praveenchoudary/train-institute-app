# ── Stage 1: Install production dependencies ──────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# npm install --omit=dev works without a package-lock.json
RUN npm install --omit=dev && npm cache clean --force

# ── Stage 2: Production image ─────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# dumb-init: proper PID 1, handles SIGTERM correctly
RUN apk add --no-cache dumb-init

# Copy only production node_modules from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY src/ ./src/
COPY package.json ./

# Run as non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nodeuser -u 1001 -G nodejs \
 && chown -R nodeuser:nodejs /app

USER nodeuser
EXPOSE 5000
CMD ["dumb-init", "node", "src/server.js"]
