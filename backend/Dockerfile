# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm ci
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm ci --production

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/server.js"]