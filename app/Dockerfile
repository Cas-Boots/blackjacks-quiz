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
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps \
  && apt-get purge -y build-essential && apt-get autoremove -y
COPY --from=bouw /app/build ./build
COPY --from=bouw /app/drizzle ./drizzle
COPY --from=bouw /app/src/lib/server/db ./src/lib/server/db
ENV DATABASE_PATH=/data/quiz.db
ENV PORT=3000
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "build/index.js"]
