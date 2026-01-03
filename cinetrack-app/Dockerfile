FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci --include=dev

COPY client/ ./client/
COPY server/ ./server/

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm ci --omit=dev --workspace=server

COPY server/src ./server/src
COPY --from=builder /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/server

EXPOSE 3001

CMD ["node", "src/server.js"]
