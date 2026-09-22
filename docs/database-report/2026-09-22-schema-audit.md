# Schema Audit — Food Delivery System

**Date:** 2026-09-22
**Scope:** Full canonical DDL — `docs/dbdesign/Food-Delivery-System-sqldiagram.sql` (759 lines, all tables/enums/constraints/indexes)
**Reviewed against:** `docs/requirements/Functional-Requirements.md`, `.claude/rules/domain-rules.md`, `CLAUDE.md` known-gaps list
**Note:** `src/prisma/schema.prisma` does not exist yet — no `prisma validate` run, review is DDL-only.

---

## 1. Scores

| Dimension | Score /10 | Summary |
| --- | --- | --- |
| Normalization & structure | 7 | Entity boundaries are mostly right (cart vs. order, `restaurant_categories` vs `menu_categories`, order-time snapshots for price/option names) but the two delivery-address tables are structurally identical, defeating the "mutable vs. immutable" split documented in `CLAUDE.md`. |
| Data integrity | 4 | Zero `CHECK` constraints anywhere in the file; three profile tables allow duplicate rows per user; one enum-typed column has a typo that breaks table creation; a nullable status column on `restaurants`; one primary-key clause is syntactically broken. |
| Indexing | 3 | Only 5 unique indexes in the whole schema. Postgres does not auto-index the referencing side of a FK, and this schema is FK-heavy (~45 FK constraints) — the overwhelming majority have no supporting index at all. |
| Naming & consistency | 6 | snake_case is followed almost everywhere, but there's a stray camelCase column, a typo'd column name, an invalid type name, and `restaurants` breaks the created_at/updated_at NOT NULL DEFAULT pattern every other table follows. |
| Domain fit | 7 | Order-time snapshotting (price, option names, delivery address) is the right pattern and is applied to the order line-item level correctly; append-only `order_status_history` with denormalized cache columns is a good, well-documented pattern; driver location as a time-series table is reasonable. Gaps: cart has no status/lifecycle field, and the address-snapshot table isn't actually immutable by structure. |

---

## 2. Must-Fix Findings (integrity/correctness risk)

### 2.1 `driver_locations` primary key clause is invalid SQL

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:550-558`

```sql
CREATE TABLE "driver_locations" (
  ...
  "recorded_at" timestamp NOT NULL,
  "primary" key(driver_id,recorded_at)
);
```

`"primary"` is quoted as an identifier and `key(...)` is not valid constraint syntax — Postgres would try to create a column literally named `primary` of an undefined type `key`. This statement fails to execute as written; the table has no real primary key.
**Fix:**

```sql
  "recorded_at" timestamp NOT NULL,
  PRIMARY KEY ("driver_id", "recorded_at")
```

### 2.2 `menu_items.is_active` uses an invalid type name

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:452`

```sql
"is_active" bollean NOT NULL DEFAULT true,
```

`bollean` is not a Postgres type — this `CREATE TABLE` fails outright.
**Fix:** `"is_active" boolean NOT NULL DEFAULT true,`

### 2.3 `payments.currency` is an unlengthed `char`, i.e. `char(1)`

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:348`

```sql
"currency" char NOT NULL,
```

Bare `char` in Postgres is `char(1)`. Currency codes are 3 letters (`USD`, `EGP`, `AED`); every insert would be silently truncated to one character, corrupting every payment row.
**Fix:** `"currency" char(3) NOT NULL,`

### 2.4 No uniqueness on the `users.id -> profile` relationship for any of the three actor tables

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:242-243` (customers), `:383-384` (restaurants), `:494-495` (drivers)

```sql
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
```

None of `customers.user_id`, `restaurants.user_id`, `drivers.user_id` has a `UNIQUE` constraint, and no `CREATE UNIQUE INDEX` exists for any of them (checked against the full index list at `:628-636`). Nothing in the DB stops the same `users` row from being linked to two `customers` rows (or two `restaurants`, or two `drivers`) — e.g. a retried registration request (FR-CUS-002.4 / FR-RES-001.4 / FR-DRV-001.4) without an idempotency check at the service layer would silently create a duplicate profile.
**Fix:**

```sql
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_key" UNIQUE ("user_id");
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_user_id_key" UNIQUE ("user_id");
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_key" UNIQUE ("user_id");
```

