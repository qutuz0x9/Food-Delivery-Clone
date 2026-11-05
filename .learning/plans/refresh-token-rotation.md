# Plan: Refresh Token Rotation

Notes: `/home/qutuz0x9/MyData/Backend-Developer/CodeBase/04- Projects/Food Delivery Clone/03- Development/Features/05- Refresh Token Rotation/`
Branch: `feature/refresh-token-rotation`

## 1. Goal and assumptions

A customer whose access token expired trades the `refreshToken` cookie for a new access token and a new refresh
token. The old token is revoked (rotation). A token that comes back after it was revoked revokes the whole chain it
belongs to (reuse detection), as `domain-rules.md` ("Accounts") and the spec require.

- The chain is followed through `replaced_by_token` (the contract has no session id column).
- The new token gets a full new TTL (`REFRESH_TOKEN_TTL_DAYS`, a sliding window), from `TokenService.createRefreshToken`.
- Two refreshes with the same token at the same moment: one wins, the other counts as reuse (no grace period).
- `device_id` stays null; nothing in the request identifies a device.
- Logout is the next feature; it reuses the revoke pieces built here.

Project: TypeScript (strict, ESM), Express 5, Prisma 8 (`@prisma/orm-postgres` rc.11), Zod 4, Vitest + Supertest.
Mirrors Login Customer (same module, controller, router, token service and error classes).
New dependencies: `@types/cookie-parser` (dev). `cookie-parser` is already a dev dependency; it moves to
`dependencies`, because production installs only those and the app now uses it at runtime (asked at `go`).

## 2. Endpoint contract

