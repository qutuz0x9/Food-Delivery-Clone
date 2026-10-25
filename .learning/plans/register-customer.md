# Plan: Register Customer

Notes: `/home/qutuz0x9/MyData/Backend-Developer/CodeBase/04- Projects/Food Delivery Clone/03- Development/Features/01- Register Customer/`

## 1. Goal and assumptions

A visitor creates a customer account and is logged in at once: the response carries a JWT access token and sets a
refresh token cookie.

- The `Customer` role already exists in `identity.roles` (the seed creates it). If it is missing, register fails
  with a 500, because that is a server setup problem, not a client error.
- No `audit_log` row (it is for admin actions, and `user_agent` is NOT NULL).
- Email verification is a separate feature. A new account is `active` and unverified.

Project: TypeScript (strict, ESM), Express 5, Prisma 8 (`@prisma/orm-postgres` rc.11), Zod 4. This is the first
feature, so there is nothing to mirror. It follows the module layout in `CLAUDE.md`.

New dependencies (dev): `vitest`, `supertest`, `@types/supertest`, `@types/jsonwebtoken`. `jsonwebtoken` is already
installed. Passwords use `node:crypto` scrypt (no new dependency), in the same `scrypt$salt$hash` format as the seed,
so seeded demo users can log in later. `CLAUDE.md` names jest for tests; this plan uses Vitest, because it runs ESM
TypeScript with no config and jest does not.

## 2. Endpoint contract

- `POST /api/v1/auth/register/customer`, no auth.
- Request body:

  ```json
  { "email": "John@Example.com", "password": "StrongPassword123!", "firstName": "John", "lastName": "Doe", "phoneNumber": "+201234567890" }
  ```

- Success: `201`, header `Set-Cookie: refreshToken=<raw>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`
  (`Secure` only in production).

  ```json
  {
    "success": true,
    "message": "Customer account created successfully",
    "data": {
      "customer": { "id": "…", "email": "John@Example.com", "firstName": "John", "lastName": "Doe", "phoneNumber": "+201234567890" },
      "accessToken": "eyJ…"
    }
  }
  ```

| Case | Status | Error code |
| --- | --- | --- |
| Body fails validation | 400 | `VALIDATION_ERROR` (with `fields`) |
| Email taken (case-insensitive), at the check or at insert | 409 | `EMAIL_ALREADY_EXISTS` |
| Phone taken, at the check or at insert | 409 | `VALUE_ALREADY_IN_USE` |
| Anything else (DB down, role missing) | 500 | `INTERNAL_SERVER_ERROR` |

## 3. Request → response flow

1. **Router** (`routes/customer.routes.ts`) matches the route and runs `validate`. Routing only.
2. **validate middleware** parses the body with `registerCustomerSchema`. On failure it calls `next(zodError)`; on
   success it replaces `req.body` with the parsed, trimmed data. Input shape is an HTTP-boundary job.
3. **Controller** reads `req.body` and `req.ip`, calls `authService.registerCustomer`, sets the refresh cookie, and
   sends 201 with the envelope. HTTP-only work: cookies and status codes live here.
4. **Service** owns the rules: normalizes the email, checks email and phone (throws `EmailAlreadyExistsError` /
   `PhoneNumberInUseError`), hashes the password, creates the raw refresh token, runs the transaction, then signs the
   JWT after commit.
5. **Repositories** (`AuthRepository`, and `CustomersService` → `CustomersRepository` for the profile) run the
   queries with the transaction client. `AuthRepository.createUser` catches a unique violation and throws the same
   409 errors, so a race still gives a 409.
6. **Prisma 8** runs the SQL. A thrown error inside `db.transaction` rolls everything back.
7. **errorHandler** (last middleware) turns `AppError` into its status + envelope, `ZodError` into 400
   `VALIDATION_ERROR`, and anything else into a logged 500.

## 4. Files

