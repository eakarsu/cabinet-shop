FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    NEXTAUTH_URL=https://cabinet.example.invalid \
    NEXTAUTH_SECRET=build-auth-7a6f3d9c2b8e5a1f4d7c9b2e6a8f3d5c \
    INTERNAL_API_TOKEN=build-api-8b7e4c1d9a6f3e2c5b8d1a7f4e9c6b3d \
    PRIVACY_HASH_SECRET=build-hash-9c8f5d2a7b4e1c6f3d9a5b2e8c7f4d1a
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
USER app
EXPOSE 3000
CMD ["node", "server.js"]

