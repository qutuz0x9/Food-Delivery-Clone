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
- `docs/requirements/Functional-Requirements.md` — 279 functional requirements (IDs like `FR-CUS-###`, `FR-RES-###`,
  `FR-DRV-###`, `FR-ADM-###`) defining scope and behavior.
- `docs/requirements/APIs-Endpoints.md` — full REST endpoint index.
- `docs/api/openapi.yaml` — API surface documentation (WIP).

Always cross-check new features against the Functional Requirements doc and the DB design SQL before implementing.
When a requirement or field is ambiguous, ask before inventing new behavior.

Two easily-confused pairs in the schema — don't merge or cross-wire them:

- `delivery_addresses` (customer's saved/mutable addresses) vs. `delivery_address` (immutable snapshot at order
  time, referenced by `orders.delivery_address_id`) — kept separate so edits/deletes don't corrupt past orders.
- `restaurant_categories` (a restaurant's own cuisine/category tags, many-per-restaurant, e.g. Dessert/Burger) vs.
  `menu_categories` (per-restaurant menu sections, e.g. Starters/Mains, referenced by `menu_items.category_id`) —
  there is no relation between `menu_items` and `restaurant_categories`.

## Commands

```bash
npm run dev     # nodemon + tsx, watches src/ and docs/api/, serves at http://localhost:3000 (Swagger UI at /api-docs)
npm run build   # tsc compile to dist/
npm start       # run compiled dist/index.js
```

No test runner is configured yet (`npm test` is a placeholder). Once implementation starts, use `jest` + `supertest`
for HTTP integration tests.

Lint the OpenAPI spec after any edit under `docs/api/`:

```bash
npx @redocly/cli lint docs/api/openapi.yaml
```

Fix any new errors before considering the doc update complete. The `no-server-example.com` warning on the
`localhost` dev server URL is expected and should be ignored.

## OpenAPI Spec Conventions (`docs/api/`)

- Layout: `openapi.yaml` (root: info/servers/tags/security/`$ref` index only) + `paths/<domain>.yaml` +
  `schemas/<domain>.yaml` + `responses/common.yaml` + `security/common.yaml`. Never grow `openapi.yaml` into a
  monolith — group by domain (auth, customers, restaurants, menu, orders, payments, drivers, admin), not by method.
- Each `paths/<domain>.yaml` is keyed by an internal operation name, not the URL; the root document maps the URL to
  it via `$ref`. When multiple methods share a URL, define one Path Item key with all methods, and put shared path
  parameters at the Path Item level (not duplicated per-operation).
- Mirror every schema/response used by a path into the root `components.schemas` / `components.responses` via
  `$ref` so tooling can list all models from the root doc.
- Target OpenAPI 3.0.3. `operationId` is `camelCase` matching the controller action. Schema names `PascalCase`;
  schema properties `camelCase` (DB `snake_case` columns map to camelCase at the API boundary).
- Response envelope: success `{ success: true, message, data }`, error `{ success: false, message, error: { code, ... } }`.
  Never inline 400/401/403/404/409/422/500 bodies in a path file — reference `responses/common.yaml`.
- Root sets `security: [bearerAuth]` globally; public endpoints (browsing, register, login, password reset) must
  explicitly override with `security: []` — never rely on omission.
- Paginated endpoints use `page` (default 1) / `limit` (default 20, max 100) query params and return
  `schemas/common.yaml#/PaginationMeta` under `data.pagination`.
- Every operation needs example values in `requestBody` and each response's `content`.
- Update `docs/api/` in the same change as any route addition/modification — don't let it drift from implemented routes.

## Planned Architecture (once implementation starts)

Organize by feature/module, not technical layer:

```txt
src/
  modules/<feature>/       # auth, customers, restaurants, menu, orders, payments, drivers, admin
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

Coding conventions to follow once code exists:

- `async/await` only, never mixed with raw `.then()`.
- Wrap every route handler (e.g. `asyncHandler`) so errors reach centralized error-handling middleware — no
  per-controller `try/catch` + `res.status()`.
- Throw typed application errors (`NotFoundError`, `ValidationError`, `ForbiddenError`, ...) from services; the
  error middleware maps them to HTTP status + a consistent JSON error shape.
- Validate all request input with zod at the route boundary.
- Prisma models are PascalCase singular, mapped to the existing snake_case tables/columns via `@map`/`@@map` —
  never rename the underlying DB schema.
- Never expose `password_hash`, token values, or other secrets in API responses — use explicit response DTOs.
- Use `prisma.$transaction` for any multi-table write (e.g. placing an order: cart -> order -> order_items ->
  order_status_history -> payment).
- Respect soft deletes: filter `deleted_at: null` by default on soft-deletable entities.
- Every order status change appends to `order_status_history` — never overwrite status in place. Financial
  operations (refunds, payouts) must be auditable and immutable once processed.
- Protect routes with JWT auth middleware + a role-guard middleware; never check roles ad hoc in controllers.
- Administrator actions that mutate state (order status, account activation, refunds) must be recorded in `audit_log`.

## Git Commits

Follow Conventional Commits: `<type>(<scope>): <description>`, imperative mood, ≤72 char subject, no period. Types:
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`. Explain *why* in the body, not just
what changed.
