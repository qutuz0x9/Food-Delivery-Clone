# Customer Schema Audit — 2026-09-29 (Re-Audit)

Scope: the 11 Customer-domain models in
[`src/prisma/contract.prisma`](../../src/prisma/contract.prisma) (`Customer`, `DeliveryAddress`,
`DeliveryAddressSnapshot`, `ShoppingCart`, `ShoppingCartItem`, `Order`, `OrderStatusHistory`, `OrderItem`,
`OrderItemOption`, `Payment`, `PaymentRefund`) and the enums they use (`gender`, `order_status`, `payment_method`,
`payment_status`, `refund_status`), checked field-by-field against the canonical DDL in
[`docs/dbdesign/Food-Delivery-System-sqldiagram.sql`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql) and
against `.claude/rules/domain-rules.md` and the `FR-CUS-006/007/015`-`022` sections of
[`docs/requirements/Functional-Requirements.md`](../../docs/requirements/Functional-Requirements.md). `Restaurant`,
`MenuCategory`, `MenuItem`, `MenuItemOptionGroup`, `MenuItemOptionValue`, `Driver`, and the `identity` namespace were
only checked at the FK-relation boundary (not re-audited internally). This is a read-only review; neither
`contract.prisma` nor the DDL file was modified.

This is a re-audit of
[`2026-09-29-customer-schema-audit.md`](2026-09-29-customer-schema-audit.md)'s prior version, which found one
must-fix finding (zero `CHECK` constraints) and four worth-considering items (default-address singularity, cart
lifecycle, missing FK indexes in the DDL, and incomplete `order_status` timestamp caching). All five have since
been re-derived from the current file contents below, independent of the change log supplied in the task brief.

