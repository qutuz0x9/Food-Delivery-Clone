# Identity Schema Audit — 2026-09-28

Scope: the 10 Identity models in
[`src/prisma/contract.prisma`](../../src/prisma/contract.prisma) (`User`, `UserClaim`, `UserLogin`, `UserToken`,
`Role`, `UserRole`, `RoleClaim`, `RefreshToken`, `PasswordResetToken`, `AuditLog`), checked field-by-field against
the canonical DDL in
[`docs/dbdesign/Food-Delivery-System-sqldiagram.sql`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql) and
against the business rules in `.claude/rules/domain-rules.md`. No other tables were reviewed. This is a read-only
review — neither file was modified.

The seven divergences called out as deliberate in the task brief (text-backed `account_status` enum, no
`DEFERRABLE` FKs, `Inet` for the DDL's `inet6`, unbounded `String`/`text` everywhere, `@@id([...])` composite
keys, the asymmetric missing `@default` on four UUID PKs, and `refresh_tokens.replaced_by_token` as an
unconstrained scalar) were verified against the contract and the DDL and are **not** repeated as findings below.

## Scores

| Dimension | Score | Justification |
| --- | --- | --- |
| Normalization & structure | 9/10 | Clean entity boundaries; claims/logins/tokens/roles are correctly split into their own tables rather than folded into `users`. Only deduction is the structural PK defect in `user_tokens` (see must-fix). |
| Data integrity | 6/10 | NOT NULL/UNIQUE/default fidelity against the DDL is exact everywhere checked, but the `user_tokens` composite primary key omits `user_id`, which is a real cross-tenant collision risk, not a style nit. |
| Indexing | 4/10 | Every foreign key column across all 10 models except the leading column of a composite PK is unindexed. In an FK-heavy, session/token-lookup-heavy schema like Identity, this is a systemic gap, not an isolated miss. |
| Naming & consistency | 9/10 | `snake_case` DB / `camelCase` Prisma / `PascalCase` model mapping is applied consistently via `@map`/`@@map`; `_id`/`_at` suffixes are consistent; no drift between contract and DDL names anywhere in scope. |
| Domain fit | 6/10 | Password-reset and refresh-token separation, and an admin audit log, match how a real auth system is modeled. But the `user_tokens` PK bug, the un-indexed "revoke all sessions for user" query path, and four tables with no requirements backing pull this down. |

## Must-fix findings

### 1. `user_tokens` primary key omits `user_id`, allowing cross-user collisions

