# Driver Schema Audit (second re-audit, 2026-10-01)

Scope: the eight Driver-domain models in [`src/prisma/contract.prisma`](../../src/prisma/contract.prisma) (`Driver`,
`DriverVehicle`, `DriverDocument`, `Earning`, `DriverLocation`, `DriverAssignment`, `DriverPayout`, `DriverReview`)
and the enums they use (`driver_status`, `driver_availability_status`, `vehicle_type`, `driver_document_type`,
`document_status`, `payout_status`, `driver_assignments_status`, `review_status`). The contract is the sole source
of truth. It was checked against `docs/requirements/Functional-Requirements.md` (`FR-DRV-001` to `018`,
`FR-ADM-007`, `FR-CUS-026`), `.claude/rules/domain-rules.md`, and sound database design. Customer, Order, Payment,
Restaurant and identity models are out of scope: only the relation declarations that reach into them were checked.
This is a read-only review and replaces the earlier report of the same name (previous score 6/10).

Settled decisions that are not repeated as findings: optional `plateNumber`, `Int` standing in for `smallint`,
text-backed enums, no `DEFERRABLE` FKs, `onDelete: Restrict` everywhere, the composite primary key on
`DriverLocation`, the `name:`-authored partial unique index on `DriverAssignment`, re-offering an order after a
rejection or cancellation, and service-layer upkeep of the `Driver.rating`/`totalDeliveries` caches. For context
only: `driver_status` has no `rejected` value, so `FR-ADM-007.3` is a known open gap.

## Verification of the previous must-fix items

