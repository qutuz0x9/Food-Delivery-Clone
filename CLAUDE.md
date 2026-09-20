# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food Delivery Clone — a backend platform (Uber Eats / Talabat style) for four actors: **Customers**, **Restaurants**,
**Delivery Drivers**, and **Administrators**. Stack: TypeScript, Node.js/Express, Prisma (PostgreSQL, planned), REST
API versioned under `/api/v1`.

**Current status: design/documentation phase.** No business logic, database layer, or `src/modules/` structure
exists yet — only a minimal Express scaffold (`src/app.ts`, `src/index.ts`) that serves the OpenAPI spec via Swagger
UI. Most work right now is on the OpenAPI spec (`docs/api/`) and the DB schema (`docs/dbdesign/`).

## Source of Truth

- `docs/dbdesign/Food-Delivery-System-sqldiagram.sql` — canonical, always-up-to-date DDL (tables, columns, types,
  constraints, FKs). Read this file directly for exact field-level details; don't rely on summaries, which drift.
  `Food-Delivery-System-dbdesign.pdf` in the same folder is the visual ERD companion (not editable from here).
- `docs/requirements/Functional-Requirements.md` — the functional requirements that define scope and behavior: parents
  (`FR-CUS-###`, `FR-RES-###`, `FR-DRV-###`, `FR-ADM-###`) with numbered children (`FR-CUS-002.1`, ...). Each actor's
  summary table sits at the end of its section, and the rows are the source of truth if a count drifts. Cite the ID in
  spec descriptions and code comments.
- `docs/requirements/APIs-Endpoints.md` — REST endpoint index for **Customer, Restaurant and Driver only**. There is
  no Administrator section yet (none of the `FR-ADM-*` requirements have endpoints), so don't invent admin routes; ask.
- `docs/api/openapi.yaml` — API surface documentation (WIP).

Always cross-check new features against the Functional Requirements doc and the DB design SQL before implementing.
When a requirement or field is ambiguous, ask before inventing new behavior.

The endpoint index is a planning draft and is not consistent with itself or with the spec. It mixes `:param` and
`{param}`, has `/api/v1` on the Restaurant and Driver rows but not the Customer rows, and uses different shapes for
the same thing (customer `/auth/login` vs. restaurant `/restaurants/auth/login`; driver reuses `/auth/login`). The spec
already differs in places (`/auth/login/customer`, `/customers/me/change-password`). When documenting or building a
route, follow the spec's conventions, and flag any conflict with the index instead of silently picking one. Static
segments must be registered before parameter routes (`/restaurants/me/orders/active` and `/driver/deliveries/history`
would otherwise match `/restaurants/me/orders/:orderId` and `/driver/deliveries/:assignmentId`).

### Requirements the schema doesn't back yet

These FRs have no table or column in the DB design. Raise it and ask before implementing, and don't add tables on your own:

- **Notifications** (`FR-CUS-027`, `FR-RES-022`, `FR-DRV-018`, `FR-ADM-016`): no notifications table.
- **System settings** (`FR-ADM-017`: delivery fees, commission rates, payment method toggles; also the
  `GET /payment-methods` endpoint): no settings table.
- **Platform-level food categories** (`FR-ADM-008`) and **platform promotions** (`FR-ADM-012`): `restaurant_categories`
  and `restaurant_promotions` both require a `restaurant_id`, so there is nothing platform-wide.
- **Rejecting a driver registration** (`FR-ADM-007.3`): `driver_status` is `pending` / `active` / `inactive` /
  `suspended`, with no `rejected` value (`restaurant_status` has one).

Two easily-confused pairs in the schema — don't merge or cross-wire them:

- `delivery_addresses` (customer's saved/mutable addresses) vs. `delivery_address` (immutable snapshot at order
  time, referenced by `orders.delivery_address_id`) — kept separate so edits/deletes don't corrupt past orders.
