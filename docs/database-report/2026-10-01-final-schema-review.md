# Final Schema Review: Can You Start Implementing?

Date: 2026-10-01. Scope: all 43 models and 18 enums in [the data contract](../../src/prisma/contract.prisma), checked against
[the functional requirements](../requirements/Functional-Requirements.md), the business rules, and the coding
conventions. The contract is the only source of truth; the old DDL sketch was deliberately not consulted. Line
numbers below (for example `contract.prisma:35`) refer to the contract as it is today.

## Verdict

**Ready after the listed items.** There is nothing that stops you from starting: the contract compiles, all 43
tables are already covered by two migrations, and the migration head hash equals the contract's current storage hash,
so there is no drift. But a handful of cheap changes (timestamp type, money precision, cart options, a missing name
snapshot, nullable columns on `Restaurant`) are painless today while every table is empty and painful once real data
and code depend on them. Make those changes in one batch, plan one more migration, and then build.

## Must do before implementing

There are no hard blockers. Two things are decisions rather than fixes, and you should settle them before writing
the module they affect:

- **Cart options decision** (affects the cart and checkout modules). Menu items can have option groups (size, extras),
  and orders can record chosen options (`OrderItemOption`), but a cart item cannot hold options. See item 3 below.
- **Identity leftovers decision** (affects the auth module). Decide whether to keep or drop `UserClaim`, `UserLogin`,
  `UserToken`, `RoleClaim`. See the identity section below.

## Worth doing before implementing

Each item is cheap now (empty tables, one more `migration plan`) and expensive later (data rewrite or backfill).

1. **Switch every timestamp to a timezone-aware type.** All timestamps are `TimestampString(6)`, which creates
   Postgres `timestamp(6)` columns *without* a time zone (`contract.prisma:35`, repeated about 80 times; the generated
   migration confirms `timestamp(6)`). A timestamp without a zone is just a wall-clock string: if the server, the
   database session, or a developer laptop uses a different zone, the same instant is stored differently, and order
   timing, token expiry and "delivered at" comparisons silently go wrong. The same string family has a zone-aware
   variant, `TimestamptzString(6)`, which needs no Temporal polyfill either, so this is not a platform limit.
   Change: find and replace `TimestampString(6)` with `TimestamptzString(6)`.
2. **Use `Numeric(10, 2)` for all money.** `Restaurant`, `MenuItem`, `Earning` and `DriverPayout` use
   `Numeric(10, 2)`, but cart, order, order item, option, payment, refund and promotion amounts use bare `Decimal`,
   which is unbounded `numeric` (`contract.prisma:259` versus `:374`, `:394`, `:415-419`, `:470`, `:493`, `:515`,
   `:532`, `:619`). An unbounded column accepts `9.995`, and then the check `total_amount = subtotal + delivery_fee +
   tax_amount - discount_amount` can pass while the displayed prices round differently. Change: make every money
   field `Numeric(10, 2)`, and add `CHECK (total_price = unit_price * quantity)` to `OrderItem` and `ShoppingCartItem`
   once you decide whether `unitPrice` already includes option adjustments (it should, see item 4).
