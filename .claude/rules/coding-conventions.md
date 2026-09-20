---
paths:
  - "src/**/*.ts"
  - "src/prisma/schema.prisma"
---

# Coding Conventions

Conventions for code under `src/`. The module layout these refer to (routes, controller, service, repository) is in
`CLAUDE.md` under "Planned Architecture". Most of these are not implemented yet, so follow them when you write the
code.

## Control Flow and Errors

- `async/await` only, never mixed with raw `.then()`.
- Let errors reach the centralized error-handling middleware: no per-controller `try/catch` + `res.status()`.
  Express 5 (this project's version) forwards a rejected promise from an async handler to that middleware on its own,
  so don't add an `asyncHandler` wrapper (it was an Express 4 workaround). Throw or reject, and the error middleware
  does the rest.
- Throw typed application errors (`NotFoundError`, `ValidationError`, `ForbiddenError`, ...) from services; the
  error middleware maps them to HTTP status + a consistent JSON error shape.

## Input, Output and Security

- Validate all request input with zod at the route boundary.
- Never expose `password_hash`, token values, or other secrets in API responses — use explicit response DTOs.
- Protect routes with JWT auth middleware + a role-guard middleware; never check roles ad hoc in controllers.
- Administrator actions that mutate state (order status, account activation, refunds) must be recorded in
  `audit_log`.

## Database

- Prisma models are PascalCase singular, mapped to the existing snake_case tables/columns via `@map`/`@@map` —
  never rename the underlying DB schema.
- Use `prisma.$transaction` for any multi-table write (e.g. placing an order: cart -> order -> order_items ->
  order_status_history -> payment).
- Respect soft deletes: filter `deleted_at: null` by default. Only `users` and `roles` have `deleted_at` in the
  schema. "Delete customer/restaurant/driver account" (`FR-ADM-005.6`, `006.7`, `007.7`) is a soft delete of the
  linked `users` row, not a hard delete of the profile row.
- Every order status change appends to `order_status_history` (with `changed_by_user_id`) — never overwrite status in
  place. The `orders.accepted_at/prepared_at/picked_up_at/delivered_at/cancelled_at` columns are denormalized caches of
  the history, and the history is the source of truth. Financial operations (refunds, payouts) must be auditable and
  immutable once processed.
