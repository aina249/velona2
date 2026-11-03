# Image unique : compile l'interface puis lance l'API (Node, sans dépendance d'exécution)
FROM node:22-alpine AS build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN OUT_DIR=/app/public node build.js

FROM node:22-alpine
ENV NODE_ENV=production PUBLIC_DIR=/app/public UPLOADS_DIR=/data/uploads
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server/ ./
COPY --from=build /app/public /app/public
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "src/index.js"]
