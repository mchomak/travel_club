FROM node:24-alpine AS builder

ARG APP
ARG BACKEND_URL=http://backend:8000
ARG NEXT_PUBLIC_CONSTRUCTOR_URL=
ARG NEXT_PUBLIC_INTERVIEWS_URL=
ARG NEXT_ASSET_PREFIX

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_PUBLIC_CONSTRUCTOR_URL=${NEXT_PUBLIC_CONSTRUCTOR_URL}
ENV NEXT_PUBLIC_INTERVIEWS_URL=${NEXT_PUBLIC_INTERVIEWS_URL}
ENV NEXT_ASSET_PREFIX=${NEXT_ASSET_PREFIX}

COPY apps/${APP}/package.json apps/${APP}/package-lock.json ./
RUN --mount=type=cache,id=travel_club_app_npm,target=/root/.npm npm ci --prefer-offline --no-audit --no-fund --maxsockets=5
COPY apps/${APP}/ ./
RUN mkdir -p public && npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node infra/local/start-next.mjs ./start-next.mjs
USER node
EXPOSE 3100 3101 3102
CMD ["node", "start-next.mjs"]
