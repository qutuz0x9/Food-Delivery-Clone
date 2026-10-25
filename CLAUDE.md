# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food Delivery Clone — a backend platform (Uber Eats / Talabat style) for four actors: **Customers**, **Restaurants**,
**Delivery Drivers**, and **Administrators**. Stack: TypeScript, Node.js/Express, Prisma 8 (PostgreSQL), REST
API versioned under `/api/v1`.

**Current status: design/documentation phase.** The data contract (`src/prisma/contract.prisma`) and its migrations
exist and are applied to the local dev database, and the OpenAPI spec (`docs/api/`) documents all four actors. There is
no business logic yet (the `src/modules/` domain folders exist but are empty) — only a minimal Express scaffold
(`src/app.ts`, `src/index.ts`) that serves the OpenAPI spec via Swagger UI. Most work right now is on the spec and the contract.

## Source of Truth

- `src/prisma/contract.prisma` — canonical, always-up-to-date data model (tables, columns, types, constraints, FKs,
  enums) for the Prisma 8 data contract. Read this file directly for exact field-level details; don't rely on
  summaries, which drift. This is the **only** source of truth for the database schema (decided 2026-09-29).
- `docs/dbdesign/Food-Delivery-System-sqldiagram.sql` — the original first-pass DB design, used to bootstrap the
  contract. It is **not** kept in sync with `contract.prisma` going forward and must not be treated as canonical —
  it's a historical/reference sketch, not ground truth. Where the two disagree, `contract.prisma` wins, and no
  change is needed to make the DDL match; don't edit this file when the contract changes.
  `Food-Delivery-System-dbdesign.pdf` in the same folder is the visual ERD companion for that original design
  (also not kept up to date).
- `docs/api/openapi.yaml` (with `docs/api/paths/`, `schemas/` and `responses/`) — the API surface, documented for all four
  actors and derived from the contract. Where the spec and the contract disagree, the contract wins.
- `docs/requirements/APIs-Endpoints.md` — a table of every route in the spec, for all four actors. It is derived from
  `docs/api/`, so the spec wins if they disagree; update it in the same change as any route you add or rename.
- `docs/requirements/Functional-Requirements.md` — **outdated and incomplete; not a source of truth** (decided
  2026-10-02). Don't cite its IDs, don't check new work against it, and don't treat anything in it as a requirement.
  It is kept only as history.

Derive every endpoint and rule from `src/prisma/contract.prisma`: the models say which actor owns what, the enums say
which states exist, and the CHECK and unique constraints say what the rules are. Always check a new feature against the
contract before implementing it. When something isn't modelled there, ask before inventing it, and if the contract has
to change, propose the change first (see "Gaps in the contract").

Route conventions (follow them, the index is derived from them):

- Auth: customers, drivers and admins use `/auth/<action>/<actor>` (`/auth/login/driver`); restaurants use
  `/restaurants/auth/<action>`. Actions are register, login, logout, refresh, forgot-password and reset-password
  (restaurants: `password-reset/request` and `password-reset/confirm`).
- Account verification is the one exception: `/auth/verify-email/...` and `/auth/verify-phone/...` serve every kind of
  user, because the email and phone belong to the `User`.
- Own data lives under `/customers/me`, `/restaurants/me`, `/driver` and `/admin`. Public browsing sits at the root
  (`/restaurants`, `/menu-items`, `/cities`, `/cuisines`, `/payment-methods`).
- Static segments must be registered before parameter routes: `/restaurants/me/orders/active` and
  `/restaurants/me/orders/history` before `/restaurants/me/orders/:orderId`, and `/driver/deliveries/history` before
  `/driver/deliveries/:assignmentId`. Delivery requests live under `/driver/delivery-requests` so they cannot collide
  with `/driver/deliveries/:assignmentId/...`.

### Gaps in the contract

Things the product needs that `src/prisma/contract.prisma` does not model. Raise it and ask before working around them,
and don't add tables on your own:

- **Notifications:** there is no notifications table. Driver delivery offers (`delivery_offers`) are the only in-app
  inbox.
- **System settings:** nowhere to store the tax rate, commission rates or which payment methods are enabled. The
  delivery fee and minimum order are per restaurant, and `GET /payment-methods` just returns the enum.