| # | Change | Result |
| --- | --- | --- |
| 1 | Partial unique index covers `completed` | Verified at [`contract.prisma:777`](../../src/prisma/contract.prisma#L777): `where: "status IN ('pending', 'accepted', 'completed')"`. A delivered order can no longer take a second assignment, and rejected or cancelled rows stay outside the index so re-offering works. The plain `@@index([orderId])` at [`:776`](../../src/prisma/contract.prisma#L776) is not redundant: the partial index only serves queries whose predicate matches, while the plain one serves full per-order history. |
| 2 | Composite FKs on `Earning` | Verified at [`contract.prisma:719`](../../src/prisma/contract.prisma#L719) and [`:723`](../../src/prisma/contract.prisma#L723). Every column in both target uniques ([`:774`](../../src/prisma/contract.prisma#L774) `(id, orderId, driverId)` and [`:796`](../../src/prisma/contract.prisma#L796) `(id, driverId)`) is NOT NULL. `Earning.driverId` and `orderId` are NOT NULL, so under MATCH SIMPLE the only column that can switch a composite FK off is the nullable `driverAssignmentId` (or `driverPayoutId`). That is the intended behavior: an unlinked earning is unchecked, a linked one must match the same order and driver. The two `@@check`s at [`:725`](../../src/prisma/contract.prisma#L725) and [`:726`](../../src/prisma/contract.prisma#L726) have no NULL hazard, because all five amount columns are NOT NULL. |
| 3 | Range and state checks | Verified, expressions reviewed below. No logic error found, and no check rejects legitimate data. |

Details on the new checks:

- `Driver` ([`:660`](../../src/prisma/contract.prisma#L660)): `rating` and `total_deliveries` are nullable, so a NULL passes the check (SQL treats an unknown result as satisfied). Correct for the range, but see worth-considering item 4.
- `DriverLocation` ([`:743`](../../src/prisma/contract.prisma#L743), [`:744`](../../src/prisma/contract.prisma#L744)): `heading` and `speed` are optional, and a NULL passes each side of the `AND`, so a fix without heading or speed is accepted. `Numeric(9, 6)` can hold values up to 999.999999, so the latitude and longitude bounds do real work.
- `DriverAssignment` ([`:771`](../../src/prisma/contract.prisma#L771) to [`:773`](../../src/prisma/contract.prisma#L773)): `completed` does not require `accepted_at`, so a flow that jumps straight to `completed` is not rejected, and a normal `accepted` to `completed` row keeps its `accepted_at`. The checks are one-directional (status implies timestamp, not the reverse), which is the safe direction for a state machine that the service drives.
- `DriverPayout` ([`:795`](../../src/prisma/contract.prisma#L795)): `status <> 'completed' OR paid_at IS NOT NULL` only requires that `paid_at` be written in the same statement that sets `completed`. A payout row can legitimately exist as `pending` or `processing` with `paid_at` NULL, so nothing legitimate is blocked.
- The enum-as-text comparisons use values that exist in the enums (`pending`, `accepted`, `rejected`, `completed`, `cancelled`, `payout_status.completed`), so none of the predicates is dead or misspelled.

Broadened partial index, flow check: a completed delivery that is later disputed or corrected can still be handled.
The corrected assignment is moved to `cancelled` (which drops out of the index) and a new assignment is created.
Two practical points for the service layer, neither a schema flaw: the `Earning` composite FK (default update
behavior) blocks changing `driverId` or `orderId` in place on an assignment that already has an earning, and the old
`Earning` stays linked to the cancelled assignment, so a correction has to reverse or void that earning explicitly.

No plain index is left redundant beside a unique constraint, and every FK column (including the composite ones) is covered by an index, a unique constraint, or the leading column of a primary key.

## Scores

| Dimension | Score | Justification |
| --- | --- | --- |
| Normalization & structure | 8/10 | Entity boundaries are clean and the caches are documented. Small deductions: `Earning.status` reuses `payout_status` and duplicates the state of the payout that owns the row, and the cache columns are nullable. |
| Data integrity | 8/10 | The active-assignment rule, earning-to-assignment and earning-to-payout consistency, money arithmetic, ranges, and timestamp-versus-status rules are now enforced in the database. Remaining gap: `DriverReview` is not tied to its order's customer or delivering driver, unlike `RestaurantReview`. |
| Indexing | 9/10 | Every FK is covered, the partial uniques are non-redundant, and the composite FK targets exist. Only optional, workload-driven indexes remain, which are not findings. |
| Naming & consistency | 9/10 | `@map`/`@@map`, enum naming and constraint naming (`<table>_<rule>`) are consistent. The one inconsistency is that the driver review lacks the composite-FK pattern the restaurant review already uses. |
| Domain fit | 8/10 | The assignment lifecycle, document verification, location trail and earnings-versus-payout split match the usual platform pattern, and delivered orders can no longer be double-assigned. Deductions are for the review linkage and the unguarded payout periods. |

## Must-fix findings

None. All three must-fix items from the previous audit are resolved, and no new integrity or correctness risk was found.

## Worth-considering findings

### 1. DriverReview is not tied to its order's customer or delivering driver

What's wrong: [`contract.prisma:867`](../../src/prisma/contract.prisma#L867) makes `orderId` unique, but the three
relations at [`:877`](../../src/prisma/contract.prisma#L877) to [`:879`](../../src/prisma/contract.prisma#L879) are
independent single-column FKs. `RestaurantReview` now closes the same hole with a composite FK to the order
([`:823`](../../src/prisma/contract.prisma#L823)), so the two review tables are inconsistent.

Why it matters: a row can reference order A, a customer who did not place A, and a driver who never delivered A. The
service layer must catch this, and a missed check puts a rating onto an uninvolved driver's `Driver.rating`
(`FR-CUS-026`).

Suggested fix: the delivering driver lives on `DriverAssignment`, and `(orderId, driverId)` is deliberately not
unique there, so reuse the existing target `(id, orderId, driverId)` instead. Add `driverAssignmentId` with a
composite FK:

```prisma
driverAssignmentId Uuid @unique @map("driver_assignment_id")
driverAssignment   DriverAssignment @relation(fields: [driverAssignmentId, orderId, driverId], references: [id, orderId, driverId], onDelete: Restrict)
```

This ties the review to one assignment for the same order and driver. The customer match would need its own unique
on `Order(id, customerId)`, and "assignment is completed" stays a service rule. Only worth the extra column if the
team wants the same strictness as restaurant reviews.

### 2. Earning.driverAssignmentId is nullable, so the composite FK can be bypassed

What's wrong: [`contract.prisma:705`](../../src/prisma/contract.prisma#L705) is optional. With it NULL, the FK at
[`:719`](../../src/prisma/contract.prisma#L719) is skipped, and `driverId` and `orderId` are then unrelated to any
assignment. Several earnings can also exist for one order, because only `driverAssignmentId` is unique.

Why it matters: an earning could credit a driver who did not deliver the order. `FR-DRV-016` describes earnings as
delivery income, which suggests every row comes from an assignment.

Suggested fix: if there is no earning type that is independent of a delivery (for example a platform bonus), make
the column required. If such rows are planned, leave it nullable and note that those rows are unchecked.

### 3. Verified or published rows can have a NULL timestamp

What's wrong: `DriverDocument.status = 'verified'` does not require `verifiedAt`
([`contract.prisma:690`](../../src/prisma/contract.prisma#L690), [`:692`](../../src/prisma/contract.prisma#L692)),
and `DriverReview.status = 'published'` does not require `publishedAt`
([`:871`](../../src/prisma/contract.prisma#L871), [`:875`](../../src/prisma/contract.prisma#L875)). The assignment
and payout tables already enforce this kind of rule.

Why it matters: an approved document or visible review with no audit time cannot be dated for `FR-ADM-007` or
`FR-ADM-013` reporting.

Suggested fix:

```prisma
@@check(expression: "status <> 'verified' OR verified_at IS NOT NULL", name: "driver_documents_verified_has_timestamp")
@@check(expression: "status <> 'published' OR published_at IS NOT NULL", name: "driver_reviews_published_has_timestamp")
```

### 4. Driver.rating and totalDeliveries are nullable

What's wrong: [`contract.prisma:653`](../../src/prisma/contract.prisma#L653) and
[`:654`](../../src/prisma/contract.prisma#L654) are optional even though the default is `0`.

Why it matters: an explicit NULL passes the check at [`:660`](../../src/prisma/contract.prisma#L660) and breaks
`totalDeliveries + 1` arithmetic in SQL. Making both required (`Numeric(3, 2)` and `Int` with the `0` default) costs nothing.

### 5. Earning.status duplicates DriverPayout.status

What's wrong: [`contract.prisma:712`](../../src/prisma/contract.prisma#L712) holds a payout state on each earning
that is already linked to a payout at [`:706`](../../src/prisma/contract.prisma#L706).

Why it matters: the two can disagree (earning `completed`, payout `failed`). Either derive earning state from the
payout, or keep the column and update both in one transaction. Not urgent.

### 6. Smaller gaps

- No guard against duplicate payout periods: nothing stops two `DriverPayout` rows for the same driver and overlapping dates ([`contract.prisma:781`](../../src/prisma/contract.prisma#L781) to [`:798`](../../src/prisma/contract.prisma#L798)). A `@@unique([driverId, periodStart, periodEnd])` would block exact repeats, but not overlaps.
- No `cancelledAt` on `DriverAssignment` ([`:761`](../../src/prisma/contract.prisma#L761) to [`:764`](../../src/prisma/contract.prisma#L764)): accepted, rejected and completed each have a timestamp, but `cancelled` does not, so cancellation time can only be inferred.
- `DriverLocation` has no retention policy ([`:733`](../../src/prisma/contract.prisma#L733)). It grows with every position fix, so plan a periodic purge of rows older than the delivery-tracking window.

## FR cross-check

| FR | Backing | Status |
| --- | --- | --- |
| `FR-DRV-001` to `004` (registration, login, password) | `Driver` plus the linked `User` | Backed |
| `FR-DRV-005` (profile, vehicle, picture) | `Driver`, `DriverVehicle`, `Driver.profileImageUrl` | Backed |
| `FR-DRV-006` (availability) | `Driver.availabilityStatus` | Backed |
| `FR-DRV-007` to `009` (receive, view, accept or reject) | `DriverAssignment` with `acceptedAt` and `rejectedAt` | Backed. `FR-DRV-009.3` notification is a known gap (no notifications table) |
| `FR-DRV-010`, `012` (navigation) | `DriverLocation`, order and delivery address snapshot | Backed |
| `FR-DRV-011`, `013`, `014` (pickup, status, delivery) | Order status history and `DriverAssignment.completedAt` | Backed, outside this scope |
| `FR-DRV-015` (history) | `DriverAssignment` completed rows | Backed |
| `FR-DRV-016` (earnings) | `Earning`, `DriverPayout` | Backed |
| `FR-DRV-017` (statistics) | `Driver.totalDeliveries`, `Driver.rating` caches | Backed |
| `FR-DRV-018` (notifications) | None | Known and deferred |
| `FR-ADM-007` (driver approval) | `Driver.status` | `.3` reject has no enum value: known open gap |
| `FR-CUS-026` (rate a driver) | `DriverReview` | Backed, see worth-considering item 1 |

Schema pieces without a direct FR: `DriverDocument` and the insurance and license-expiry columns support the
verification step of `FR-ADM-007`, which is reasonable, and none looks like dead weight.

## Overall rating

**8/10.** The three previous must-fix items landed correctly and the new checks hold up: no check has a NULL or
enum-comparison error, none rejects legitimate data, and the optional composite FKs behave as intended under MATCH
SIMPLE with all target columns NOT NULL. The broadened partial unique index does not block a legitimate flow, since
a correction goes through a `cancelled` row. The remaining items are consistency and tightening, not correctness
risks, so the domain is solid, with no must-fix gaps.

Priority list:

1. Tie `DriverReview` to its order's assignment, matching what `RestaurantReview` already does (item 1).
2. Decide whether `Earning.driverAssignmentId` should be required (item 2).
3. Add the `verified_at` and `published_at` checks (item 3).
4. Make `Driver.rating` and `totalDeliveries` NOT NULL (item 4).
5. Add `DriverAssignment.cancelledAt` and plan `DriverLocation` retention (item 6).
