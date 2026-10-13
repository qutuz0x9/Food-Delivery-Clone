# One Dockerfile, three stages you can target: dev (hot reload), build (compile + migrations), prod (small runtime).
FROM node:24-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

# All dependencies, including dev tools (tsx, tsc, prisma CLI).
FROM base AS deps
RUN npm ci

# dev: source is bind-mounted by compose.dev.yaml, nodemon restarts on change.
FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev"]

# build: compiles to dist/. Also used by the `migrate` service because it has the prisma CLI.
FROM deps AS build
COPY . .
RUN npm run build

# prod: used by staging and prod. Same image, different env file.
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=build --chown=node:node /app/dist ./dist
# app.ts reads the OpenAPI spec from process.cwd()/docs/api at startup.
COPY --chown=node:node docs/api ./docs/api
USER node
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["dist/index.js"]
