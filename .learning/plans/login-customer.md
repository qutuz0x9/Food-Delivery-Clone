# Plan: Login Customer

Notes: `/home/qutuz0x9/MyData/Backend-Developer/CodeBase/04- Projects/Food Delivery Clone/03- Development/Features/02- Login Customer/`
Branch: `feature/login-customer`

## 1. Goal and assumptions

A registered customer logs in with email and password. The response has the same shape as register: the customer and
a JWT access token in the body, and a new refresh token in an `HttpOnly` cookie.

- Only `active` accounts may log in. A soft-deleted account can never log in (`domain-rules.md`, "Accounts").
- Login doesn't touch existing refresh tokens: every login (every device) gets its own row.
- No `audit_log` row (it's for admin actions).
- Login reuses `findUserByNormalizedEmail`, after the soft-delete fix from the Register final review (see §8).

Project: TypeScript (strict, ESM), Express 5, Prisma 8 (`@prisma/orm-postgres` rc.11), Zod 4, Vitest + Supertest.
Mirrors Register Customer (same module, controller, router and token service).
New dependencies: none. `express-rate-limit` is already installed as a dev dependency; it moves to `dependencies`,
because production installs only those (asked at `go`).

## 2. Endpoint contract

- `POST /api/v1/auth/login/customer`, no auth (`security: []`, already in `docs/api/paths/customer.yaml`).
- Request body:

  ```json
  { "email": "John@Example.com", "password": "StrongPassword123!" }
  ```

- Success: `200`, header `Set-Cookie: refreshToken=<raw>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
  (`Secure` only in production).

  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "data": {
      "customer": { "id": "…", "email": "John@Example.com", "firstName": "John", "lastName": "Doe", "phoneNumber": "+201234567890" },
      "accessToken": "eyJ…"
    }
  }
  ```

| Case | Status | Error code / message |
| --- | --- | --- |
| Body fails the schema | 400 | `VALIDATION_ERROR` with `fields` |
| No user with this email, or a deleted one | 401 | `INVALID_CREDENTIALS` / "Invalid email or password" |
| Wrong password | 401 | `INVALID_CREDENTIALS` / "Invalid email or password" (the same answer, on purpose) |
| Right password, `account_status` = `suspended` / `locked` / `inactive` | 403 | `ACCOUNT_SUSPENDED` / `ACCOUNT_LOCKED` / `ACCOUNT_INACTIVE` |
| Right password, but the user has no customer profile (a driver, admin, restaurant) | 403 | `FORBIDDEN` |
| Too many attempts from one IP | 429 | `TOO_MANY_REQUESTS` |
| Anything unexpected | 500 | `INTERNAL_SERVER_ERROR` |

## 3. Request → response flow

1. **Rate limiter** (`routes/customer.routes.ts`): counts attempts per IP; over the limit → 429 before any work.
2. **validate(loginCustomerSchema)**: bad body → `ZodError` → errorHandler → 400.
3. **CustomerAuthController.login**: passes `req.body` and `{ ipAddress }` to the service. HTTP only.
4. **AuthService.loginCustomer**: every rule.
   - lowercases the email → `AuthRepository.findUserByNormalizedEmail` (deleted users are not returned)
   - `PasswordHasher.verify` (runs even when there is no user, see §8) → `InvalidCredentialsError` (401)
   - `accountStatus` not `active` → `AccountNotActiveError` (403)
   - `CustomersService.findProfileByUserId` → `CustomersRepository.findByUserId`; none → `NotACustomerError` (403)
   - `TokenService.createRefreshToken` → `AuthRepository.createRefreshToken` (one write) → `signAccessToken`
5. **Back in the controller**: sets the cookie, answers 200 with the envelope.
6. **errorHandler**: every `AppError` → its status and `{ success: false, message, error: { code } }`.

## 4. Files

| File | Layer | Who writes | Purpose |
| --- | --- | --- | --- |
| `src/common/password-hasher.ts` | common | Claude | add `verify(password, storedHash \| null)`, constant time |
| `src/modules/auth/auth.errors.ts` | errors | Claude | `InvalidCredentialsError`, `AccountNotActiveError`, `NotACustomerError` |
| `src/modules/auth/auth.types.ts` | types | Claude | `LoginCustomerResult` (same shape as register's) |
| `src/modules/auth/auth.validation.ts` | validation | Claude (shape) / **You** (rules) | `loginCustomerSchema` |
| `src/modules/auth/auth.service.ts` | service | **You** | `loginCustomer` |
| `src/modules/customers/customers.repository.ts` | repository | **You** | `findByUserId` |
| `src/modules/customers/customers.service.ts` | service | Claude | `findProfileByUserId` (passes through) |
| `src/modules/auth/controllers/customer.controller.ts` | controller | Claude | `login`; the cookie code shared with `register` |
| `src/modules/auth/routes/customer.routes.ts` | routes | Claude | `POST /login/customer` with the rate limiter and validate |
| `src/middlewares/rate-limit.ts` | middleware | Claude | the login rate limiter, answering in the error envelope |
| `docs/api/paths/customer.yaml`, `responses/common.yaml` | spec | Claude | add the 429 response |
| tests (see §9) | tests | Claude | |

## 5. Data model

No contract change.

- **Read** `identity.users` by `normalized_email` (unique index `users_normalized_email_key`): `id`, `email`,
  `phone_number`, `password_hash`, `account_status`, `deleted_at`.
- **Read** `public.customers` by `user_id` (unique `customers_user_id_key`): one profile or none.
- **Write** one `identity.refresh_tokens` row: `user_id`, `token_hash` (SHA-256 of the raw token, unique),
  `expires_at` (now + `REFRESH_TOKEN_TTL_DAYS`), `ip_address`. `id` and `created_at` come from defaults.
- Email is normalized in the service exactly like register: `input.email.toLowerCase()`.

## 6. Validation rules

| Field | Rules | Where |
| --- | --- | --- |
| `email` | trimmed, valid email, at most 254 characters | Zod |
| `password` | required (at least 1 character), at most 128, **not** trimmed, **no strength rules** | Zod |
| password matches the hash | `PasswordHasher.verify` | service |
| account is `active`, user is a customer | `accountStatus`, customer profile | service |

Strength rules belong to register (and password change) only: login checks the password the user *has*, not the one
the rules want today. The 128 maximum stops a huge password from making scrypt slow on purpose.

## 7. Transaction and error design

- No transaction: there is one write (the refresh token row), and the reads don't need to be consistent with it.
- If saving the token fails, the request ends with a 500, and no cookie is sent. Nothing is half done.
- Sign the access token **after** the refresh token is saved, like register.
- No Prisma error to translate: `token_hash` is 32 random bytes, so a duplicate is practically impossible; if it ever
  happens, the 500 is the right answer.
- The service throws `AppError` subclasses; `errorHandler` turns them into responses.

## 8. Edge cases and security

- **Brute force / credential stuffing** (an attacker tries many passwords, or leaked email+password pairs): rate
  limit per IP → 429.
- **User enumeration** (learning which emails are registered): unknown email and wrong password give the same status,
  code and message. Also the same *time*: `verify` hashes against a dummy hash when there is no user, so a missing
  email isn't answered faster.
- **Order of checks**: password first, then `account_status`, then the customer profile. A 403 is only possible
  with the right password, so it doesn't reveal that an email is registered.
- **Soft-deleted account**: `findUserByNormalizedEmail` must skip rows with `deleted_at` set, so a deleted account
  gets the normal 401. Today its filter is inverted (`isNotNull()` returns *only* deleted users): fix it first (it's
  on the Register final-review list).
- **Another actor's account** (a driver at the customer login): right password but no customer profile → 403
  `FORBIDDEN`.
- **Two logins at the same moment / several devices**: each gets its own random token and row; no conflict.
- **Logs**: never log the body, the password or the token (`logger.ts` redacts `*.password` and `*.token` as a
  safety net).

## 9. Tests

| Test (describe › it) | What it checks | Covers | Written by |
| --- | --- | --- | --- |
| `loginCustomerSchema` › accepts a valid body | happy path, email trimmed | Zod rules | Claude |
| `loginCustomerSchema` › rejects missing / invalid / too-long email | email rules | Zod rules | Claude |
| `loginCustomerSchema` › rejects an empty or too-long password | password rules | Zod rules | Claude |
| `loginCustomerSchema` › accepts a weak password like `password` | no strength rules | Zod rules | Claude |
| `AuthService.loginCustomer` › returns the customer and both tokens | happy path, token saved | service | Claude |
| `AuthService.loginCustomer` › looks the user up by the lowercased email | normalization | service | Claude |
| `AuthService.loginCustomer` › 401 for an unknown email, and still runs verify | enumeration | service | Claude |
| `AuthService.loginCustomer` › 401 for a wrong password, nothing saved | credentials | service | Claude |
| `AuthService.loginCustomer` › 403 for each non-active status, only after the password | account status | service | Claude |
| `AuthService.loginCustomer` › 403 when there is no customer profile | role | service | Claude |
| `PasswordHasher.verify` › true for the right password, false otherwise, false for null | hasher | Claude's code | Claude |
| `POST /auth/login/customer` › 200, envelope, cookie flags | route | controller | Claude |
| `POST /auth/login/customer` › 400 / 401 / 403 envelopes | route | errors | Claude |
| `POST /auth/login/customer` › 429 after too many attempts | route | rate limit | Claude |
| `CustomersRepository.findByUserId` (db) › finds the profile / returns null | real query | repository | Claude |
| `AuthRepository.findUserByNormalizedEmail` (db) › skips a soft-deleted user | real query | the fix in §8 | Claude |

Test writing by you: off (it turns on after 2 done features).

## 10. Your part

| # | Piece | Kind | Stage | What it must do |
| --- | --- | --- | --- | --- |
| 0 | `findUserByNormalizedEmail` filter | fix (Register) | — | skip soft-deleted users (§8); also `findUserByPhoneNumber` |
| 1 | `CustomersRepository.findByUserId` | core: find by unique field | Guided | the profile for this user id, or null |
| 2 | `loginCustomerSchema` rules | core: required and format, length | Guided | the rules in §6 |
| 3 | `AuthService.loginCustomer` | core: orchestration flow, password hashing usage, authorization check | Guided | the flow in §3, the checks in the order of §8 |
| 4 | Error classes + errorHandler | foundation | explain-back | answer 3 questions at review |

Explain-back questions (answer them at `/feature-build review`):

1. `errorHandler` has 4 parameters, and `_next` is never used. Why must it stay?
2. `loginCustomer` throws `AccountNotActiveError`. Follow it: which file turns it into a 403 JSON response, and how
   does that file know the status and the code?
3. For an unknown error, why does the client never see `err.message`, and where does the error and its stack end up?

Design rating for this round: **Needs work** (3 must-fix gaps). Design stage: `questions` (Strong rounds: 0).

## 11. Think before you code

- If the password check and the status check were swapped, what could an attacker learn from a 403?
- A user changes their password on their phone. Should their laptop's refresh token still work? Who decides, and
  when?
- The rate limit counts per IP. What happens to a whole office behind one IP, and what would a per-email limit add?
- Your service gets the profile through `this.customers`, not the customers repository. What would break, later, if
  the auth module read the `customers` table directly?
