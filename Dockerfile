FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 CI=true
RUN corepack enable

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS production-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG APP_URL=https://n7.eluvaire.com
ENV APP_URL=$APP_URL
RUN pnpm build:deploy

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ARG APP_BUILD_SHA=local
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
ENV APP_BUILD_SHA=$APP_BUILD_SHA
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Database CLI utilities need modules that Next's tracing may omit.
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.scripts-dist ./.scripts-dist
COPY --from=builder --chown=node:node /app/database/migrations ./database/migrations
COPY --from=builder --chown=node:node /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder --chown=node:node /app/scripts/verify-media.cjs ./scripts/verify-media.cjs
RUN mkdir -p /app/media /app/.next/cache && chown -R node:node /app/media /app/.next/cache \
    && chmod 755 /app/docker-entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