| File | Layer | Who writes | Purpose |
| --- | --- | --- | --- |
| `src/common/errors/app-error.ts` | errors | **You** (foundation) | `AppError` base: status, code, message, optional fields |
| `src/common/errors/http-errors.ts` | errors | Claude | `ConflictError`, `UnauthorizedError`, `NotFoundError`, ... |
| `src/middlewares/error-handler.ts` | middleware | **You** (foundation) | errors → JSON envelope |
| `src/middlewares/validate.ts` | middleware | Claude | runs Zod schemas on body/params/query |
| `src/config/env.ts` | config | Claude | loads and validates `JWT_ACCESS_SECRET`, token lifetimes, `NODE_ENV` |
| `src/prisma/db.ts` | db | Claude (small edit) | export a `DbClient` type that fits both `db` and `tx` |
| `src/common/password-hasher.ts` | helper | Claude | scrypt hash/verify, seed format |
| `src/modules/auth/token.service.ts` | auth | Claude | sign the JWT; create a refresh token + its SHA-256 hash |
| `src/modules/auth/auth.repository.ts` | repository | **You** (3 methods) + Claude (the rest) | users, user_roles, refresh_tokens queries |
| `src/modules/auth/auth.validation.ts` | validation | **You** (rules) + Claude (shape) | `registerCustomerSchema` + input type |
| `src/modules/auth/auth.service.ts` | service | **You** (`registerCustomer`) | the register flow |
| `src/modules/auth/auth.errors.ts` | errors | Claude | `EmailAlreadyExistsError`, `PhoneNumberInUseError` |
| `src/modules/auth/auth.types.ts` | types | Claude | `CustomerResponse`, `RegisterCustomerResult` |
| `src/modules/auth/auth.mapper.ts` | mapper | Claude | user + customer rows → `CustomerResponse` |
| `src/modules/auth/controllers/customer.controller.ts` | controller | Claude | HTTP in/out, cookie |
| `src/modules/auth/routes/customer.routes.ts` | routes | Claude | `buildCustomerAuthRouter(controller)` |
| `src/modules/auth/auth.module.ts` | wiring | Claude | builds repository → service → controller → router |
| `src/modules/customers/{customers.repository,customers.service,index}.ts` | customers | Claude | `createProfile` (customers owns its table) |
| `src/routes.ts`, `src/app.ts` | app | Claude | mount under `/api/v1`, errorHandler last |
| `docs/api/paths/customer.yaml`, `docs/api/schemas/customer.yaml` | spec | Claude | add `accessToken` + `Set-Cookie` to the 201 |
| `src/modules/auth/__tests__/*.test.ts` | tests | Claude | see section 9 |

## 5. Data model

No contract change and no migration. Rows written:

- `identity.users`: `email` (trimmed, as typed), `normalizedEmail` (lowercase), `passwordHash`, `phoneNumber`.
  `id` defaults to `uuid()`, `accountStatus` to `active`, `createdAt` to `now()`. Unique: `users_email_key`,
  `users_normalized_email_key`, `users_phone_number_key`.
- `identity.user_roles`: `userId`, `roleId` of `Customer` (primary key on both).
- `customers`: `id` (code generates it, no default), `userId` (unique FK), `firstName`, `lastName`.
- `identity.refresh_tokens`: `userId`, `tokenHash` (unique), `expiresAt` = now + 7 days, `ipAddress`. `deviceId` null.

Existing indexes are enough: every lookup is on a unique column.

## 6. Validation rules

| Field | Rules | Where |
| --- | --- | --- |
| email | required, trimmed, valid email, at most 254 characters | Zod |
| email | not already used (compared by `normalizedEmail`) | Service + DB constraint |
| password | required, 8 to 128 characters, not trimmed | Zod |
| firstName, lastName | required, trimmed, 1 to 100 characters after trimming | Zod |
| phoneNumber | required, trimmed, E.164 (`+` then 8 to 15 digits, first digit not 0) | Zod |
| phoneNumber | not already used | Service + DB constraint |

## 7. Transaction and error design

- Before the transaction: normalize the email, run both uniqueness checks, hash the password, create the raw refresh
  token and its hash. Slow or pure work stays outside, so the transaction is short.
- Inside one `db.transaction`: insert `users` → insert `user_roles` → `CustomersService.createProfile` →
  insert `refresh_tokens`. Every call gets `tx`.
- After commit: sign the JWT. The controller sets the cookie.
- On failure, any throw inside the callback rolls back all four inserts. No half-created account is left.
- `AuthRepository.createUser` translates a Postgres unique violation (SQLSTATE `23505`) by constraint name into
  `EmailAlreadyExistsError` or `PhoneNumberInUseError`. Any other error is rethrown unchanged. The error handler
  never sees database codes.