### 2.5 `delivery_address` (the immutable order-time snapshot) has no FK on `customer_id`, and is structurally identical to the mutable `delivery_addresses`

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:365-380` vs `:253-268`

`CLAUDE.md` is explicit that `delivery_addresses` (mutable, customer-owned) and `delivery_address` (immutable snapshot at order time) must be kept structurally distinct "so edits/deletes don't corrupt past orders." As written, the two tables have identical column lists — including `is_default` and `updated_at`, neither of which makes sense on a one-shot order-time snapshot. Nothing in the schema actually prevents `delivery_address` rows from being edited after order placement, which is the entire point of having two tables.

Separately: scanning every `ALTER TABLE ... ADD CONSTRAINT` in the file (`:646-758`), there is a FK from `delivery_addresses.customer_id -> customers.id` (`:666`) but **no equivalent FK from `delivery_address.customer_id`**. That column can hold any UUID, including one that doesn't exist in `customers`.
**Fix:**

- Add `ALTER TABLE "delivery_address" ADD CONSTRAINT "delivery_address_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");`
- Drop `is_default` and `updated_at` from `delivery_address` — a snapshot is written once at order placement and never updated.

### 2.6 Zero `CHECK` constraints anywhere in the schema

Confirmed by scanning the full file: there is not a single `CHECK` constraint in any `CREATE TABLE` or `ALTER TABLE` statement. Concrete cases that matter:

- **Order total formula** (`FR-CUS-019.3`, and explicitly called out in `.claude/rules/domain-rules.md:19`: "Order total = subtotal + delivery fee + tax − discount, calculated server-side"). `orders` (`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:295-299`) stores `subtotal`, `delivery_fee`, `tax_amount`, `discount_amount`, `total_amount` as independent columns with no constraint tying them together. A bug anywhere in the service layer produces an order whose total simply doesn't add up, and the DB will accept it silently.

  ```sql
  ALTER TABLE "orders" ADD CONSTRAINT "orders_total_amount_check"
    CHECK ("total_amount" = "subtotal" + "delivery_fee" + "tax_amount" - "discount_amount");
  ```

- **Rating range.** `restaurant_reviews.rating` (`:586`) and `driver_reviews.rating` (`:618`) are `integer NOT NULL` with no bound — a rating of `-5` or `999` is valid data today.

  ```sql
  ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
  ALTER TABLE "driver_reviews" ADD CONSTRAINT "driver_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
  ```

- **Non-negative money/quantity.** `menu_items.base_price` (`:450`), `order_items.quantity`/`unit_price` (`:324-325`), `orders.subtotal`/`delivery_fee`/`tax_amount` (`:295-297`) all lack `>= 0` checks. A negative `base_price` or `quantity` would pass straight through to a real order.

### 2.7 `restaurants.status` and `restaurants.availability_status` are nullable

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:391-392`

```sql
"status" restaurant_status,
"availability_status" restaurant_availability,
```

Compare `drivers.status`/`drivers.availability_status` (`:503-504`), which are both `NOT NULL`. A restaurant row with `status = NULL` bypasses the entire approval workflow (`FR-ADM-006.2/.3`) — no query filtering `WHERE status = 'pending'` or `= 'approved'` would ever match it, so it would silently sit outside both the admin-approval queue and customer-facing "approved" listings.
**Fix:** `"status" restaurant_status NOT NULL DEFAULT 'pending',` and `"availability_status" restaurant_availability NOT NULL DEFAULT 'closed',`

### 2.8 No unique constraint preventing duplicate reviews per order

`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:581-594` (`restaurant_reviews`), `:613-626` (`driver_reviews`)
Both tables have `order_id NOT NULL` but no `UNIQUE` on it (and none of the 5 unique indexes at `:628-636` cover it). `FR-CUS-024`–`026` describe rating a restaurant/driver "after a completed order" as a single action; nothing stops a customer from submitting the review endpoint twice for the same order and getting two rows.
**Fix:**

```sql
ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_order_id_key" UNIQUE ("order_id");
ALTER TABLE "driver_reviews" ADD CONSTRAINT "driver_reviews_order_id_key" UNIQUE ("order_id");
```

### 2.9 Systemic missing indexes on foreign-key columns

Scanned all ~45 `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` statements (`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:646-758`) against the index list (`:628-636`, plus the one partial index at `:636`). Postgres only auto-indexes the PK side of a FK, never the referencing column, and outside of a handful of columns that happen to be the leftmost part of a composite unique index (e.g. `menu_items.restaurant_id` via `:632`), **no FK column in this schema has a supporting index.** Representative examples that sit directly on FR-driven hot paths:

