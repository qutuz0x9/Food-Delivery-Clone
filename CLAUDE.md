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
- `docs/requirements/Functional-Requirements.md` — 279 functional requirements defining scope and behavior: 85
  parents (`FR-CUS-###`, `FR-RES-###`, `FR-DRV-###`, `FR-ADM-###`) and 194 children (`FR-CUS-002.1`, ...). Customer 74,
  Restaurant 71, Driver 57, Admin 77. Cite the ID in spec descriptions and code comments.
- `docs/requirements/APIs-Endpoints.md` — REST endpoint index for **Customer, Restaurant and Driver only**. There is
  no Administrator section yet (77 `FR-ADM-*` requirements have no endpoints), so don't invent admin routes; ask.
- `docs/api/openapi.yaml` — API surface documentation (WIP).

Always cross-check new features against the Functional Requirements doc and the DB design SQL before implementing.
When a requirement or field is ambiguous, ask before inventing new behavior.

The endpoint index is a planning draft and is not consistent with itself or with the spec. It mixes `:param` and
`{param}`, has `/api/v1` on the Restaurant and Driver rows but not the Customer rows, and uses different shapes for
the same thing (customer `/auth/login` vs. restaurant `/restaurants/auth/login`; driver reuses `/auth/login`). The spec
already differs in places (`/auth/login/customer`, `/customers/me/change-password`). When documenting or building a
route, follow the spec's conventions, and flag any conflict with the index instead of silently picking one. Static
segments must be registered before parameter routes (`/orders/active` and `/deliveries/history` would otherwise match
`/:orderId` and `/:assignmentId`).

### Requirements the schema doesn't back yet

These FRs have no table or column in the DB design. Raise it and ask before implementing, and don't add tables on your own:

- **Notifications** (`FR-CUS-027`, `FR-RES-022`, `FR-DRV-018`, `FR-ADM-016`): no notifications table.
- **System settings** (`FR-ADM-017`: delivery fees, commission rates, payment method toggles; also the
  `GET /payment-methods` endpoint): no settings table.
- **Platform-level food categories** (`FR-ADM-008`) and **platform promotions** (`FR-ADM-012`): `restaurant_categories`
  and `restaurant_promotions` both require a `restaurant_id`, so there is nothing platform-wide.

Two easily-confused pairs in the schema — don't merge or cross-wire them:

- `delivery_addresses` (customer's saved/mutable addresses) vs. `delivery_address` (immutable snapshot at order
  time, referenced by `orders.delivery_address_id`) — kept separate so edits/deletes don't corrupt past orders.
- `restaurant_categories` (a restaurant's own cuisine/category tags, many-per-restaurant, e.g. Dessert/Burger) vs.
  `menu_categories` (per-restaurant menu sections, e.g. Starters/Mains, referenced by `menu_items.category_id`) —
  there is no relation between `menu_items` and `restaurant_categories`.
  The restaurant's "food categories" requirement (`FR-RES-008`) and `/restaurants/me/categories` map to
  **`menu_categories`**, not `restaurant_categories`.

### Business rules from the requirements

- Registration needs a unique email (`FR-CUS-002.3`). Password reset verifies identity first, via
  `password_reset_tokens`.
- Restaurant and driver registrations start as `pending` and need admin approval or rejection
  (`FR-ADM-006.2/.3`, `FR-ADM-007.2/.3`), which maps to `restaurant_status` / `driver_status`. Admin
  activate/deactivate maps to `account_status`.
- Order total = subtotal + delivery fee + tax − discount (`FR-CUS-019.3`), calculated server-side. Each order gets a
  unique `order_number` (`FR-CUS-019.5`).
- Cancellation is only allowed when the order is eligible under the platform policy, and it notifies the restaurant
  and the driver (`FR-CUS-022`).
- Ratings and reviews (restaurant and driver) are only for completed orders (`FR-CUS-024` to `026`). Restaurants can
  reply (`FR-RES-020`). Admins moderate through `review_status` (`FR-ADM-013`).

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
- Respect soft deletes: filter `deleted_at: null` by default. Only `users` and `roles` have `deleted_at` in the
  schema. "Delete customer/restaurant/driver account" (`FR-ADM-005.6`, `006.7`, `007.7`) is a soft delete of the
  linked `users` row, not a hard delete of the profile row.
- Every order status change appends to `order_status_history` (with `changed_by_user_id`) — never overwrite status in
  place. The `orders.accepted_at/prepared_at/picked_up_at/delivered_at/cancelled_at` columns are denormalized caches of
  the history, and the history is the source of truth. Financial operations (refunds, payouts) must be auditable and
  immutable once processed.
- Protect routes with JWT auth middleware + a role-guard middleware; never check roles ad hoc in controllers.
- Administrator actions that mutate state (order status, account activation, refunds) must be recorded in `audit_log`.

## Git Commits

Follow Conventional Commits: `<type>(<scope>): <description>`, imperative mood, ≤72 char subject, no period. Types:
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`. Explain *why* in the body, not just
what changed.