## 8. Edge cases and security

- Two requests with the same email at the same time: both pass the check; the DB constraint stops the second; the
  repository turns it into a 409.
- `John@x.com` and `john@x.com` are the same account (compared by `normalizedEmail`).
- The password is never logged, never returned, and is stored only as a salted scrypt hash.
- The refresh token is stored only as a SHA-256 hash, and sent only in an `HttpOnly` cookie, never in the body.
- The JWT is HS256 with a secret from env (at least 32 characters, app refuses to start without it), lifetime 15
  minutes, payload `{ sub: userId, role: "Customer" }`. No email or other personal data in it.
- The 409 tells an attacker that an email is registered. That is accepted for register; rate limiting is a later
  feature.
- The response is built by a mapper, so `passwordHash` can't leak by accident.

## 9. Tests

| Test (describe › it) | What it checks | Covers | Written by |
| --- | --- | --- | --- |
| registerCustomerSchema › accepts a valid body / does not trim the password / every field missing | guards that already pass | Zod shape | Claude |
| registerCustomerSchema › trims fields and keeps the email's case | transforms | Zod rules | Claude |
| registerCustomerSchema › rejects … (email, lengths, names, phone) | each rule in section 6 | Zod rules | Claude |
| AuthService › registerCustomer › creates user, role, profile and refresh token in one transaction | every write gets `tx`, returns customer + tokens | service | Claude |
| AuthService › registerCustomer › stores a hash of the password, never the plain password | hasher used | service | Claude |
| AuthService › registerCustomer › looks the email up by its normalized form | lowercase lookup | service | Claude |
| AuthService › registerCustomer › throws EmailAlreadyExistsError and creates nothing | pre-check | service | Claude |
| AuthService › registerCustomer › throws PhoneNumberInUseError and creates nothing | pre-check | service | Claude |
| AuthService › registerCustomer › fails with a plain (500) error when the Customer role is missing | role lookup | service | Claude |
| AuthService › registerCustomer › does not sign an access token when a write in the transaction fails | work after commit | service | Claude |
| AppError › sets the subclass name, status, code and fields | base class | foundation | Claude |
| errorHandler › AppError, AppError with fields, ZodError, first message per field, unknown error | envelope, status, no leak in 500 | foundation | Claude |
| POST /api/v1/auth/register/customer › 201 with body and a safe cookie | response shape, cookie flags | routes + controller | Claude |
| POST /api/v1/auth/register/customer › 400 for an invalid email / for an empty body | validate + errorHandler | routes | Claude |
| POST /api/v1/auth/register/customer › 409 EMAIL_ALREADY_EXISTS | error mapping | routes | Claude |

Repository tests are skipped: there is no test database (`.env.test`). A Postgres test container in Docker Compose
would make them possible.

## 10. Your part

| Order | Piece | Kind | Stage | What it must do |
| --- | --- | --- | --- | --- |
| 1 | `AppError` (`app-error.ts`) | foundation | guided | base class every app error extends |
| 2 | `errorHandler` (`error-handler.ts`) | foundation | guided | `AppError` / `ZodError` / unknown → envelope |
| 3 | `AuthRepository.findUserByNormalizedEmail` and `findUserByPhoneNumber` | core: find by unique field | guided | return the user row or null; same soft-delete rule in both |
| 4 | `AuthRepository.createUser` | core: create + translate Prisma errors | guided | insert the user; unique violation → 409 errors |
| 5 | `registerCustomerSchema` rules | core: format, length, transforms | guided | the rules in section 6 |
| 6 | `AuthService.registerCustomer` | core: orchestration, uniqueness, transaction, hashing, after commit | guided | the flow in section 7 |

Foundation this feature: **Error classes + errorHandler**, written by you. About 2.5–3 hours in total.

Design rating this round: **Needs work** (3 must-fix gaps). Design stage: `questions`.

## 11. Think before you code

1. The email check and the insert are two separate steps. What can happen between them, and which line of your
   code turns it into a 409?
2. Why is the refresh token hashed with SHA-256 but the password with scrypt? What would break if you used scrypt
   for the refresh token too?
3. If signing the JWT throws after the transaction commits, what is in the database, and what does the client see?
4. A user was soft-deleted (`deleted_at` is set). Someone registers with the same email. What happens, and is that
   what we want?