- `orders.customer_id`, `orders.restaurant_id` (`:676`, `:678`) — every "view my orders" (FR-CUS-023) and "view restaurant's orders" (FR-RES-015/016/017) query filters on these.
- `order_status_history.order_id` (`:682`) — every order-tracking read (FR-CUS-021) joins on this.
- `driver_assignments.driver_id` (`:738`) — "receive delivery requests" (FR-DRV-007) queries by driver.
- `payments.order_id` (`:696`), `restaurant_reviews.restaurant_id` (`:744`), `menu_items.category_id` (`:712`), `customers.user_id` (`:664`), `drivers.user_id` (`:722`) — same pattern.

Every one of these becomes a sequential scan as tables grow, and every `DELETE`/`UPDATE` on the referenced row (e.g. deleting a `customers` row, updating a `menu_categories` row) triggers an unindexed scan of the child table to enforce the FK.
**Fix:** add a plain `CREATE INDEX` on every FK column that isn't already the leading column of an existing index. This is large enough that it's worth doing as one pass over the whole file rather than one column at a time.

Also worth an index, though not strictly a FK: `orders.status` (`:294`) and `orders.placed_at` (`:301`) — both are named directly in `FR-ADM-009.3` ("filter orders by status, date, or customer") and `FR-RES-015`/`FR-RES-017`.

---

## 3. Worth Considering (not blocking, flag for later)

- **`restaurant_categories."isActive"`** (`docs/dbdesign/Food-Delivery-System-sqldiagram.sql:430`) is camelCase in an otherwise snake_case schema; same table has `"update_at"` (`:432`) instead of `updated_at`. Cosmetic but will need fixing before it's copy-pasted into `schema.prisma`'s `@map`.
- **`restaurants.created_at`/`updated_at`** (`:398-399`) are plain nullable `timestamp` with no default, unlike every other table (e.g. `customers.created_at` at `:249` is `NOT NULL DEFAULT (now())`). Minor consistency gap, easy fix.
- **`shopping_cart` has no lifecycle/status column.** Real platforms typically distinguish an active cart from one that was abandoned or already converted to an order (so background jobs can clean up stale carts). Here, a cart row's only signal is its own existence — once an order is placed, nothing marks the cart as converted, and there's no way to tell an abandoned cart from a fresh one except reading `updated_at` app-side. Not wrong for the current scope, but worth a `status` enum if cart-abandonment analytics (not currently in the FRs) ever become a requirement.
- **`restaurants.rating_average`/`rating_count`** (`:396-397`) and **`drivers.rating`/`total_deliveries`** (`:505-506`) are denormalized caches (presumably of `restaurant_reviews`/`driver_reviews` and `driver_assignments`), same pattern as `orders.accepted_at` etc. Unlike the `orders` timestamp columns (`:638-642`), there's no `COMMENT ON COLUMN` documenting them as caches or naming the source of truth. Consider adding the same kind of comment for consistency.
- **Enforcing "reviews only for completed orders" (`FR-CUS-024`-`026`, `domain-rules.md:25`)** can't be a simple `CHECK` — Postgres checks can't reference another table's row (`orders.status`). This has to stay a service-layer check inside the `$transaction` that creates the review; flagging so it isn't assumed to be DB-enforced.
- **No `ON DELETE`/`ON UPDATE` action specified on any of the ~45 FKs** — all default to `NO ACTION`. That's a safe, conservative default and not wrong, but it means a hard `DELETE FROM menu_items` for a item that has historical `order_items` referencing it (FR-RES-009.3 "Delete Menu Item") will simply fail at the DB level. Worth documenting explicitly that "delete menu item" must map to `is_active = false`, not a real `DELETE`, the same way `CLAUDE.md` already documents that most "delete X" for people maps to `users.deleted_at`.
- **Geospatial lookups** (`restaurants`/`restaurant_addresses`/`driver_locations` all store `latitude`/`longitude` as plain `decimal`, e.g. `:409-410`, `:552-553`) have no spatial index. Fine for the current design-phase scope (no PostGIS decision has been made), flagged only as a scale concern, not something to act on now.

---

## 4. FR Cross-Check

### FRs with schema backing confirmed