3. **Decide how options reach the cart.** `ShoppingCartItem` has no option rows and is unique on
   `(shoppingCartId, menuItemId)` (`contract.prisma:389-404`). So "large pizza" and "small pizza" cannot be two cart
   lines, and the options a customer picked have nowhere to live until checkout, while `OrderItemOption` expects
   them (`contract.prisma:486-504`). No functional requirement mentions customer-selected options (only the
   restaurant's option management exists), so you have two honest choices. Either (a) add a
   `ShoppingCartItemOption` table and replace the unique with an app-level "same item and same option set merges"
   rule, or (b) leave options out of the first version and build `OrderItemOption` later. Pick one now, because the
   cart module's shape depends on it.
4. **Snapshot the item name on `OrderItem`.** `OrderItem` snapshots prices but not the name (`contract.prisma:465-481`),
   while `OrderItemOption` does snapshot names (`:491-492`). Renaming "Margherita" later would rewrite every past
   receipt. Change: add `itemName String @map("item_name")` (optionally also `restaurantName` on `Order` for receipts).
5. **Make the key `Restaurant` columns required.** `status`, `availabilityStatus`, `minimumOrderAmount`,
   `deliveryFee`, `ratingAverage` and `ratingCount` are nullable (`contract.prisma:216-222`). A `NULL` status never
   matches `status = 'approved'`, so a restaurant created without it silently disappears from listings, and a `CHECK`
   passes when its column is `NULL`, so the non-negative and rating checks can be bypassed. Change: `status` required
   with `@default(pending)`, `availabilityStatus` required with `@default(closed)`, and the numeric ones required with
   their existing zero defaults. (`Driver.rating` and `Driver.totalDeliveries` are the same pattern; they are already
   in your carried-over list.)
6. **Give option groups and values an `isActive` flag.** `OrderItemOption` points at the group and value with
   `onDelete: Restrict` (`contract.prisma:497-498`), so once any order used an option, the planned
   `DELETE .../options/:groupId` endpoint can never succeed. Menu items, categories and promotions already have
   `isActive` for exactly this reason; options do not (`contract.prisma:277-304`). Change: add
   `isActive Boolean @default(true)` to both models and make "delete" mean "deactivate".
7. **Tie option values to their group on `OrderItemOption`.** Nothing stops `optionValueId` from belonging to a
   different group than `optionGroupId` (`contract.prisma:489-490`). It needs no new column: add
   `@@unique([id, optionGroupId])` on `MenuItemOptionValue` and make the relation use
   `fields: [optionValueId, optionGroupId], references: [id, optionGroupId]`. Also add
   `@@unique([orderItemId, optionValueId])` so the same option cannot be recorded twice for one line.
8. **Add composite indexes for the real query paths.** Today `Order` has three single-column indexes
   (`contract.prisma:441-443`). Customer history ("my orders, newest first") wants `(customerId, placedAt)`;
   the restaurant's active-orders screen wants `(restaurantId, status, placedAt)`; admin lists want `(status, placedAt)`.
   Drivers' pending offers want `(driverId, status)` on `DriverAssignment`. Replace the single-column order indexes
   with these. Everything else (every foreign key, the audit log, the partial unique indexes) is already indexed
   correctly, which is better than most first drafts.
9. **Tighten the address snapshot.** `DeliveryAddressSnapshot.customerId` is a plain column with no foreign key and
   no index (`contract.prisma:353`), `Order.deliveryAddressId` is not unique, so two orders can share one snapshot
   and nothing prevents a snapshot from pointing at a customer who does not exist. Change: add the relation to
   `Customer`, make `Order.deliveryAddressId` `@unique`, and consider a composite
   `(deliveryAddressId, customerId)` so the snapshot's owner must be the order's customer. Also store
   `DeliveryAddress.latitude`/`longitude` as `Numeric(9, 6)` with the same range check as `RestaurantAddress`
   (`contract.prisma:334-335` are unbounded `Decimal`; the snapshot copies them).
10. **Decide the cross-domain composite foreign keys (see the dedicated section).** The cheap, high-value ones are
    items 7 and 9 above plus the `OrderItem` to `MenuItem` same-restaurant check.
11. **Payments: stop double charges at the database.** Several `Payment` rows per order are correct (retries), but
    nothing stops two successful ones. Add a partial unique index on `orderId` where status is one of `paid`,
    `refunded`, `partially_refunded` (same style as `driver_assignments_active_order_unique`).
12. **Housekeeping.** Commit the new `migrations/` folders and snapshots; update the stale comment above `Payment`
    (`contract.prisma:506-508` still says `currency` is a bare one-character `Char`, but it is `Char(3)` and blocks
    nothing); delete the orphan snapshot `migrations/snapshots/ed3cdc29...` only if you confirm no migration refers to
    it (none does today).

## Can wait until the feature is built

- **Promotions in orders.** `Order` has `discountAmount` but no link to the promotion that produced it, and the
  requirements never define how a promotion is applied (code, automatic, minimum order). Adding a nullable
  `promotionId` later is cheap. Ask before inventing the rules.
- **Tips.** `Earning.tip` exists, but no requirement lets a customer tip and `Order` has no tip column.
- **System-initiated status changes.** `OrderStatusHistory.changedByUserId` is required (`contract.prisma:453`).
  Auto-cancel jobs or payment webhooks will need a seeded "system" user. Decide when you build them.
- **Order status timestamps.** `preparedAt` and `readyForPickupAt` overlap in meaning and there is no `preparingAt`.
  Define in the service which status writes which column. They are caches of `order_status_history`, which is the
  truth.
- **Refunds.** Refund total not exceeding payment amount needs a row lock in the service. `PaymentRefund` lacks an
  `updatedAt` and a provider reference; add when you integrate a gateway. A check linking `completed` to
  `processedAt` and `paid` to `paidAt` (the same pattern as your carried-over item) fits here.
- **Refresh-token rotation.** `replacedByToken` has no foreign key (`contract.prisma:131`), so a dangling id is
  possible. Fine for reuse detection; consider an FK if you want the chain guaranteed. An index on `expiresAt` helps
  the cleanup job.
- **Restaurant search.** Name search will need `pg_trgm` or a full-text index; listing wants an index on
  `(status, availabilityStatus)`. Not needed at learning-project data sizes.
- **Driver location history.** `DriverLocation` stores one row per ping (`contract.prisma:733-747`). You will need a
  retention job, and "nearest driver" is a bounding-box query until you consider PostGIS.
- **`onDelete: Restrict` on cart items.** Deleting a cart at checkout must delete its items first (inside the
  transaction), which is fine. `Cascade` on `ShoppingCartItem.shoppingCart` would save a line of code, but keeping one
  consistent rule is also a valid choice.
- **Known deferred requirements** (not findings): notifications, system settings (tax, commission, delivery-fee
  rules), platform-level categories and promotions, driver rejection status.

## Cross-domain consistency: DB or service code?

| Relationship | Guaranteed today? | Recommendation |
| --- | --- | --- |
| Cart item's menu item belongs to the cart's restaurant | No (`contract.prisma:389-404`) | Service. The cart is temporary, and checkout re-validates every item anyway (still active, still available, still this restaurant). A composite FK needs a duplicated `restaurantId` on the item, which is not worth it for a throwaway row. |
| Order item's menu item belongs to the order's restaurant | No (`contract.prisma:465-481`) | Database, if you want the learning value: add `restaurantId` to `OrderItem`, `@@unique([id, restaurantId])` on `Order`, and a composite FK to `MenuItem(id, restaurantId)`. It is an immutable money record, and the same pattern you already use for `MenuItem` to `MenuCategory`. Service-only is acceptable because checkout is the single writer. |
| Option value belongs to the option group | No (`contract.prisma:489-490`) | Database. No new column needed (worth-doing item 7). |
| Option group belongs to the order item's menu item | No | Service. Needs a duplicated `menuItemId` on `OrderItemOption` for little gain. |
| Cart restaurant is the customer's single active restaurant | Yes, by `@@unique([customerId])` | Already good. |
| Driver review matches the order's customer and driver | No (`contract.prisma:863-887`; carried over) | Database later: reference the assignment with a composite FK `(driverAssignmentId, orderId, driverId)`, mirroring `Earning`, and add `@@unique([id, customerId])` on `Order` for the customer. Until then, the review service must verify the order is delivered, owned by the caller, and read `driverId` from the completed assignment. |
| Restaurant review matches the order's customer and restaurant | Yes (composite FK, `contract.prisma:823`) | Already good. The service must still check the order is `delivered`. |
| Earning matches the assignment's order and driver; payout matches driver | Yes, except when `driverAssignmentId` is null (carried over) | Already good. |

## Money correctness

- **Reproducing an order exactly later.** Snapshots are almost enough: `unitPrice`, `totalPrice`, option
  `priceAdjustment`, the order's `subtotal`, `deliveryFee`, `taxAmount`, `discountAmount`, `totalAmount`, plus a
  `CHECK` that the total matches its components (`contract.prisma:437-438`). Gaps: the item name (worth-doing item 4),
  the precision (item 2), the tax rate or promotion used (can wait), and the currency, which lives only on `Payment`.
  That is fine for a single-currency platform.
- **Refunds.** `PaymentRefund` is a separate row per refund with its own status, so partial refunds and failed refunds
  are representable, and `Restrict` keeps history. The "sum of refunds is at most the payment" rule is service code
  under a transaction.
- **Payment retries.** Multiple payments per order are allowed and `transactionReference` is unique but nullable, which
  is right. See worth-doing item 11 for the double-charge guard.
- **`Payment.currency`.** It is `Char(3)` (`contract.prisma:516`), which fits ISO codes such as `USD`. Nothing is
  blocked. A `CHECK (currency = upper(currency))` is optional.
- **`ShoppingCart.subtotal`** is a stored total that can drift from its items. Recompute it in the same transaction
  that changes items, and never trust it at checkout. Cart item `unitPrice` is a snapshot too, so re-price from
  `MenuItem.basePrice` when placing the order.

## Identity design

- **Actor identity.** `Admin`, `Customer`, `Restaurant` and `Driver` each have a unique `userId`, so each user has at
  most one profile *of each kind*. Nothing stops one user from owning a customer and a driver profile, or none at
  all. That is fine if login is role-specific (`/auth/login/customer`), but the token must say which actor logged
  in, and role guards must check that the matching profile row exists.
- **The six unrequested tables.** They are empty and cost nothing at runtime, but they cost attention: every
  newcomer asks what they are for. Recommendation for a learner:
  - Keep `Role` and `UserRole`, seeded with `customer`, `restaurant`, `driver`, `admin`. They give the role guard
    (a requirement in the coding conventions) a natural home and are the only ones with a clear use.
  - Drop `UserClaim`, `UserLogin`, `UserToken` and `RoleClaim` for now. They come from the ASP.NET Identity template
    and serve external logins (Google and similar) and fine-grained permissions, which no requirement asks for.
    `UserLogin.value` and `UserToken.value` would store provider secrets, a security burden you do not need yet.
    `RoleClaim.roleId` is nullable, which is odd for a claim that belongs to a role (`contract.prisma:113`), and
    `UserClaim.id` is the only identity id without a default (`contract.prisma:46`).
  - Dropping later is easy (empty tables), so this is your call, not a blocker. If you drop them, do it before
    applying the migrations anywhere that matters.
- **Soft delete.** `deletedAt` exists only on `User` and `Role`. Two consequences to design for: every login and
  lookup must filter `deletedAt IS NULL`, and public listings must also join the owner's `User` row so a
  suspended or deleted owner's restaurant is hidden (the database cannot do this for you). Also, `email` and
  `phoneNumber` stay unique forever, so a soft-deleted person cannot re-register with the same email. That is a fine
  product decision; just make it deliberately.
- **`onDelete: Restrict` everywhere.** A consistent and safe default that matches soft deletes. The price is that
  hard deletes (test cleanup, "clear cart") must remove children first. Prefer `isActive` flags over deletion.

## Migrations

- **Current state.** Two migrations exist. The second, named `add_restaurant_driver`, is misnamed: it creates all 40
  remaining tables (customer, cart, order, payment, restaurant, driver and review tables included). Together they
  create 43 tables. The ref file `migrations/app/refs/db.json` holds the hash `a98b30a8...`, which equals the
  contract's current `storageHash`, so planning right now would produce an empty plan. The next
  `migration plan` will contain only the changes you make from this review. Run `npx prisma migration status`
  (read-only) to see whether the database has actually applied them.
- **Will anything else break `migration plan` or `db migrate`?** The risky shapes you asked about already
  planned successfully in the second migration: `name:`-authored partial unique indexes, `@@check` expressions,
  composite foreign keys including the optional-column one on `Earning`, and the `@default("0")` / `dbgenerated`
  numeric defaults (they render as `DEFAULT '0'::numeric` and `DEFAULT ('0'::numeric(10,2))`). Plan success does not
  prove apply success, so run `db migrate` against a scratch database early. Mixed default styles (`@default("0")`
  on `Decimal`, `dbgenerated` on `Numeric(p,s)`) are inconsistent but work; item 2 removes the inconsistency when
  you move everything to `Numeric(10, 2)`.
- **Changing column types.** Item 1 (timestamptz) and item 2 (numeric precision) rewrite columns. On empty tables
  that is trivial; the plan may label them as destructive or data-dependent operations, so read the plan before
  applying.
- **Untracked files.** `migrations/app/20261001T1510_add_restaurant_driver/` and two snapshots are not committed yet.

## Flow-by-flow readiness

| Flow | Supported cleanly? | Notes |
| --- | --- | --- |
| Register (any actor) | Yes | One transaction: `User` plus profile row (and `UserRole` if kept). Domain ids are generated in the app (`crypto.randomUUID()`). |
| Login, refresh, logout | Yes | `RefreshToken` has hash, expiry, revocation and replacement chain. Check `accountStatus` and `deletedAt` on every login. |
| Password reset | Yes | `PasswordResetToken` with hash, expiry, `usedAt`. Mark used and revoke refresh tokens in one transaction. |
| Restaurant onboarding and approval | Mostly | Works. A rejection reason has no column (carried-over question). Make `status` required first (item 5). Audit-log the admin action. |
| Menu browsing | Yes | Composite FKs keep categories and items consistent. Option retirement needs `isActive` (item 6). |
| Add to cart | Partly | Works for plain items. Options need a decision (item 3). One cart per customer, so switching restaurants means clearing it. |
| Checkout (cart to order to payment) | Yes, with care | One `$transaction`: validate and re-price, copy the address into a snapshot, create order, items, options and the first status-history row, create payment, delete cart items then the cart. Needs an item-name snapshot (item 4) and an app-made order number with a retry on the unique constraint. |
| Order status flow | Yes | Append to `order_status_history`, then update the cache columns. The state machine lives in the service; the database only stores it. |
| Driver assignment | Yes | The partial unique index prevents double-assigning and still allows re-offering after a rejection. |
| Pickup and delivery | Yes | Status changes go through order history; assignment timestamps are checked. Update `Driver` caches in the same transaction. |
| Earnings and payout | Yes | `Earning` per assignment, composite FKs to the driver, payout membership recorded. Payout `amount` equals the sum of its earnings: service code in a transaction. |
| Reviews and moderation | Mostly | One review per order, one reply per review, statuses for moderation. Recompute `ratingAverage` from published reviews only. `DriverReview` linkage is a carried-over item. |
| Admin actions with audit log | Yes | `AuditLog` has actor snapshot, entity, old and new JSON, IP, user agent. Every state-changing admin action must write a row in the same transaction. |
| Refunds | Yes, with care | Representable. Limits and idempotency are service logic. |
| Notifications, settings, platform promotions | No (known, deferred) | Documented gaps; ask before building. |

## Scores

| Dimension | Score (1-10) | Why |
| --- | --- | --- |
| Normalization and structure | 8 | Clean entity boundaries, snapshots where history matters, intentional caches. Missing: cart options, item-name snapshot, option retirement. |
| Data integrity | 8 | Many check constraints, partial unique indexes and composite FKs. Gaps: nullable `Restaurant` columns defeating checks, unbounded `Decimal` money, a few unlinked relationships. |
| Indexing | 7 | Every foreign key is covered and the partial indexes are well chosen. Missing composite indexes for order history and active orders. |
| Naming and consistency | 7 | Consistent snake_case mapping and `_id` / `_at` suffixes. Small inconsistencies: `shopping_cart` and `delivery_address` singular, `driver_assignments_status` enum name, mixed money types and default styles. |
| Domain fit | 8 | Matches Talabat/Uber Eats patterns: address snapshot, price snapshot, append-only status history, assignment re-offering, review moderation. Gaps are the promotion link and cart options. |
| Migration readiness | 9 | Migrations exist, cover all models, and match the contract hash. Shapes plan successfully. Remaining risk is apply-time behaviour and the planned column rewrites. |

**Overall rating: 8 out of 10.** This is a solid design with no integrity-breaking structural problem: the hard parts
(one active assignment per order, same-restaurant composite keys, order total check, review uniqueness) are already
enforced by the database. What keeps it from a 9 is a short list of cheap fixes whose cost jumps once code and data
exist: timezone-less timestamps, unbounded money columns, nullable `Restaurant` columns, and the cart/order option
and name-snapshot gaps. Fix those and it becomes a 9.

## Carried-over small items

These are known and open; they are not new findings.

- `Earning.driverAssignmentId` is nullable, so a null skips its composite foreign key (undecided whether to require it).
- `DriverReview` is not tied to its order's customer and driver (see the cross-domain table for a concrete design).
- No check links `verified` / `published` status to `verifiedAt` / `publishedAt`.
- `Driver.rating` and `Driver.totalDeliveries` are nullable despite a default of 0.
- Four unanswered Restaurant questions: rejection reason column, address label or primary marker,
  `Restaurant.email` duplicating `User.email`, and whether manual availability overrides the weekly schedule.
- `driver_status` has no `rejected` value (`FR-ADM-007.3`), a known gap.

## What is strong here

- **Snapshots.** `DeliveryAddressSnapshot`, order prices, option names and `AuditLog.actorEmail` keep history truthful
  after the live data changes. This is the single most important idea in e-commerce modelling.
- **Composite foreign keys.** `MenuItem` to `MenuCategory`, `RestaurantReview` to `Order`, `RestaurantReviewReply` to
  its review, and `Earning` to its assignment and payout make "wrong restaurant" or "wrong driver" rows impossible,
  not merely unlikely.
- **Partial unique indexes.** One default address per customer, one active vehicle per driver, one live assignment
  per order, active-name uniqueness for menu items. Each is a business rule expressed as an index.
- **Check constraints.** Order total arithmetic, option group selection ranges, earning net amount, promotion date
  range and percentage cap, "completed payout has a paid date", coordinate ranges.
- **The identity namespace.** Auth and audit tables live in their own Postgres schema, separate from business tables.
- **A coherent lifecycle story.** Soft delete on `User` only, `Restrict` everywhere, append-only history, one cart
  per customer deleted at checkout. The rules are simple and consistent.

## What you will learn while implementing

- **Transactions.** Checkout touches about ten tables and must succeed or fail as one unit
  (`prisma.$transaction`, or its Prisma 8 equivalent). Race conditions (two taps, two drivers accepting) are solved
  by the unique indexes already in the schema: catch the unique violation and translate it into a friendly error.
- **Append-only history.** Order status changes insert a history row first and then update the cache columns on
  `Order`. Nothing in the database forbids updating history rows, so the discipline lives in your repository code
  (a trigger or revoked `UPDATE` privilege is the advanced version).
- **Denormalized caches.** `Restaurant.ratingAverage`, `Driver.rating`, `Driver.totalDeliveries`,
  `ShoppingCart.subtotal` and the `Order` timestamp columns can drift. Update them in the same transaction as the
  change, and know how to recompute them.
- **State machines.** The database stores order, payment, assignment and document statuses but allows any value to
  follow any other. The legal transitions (for example `pending` to `accepted` but not `delivered` to `pending`) are a
  table in your service code, ideally with a unit test per transition.
- **Money and time handling.** Never use floating-point for money; keep `Numeric` as strings or a decimal library,
  and store instants in a timezone-aware type.
- **Authorization layers.** Authentication (who are you), role guards (which actor), and ownership checks (is this your
  order). The schema gives you the ownership columns; the checks are code.
- **Migrations as history.** Plan, read, apply, commit. Reading the generated plan before applying it is the habit.

## Suggested implementation order

The order follows the foreign-key dependency graph: a table can only be written once the tables it points at exist
in your code.

1. **Foundation first.** Prisma client wiring, error middleware, validation helpers, and the schema fixes above plus
   a third migration.
2. **Auth and identity.** `User`, `RefreshToken`, `PasswordResetToken`, `AuditLog` helper, and the role guard. Everything else
   needs an authenticated actor.
3. **Customer profile and addresses.** Small, teaches the profile-plus-user transaction and the default-address
   partial index.
4. **Restaurant and menu.** Onboarding, approval (with audit log), categories, items, options, hours. This produces
   the data that orders need.
5. **Cart and checkout (orders and payments).** The biggest learning step: snapshots, totals, status history,
   transaction. Do the cash payment first, then card flows.
6. **Order lifecycle for restaurants and customers.** Accept, reject, prepare, cancel, with the state machine.
7. **Drivers.** Registration and approval, availability and location, assignment, pickup and delivery, then
   earnings and payouts.
8. **Reviews and moderation.** Needs delivered orders, so it comes late; build the rating-cache update with it.
9. **Admin features and reports.** Last, because they read everything else.
