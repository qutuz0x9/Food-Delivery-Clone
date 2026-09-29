# Contract Schema Audit v2 (Follow-Up) — 2026-09-28

Scope: the same 11 models as the prior audit, currently defined in
[`src/prisma/contract.prisma`](../../src/prisma/contract.prisma) — the 10 Identity models under
`namespace identity { ... }` (`User`, `UserClaim`, `UserLogin`, `UserToken`, `Role`, `UserRole`, `RoleClaim`,
`RefreshToken`, `PasswordResetToken`, `AuditLog`) plus the `Admin` model (`admins`) outside the namespace. Checked
field-by-field against the canonical DDL in
[`docs/dbdesign/Food-Delivery-System-sqldiagram.sql`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql) and
against [`.claude/rules/domain-rules.md`](../../.claude/rules/domain-rules.md). Tables not yet in the contract
(`customers`, `restaurants`, `drivers`, `orders`, and everything under those domains) remain out of scope. This is
a read-only, follow-up verification pass on top of
[`docs/database-report/2026-09-28-contract-schema-audit.md`](2026-09-28-contract-schema-audit.md) — nothing from
that report was assumed to still hold; every claim below was re-derived from the current file contents. Neither
`contract.prisma` nor the DDL file was modified during this review.

The nine divergences confirmed as deliberate (text-backed `account_status` enum, no `DEFERRABLE` FKs, `Inet` for
the DDL's `inet6`, unbounded `String`/`text` everywhere, `@@id([...])` composite keys, the asymmetric missing
`@default` on five UUID PKs including `admins.id`, `refresh_tokens.replaced_by_token` as an unconstrained scalar,
`onDelete: Restrict` on every FK, and `account_status` as the sole platform-wide suspension/lock source of truth)
were re-verified against the contract and the DDL and are **not** repeated as findings below.

## What was re-verified from the prior report's fix list

