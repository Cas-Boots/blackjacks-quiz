# syntax=docker/dockerfile:1
FROM node:22-slim AS bouw
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-slim AS draai
WORKDIR /app
ENV NODE_ENV=production
# python3 en build-essential zijn er alleen voor het geval better-sqlite3 geen
# kant-en-klare binary vindt; daarna gaan ze er weer uit.
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps \
  && npm cache clean --force \
  && apt-get purge -y build-essential python3 && apt-get autoremove -y
COPY --from=bouw --chown=node:node /app/build ./build
COPY --from=bouw --chown=node:node /app/drizzle ./drizzle
COPY --from=bouw --chown=node:node /app/src/lib/server/db ./src/lib/server/db
# De app draait als de ingebouwde gebruiker 'node', niet als root. De map
# voor de database krijgt hem als eigenaar, zodat een nieuw volume meteen
# beschrijfbaar is.
RUN mkdir -p /app/media /data && chown node:node /app/media /data
USER node
ENV DATABASE_PATH=/data/quiz.db
ENV PORT=3000
# Grootste verzoek dat de server aanneemt; een portret is hooguit 200 kB.
ENV BODY_SIZE_LIMIT=512K
EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "build/index.js"]
