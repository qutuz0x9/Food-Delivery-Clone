# Future Features / Deferred Design Gaps

This document tracks real-world food delivery platform capabilities (in the
spirit of Uber Eats, DoorDash, Talabat) that the current schema
(`docs/dbdesign/Food-Delivery-System-sqldiagram.sql`) does not yet support.
These were identified during an order-flow design review but intentionally
**deferred** — not implemented — so they can be scoped and planned
individually later. Each item below should be re-evaluated against
`docs/requirements/Functional-Requirements.md` before implementation.

## 1. Tip traceability on orders/payments

`earnings.tip` records what the driver is paid out, but nothing on `orders`
or `payments` records the tip amount the customer actually entered at
checkout. Add an explicit `tip_amount` (and likely include it in
`orders.total_amount`) so the tip has a clear origin and can be audited.

## 2. Pickup vs. delivery orders

`orders.delivery_address_id` is currently `NOT NULL`, meaning every order is
assumed to be delivered. Real platforms support customer pickup at the
restaurant (no driver, no delivery address). Would require making
`delivery_address_id` nullable, adding an `order_type` enum
(`delivery` / `pickup`), and adjusting driver-assignment logic to skip
pickup orders.

## 3. Scheduled / "order for later" orders

No support for placing an order now for a future date/time. Would need an
`order_type` (or separate flag) plus a `scheduled_for` timestamp, and
changes to how restaurants/drivers are matched against scheduled demand.

## 4. Cancellation & rejection metadata

`order_status` includes `cancelled` and `rejected`, but there's no
`cancellation_reason` or record of which actor (customer, restaurant,
driver, system/admin) triggered it. Useful for support tooling, refund
policy decisions, and analytics on cancellation causes.

## 5. Promotion/coupon traceability on orders

`restaurant_promotions` defines available promotions, but `orders` only has
a raw `discount_amount` with no link to *which* promotion was applied.
Add a `promotion_id` (nullable) FK on `orders` (or a join table if multiple
promotions can stack) for auditing and promo-effectiveness analytics.

## 6. Item-level refunds

`payment_refunds` is scoped to the whole `payment`, so there's no way to
model "refund just the missing/incorrect item" — a very common real-world
support flow. Would need either a `payment_refund_items` join table or an
`order_item_id` reference on refunds.

## 7. Per-order ETA

`restaurants.estimated_delivery_time` is a general/average value per
restaurant, but there's no per-order estimate (e.g. `estimated_delivery_at`)
that can be shown to the customer and tracked against actual `delivered_at`
for SLA/performance reporting.

## 8. `orders` timestamp/attribute cleanup
Reviewing `orders.placed_at`, `accepted_at`, and related columns surfaced
five smaller issues worth revisiting together:

- **`placed_at` duplicates `created_at`.** There's no "draft order" concept
  before an `orders` row exists (the cart → order transition is a direct
  insert), so both columns capture the same moment. One should be dropped
  (likely `placed_at`, keeping the standard `created_at` audit column).
- **`updated_at` is `NOT NULL` with no default** — the only `updated_at`
  column in the schema like this; every other table's `updated_at` is
  either nullable or `NOT NULL DEFAULT (now())`. As written, every insert
  into `orders` must explicitly supply `updated_at` or it will fail.
  Align it with the rest of the schema (`DEFAULT (now())`).
- **Missing `rejected_at`.** `order_status` has a distinct `rejected` value
  from `cancelled`, but only `cancelled_at` is cached — a rejection
  currently has nowhere accurate to record its timestamp without
  conflating it with cancellation.
- **Missing `ready_for_pickup_at`.** `order_status` includes
  `ready_for_pickup`, but no corresponding cached timestamp exists.
- **Missing `out_for_delivery_at`.** `order_status` includes
  `out_for_delivery`, but no corresponding cached timestamp exists.

Since the cached timestamp columns on `orders` are intentional
denormalization for fast reads (see the `COMMENT ON COLUMN` notes in
`sqldiagram.sql`), leaving them incomplete relative to the 9-value
`order_status` enum undermines that goal — callers still have to fall back
to `order_status_history` for the missing transitions anyway. Any future
fix should add the 3 missing timestamp columns, fix the `updated_at`
default, and drop `placed_at` in the same pass to avoid multiple
migrations touching the same table.

---

**Already addressed** (for context, not part of this backlog):

- Order-item option snapshotting was implemented via the new
  `order_item_options` table (see `sqldiagram.sql`), so selected
  customizations (e.g. "extra cheese", "no onions") are now preserved
  per order item even if the source menu option is later changed/removed.