- **Platform-wide categories and promotions:** `menu_categories`, `restaurant_categories` and `restaurant_promotions`
  all require a `restaurant_id`, so there is nothing an admin can create for every restaurant.
- **Rejections:** `driver_status` is `pending` / `active` / `inactive` with no `rejected` value, and neither a restaurant
  nor a driver registration can store a rejection reason. Neither status enum has `suspended` either: suspension for
  every actor routes through `users.account_status`.
- **Which promotion applied:** `orders.discount_amount` is a plain number with no link to a promotion.
- **Driver delay reports:** nowhere to store them.

Two easily-confused pairs in the schema — don't merge or cross-wire them:

- `delivery_addresses` (customer's saved/mutable addresses) vs. `delivery_address` (immutable snapshot at order
  time, referenced by `orders.delivery_address_id`) — kept separate so edits/deletes don't corrupt past orders.
- `restaurant_categories` (a restaurant's own cuisine/category tags, many-per-restaurant, e.g. Dessert/Burger) vs.
  `menu_categories` (per-restaurant menu sections, e.g. Starters/Mains, referenced by `menu_items.category_id`) —
  there is no relation between `menu_items` and `restaurant_categories`.
  A restaurant's menu sections are served at `/restaurants/me/categories` (**`menu_categories`**) and its cuisine tags
  at `/restaurants/me/cuisines` (**`restaurant_categories`**).

Business rules (accounts and approvals, cities and branches, cart and orders, dispatch, payments, reviews) are in
`.claude/rules/domain-rules.md`. It loads when you work on `src/**` or `docs/api/**`.

## Commands

```bash
npm run dev     # nodemon + tsx, watches src/ and docs/api/, serves at http://localhost:3000 (Swagger UI at /api-docs)
npm run build   # tsc compile to dist/
npm start       # run compiled dist/index.js
npm run lint    # oxlint with type-aware rules (config: .oxlintrc.json)
npm run lint:fix  # same, applying safe auto-fixes
npm run lint:api  # Redocly lint of docs/api/openapi.yaml (config: redocly.yaml)
npm run bundle:api  # bundle the split spec into one file, dist/openapi.bundled.yaml (for Apidog/Postman import)
npm run postman:cases [-- --only <operationId,...>]  # Postman collection with success + failure cases for every operation (Apidog imports them as cases)
npm run contract:emit  # regenerate src/prisma/contract.json and contract.d.ts after editing contract.prisma
npm run migration:plan -- <name>  # plan a migration for a contract change; review it, then apply it
npm run db:migrate  # apply planned migrations to the local database
npm run db:seed  # insert the reference cities (safe to run again)
```

Run `npm run lint` and `npm run build` after code changes and fix new findings. Oxlint is used instead of ESLint
because typescript-eslint can't load TypeScript 7 (no JS compiler API). Two rules enforce conventions from
`.claude/rules/coding-conventions.md`: `no-restricted-imports` bans `@prisma/client` outside `*.repository.ts` and
`src/config/`, and `promise/prefer-await-to-then` bans `.then()` chains. Oxlint skips the generated `migrations/` folder.

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`, `npm run lint:api` and `npm run build` on pushes to `main` and on PRs. Pin
any new action to a full commit SHA with a version comment, as the existing steps do.

Tests use Vitest + Supertest (Vitest runs ESM TypeScript with no config; jest does not). They live in
`src/**/__tests__/`, are excluded from `npm run build`, and are type-checked by `tsconfig.test.json`:

```bash
npm test            # vitest run
npm run test:watch  # vitest in watch mode
npm run typecheck   # type-check src/ including tests
```

Repository integration tests (`*.db.test.ts`) run against a separate, in-memory Postgres (`compose.test.yaml`,
`.env.test` copied from `.env.test.example`), never the dev database. Each test runs in a transaction that is rolled
back (`src/test/with-rollback.ts`). `npm test` skips them (`vitest.config.ts`).

```bash
npm run test:db:up       # start the db-test container (port 5434, starts empty)
npm run test:db:migrate  # apply the migrations to it
npm run test:db          # run the *.db.test.ts files (vitest.db.config.ts)
npm run test:db:down     # stop it (its data is gone)
```

The TypeScript setup is strict and ESM (relative imports need `.js`, no `enum`, `import type`), and the app bundles the
OpenAPI spec at startup. Details are in `.claude/rules/typescript-setup.md`, which loads when you work on
`src/**/*.ts` or `tsconfig.json`.

## OpenAPI Spec (`docs/api/`)

The spec conventions (file layout, `$ref` rules, naming, response envelope, security, pagination, examples, lint) live
in `.claude/rules/open-api-rules.md`, which loads automatically when you work on `docs/api/**/*.yaml`. Read it before
editing the spec, and lint after every edit:

```bash
npm run lint:api
```

Update `docs/api/` in the same change as any route you add or modify in `src/`, so it doesn't drift from the
implemented routes. That rule is repeated here because the rules file doesn't load when you're only editing code.

## Planned Architecture (once implementation starts)

Organize by business domain, not by actor or technical layer. Most data is touched by several actors (an order is
placed by the customer, moved along by the restaurant and the driver, and overridden by an admin), so one module owns all
the rules for its tables in one service, and each actor gets a thin route file inside that module. The module folders
exist under `src/modules/` (empty until each one is built):

```txt
src/
  index.ts                 # starts the server
  app.ts                   # builds the Express app (middleware, Swagger UI, routes)
  routes.ts                # mounts every module router under /api/v1
  config/                  # env loading and validation, logger
  prisma/                  # contract.prisma, generated contract.json / contract.d.ts, db.ts
  common/                  # error classes, pagination, shared helpers
  middlewares/             # authenticate (JWT), role guard, request validation, error handler
  modules/
    auth/                  # register/login/logout/refresh/password reset for all actors, email and phone verification
    customers/             # customer profile, saved delivery_addresses
    restaurants/           # restaurant profile, branches, operating hours, cuisine tags (restaurant_categories)
    menu/                  # menu_categories, menu items, option groups/values, images
    cart/                  # shopping_cart, items, item options
    orders/                # orders, order items/options, delivery_address snapshot, order_status_history
    payments/              # payments, payment_refunds
    deliveries/            # dispatch: delivery_offers, driver_assignments, driver_locations
    drivers/               # driver profile, vehicles, documents, earnings, payouts
    reviews/               # restaurant and driver reviews, review images, restaurant replies
    promotions/            # restaurant_promotions
    cities/                # cities (public list, admin management)
    admins/                # admin accounts only
  scripts/                 # seed.ts, spec-to-postman.ts
```

Inside a module (`orders` shown; a small module like `cities` keeps one routes and one controller file instead of the
`routes/` and `controllers/` folders):

```txt
modules/orders/
  index.ts                 # the module's public API: its service and types, never its repository
  orders.service.ts        # every business rule for the module's tables
  orders.repository.ts     # the only layer that imports the Prisma client
  orders.validation.ts     # zod schemas and the DTO types inferred from them
  orders.types.ts
  routes/                  # HTTP -> controller wiring only, one file per actor:
    customer.routes.ts     #   /customers/me/orders
    restaurant.routes.ts   #   /restaurants/me/orders
    admin.routes.ts        #   /admin/orders
  controllers/             # parse/validate input, format responses; no Prisma calls or business logic
```

- A module writes only its own tables. When it needs another domain (placing an order reads the cart and menu, creates
  the payment and starts dispatch), it calls that module's service through its `index.ts`, never its repository.
- "Admin" is an actor, not a domain: admin actions live in an `admin.routes.ts` inside the domain they change, behind
  the role guard. The `admins` module only manages administrator accounts.
- Modules follow the files in `docs/api/paths/` (`order.yaml`, `cart.yaml`, `delivery.yaml`, ...), so a route change
  maps straight to the yaml file to update.
- Not placed yet: dashboards and reports. Decide where they live before building them.

Coding conventions (async/await and error handling, zod validation, DTOs, Prisma mapping, transactions, soft deletes,
order status history, role guards, `audit_log`) are in `.claude/rules/coding-conventions.md`. It loads automatically
when you work on `src/**/*.ts` or `src/prisma/contract.prisma`.
