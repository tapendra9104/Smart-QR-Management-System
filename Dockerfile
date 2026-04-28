FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ARG BACKEND_API_URL=http://backend:8080
ENV BACKEND_API_URL=$BACKEND_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json jsconfig.json next.config.mjs postcss.config.mjs components.json proxy.js ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

ARG BACKEND_API_URL=http://backend:8080
ENV BACKEND_API_URL=$BACKEND_API_URL

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

USER nextjs

CMD ["node", "server.js"]
