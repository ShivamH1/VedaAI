FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run --filter api build

FROM oven/bun:1.3 AS runner
WORKDIR /app

RUN apt-get update -qq && apt-get install -y -qq curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/ui ./packages/ui

ENV NODE_ENV=production
EXPOSE 8000
ENV PORT=8000

CMD ["bun", "run", "--cwd", "apps/api", "start"]
