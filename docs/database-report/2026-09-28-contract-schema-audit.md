# Contract Schema Audit — 2026-09-28

Scope: the 11 models currently defined in
[`src/prisma/contract.prisma`](../../src/prisma/contract.prisma) — the 10 Identity models under
`namespace identity { ... }` (`User`, `UserClaim`, `UserLogin`, `UserToken`, `Role`, `UserRole`, `RoleClaim`,
`RefreshToken`, `PasswordResetToken`, `AuditLog`) plus the new `Admin` model (`admins`) outside the namespace.
Checked field-by-field against the canonical DDL in
[`docs/dbdesign/Food-Delivery-System-sqldiagram.sql`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql) and
against [`.claude/rules/domain-rules.md`](../../.claude/rules/domain-rules.md). Tables not yet in the contract
(`customers`, `restaurants`, `drivers`, `orders`, and everything under those domains) are out of scope and are
referenced only where needed to explain whether a pattern is schema-wide or specific to `admins`. This is a
read-only review — neither `contract.prisma` nor the DDL file was modified.

This report supersedes
[`docs/database-report/2026-09-28-identity-schema-audit.md`](2026-09-28-identity-schema-audit.md) for the models it
covers; nothing in that report was assumed to still hold — every claim below was re-derived from the current file
contents.

The eight divergences called out as deliberate in the task brief (text-backed `account_status` enum, no
`DEFERRABLE` FKs, `Inet` for the DDL's `inet6`, unbounded `String`/`text` everywhere, `@@id([...])` composite keys,
the asymmetric missing `@default` on five UUID PKs including `admins.id`, `refresh_tokens.replaced_by_token` as an
unconstrained scalar, and `onDelete: Restrict` on every FK) were verified against the contract and the DDL and are
**not** repeated as findings below.

## What was re-verified from the prior report's changelog