- `POST /api/v1/auth/refresh/customer`, no access token (`security: []`, already in `docs/api/paths/customer.yaml`).
- Request: no body. Cookie `refreshToken=<raw token>` (sent by the browser; `Path=/api/v1/auth`).
- Success: `200`, header `Set-Cookie: refreshToken=<new raw>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
  (`Secure` only in production), same flags as login.

  ```json
  {
    "success": true,
    "message": "Access token refreshed successfully",
    "data": { "accessToken": "eyJ…" }
  }
  ```

| Case | Status | Error code / message |
| --- | --- | --- |
| No `refreshToken` cookie, or an empty one | 401 | `INVALID_REFRESH_TOKEN` / "Refresh token is required" |
| No row with this token's hash | 401 | `INVALID_REFRESH_TOKEN` / "Your session has expired. Please log in again" |
| Row revoked (rotated, logged out, or reuse) → the chain is revoked first | 401 | same as above |
| Row expired (`expires_at` ≤ now) | 401 | same as above |
| The token's user is missing or soft-deleted | 401 | same as above |
| The conditional revoke changed 0 rows (lost a race) → the chain is revoked | 401 | same as above |
| `account_status` is `inactive` / `locked` / `suspended` | 403 | `ACCOUNT_INACTIVE` / `ACCOUNT_LOCKED` / `ACCOUNT_SUSPENDED` |
| The user has no customer profile (a driver, admin, restaurant token) | 403 | `FORBIDDEN` |
| Anything unexpected | 500 | `INTERNAL_SERVER_ERROR` |

## 3. Request → response flow

1. **cookie-parser** (`src/app.ts`): fills `req.cookies` from the `Cookie` header. Express 5 doesn't parse cookies.
2. **Router** (`routes/customer.routes.ts`): `POST /refresh/customer` → controller. No `validate`: there is no body,
   and a missing cookie must be 401, not Zod's 400.
3. **CustomerAuthController.refresh**: reads `req.cookies.refreshToken` (maybe `undefined`) and `req.ip`, calls the
   service. HTTP only.
4. **AuthService.refreshCustomer**: every rule, in this order (all checks before any write):
   - no token → `InvalidRefreshTokenError("missing")` (401)
   - `TokenService.hashRefreshToken` → `AuthRepository.findRefreshTokenByHash`; null → `InvalidRefreshTokenError` (401)
   - `revokedAt` set → `AuthRepository.revokeTokenChain(row.id, "reuse_detected")` → `InvalidRefreshTokenError` (401)
   - `expiresAt` passed → `InvalidRefreshTokenError` (401)
   - `AuthRepository.findUserById(row.userId)` (not deleted); null → `InvalidRefreshTokenError` (401)
   - status not `active` → `AccountNotActiveError` (403); `CustomersService.findProfileByUserId` null →
     `NotACustomerError` (403)
   - `TokenService.createRefreshToken()` (new id, token, hash, expiry)
   - **transaction:** `revokeRefreshTokenIfActive(old.id, { reason: "rotated", replacedBy: new.id }, tx)`; `false` →
     return without inserting. Otherwise `createRefreshToken(new row, tx)`.
   - after the commit: lost the race → `revokeTokenChain(old.id, "reuse_detected")` → `InvalidRefreshTokenError` (401)
   - `TokenService.signAccessToken({ userId, role: Customer })`; return the access token and the new refresh token
5. **Back in the controller**: sets the cookie (the same private helper as login), answers 200 with the envelope.
6. **errorHandler**: every `AppError` → its status and `{ success: false, message, error: { code } }`; others → 500.

## 4. Files

| File | Layer | Who writes | Purpose |
| --- | --- | --- | --- |
| `package.json` | config | Claude | `cookie-parser` → `dependencies`; `@types/cookie-parser` dev dependency |
| `src/app.ts` | app | Claude | `app.use(cookieParser())` before the routes |
| `src/modules/auth/token.service.ts` | service | Claude | `createRefreshToken` also returns an `id`; public `hashRefreshToken(token)` |
| `src/modules/auth/auth.types.ts` | types | Claude | `IssuedRefreshToken.id`, `REVOKED_REASONS`, `RefreshCustomerResult` |
| `src/modules/auth/auth.errors.ts` | errors | Claude | `InvalidRefreshTokenError` (two messages, one code) |
| `src/modules/auth/auth.repository.ts` | repository | Claude / **You** | `RefreshTokenRow`; `createRefreshToken` takes the `id`; Claude: `findUserById`, `revokeTokenChain`; **You:** `findRefreshTokenByHash`, `revokeRefreshTokenIfActive` |
| `src/modules/auth/auth.service.ts` | service | **You** | `refreshCustomer` |
| `src/modules/auth/controllers/customer.controller.ts` | controller | Claude | `refresh` |
| `src/modules/auth/routes/customer.routes.ts` | routes | Claude | `POST /refresh/customer` |
| `src/modules/auth/__tests__/auth.service.test.ts` | test | Claude / **You** | the `refreshCustomer` cases; **You:** the reuse case |
| `src/modules/auth/__tests__/customer.routes.test.ts` | test | Claude | the refresh route |
| `src/modules/auth/__tests__/auth.repository.db.test.ts` | test | Claude | the four new repository methods |
| `docs/api/paths/customer.yaml` | spec | Claude | only if the implementation differs (checked at the end) |

## 5. Data model

No contract change and no migration. `identity.refresh_tokens` already has everything:

- **Old row (update):** `revoked_at = now`, `revoked_reason = 'rotated'`, `replaced_by_token = <new id>`, only
  `WHERE id = <old id> AND revoked_at IS NULL`.
- **New row (insert):** `id` (from `TokenService`), `user_id` (from the old row), `token_hash`, `expires_at`,
  `ip_address` (from the request). `revoked_*`, `replaced_by_token` and `device_id` stay null.
- **Chain (update on reuse):** every row reached from the reused row through `replaced_by_token`, still active →
  `revoked_at = now`, `revoked_reason = 'reuse_detected'`.
- Reasons live in one constant, `REVOKED_REASONS` (`rotated`, `reuse_detected`, later `logout`), because the column is
  free text.
- Lookups: `token_hash` (unique index), `users.id` (PK), `customers.user_id` (unique), the chain by `id` (PK).

## 6. Validation rules

| Field | Rules | Where |
| --- | --- | --- |
| `refreshToken` cookie | present and not empty, otherwise 401 `INVALID_REFRESH_TOKEN` ("Refresh token is required") | service (`refreshCustomer`, first step) |
| token row | found by hash; not revoked (reuse → revoke the chain); not expired; checked in that order | service |
| user | found and not deleted (401); `active` (403); has a customer profile (403); in that order | service |

No Zod schema: there is no body, and every failure here is a 401 or 403, never a 400.

## 7. Transaction and error design

- **Inside one interactive transaction:** the conditional revoke of the old row, then the insert of the new row.
  The revoke reports whether it changed a row; if not, the callback returns without inserting.
- **Before it:** every read and check, and making the new token (`createRefreshToken`).
- **After it:** if the revoke changed 0 rows, revoke the chain (committed on its own, so it sticks even though this
  request fails) and throw `InvalidRefreshTokenError`. Otherwise sign the access token.
- **On failure:** an error inside the callback rolls both writes back; the old token still works and the client can
  retry.
- **Prisma errors:** none to translate. `token_hash` is 32 random bytes, so a duplicate hash never happens in practice;
  if it ever did, it would be a 500, which is right for "impossible".

## 8. Edge cases and security

- **Same token, two requests at once:** the row lock plus `revoked_at IS NULL` lets only one rotate it; the other is
  reuse → chain revoked → both logged out. Accepted (no grace period).
- **Stolen token:** whoever uses it second triggers reuse detection, so the theft ends at the next refresh.
- **Replay of an old, expired, rotated token:** the revoked check runs before the expiry check, so it still revokes
  the chain.
- **Deleted, inactive or non-customer account:** 401 / 403 / 403, before any write.
- **The token is never logged** and never sent in the body; only the cookie carries it.
- **No rate limit:** the token can't be guessed.

## 9. Tests

| Test (describe › it) | What it checks | Covers | Written by |
| --- | --- | --- | --- |
| `AuthService.refreshCustomer › throws InvalidRefreshTokenError when no token is sent` | the "missing" message, no lookup | service | Claude |
| `… › throws InvalidRefreshTokenError when no row has the token's hash` | 401, no writes | service | Claude |
| `… › revokes the chain and throws InvalidRefreshTokenError when the token was already revoked` | reuse detection | service | **You** |
| `… › throws InvalidRefreshTokenError when the token has expired` | expiry, no writes | service | Claude |
| `… › throws InvalidRefreshTokenError when the user is deleted or missing` | 401 | service | Claude |
| `… › throws AccountNotActiveError when the account is not active` | 403, no writes | service | Claude |
| `… › throws NotACustomerError when the user has no customer profile` | 403, no writes | service | Claude |
| `… › revokes the old token and saves the new one inside one transaction` | both writes get the `tx`, the right values | service | Claude |
| `… › revokes the chain when another request rotated the token first` | revoke returned false → no insert, chain revoked, 401 | service | Claude |
| `… › returns a new access token and refresh token` | the result | service | Claude |
| `POST /refresh/customer › 401 when the cookie is missing` | real errorHandler, the message | route | Claude |
| `… › 200, the access token in the body and a new refreshToken cookie` | `Set-Cookie` flags and path | route | Claude |
| `… › passes the cookie value and the ip to the service` | wiring | route | Claude |
| `AuthRepository.findRefreshTokenByHash › found / not found` | the row or null | db | Claude |
| `AuthRepository.revokeRefreshTokenIfActive › true and the row updated / false when already revoked` | the conditional update | db | Claude |
| `AuthRepository.revokeTokenChain › revokes every active row after the given one, and no other user's rows` | the chain | db | Claude |
| `AuthRepository.findUserById › found / deleted / missing` | soft delete rule | db | Claude |