- `restaurant_categories` (a restaurant's own cuisine/category tags, many-per-restaurant, e.g. Dessert/Burger) vs.
  `menu_categories` (per-restaurant menu sections, e.g. Starters/Mains, referenced by `menu_items.category_id`) —
  there is no relation between `menu_items` and `restaurant_categories`.
  The restaurant's "food categories" requirement (`FR-RES-008`) and `/restaurants/me/categories` map to
  **`menu_categories`**, not `restaurant_categories`.

Business rules taken from the requirements (registration, approvals, order totals, cancellation, reviews) are in
`.claude/rules/domain-rules.md`. It loads when you work on `src/**` or `docs/api/**`.

## Commands

```bash
npm run dev     # nodemon + tsx, watches src/ and docs/api/, serves at http://localhost:3000 (Swagger UI at /api-docs)
npm run build   # tsc compile to dist/
npm start       # run compiled dist/index.js
npm run lint    # oxlint with type-aware rules (config: .oxlintrc.json)
npm run lint:fix  # same, applying safe auto-fixes
```

Run `npm run lint` and `npm run build` after code changes and fix new findings. Oxlint is used instead of ESLint
because typescript-eslint can't load TypeScript 7 (no JS compiler API). Two rules enforce conventions from
`.claude/rules/coding-conventions.md`: `no-restricted-imports` bans `@prisma/client` outside `*.repository.ts` and
`src/config/`, and `promise/prefer-await-to-then` bans `.then()` chains.

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint` and `npm run build` on pushes to `main` and on PRs. Pin
any new action to a full commit SHA with a version comment, as the existing steps do.

No test runner is configured yet (`npm test` is a placeholder). Once implementation starts, use `jest` + `supertest`
for HTTP integration tests.

The TypeScript setup is strict and ESM (relative imports need `.js`, no `enum`, `import type`), and the app bundles the
OpenAPI spec at startup. Details are in `.claude/rules/typescript-setup.md`, which loads when you work on
`src/**/*.ts` or `tsconfig.json`.

## OpenAPI Spec (`docs/api/`)

The spec conventions (file layout, `$ref` rules, naming, response envelope, security, pagination, examples, lint) live
in `.claude/rules/open-api-rules.md`, which loads automatically when you work on `docs/api/**/*.yaml`. Read it before
editing the spec, and lint after every edit:

```bash
npx @redocly/cli lint docs/api/openapi.yaml
```

Update `docs/api/` in the same change as any route you add or modify in `src/`, so it doesn't drift from the
implemented routes. That rule is repeated here because the rules file doesn't load when you're only editing code.

## Planned Architecture (once implementation starts)

Organize by feature/module, not technical layer:

```txt
src/
  modules/<feature>/       # auth, customers, restaurants, menu, orders, payments, drivers, admin (see note below)
    <feature>.routes.ts        # HTTP -> controller wiring only
    <feature>.controller.ts    # parse/validate input, format responses — no Prisma calls or business logic
    <feature>.service.ts       # business logic, orchestrates repositories
    <feature>.repository.ts    # only layer that imports the Prisma client
    <feature>.validation.ts    # zod schemas / DTOs
    <feature>.types.ts
  middlewares/              # auth, error handler, role guard, request validation
  common/                    # shared utils, error classes, pagination helpers
  config/                    # env loading, prisma client instance, logger
  prisma/schema.prisma
```

The requirements also imply features outside this module list: cart (`shopping_cart*`), reviews, promotions,
notifications, and dashboards/reports (`FR-RES-021`, `FR-DRV-016/017`, `FR-ADM-014/015`). Decide where each one lives
(its own module or inside an existing one) before implementing it.

Coding conventions (async/await and error handling, zod validation, DTOs, Prisma mapping, transactions, soft deletes,
order status history, role guards, `audit_log`) are in `.claude/rules/coding-conventions.md`. It loads automatically
when you work on `src/**/*.ts` or `src/prisma/schema.prisma`.
