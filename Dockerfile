# Deploy ONLY the Express backend from server/ (Sevalla builds from repo root)
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Install backend dependencies using the actual server package scripts/lockfile
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy required backend runtime files (preserves src/data/layers, src/data/rotationlab, etc.)
COPY server/src ./src
COPY server/public ./public

# Default port (overridden by PORT env var at runtime); server listens on env.PORT
EXPOSE 4000

# Actual backend start command from server/package.json: "start": "node src/server.js"
CMD ["npm", "start"]
