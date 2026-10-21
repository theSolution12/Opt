FROM node:24-alpine AS build

WORKDIR /app
ENV NODE_ENV=development

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=256 \
    UV_THREADPOOL_SIZE=2

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

USER node
EXPOSE 8000

CMD ["node", "dist/server.js"]