The eight platform-level divergences already accepted for this domain (text-backed enums, no `DEFERRABLE` FKs, bare
`Decimal`/`Char` mappings for unspecified-precision DDL columns, `Order.updatedAt` with no default,
`OrderItemOption`'s name snapshots, `DeliveryAddressSnapshot.customerId` having no FK/relation) were re-verified
against the contract and the DDL and are **not** repeated as findings below.

## Scores

| Dimension | Score | Justification |
| --- | --- | --- |
| Normalization & structure | 9/10 | Cart/order/payment/refund boundaries remain clean and match the DDL exactly; the prior `ShoppingCart` cart-identity ambiguity is resolved by the new `@@unique([customerId])`. Docked one point only because `ShoppingCart.subtotal` and `Order`'s total columns are caches with no DB-level way to verify they still match their line items — inherent to the denormalization, enforceable only via app-layer transactions, not a flaw to fix here. |
| Data integrity | 8/10 | All six `@@check` constraints from the prior must-fix landed correctly in both files (verified below) and the default-address partial unique index is in place. Docked for the still-open `Payment.currency` `char(1)` bug and the `delivery_addresses` FK-index gap described below. |
| Indexing | 8/10 | 14 of 15 Customer-domain FK columns now have an explicit `CREATE INDEX` in the DDL matching the contract's `@@index`, a real improvement over the prior review. Docked one point for `delivery_addresses.customer_id`, which the contract indexes but the DDL does not (see worth-considering). |
| Naming & consistency | 8/10 | `snake_case` DB / `camelCase` Prisma mapping via `@map`/`@@map` is consistent throughout, with no drift between contract and DDL. Docked one point for `Order.preparedAt`/`prepared_at`, which breaks the otherwise-exact status-name-to-column-name pattern the other seven cached timestamps follow (see worth-considering). |
| Domain fit | 8/10 | Address snapshotting, per-line-item option-name snapshotting, and price-at-order-time snapshotting (`OrderItem.unitPrice` independent of `MenuItem.basePrice`) all match the real-world Uber-Eats/Talabat pattern. The single-cart-per-customer decision is now enforced at the DB layer. Docked for the same cache-consistency point noted under normalization. |

## Must-fix findings

None. The single must-fix finding from the prior audit is resolved (see verification below), and no new
correctness/integrity risk was found in this pass.

## Fix verification (prior must-fix and worth-considering items)

1. **`@@check` constraints — landed correctly.** All six are present and match between the contract and the DDL:
   - `Order`: `order_amounts_non_negative`
     ([`contract.prisma:422`](../../src/prisma/contract.prisma#L422),
     [`sqldiagram.sql:711-712`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L711-L712)) and
     `order_total_matches_components`
     ([`contract.prisma:423`](../../src/prisma/contract.prisma#L423),
     [`sqldiagram.sql:714-715`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L714-L715)) — the equality
     check is safe against rounding because every operand is an unconstrained Postgres `numeric` (arbitrary
     precision), not a floating type, so the arithmetic is exact.
   - `OrderItem`: `order_item_amounts_valid`
     ([`contract.prisma:460`](../../src/prisma/contract.prisma#L460),
     [`sqldiagram.sql:717-718`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L717-L718)).
   - `ShoppingCartItem`: `shopping_cart_item_amounts_valid`
     ([`contract.prisma:385`](../../src/prisma/contract.prisma#L385),
     [`sqldiagram.sql:720-721`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L720-L721)).
   - `Payment`: `payment_amount_non_negative`
     ([`contract.prisma:507`](../../src/prisma/contract.prisma#L507),
     [`sqldiagram.sql:723`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L723)).
   - `PaymentRefund`: `payment_refund_amount_non_negative`
     ([`contract.prisma:523`](../../src/prisma/contract.prisma#L523),
     [`sqldiagram.sql:725`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L725)).

2. **`DeliveryAddress` single-default partial unique index — landed correctly.** Contract
   [`contract.prisma:328`](../../src/prisma/contract.prisma#L328) matches DDL
   [`sqldiagram.sql:650`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L650) (`CREATE UNIQUE INDEX
   "delivery_addresses_one_default_per_customer" ON "delivery_addresses" ("customer_id") WHERE "is_default" =
   true`), byte-for-byte the same pattern as `DriverAssignment`'s partial unique index.

3. **`ShoppingCart` one-cart-per-customer — landed correctly.** Contract
   [`contract.prisma:369`](../../src/prisma/contract.prisma#L369) (`@@unique([customerId])`) matches DDL
   [`sqldiagram.sql:281`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L281) (`"customer_id" uuid UNIQUE
   NOT NULL`). The lifecycle comment at
   [`contract.prisma:366-368`](../../src/prisma/contract.prisma#L366-L368) documents the "delete cart at checkout,
   no status column" decision, consistent with the schema shape (no `status` column on `shopping_cart`).

4. **FK indexing backport — landed for 14 of 15 columns; one column still has a gap.** All of
   `shopping_cart.restaurant_id`, `shopping_cart_items.menu_item_id`, `orders.customer_id`/`restaurant_id`/
   `delivery_address_id`, `order_status_history.order_id`/`changed_by_user_id`, `order_items.order_id`/
   `menu_item_id`, `order_item_options.order_item_id`/`option_group_id`/`option_value_id`, `payments.order_id`, and
   `payment_refunds.payment_id` now have a matching `CREATE INDEX` in the DDL
   ([`sqldiagram.sql:670-696`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L670-L696)) mirroring the
   contract's `@@index`. `delivery_addresses.customer_id` is the exception — see worth-considering below.

5. **`order_status` timestamp caching — landed correctly.** `rejectedAt`/`readyForPickupAt`/`outForDeliveryAt` are
   now present in the contract
   ([`contract.prisma:408`](../../src/prisma/contract.prisma#L408),
   [`contract.prisma:410`](../../src/prisma/contract.prisma#L410),
   [`contract.prisma:412`](../../src/prisma/contract.prisma#L412)) with matching DDL columns
   (`rejected_at`/`ready_for_pickup_at`/`out_for_delivery_at` at
   [`sqldiagram.sql:312`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L312),
   [`sqldiagram.sql:314`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L314),
   [`sqldiagram.sql:316`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L316)) and matching
   `COMMENT ON COLUMN` entries
   ([`sqldiagram.sql:699,701,703`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L699-L703)), bringing the
   cached-column count to 8 of 9 `order_status` values (everything except `pending`, which is intentionally covered
   by `placedAt`/`createdAt` instead, per the task brief). Field order in both files also now mirrors the enum's
   declaration order (`pending → accepted → rejected → preparing → ready_for_pickup → picked_up →
   out_for_delivery → delivered → cancelled`).

## Worth considering

- **`delivery_addresses.customer_id` has a contract `@@index` with no DDL counterpart.** Contract
  [`contract.prisma:327`](../../src/prisma/contract.prisma#L327) declares a plain `@@index([customerId])` in
  addition to the partial unique index on the same column
  ([`contract.prisma:328`](../../src/prisma/contract.prisma#L328)), but the DDL only implements the partial unique
  index (`CREATE UNIQUE INDEX "delivery_addresses_one_default_per_customer" ... WHERE "is_default" = true` at
  [`sqldiagram.sql:650`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L650)) — there is no plain
  `CREATE INDEX ON "delivery_addresses" ("customer_id")`. A partial index is only usable by the planner for queries
  that include the same `WHERE is_default = true` predicate; the common `FR-CUS-007.1`-`.3` read pattern ("list all
  of this customer's addresses," not just the default one) filters on `customer_id` alone and would fall back to a
  sequential scan on this table. In practice the table stays small per customer, so this is low-risk at current
  scale, and the same "partial unique index substitutes for a plain FK index" pattern already exists elsewhere in
  the schema (`DriverAssignment.orderId`, out of this domain's audit scope) — but per `CLAUDE.md`'s
  "contract and DDL must match exactly" rule, this is a genuine drift between the two files that fix item 4 above
  didn't fully close. Suggested fix if the DDL is meant to match the contract as written:

  ```sql
  CREATE INDEX ON "delivery_addresses" ("customer_id");
  ```

- **`Order.preparedAt`/`prepared_at` breaks the otherwise-exact status-name-to-column-name pattern.** Every other
  cached milestone column is named after its `order_status` value verbatim: `accepted_at` ↔ `accepted`,
  `rejected_at` ↔ `rejected`, `ready_for_pickup_at` ↔ `ready_for_pickup`, `picked_up_at` ↔ `picked_up`,
  `out_for_delivery_at` ↔ `out_for_delivery`, `delivered_at` ↔ `delivered`, `cancelled_at` ↔ `cancelled`. The
  `preparing` status ([`sqldiagram.sql:864`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L864)),
  however, caches to `prepared_at` / `preparedAt`
  ([`contract.prisma:409`](../../src/prisma/contract.prisma#L409),
  [`sqldiagram.sql:313`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L313)) rather than `preparing_at` —
  the only cached column whose name doesn't match its status verbatim. This isn't a correctness bug (the column
  still means "when the order entered the `preparing` status"), but it's the kind of naming inconsistency that
  invites a bug in any service-layer code that maps a status enum value to a column name programmatically (e.g. a
  generic "cache the latest timestamp for this status" helper). Worth a rename to `preparingAt`/`preparing_at` for
  consistency, or an explicit comment noting the deliberate exception if the current name is intentional (e.g. to
  read naturally as "the food was prepared at").

- **`Payment.currency` is still a bare `char`, i.e. `character(1)`**
  ([`contract.prisma:499`](../../src/prisma/contract.prisma#L499),
  DDL [`sqldiagram.sql:360`](../../docs/dbdesign/Food-Delivery-System-sqldiagram.sql#L360)) — too short to hold a
  real ISO-4217 code like `"USD"`. Confirmed still present and unchanged; this is the same known, unfixed issue
  carried forward from the prior audit, not a new finding. Re-flagging only because it remains in this review's
  scope.

- **No DB-level guarantee that `ShoppingCart.subtotal` or `Order`'s cached total columns stay in sync with their
  line items.** This is expected for an intentionally denormalized cache (per `CLAUDE.md`'s guidance on
  `orders.accepted_at`-style caches) and can't be expressed as a single-row `CHECK` since it depends on an
  aggregate over child rows — but it does mean the invariant is entirely dependent on the service layer always
  recomputing and persisting these totals inside the same `prisma.$transaction` as the line-item writes
  (`ShoppingCartItem` add/update/remove for `ShoppingCart.subtotal`; `OrderItem` writes for `Order`'s totals). Not a
  schema defect, just a reminder for whoever implements the cart/order services.

## FR and business-rule cross-check

| Schema piece | Backing | Note |
| --- | --- | --- |
| `orders.order_number` unique | `FR-CUS-019.5` (unique order identifier) | Enforced via `@unique` in both the contract (`contract.prisma:395`) and the DDL (`sqldiagram.sql:299`) — satisfied. |
| `orders.subtotal`/`delivery_fee`/`tax_amount`/`discount_amount`/`total_amount` | `FR-CUS-019.3` (total = subtotal + fee + tax − discount) | Now enforced at the DB layer by `order_total_matches_components` and `order_amounts_non_negative` — fully satisfied, resolving the prior must-fix. |
| `shopping_cart_items.quantity`/`order_items.quantity` | `FR-CUS-015.2` (specify quantity) / `FR-CUS-016.1`-`.2` (increase/decrease) | `quantity > 0` enforced by `@@check` on both tables; a decrease to zero must be modeled as a row delete (`FR-CUS-017`), not a zero quantity — consistent with the constraint. |
| `order_status_history` | Cancellation append-only rule (`.claude/rules/coding-conventions.md`) and `FR-CUS-022.3` (update status to Cancelled) | Append-only design confirmed: `Order.status` is a plain column, and every transition (including to `cancelled`) is expected to also insert an `order_status_history` row — schema supports it, enforcement is at the service layer (correctly, per the coding conventions). |
| `FR-CUS-022.2` (verify cancellation eligibility) | Known gap per `.claude/rules/domain-rules.md` | The platform's cancellation policy isn't defined anywhere yet; nothing in this schema should be read as encoding it. Not a finding — already flagged as an open question in `domain-rules.md`. |
| `FR-CUS-022.4` (notify restaurant/driver on cancellation) | Known gap per `CLAUDE.md` | No notifications table exists anywhere in the schema — this is the documented, deferred gap, not a new finding. |
| `delivery_addresses` (`FR-CUS-007.1`-`.3`) vs `delivery_address` (order-time snapshot) | `FR-CUS-007`, order integrity | Correctly split exactly as `CLAUDE.md` describes — mutable saved addresses vs. immutable per-order snapshot, with `Order.deliveryAddressId` pointing at the snapshot table only. |
| `FR-CUS-007.4` (select default address) | Satisfied | The partial unique index on `is_default = true` now guarantees at most one default per customer at the DB layer — resolving the prior worth-considering item. |
| `payments.payment_method`/`status`, `payment_refunds` | `FR-CUS-020.1`-`.5` (display methods, select, process, notify, record) | Table shape (method, status, transaction reference, paid/failed state) supports the full flow — satisfied. |
| `FR-CUS-021` (track order) | `orders.status` + `order_status_history` | Both the current-state column and the full history are available for a tracking view — satisfied. |
| `gender` enum (`male`/`female` only) | `FR-CUS-006` (manage profile) | No FR specifies allowed gender values or requires a non-binary/unspecified option; matches the DDL exactly (`sqldiagram.sql:129-132`). Not a finding — no FR mandates more values, so this isn't dead weight either. |

## Overall rating: 8/10

Solid design with zero must-fix findings — the prior audit's single must-fix (missing `CHECK` constraints on every
money/quantity column) is fully and correctly resolved in both `contract.prisma` and the canonical DDL, and three
of the four prior worth-considering items (default-address singularity, cart lifecycle, and most of the FK
indexing gap) are resolved as well. What holds this back from a 9+ is a small residual set of worth-considering
items: one FK column (`delivery_addresses.customer_id`) where the contract and DDL still disagree on indexing, a
minor status-to-column naming inconsistency (`prepared_at` for the `preparing` status), and the still-open
`Payment.currency` `char(1)` bug carried over from an earlier review. None of these are integrity risks on their
own.

Priority order to address next:

1. Add the missing `CREATE INDEX ON "delivery_addresses" ("customer_id")` to the DDL (or drop the contract's plain
   `@@index([customerId])` if the partial unique index is judged sufficient) so the two files agree.
2. Decide whether `Order.preparedAt`/`prepared_at` should be renamed to `preparingAt`/`preparing_at` for
   consistency with the other seven cached milestone columns, or leave it as a documented deliberate exception.
3. Confirm whether `Payment.currency`'s `char` type is the known DDL bug that still needs a fix (carried over, not
   introduced here).
4. No schema action needed, but flag to whoever builds the cart/order services that `ShoppingCart.subtotal` and
   `Order`'s cached totals must be recomputed inside the same `prisma.$transaction` as their line-item writes,
   since nothing in the DB enforces that consistency automatically.