What's wrong:
[`Food-Delivery-System-sqldiagram.sql:175`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L175) declares
`PRIMARY KEY ("login_provider", "token_name")`, and the contract mirrors it exactly at
[`contract.prisma:76`](../../src/prisma/contract.prisma#L76) with `@@id([loginProvider, tokenName])`.

Why it matters: the key has no `user_id` component, so only **one user in the entire system** can ever hold a
token for a given `(login_provider, token_name)` pair at the same time — e.g. every user's TOTP secret under
provider `"Default"` named `"AuthenticatorKey"` would collide on the same row. The comparable `user_logins` table
is fine because its real-world semantics (`login_provider` + external `value`) are supposed to be globally unique
per external identity — but `user_tokens` stores a *named secret per user*, which needs `user_id` in the key.

Suggested fix (both files, since they must stay in lockstep):

```sql
ALTER TABLE "user_tokens" DROP CONSTRAINT IF EXISTS "user_tokens_pkey";
ALTER TABLE "user_tokens" ADD PRIMARY KEY ("user_id", "login_provider", "token_name");
```

```prisma
model UserToken {
  userId        Uuid                @map("user_id")
  loginProvider String              @map("login_provider")
  tokenName     String              @map("token_name")
  value         String
  expiresAt     TimestampString(6)? @map("expires_at")
  createdAt     TimestampString(6)  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@id([userId, loginProvider, tokenName])
  @@map("user_tokens")
}
```

This is a defect in the canonical DDL itself (not something the contract introduced) — flagging it as a
DDL-vs-contract note per the review brief, not silently patching either file.

### 2. Foreign key columns have no index anywhere in the Identity slice

What's wrong: Postgres only auto-indexes the referenced (PK) side of a foreign key, never the referencing side,
and none of the following FK columns have an explicit `@@index` (or are covered by a leading PK/unique column):

- `UserClaim.userId` — [`contract.prisma:42`](../../src/prisma/contract.prisma#L42), FK at
  [`Food-Delivery-System-sqldiagram.sql:646`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L646).
- `UserLogin.userId` — [`contract.prisma:53`](../../src/prisma/contract.prisma#L53), FK at
  [`Food-Delivery-System-sqldiagram.sql:648`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L648).
- `UserToken.userId` — [`contract.prisma:67`](../../src/prisma/contract.prisma#L67), FK at
  [`Food-Delivery-System-sqldiagram.sql:650`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L650).
- `UserRole.roleId` — [`contract.prisma:94`](../../src/prisma/contract.prisma#L94) (only the leading
  `userId` column of `@@id([userId, roleId])` at line 99 is indexed; `roleId` alone is not), FK at
  [`Food-Delivery-System-sqldiagram.sql:654`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L654).
- `RoleClaim.roleId` — [`contract.prisma:105`](../../src/prisma/contract.prisma#L105), FK at
  [`Food-Delivery-System-sqldiagram.sql:656`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L656).
- `RefreshToken.userId` — [`contract.prisma:117`](../../src/prisma/contract.prisma#L117), FK at
  [`Food-Delivery-System-sqldiagram.sql:658`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L658).
- `PasswordResetToken.userId` — [`contract.prisma:134`](../../src/prisma/contract.prisma#L134), FK at
  [`Food-Delivery-System-sqldiagram.sql:660`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L660).
- `AuditLog.userId` — [`contract.prisma:149`](../../src/prisma/contract.prisma#L149), FK at
  [`Food-Delivery-System-sqldiagram.sql:662`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L662).

Why it matters: this is an authentication-critical schema. "Log the user out everywhere" (revoke all
`refresh_tokens` for a user), "list a user's claims/roles", "show a user's audit trail" (an admin-facing feature
implied by the `audit_log` requirement in `.claude/rules/coding-conventions.md`), and "find all users holding a
given role" (`RoleClaim`/`UserRole` reverse lookup) all filter by these exact columns. Without an index, every one
of those becomes a sequential scan of the whole table as data grows.

Suggested fix, one `@@index` per model:

```prisma
model UserClaim {
  // ...fields unchanged...
  @@index([userId])
  @@map("user_claims")
}

model UserLogin {
  // ...fields unchanged...
  @@id([loginProvider, value])
  @@index([userId])
  @@map("user_logins")
}

model UserToken {
  // ...fields unchanged, plus the user_id PK fix from finding 1...
  @@id([userId, loginProvider, tokenName])
  @@map("user_tokens")
}

model UserRole {
  // ...fields unchanged...
  @@id([userId, roleId])
  @@index([roleId])
  @@map("user_roles")
}

model RoleClaim {
  // ...fields unchanged...
  @@index([roleId])
  @@map("role_claims")
}

model RefreshToken {
  // ...fields unchanged...
  @@index([userId])
  @@map("refresh_tokens")
}

model PasswordResetToken {
  // ...fields unchanged...
  @@index([userId])
  @@map("password_reset_tokens")
}

model AuditLog {
  // ...fields unchanged...
  @@index([userId])
  @@map("audit_log")
}
```

(Note: once finding 1's PK fix lands, `UserToken` no longer needs a separate `userId` index — the new composite
PK already covers it as the leading column.)

## Worth considering

- **Resolved:** `account_status.suspended` overlapped in name with `restaurant_status.suspended` /
  `driver_status.suspended` at the actor-profile level. Decision: `users.account_status` is the single,
  platform-wide source of truth for suspension/lock — `restaurant_status` and `driver_status` will keep only
  their business-approval-workflow values (`pending`/`approved`/`rejected` for restaurants,
  `pending`/`active`/`inactive` for drivers) and drop `suspended` when those tables are built. Suspending a
  restaurant or driver means suspending the owning `users` row via `account_status`, not a second parallel flag.
  Tracked for follow-through when the restaurant/driver schema is authored (not yet built as of this audit).
- **Resolved:** `AuditLog.entityName`/`entityId` had no FK (correct — it's a polymorphic reference) and no
  `@@index([entityName, entityId])`, which an admin "show history for this order/this restaurant" screen would
  need. Added `@@index([entityName, entityId])` to the contract and a matching `CREATE INDEX ON "audit_log"
  ("entity_name", "entity_id")` to the DDL.
- **Deferred:** no index on `RefreshToken.expiresAt` / `PasswordResetToken.expiresAt`. These are natural
  candidates for a periodic "purge expired tokens" job, but no such job exists yet, and the ideal index shape
  (plain vs. a partial index scoped to non-revoked tokens) depends on how that job ends up querying. Revisit when
  the cleanup job is actually designed.
- **Nothing in the schema stops a `password_reset_tokens` row from being reused after `used_at` is set.**
  ([`contract.prisma:137`](../../src/prisma/contract.prisma#L137)). This is inherently an application-layer check
  ("was `used_at` already non-null before I accept this token"), since a DB constraint can't prevent a legal
  `UPDATE`, but it's worth stating explicitly as a requirement on whichever service implements `FR-CUS-005.2` /
  `FR-RES-004.2` / `FR-DRV-004.2` / `FR-ADM-003.2`, since nothing in the schema documents the rule.

## FR and business-rule cross-check

| Schema piece | Backing | Note |
| --- | --- | --- |
| `users.email` unique / `password_hash` | `FR-CUS-002.3` (unique email) | Enforced via `@unique` at both `email` and `normalized_email` — satisfied. |
| `password_reset_tokens` | `FR-CUS-005.1/.2`, `FR-RES-004.1/.2`, `FR-DRV-004.1/.2`, `FR-ADM-003.1/.2` | Table shape (hash, expiry, `used_at`, IP, device) supports "request reset" + "verify identity" — satisfied, modulo the reuse-prevention note above. |
| `users.account_status` | `FR-ADM-005.4/.5`, `006.5/.6`, `007.5/.6` (activate/deactivate) | Satisfied per `.claude/rules/domain-rules.md`'s explicit mapping. |
| `audit_log` | `FR-ADM-010.2` (record admin order-status changes) + the general audit rule in `.claude/rules/coding-conventions.md` | Table shape (`action`, `entity_name`/`entity_id`, `old_value`/`new_value`, actor `user_id`) supports it — satisfied. |
| `refresh_tokens` | No explicit FR, but implied by "Protect routes with JWT auth middleware" (`.claude/rules/coding-conventions.md`) | Reasonable infrastructure table for session/JWT refresh; not a concern. |
| `user_claims`, `user_logins`, `user_tokens`, `role_claims` | **None found** | Neither `Functional-Requirements.md` nor `domain-rules.md` mentions external/OAuth logins, claims-based authorization, or per-role claims anywhere in the Customer/Restaurant/Driver/Admin sections. These four tables read as ASP.NET-Identity-style boilerplate carried into the DDL rather than something an FR asked for. Not proposing removal unilaterally — flagging so the user can confirm whether OAuth/claims-based auth is actually planned, or whether these are dead weight worth dropping before more code is built against them. |
| Driver rejection (`driver_status` has no `rejected` value) | Known gap per `CLAUDE.md` | Out of scope for Identity (lives on `drivers`, not reviewed here) — noted only to confirm it wasn't conflated with `account_status`, which is a separate enum. |

## Overall rating: 5/10

This lands squarely in "workable but has must-fix findings that should be resolved before implementation leans on
this table." Field-level fidelity between the contract and the canonical DDL is excellent — every nullability,
default, and uniqueness constraint checked matched exactly, and the seven pre-agreed platform-limitation
divergences are all handled correctly. What holds this back from a 7+ is one genuine data-integrity defect (the
`user_tokens` primary key) and a schema-wide indexing gap that will bite the moment auth/session code starts
querying these tables at any real scale. Neither is hard to fix, and neither requires touching the deliberate
divergences list.

Priority order to fix:

1. **Fixed** — `user_id` added to the `user_tokens` primary key, in both the DDL and the contract.
2. **Fixed** — added `@@index([...])` (and matching DDL `CREATE INDEX`) on the 7 remaining FK columns listed in
   must-fix finding 2 (`UserToken.userId` needed no separate index once fix 1 landed, since it's the leading
   column of the new composite PK).
3. Confirm with the user whether `user_claims` / `user_logins` / `user_tokens` / `role_claims` back a real,
   planned requirement (OAuth login, claims-based authz) before building services against them.
4. **Resolved** — `account_status` is the single source of truth for suspension; drop `suspended` from
   `restaurant_status`/`driver_status` when those tables are authored (see "Worth considering" above).
5. **Fixed** — `audit_log(entity_name, entity_id)` index added. **Deferred** — `*.expires_at` indexing stays
   open until a token-cleanup job is actually being built (see "Worth considering" above).