- **`admins.user_id` uniqueness** — the DDL now declares `"user_id" uuid UNIQUE NOT NULL` at
  [`Food-Delivery-System-sqldiagram.sql:241`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L241), and
  the contract mirrors it with `@unique` at
  [`contract.prisma:189`](../../src/prisma/contract.prisma#L189) (`userId Uuid @unique @map("user_id")`). The FK
  itself is unchanged at
  [`sqldiagram.sql:690`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L690)
  (`admin_user_id_fkey`). Fix landed correctly in both files.
- **Redundant plain index on `admins.user_id` removed** — the contract's `Admin` model
  ([`contract.prisma:187-199`](../../src/prisma/contract.prisma#L187-L199)) has no `@@index([userId])` left, and
  the DDL's index block (checked in full,
  [`sqldiagram.sql:645-662`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L645-L662)) has no
  `CREATE INDEX ON "admins" ("user_id")` line anywhere in the file. A `UNIQUE` constraint already creates its own
  index in Postgres, so this removal is correct, not a loss of coverage. Removed cleanly from both files, no
  orphaned index left behind.
- **`audit_log.created_at` index** — present in both files:
  [`contract.prisma:178`](../../src/prisma/contract.prisma#L178) (`@@index([createdAt])`) and
  [`sqldiagram.sql:662`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L662)
  (`CREATE INDEX ON "audit_log" ("created_at");`). Matches, and sits correctly alongside the pre-existing
  `AuditLog.userId` index ([`contract.prisma:176`](../../src/prisma/contract.prisma#L176) /
  [`sqldiagram.sql:658`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L658)) and the
  `(entityName, entityId)` composite index
  ([`contract.prisma:177`](../../src/prisma/contract.prisma#L177) /
  [`sqldiagram.sql:660`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L660)) — no duplication, no
  malformed lines in the surrounding index block.
- **No regressions in the surrounding DDL** — read the full index block
  ([`sqldiagram.sql:636-663`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L636-L663)), the `admins`
  table definition ([`sqldiagram.sql:239-247`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L239-L247)),
  and the full identity-table block
  ([`sqldiagram.sql:134-237`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L134-L237)) line by line
  against the contract's matching models. No dropped columns, no duplicated `CREATE INDEX`/`CREATE TABLE`
  statements, no stray blank-line or semicolon damage near either edit site.

## Scores

| Dimension | Score | Justification |
| --- | --- | --- |
| Normalization & structure | 9/10 | Unchanged from the prior audit — clean entity boundaries, `Admin` correctly modeled as its own table. No redundant/derived data in scope. |
| Data integrity | 9/10 | The `admins.user_id` gap is closed and verified in both files. No remaining integrity gap found in scope this pass. |
| Indexing | 9/10 | Every FK column in scope has an explicit index, the redundant `admins.user_id` index was correctly retired in favor of the unique constraint's implicit index, and `AuditLog.createdAt` now has coverage. Composite `(createdAt, action)` shape is deliberately deferred per the prior report's own rationale — not a gap. |
| Naming & consistency | 8/10 | Unchanged — `snake_case`/`camelCase`/`PascalCase` mapping stays consistent; the identity-vs-actor-profile FK-naming split is carried forward as a known, deferred item, not re-flagged. |
| Domain fit | 8/10 | `admins.user_id` uniqueness closes the last real domain-fit gap found for `Admin` — one admin profile per user is now DB-enforced, matching `FR-ADM-004`. The `user_claims`/`user_logins`/`user_tokens`/`role_claims` FR-backing question remains open (product decision, not a schema defect) and is carried forward, not re-scored down further since nothing new was found. |

## Must-fix findings

None found in this pass. The single must-fix from the prior audit (`admins.user_id` missing `UNIQUE`) is
confirmed resolved in both files — see "What was re-verified" above.

## Worth considering

- **`user_claims` / `user_logins` / `user_tokens` / `role_claims` still have no FR backing.** Re-checked
  `docs/requirements/Functional-Requirements.md` again this session: no Customer, Restaurant, Driver, or
  Administrator requirement mentions external/OAuth logins, claims-based authorization, or per-role claims. This
  was flagged in both prior audits and remains unresolved — still carrying real schema weight (four tables, three
  with maintained indexes) with no confirmed consumer. Not proposing removal unilaterally; needs a product
  decision from the user.
- **FK constraint naming split (identity tables vs. `admins`) is unchanged and still deferred on purpose.**
  Identity-table FK constraints use a plural table-name prefix (e.g. `user_claims_user_id_fkey` at
  [`sqldiagram.sql:672`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L672)), while `admins` uses a
  singular prefix (`admin_user_id_fkey` at
  [`sqldiagram.sql:690`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L690)), matching its
  not-yet-in-contract siblings `customer_user_id_fkey`
  ([`sqldiagram.sql:692`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L692)) and
  `driver_user_id_fkey` ([`sqldiagram.sql:750`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L750)).
  Per the prior report's own recommendation, this is deferred until `customers`/`restaurants`/`drivers` enter the
  contract so it can be resolved in one pass — still the right call, no new action needed now.
- **Composite `AuditLog(createdAt, action)` index shape is still unknown, and that is fine.** The single-column
  `createdAt` index added this round is the documented minimum per the prior audit's rationale
  ([`contract.prisma:178`](../../src/prisma/contract.prisma#L178) /
  [`sqldiagram.sql:662`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L662)). Revisit once the
  admin activity-log screen's actual query pattern (`FR-ADM-018.2`) is built — not before.

## FR and business-rule cross-check

| Schema piece | Backing | Note |
| --- | --- | --- |
| `admins.user_id` uniqueness | `FR-ADM-004` (a single, unambiguous profile per administrator) | **Resolved** — `UNIQUE` present in both files, verified above. |
| `admins.first_name`/`last_name`/`profile_image_url` | `FR-ADM-004.1`/`.2` (view/update admin profile) | Unchanged, satisfied. |
| Admin password/login | `FR-ADM-001` (log in), `FR-ADM-004.3` (change password) | Unchanged — correctly lives on `User`, not duplicated on `Admin`. |
| `audit_log` | `FR-ADM-010.2` (record admin order-status changes), `FR-ADM-018` (view/search/filter activity logs) | The `userId` and now `createdAt` filters of `FR-ADM-018.2` are indexed; the `action`-alone filter still has no dedicated index, per the deliberately-deferred composite decision above. |
| `users.account_status` | `FR-ADM-005.4`/`.5` (activate/deactivate customers) | Unchanged, confirmed sole source of truth. |
| `password_reset_tokens` | `FR-CUS-005.1`/`.2`, `FR-RES-004.1`/`.2`, `FR-DRV-004.1`/`.2`, `FR-ADM-003.1`/`.2` | Unchanged from both prior audits — satisfied, modulo the reuse-prevention note (no schema constraint stops re-use of an already-`used_at` token; app-layer check). |
| `user_claims`, `user_logins`, `user_tokens`, `role_claims` | **None found** | Re-confirmed absent from all four FR sections — see worth-considering. |

## Overall rating: 9/10

Production-ready for the in-scope tables: the sole must-fix from the prior audit (`admins.user_id` missing
`UNIQUE`) is confirmed resolved in both `contract.prisma` and the canonical DDL, the redundant plain index was
correctly retired rather than left alongside the new unique constraint, the `audit_log.created_at` index landed
as specified, and no regressions were found in either file around the edit sites or elsewhere in the 11-model
scope. This isn't a 10 only because two items remain genuinely open and outside this review's authority to
resolve unilaterally: whether `user_claims`/`user_logins`/`user_tokens`/`role_claims` back any real, planned
requirement, and the cosmetic FK-naming split that's intentionally deferred until the actor-profile tables join
the contract.

Priority order going forward:

1. Get a product decision from the user on whether `user_claims`/`user_logins`/`user_tokens`/`role_claims` back a
   real, planned requirement (OAuth login, claims-based authz) before building services against them.
2. When `customers`/`restaurants`/`drivers` are added to the contract, resolve the FK-constraint-naming split
   (identity plural prefix vs. actor-table singular prefix) in one pass across all actor-profile tables.
3. Revisit `AuditLog`'s index shape (single-column `createdAt` vs. a composite with `action`) once the admin
   activity-log screen's actual query pattern is built — not before.
