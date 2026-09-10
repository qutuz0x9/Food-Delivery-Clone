# Copilot Instructions — Food Delivery Clone

## Project Overview
This is a **Food Delivery platform backend** (a clone of apps like Uber Eats / Talabat), serving four actors:
**Customer**, **Restaurant**, **Delivery Driver**, and **Administrator**. Business scope and behavior are defined in
`docs/requirements/Functional-Requirements.md` (279 functional requirements, IDs like `FR-CUS-###`, `FR-RES-###`,
`FR-DRV-###`, `FR-ADM-###`). The relational data model is defined in
`docs/dbdesign/Food-Delivery-System-sqldiagram.sql` (the canonical, always-up-to-date DDL — tables, columns, types,
constraints, and FKs) with `docs/dbdesign/Food-Delivery-System-dbdesign.pdf` as the visual ERD companion.
API surface is documented (partially, WIP) in `docs/api/openapi.yaml`.

Always cross-check new features against the Functional Requirements doc and the DB design SQL before implementing —
these are the source of truth for scope and entity relationships. Read the `.sql` file directly (via `view`/`grep`)
when you need exact column names, types, defaults, or constraints — do not rely on the entity summary below for
precise field-level details, since it is a high-level index only and will drift from the DDL over time. When a
requirement or field is ambiguous, ask before inventing new behavior.

> Note: `delivery_addresses` (customer's saved/mutable addresses) and `delivery_address` (an immutable snapshot of
> the address at order time, referenced by `orders.delivery_address_id`) are intentionally separate tables — this
> preserves the order's delivery address even if the customer later edits or deletes their saved address. Don't
> merge them.

## Tech Stack
- **Language:** TypeScript (strict mode)
- **Runtime/Framework:** Node.js + Express.js
- **ORM:** Prisma (PostgreSQL — schema uses `uuid`, `decimal`, `jsonb`, enums, and soft-delete columns)
- **Auth:** JWT access tokens + refresh tokens (see `refresh_tokens`, `user_tokens`, `user_logins` tables), RBAC via
  `roles`, `user_roles`, `role_claims`, `user_claims` tables
- Validation library (e.g. `zod`) for request DTOs — prefer zod for new schemas
- Test runner: `jest` + `supertest` for HTTP integration tests

## Domain Model Highlights (from DB design)
- **Identity:** `users`, `roles`, `user_roles`, `user_claims`, `role_claims`, `user_logins`, `user_tokens`,
  `refresh_tokens`, `password_reset_tokens`. Soft delete via `deleted_at` on `users`.
- **Customers:** `delivery_addresses`, `shopping_cart`, `shopping_cart_items`
- **Restaurants:** `restaurants`, `restaurant_addresses`, `restaurant_operating_hours`, `restaurant_availability`,
  `restaurant_promotions`, `restaurant_reviews`, `restaurant_review_replies`, `restaurant_review_images`,
  `main_categories`, `menu_items`, `menu_item_images`, `menu_item_option_groups`, `menu_item_option_values`
- **Orders:** `orders`, `order_items`, `order_status_history`, `payments`, `payment_refunds`
- **Drivers:** `drivers`, `driver_vehicles`, `driver_documents`, `driver_locations`, `driver_assignments`,
  `driver_payouts`, `driver_reviews`
- **Platform/Audit:** `audit_log`

Key enums to model with Prisma `enum`: `account_status`, `order_status`, `payment_status`, `payment_method`,
`refund_status`, `driver_status`/`driver_availability_status`, `restaurant_status`, `review_status`,
`document_type`/`document_status`, `vehicle_type`, `discount_type`, `payout_status`.

Every order carries a full status history (`order_status_history`) — never overwrite status in place without
appending a history row. Financial changes (refunds, payouts) must be auditable and immutable once processed.

## Project Structure Conventions
Organize by feature/module rather than by technical layer at the top level:
```
src/
  modules/
    auth/            # login, register, refresh tokens, password reset
    customers/
    restaurants/
    menu/
    orders/
    payments/
    drivers/
    admin/
    <feature>/
      <feature>.routes.ts
      <feature>.controller.ts
      <feature>.service.ts
      <feature>.repository.ts   # Prisma queries live here, not in services/controllers
      <feature>.validation.ts   # zod schemas / DTOs
      <feature>.types.ts
  middlewares/         # auth, error handler, role guard, request validation
  common/               # shared utils, error classes, pagination helpers
  config/              # env loading, prisma client instance, logger
  prisma/
    schema.prisma
    migrations/
  app.ts               # Express app wiring (middlewares, routes)
  server.ts            # process entrypoint (listen)
```
Routes only wire HTTP → controller. Controllers parse/validate input and format responses; they must not contain
Prisma calls or business logic. Services hold business logic and orchestrate repositories. Repositories are the only
layer that imports the Prisma client.

## Coding Conventions
- Use `async/await` exclusively; never mix with raw `.then()` chains.
- All Express route handlers must be wrapped (e.g. an `asyncHandler` util) so thrown/rejected errors reach the
  centralized error-handling middleware — do not `try/catch` + `res.status()` in every controller individually.
- Throw typed application errors (e.g. `NotFoundError`, `ValidationError`, `ForbiddenError`) from services; the error
  middleware maps them to HTTP status codes and a consistent JSON error shape.
- Validate all request input (body/params/query) with zod schemas at the route boundary before it reaches services.
- Prisma model names are PascalCase singular (e.g. `MenuItem`); map to the existing snake_case table/column names
  from the DB design using `@@map` / `@map` in `schema.prisma` rather than renaming the underlying tables.
- Never expose `password_hash`, token values, or other secrets in API responses — use explicit response
  DTOs/serializers, not raw Prisma models.
- Use Prisma transactions (`prisma.$transaction`) for any multi-table write (e.g. placing an order: cart → order →
  order_items → order_status_history → payment).
- Respect soft deletes: queries against soft-deletable entities must filter `deleted_at: null` by default.

## API Conventions
- Version all routes under `/api/v1`.
- Follow REST resource naming already started in `docs/api/openapi.yaml` (plural nouns, nested resources for
  ownership, e.g. `/restaurants/:id/menu-items`).
- Keep `docs/api/openapi.yaml` (and `docs/api/paths` / `schemas` / `responses`) up to date when adding or changing
  endpoints — split large specs into the `paths/`/`schemas/`/`responses/` folders using `$ref` rather than growing
  one monolithic file.
- Use standard HTTP status codes and a consistent error response envelope across all endpoints.

## Auth & Authorization
- Four actor roles map to the `roles`/`user_roles` tables: customer, restaurant, driver, administrator.
- Protect routes with an auth middleware (JWT verification) plus a role-guard middleware; never check roles ad hoc
  inside controllers.
- Administrator actions that mutate state (order status changes, account activation/deactivation, refunds) must be
  recorded in `audit_log`.

## Testing & Validation
- Add/extend tests for new endpoints and services; use `supertest` against the Express app and mock or use a test
  database for Prisma.
- Before considering a change complete, run the project's lint, typecheck, and test scripts (see `package.json`
  once initialized) and fix any failures introduced by the change.

## Documentation Sync
When functional behavior changes, check whether `docs/requirements/Functional-Requirements.md` or
`docs/api/openapi.yaml` need corresponding updates, and call this out if you can't update them yourself (e.g. the DB
design PDF is not editable from here).