- **`user_tokens` primary key** — now `(user_id, login_provider, token_name)` in both files:
  [`contract.prisma:85`](../../src/prisma/contract.prisma#L85) (`@@id([userId, loginProvider, tokenName])`) and
  [`Food-Delivery-System-sqldiagram.sql:173`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L173)
  (`PRIMARY KEY ("user_id", "login_provider", "token_name")`). Matches, and the cross-user collision bug from the
  prior report is resolved.
- **FK indexes** — all 8 previously-missing indexes are present and mirrored in both files: `UserClaim.userId`
  ([`contract.prisma:56`](../../src/prisma/contract.prisma#L56) /
  [`sqldiagram.sql:646`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L646)), `UserLogin.userId`
  ([`:71`](../../src/prisma/contract.prisma#L71) / [`:648`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L648)),
  `UserRole.roleId` ([`:109`](../../src/prisma/contract.prisma#L109) /
  [`:650`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L650)), `RoleClaim.roleId`
  ([`:122`](../../src/prisma/contract.prisma#L122) / [`:652`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L652)),
  `RefreshToken.userId` ([`:140`](../../src/prisma/contract.prisma#L140) /
  [`:654`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L654)), `PasswordResetToken.userId`
  ([`:156`](../../src/prisma/contract.prisma#L156) / [`:656`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L656)),
  `AuditLog.userId` ([`:176`](../../src/prisma/contract.prisma#L176) /
  [`:658`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L658)), and `AuditLog(entityName, entityId)`
  ([`:177`](../../src/prisma/contract.prisma#L177) / [`:660`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L660)).
  `UserToken.userId` correctly has no separate index — it's the leading column of the composite PK fixed above.
- **`account_status`** — confirmed sole platform-wide source of truth for suspension/lock
  ([`contract.prisma:22-28`](../../src/prisma/contract.prisma#L22-L28)). `restaurant_status`
  ([`sqldiagram.sql:38-42`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L38-L42)) now carries only
  `pending`/`approved`/`rejected`, and `driver_status`
  ([`:57-61`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L57-L61)) only `active`/`inactive`/`pending` —
  neither has `suspended` anymore. Both tables are out of scope for this audit (not yet in the contract), so this is
  noted only as confirmation, not a finding.

## Scores

| Dimension | Score | Justification |
| --- | --- | --- |
| Normalization & structure | 9/10 | Same clean entity boundaries as before, plus `Admin` correctly modeled as its own table rather than folded into `users` or `customers`-style profile tables. No redundant/derived data in scope. |
| Data integrity | 7/10 | All previously-checked NOT NULL/UNIQUE/default fidelity still holds, and the `user_tokens` PK defect is fixed. One new gap: `admins.user_id` has no `UNIQUE` constraint (see must-fix below), which is a real integrity risk on a newly in-scope table. |
| Indexing | 9/10 | Every FK column in scope, including the new `admins.user_id`, now has an explicit index. Only a minor, FR-driven gap remains on `AuditLog.createdAt`/`AuditLog.action` (see worth-considering). |
| Naming & consistency | 8/10 | `snake_case` DB / `camelCase` Prisma / `PascalCase` model mapping stays consistent, `admins` included. Minor, pre-existing FK-constraint-naming split (identity tables use a plural table-name prefix, actor-profile tables including `admins` use a singular prefix) — not introduced by this change, noted as a style nit. |
| Domain fit | 7/10 | `Admin` closes a real gap (there was previously no way to identify which `users` row is an administrator) and correctly leaves password/login on `User`. The `user_claims`/`user_logins`/`user_tokens`/`role_claims` FR-backing question from the prior audit is still open, and the missing `admins.user_id` uniqueness is a real domain-fit issue: nothing stops two admin profiles from pointing at one user. |

## Must-fix findings

### 1. `admins.user_id` has no `UNIQUE` constraint, allowing duplicate admin profiles for one user

What's wrong: [`Food-Delivery-System-sqldiagram.sql:241`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L241)
declares `"user_id" uuid NOT NULL` with no `UNIQUE`, and the contract mirrors it exactly at
[`contract.prisma:188`](../../src/prisma/contract.prisma#L188) (`userId Uuid @map("user_id")`, no `@unique`). The
FK itself, [`sqldiagram.sql:690`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L690)
(`admin_user_id_fkey`), only constrains `user_id` to reference an existing `users.id` — it says nothing about
how many `admins` rows may reference the same one.

Why it matters: `FR-ADM-004` ("Manage Administrator Profile") and its children
(`FR-ADM-004.1`/`.2` — view/update profile) assume a single, unambiguous profile per administrator. Without a
uniqueness constraint, nothing at the database layer stops two `admins` rows from being created for the same
`user_id` (e.g., a retried registration call, or a bug in whatever seeds the first admin). A service doing
`Admin.where({ userId }).first()` would then silently pick one of two rows non-deterministically depending on
scan order, and an `UPDATE ... WHERE user_id = ...` intended to change "the" admin's profile would update both.
This is squarely a `NOT NULL`/`UNIQUE`-class integrity gap, not a style nit.

This same shape (`user_id` FK with no `UNIQUE`) also exists on `customers`
([`sqldiagram.sql:251`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L251)), `restaurants`
([`:392`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L392)), and `drivers`
([`:503`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L503)) — those three are out of scope for this
audit since they aren't in the contract yet, so this finding is scoped to `admins` only, but the same fix should
be considered when those tables are added to the contract.

Suggested fix (both files):

```sql
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_key" UNIQUE ("user_id");
```

```prisma
model Admin {
  id              Uuid                @id
  userId          Uuid                @unique @map("user_id")
  firstName       String              @map("first_name")
  lastName        String              @map("last_name")
  profileImageUrl String?             @map("profile_image_url")
  createdAt       TimestampString(6)  @default(now()) @map("created_at")
  updatedAt       TimestampString(6)? @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@map("admins")
}
```

Note: once `userId` is `@unique`, the separate `@@index([userId])` at
[`contract.prisma:197`](../../src/prisma/contract.prisma#L197) becomes redundant — a unique constraint already
creates its own index in Postgres — so it should be dropped, not kept alongside, along with the matching
`CREATE INDEX ON "admins" ("user_id");` at
[`sqldiagram.sql:662`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L662).

## Worth considering

- **`AuditLog` has no index supporting date-range or action filters.** `FR-ADM-018.2` ("Filter Activity Logs")
  explicitly says "filter activity logs by date, user, or action," but only `userId`
  ([`contract.prisma:176`](../../src/prisma/contract.prisma#L176)) and `(entityName, entityId)`
  ([`:177`](../../src/prisma/contract.prisma#L177)) are indexed — `createdAt` and `action`
  ([`:163`, `:172`](../../src/prisma/contract.prisma#L163)) have no index. This is a real gap against a named FR,
  but table volume and the exact admin-UI query shape (single-column vs. composite, range vs. equality) aren't
  known yet, so a specific index recommendation would be a guess. Worth an index on `createdAt` at minimum once
  the admin activity-log screen is built.
- **FK constraint naming is inconsistent between the Identity tables and the actor-profile tables, `admins`
  included.** Identity-table FK constraints use a plural table-name prefix (e.g. `user_claims_user_id_fkey` at
  [`sqldiagram.sql:672`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L672)), while `admins` uses a
  singular prefix (`admin_user_id_fkey` at
  [`:690`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L690)), matching its siblings
  `customer_user_id_fkey` ([`:692`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L692)) and
  `driver_user_id_fkey` ([`:750`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L750)). This split
  predates `admins` and is cosmetic — Postgres doesn't care — but it's worth a pass if the constraint names ever
  become part of tooling (e.g., migration-diffing scripts that parse names).
- **`user_claims` / `user_logins` / `user_tokens` / `role_claims` still have no FR backing.** Re-checked the full
  `Functional-Requirements.md` again this session: no Customer, Restaurant, Driver, or Administrator requirement
  mentions external/OAuth logins, claims-based authorization, or per-role claims. This was flagged in the prior
  audit and remains unresolved — not proposing removal unilaterally, but flagging again since these four tables
  are still carrying real schema weight (and now three of them have indexes maintained against them) with no
  confirmed consumer.

## FR and business-rule cross-check

| Schema piece | Backing | Note |
| --- | --- | --- |
| `admins.first_name`/`last_name`/`profile_image_url` | `FR-ADM-004.1`/`.2` (view/update admin profile) | Satisfied — mirrors the shape used for other actor profiles. |
| Admin password/login | `FR-ADM-001` (log in), `FR-ADM-004.3` (change password) | Correctly *not* duplicated on `Admin` — both live on `User.passwordHash`/`User.email`, consistent with the file's header comment at [`contract.prisma:1-17`](../../src/prisma/contract.prisma#L1-L17). |
| `admins.user_id` uniqueness | `FR-ADM-004` (a single, unambiguous profile per administrator) | **Gap** — see must-fix finding 1. |
| `audit_log` | `FR-ADM-010.2` (record admin order-status changes), `FR-ADM-018` (view/search/filter activity logs) | Table shape satisfies `FR-ADM-018.1`/`.3` (search, view details) and the `userId` filter of `.2`; the `createdAt`/`action` filter half of `.2` has no supporting index yet — see worth-considering. |
| `users.account_status` | `FR-ADM-005.4`/`.5` (activate/deactivate customers) | Confirmed still the sole source of truth; out-of-scope tables (`restaurant_status`, `driver_status`) were updated to stop overlapping with it, verified above. |
| `password_reset_tokens` | `FR-CUS-005.1`/`.2`, `FR-RES-004.1`/`.2`, `FR-DRV-004.1`/`.2`, `FR-ADM-003.1`/`.2` | Unchanged from the prior audit — satisfied, modulo the reuse-prevention note (no schema constraint stops re-use of an already-`used_at` token; inherently an app-layer check). |
| `user_claims`, `user_logins`, `user_tokens`, `role_claims` | **None found** | Re-confirmed absent from all four FR sections — see worth-considering. |

## Overall rating: 6/10

This is "workable but has a must-fix finding that should be resolved before implementation leans on this table" —
the missing `UNIQUE` on `admins.user_id` is the only integrity gap found, but it is a real one for the specific
table it targets in this scope. Everything carried over from the prior audit checked out: the `user_tokens`
primary-key fix and all eight FK indexes are correctly in place and mirrored between `contract.prisma` and the
canonical DDL, and the `account_status`/`restaurant_status`/`driver_status` suspension-overlap resolution landed
as described. `Admin`'s field-for-field shape (types, nullability, defaults, FK, index) matches the DDL exactly,
and its cross-namespace relation to `identity.User` is structurally sound — Prisma 8 namespaces only affect
physical table placement, not name resolution, and this pattern is the right one to reuse when `customers`,
`restaurants`, and `drivers` are eventually added outside the `identity` namespace as `Admin`'s siblings. Fixing
the one must-fix below would move this to a 7-8.

Priority order to fix:

1. Add `UNIQUE ("user_id")` to `admins` in both the DDL and the contract, and drop the now-redundant plain index
   on the same column (must-fix finding 1).
2. Add an index on `AuditLog.createdAt` (and consider `action`) once the admin activity-log screen's actual query
   shape is known — tracked against `FR-ADM-018.2` (worth-considering).
3. Confirm with the user whether `user_claims`/`user_logins`/`user_tokens`/`role_claims` back a real, planned
   requirement (OAuth login, claims-based authz) before building services against them — still open from the
   prior audit.
4. Optional cleanup: align `admin_user_id_fkey`-style naming with either the identity-table or actor-table
   convention, once the actor-profile tables (`customers`, `restaurants`, `drivers`) are added to the contract and
   the naming split can be resolved in one pass instead of piecemeal.