Registration/auth (`FR-CUS-002/003/005`, `FR-RES-001/002/004`, `FR-DRV-001/002/004`) → `users`, `customers`/`restaurants`/`drivers`, `password_reset_tokens`, `refresh_tokens`. Addresses (`FR-CUS-007`) → `delivery_addresses`. Cart (`FR-CUS-015`-`018`) → `shopping_cart`/`shopping_cart_items`. Order placement/payment/tracking/cancellation (`FR-CUS-019`-`022`) → `orders`, `order_items`, `order_item_options`, `payments`, `order_status_history`. Reviews (`FR-CUS-024`-`026`, `FR-RES-019/020`, `FR-ADM-013`) → `restaurant_reviews`, `restaurant_review_images`, `restaurant_review_replies`, `driver_reviews`, `review_status`. Restaurant operations (`FR-RES-006`-`010`, `018`) → `restaurant_operating_hours`, `menu_categories`, `menu_items`, `menu_item_images`, `menu_item_option_groups/values`, `restaurant_promotions`. Driver operations (`FR-DRV-005`-`016`) → `driver_vehicles`, `driver_documents`, `driver_assignments`, `driver_locations`, `earnings`, `driver_payouts`. Admin account management, order monitoring, refunds, audit (`FR-ADM-005`-`007`, `009`-`011`, `018`) → `account_status`, `restaurant_status`/`driver_status`, `order_status_history` (admin as `changed_by_user_id`), `payment_refunds`, `audit_log`.

### Known, deferred (per `CLAUDE.md` — not re-raised as findings)

- Notifications (`FR-CUS-027`, `FR-RES-022`, `FR-DRV-018`, `FR-ADM-016`) — no table, documented gap.
- System settings (`FR-ADM-017`) — no table, documented gap.
- Platform-level food categories (`FR-ADM-008`) and platform promotions (`FR-ADM-012`) — `restaurant_categories`/`restaurant_promotions` are both restaurant-scoped, documented gap.
- Driver-rejection status (`FR-ADM-007.3`) — `driver_status` has no `rejected` value, documented gap.

### Schema pieces with no FR backing

`user_claims` (`:150-156`), `user_logins` (`:158-166`), `user_tokens` (`:168-176`), `role_claims` (`:194-200`) look like a generic Identity-framework template (claims/external-login/provider-token tables) copied in from a starter ERD. Nothing in `Functional-Requirements.md` mentions external/social login, claims-based authorization, or per-role claims — the FR doc's auth model is plain email/password (`FR-CUS-002`/`003`, same pattern for the other actors). These four tables are either dead weight that should be dropped, or an undocumented requirement (social login?) that should be added to the FR doc. Worth asking rather than silently keeping or dropping.

### Other minor cross-check note

`FR-DRV-013.3` ("Handle Delivery Delay") has no dedicated column, but is loosely coverable by `order_status_history.note` (`:317`) on a status-unchanged log entry — acceptable, not flagging as a gap, but worth confirming that's the intended mapping before building the delay-reporting endpoint.

---

## 5. Overall Rating: 5/10

**Workable but not yet safe to build against.** The entity model itself is sound — the cart/order split, the order-time snapshot pattern for prices and option names, the append-only status history with documented denormalized caches, and the review/moderation flow all match how a real food-delivery platform is normally modeled, and the FR coverage is good everywhere except the gaps `CLAUDE.md` already knows about. What pulls the score down is integrity enforcement: this file has **two statements that don't execute as valid SQL** (`driver_locations`'s primary key, `menu_items.is_active`'s type), **zero `CHECK` constraints** anywhere despite several explicit, FR-documented invariants (order total formula, rating range), **no uniqueness on the user-to-profile relationship** for any of the three actor types, and **almost no indexes on a FK-heavy schema**. None of these are structural/relational redesigns — they're additive DDL fixes — but they're squarely "must fix before a service layer leans on this schema" rather than "nice to have."

**Top priority fixes, in order:**

1. Fix the two syntax errors (`driver_locations` PK clause, `menu_items.is_active` type) — the file doesn't currently execute as-is.
2. Add `UNIQUE(user_id)` to `customers`, `restaurants`, `drivers`.
3. Add the order-total `CHECK`, rating-range `CHECK`s, and non-negative-money `CHECK`s.
4. Add indexes across the ~45 FK columns that currently have none (start with `orders.customer_id/restaurant_id`, `order_status_history.order_id`, `driver_assignments.driver_id`).
5. Fix `payments.currency` (`char` → `char(3)`), add the missing `delivery_address.customer_id` FK, and decide whether `delivery_address` should actually diverge structurally from `delivery_addresses` (drop `is_default`/`updated_at`).
