FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p /app/data && if [ -z \"$AUTH_SECRET\" ]; then if [ -f /app/data/auth_secret ]; then export AUTH_SECRET=\"$(cat /app/data/auth_secret)\"; echo 'Loaded AUTH_SECRET from /app/data/auth_secret'; else export AUTH_SECRET=\"$(node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\")\"; printf '%s' \"$AUTH_SECRET\" > /app/data/auth_secret; chmod 600 /app/data/auth_secret; echo 'Generated AUTH_SECRET and saved to /app/data/auth_secret'; fi; fi && npx prisma migrate deploy && npm run start -- -p 3000"]