## 10. Your part

| # | Piece | Kind | Stage | What it must do |
| --- | --- | --- | --- | --- |
| 1 | `AuthRepository.findRefreshTokenByHash` | core (find by unique field) | Unguided | return the row with this `token_hash`, or null |
| 2 | `AuthRepository.revokeRefreshTokenIfActive` | core (create, update, delete) | Guided | revoke the row only if `revoked_at` is still null; return whether a row changed |
| 3 | `AuthService.refreshCustomer` | core (orchestration, multi-write transaction, authorization check) | Guided | the flow in §3, step 4 |
| 4 | the reuse test in `auth.service.test.ts` | test (unit test with fakes) | Guided | a revoked row → the chain is revoked, it rejects with `InvalidRefreshTokenError`, nothing is inserted |

**Foundation (explain-back):** Error classes + errorHandler. Read `src/middlewares/error-handler.ts` and
`src/common/errors/`, then answer at review:

1. `refreshCustomer` is `async` and throws `InvalidRefreshTokenError`. Nothing in the controller catches it. How does
   it reach the errorHandler in Express 5? What did Express 4 need instead?
2. Why does `InvalidRefreshTokenError` extend `UnauthorizedError` instead of `Error`? Follow one thrown error to the
   JSON the client gets.
3. How does Express know that `errorHandler` is an error handler and not a normal middleware? Why must it be
   registered **after** the routes?

Design rating for this round: **Needs work**. Design stage: `questions` (Strong rounds: 1).

## 11. Think before you code

- The conditional update tells you how many rows it changed. What should the service do with `0`, and why must
  revoking the chain happen **outside** the transaction?
- `revoked_at` and `expires_at` arrive as strings (`TimestampString`). How do you compare `expires_at` with "now"
  without comparing two strings?
- The controller passes the cookie value, which can be `undefined`. Where is the first place it becomes a `string`,
  and what makes TypeScript sure of it?
- If the conditional update runs first and the insert fails, what does the client hold, and does its next refresh
  work?
