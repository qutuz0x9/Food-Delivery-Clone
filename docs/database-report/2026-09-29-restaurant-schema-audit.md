# Restaurant Domain Schema Audit (fresh re-audit)

This report replaces the earlier Restaurant audit of the same filename. It audits the 13 Restaurant-domain models in
[`src/prisma/contract.prisma`](../../src/prisma/contract.prisma) (the sole source of truth for the schema, per
`CLAUDE.md`): `Restaurant`, `MenuCategory`, `MenuItem`, `MenuItemOptionGroup`, `MenuItemOptionValue`,
`RestaurantAddress`, `RestaurantOperatingHour`, `RestaurantCategory`, `MenuItemImage`, `RestaurantPromotion`,
`RestaurantReview`, `RestaurantReviewImage`, `RestaurantReviewReply`, plus the enums `restaurant_status`,
`restaurant_availability`, `discount_type` and `review_status`.

It is checked against `FR-RES-005` to `FR-RES-010`, `FR-RES-018` to `FR-RES-020`, `FR-ADM-006`, `FR-CUS-024` and
`FR-CUS-025` in [`docs/requirements/Functional-Requirements.md`](../requirements/Functional-Requirements.md), and
against [`.claude/rules/domain-rules.md`](../../.claude/rules/domain-rules.md). Customer, Order, Payment, Driver and
identity models were not audited in depth. Only the FK relations that leave the Restaurant domain were checked, plus
the new `Order` composite unique. No schema file was modified.

## Settled decisions (not findings)

- Several `RestaurantAddress` rows per restaurant (multi-branch) is intentional.
- `RestaurantCategory` has no FR anchor and is kept for future cuisine filtering (`FR-CUS-010`). Context only.
  `MenuItemOptionGroup` and `MenuItemOptionValue` have no FR anchor either (`FR-RES-009` does not mention options).
- `restaurant_status` is `pending` / `approved` / `rejected`; suspension lives only in `users.account_status`.
- Text-backed enums with generated CHECKs, no `DEFERRABLE` FKs, `onDelete: Restrict` everywhere, bare `Decimal` vs
  `Numeric(p, s)`, nullable `Restaurant.status` and `availabilityStatus`, and ids without `@default(uuid())`.
- `dayOfWeek` is 0-6 with 0 = Sunday. The FR doc does not state this convention. Context only.
- `RestaurantCategory.isActive` defaults to `true`.

## Verification of the seven changes

All seven are present in the contract and correct. The emitted `contract.json` also contains the new constraint and
index names, so the emitted contract is in step with the source.

| # | Change | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `MenuItem` to `MenuCategory` composite FK | Verified | [`:267`](../../src/prisma/contract.prisma#L267) references `[id, restaurantId]`; target [`:247`](../../src/prisma/contract.prisma#L247) `@@unique([id, restaurantId])` |
| 2 | `RestaurantReview` to `Order` composite FK | Verified | [`:792`](../../src/prisma/contract.prisma#L792); targets [`:440`](../../src/prisma/contract.prisma#L440) on `Order` and [`:795`](../../src/prisma/contract.prisma#L795) on the review |
| 3 | `RestaurantReviewReply` to `RestaurantReview` composite FK | Verified | [`:825`](../../src/prisma/contract.prisma#L825); `reviewId` still `@unique` ([`:818`](../../src/prisma/contract.prisma#L818)) |
| 4 | Partial unique names on active rows | Verified | [`:249`](../../src/prisma/contract.prisma#L249) and [`:273`](../../src/prisma/contract.prisma#L273), plain indexes at [`:248`](../../src/prisma/contract.prisma#L248), [`:271-272`](../../src/prisma/contract.prisma#L271) |
| 5 | `RestaurantCategory` unique name, required `createdAt` | Verified | [`:598`](../../src/prisma/contract.prisma#L598), [`:593`](../../src/prisma/contract.prisma#L593) |
| 6 | New `@@check`s | Verified, logic sound (see below) | [`:228-230`](../../src/prisma/contract.prisma#L228), [`:270`](../../src/prisma/contract.prisma#L270), [`:287-288`](../../src/prisma/contract.prisma#L287), [`:561`](../../src/prisma/contract.prisma#L561), [`:582-583`](../../src/prisma/contract.prisma#L582), [`:628-630`](../../src/prisma/contract.prisma#L628), [`:794`](../../src/prisma/contract.prisma#L794) |
| 7 | `createdAt` required with default | Verified | [`:223`](../../src/prisma/contract.prisma#L223), [`:576`](../../src/prisma/contract.prisma#L576) |

### Composite FKs and their unique targets

- All three composite FKs reference a unique constraint that exists on the target model, and every column in each FK is
  `NOT NULL`. That matters: Postgres composite FKs use `MATCH SIMPLE`, so a NULL in any column would skip the check
  entirely. None of the six columns involved is nullable, so the cross-row rule is always enforced.
- `Order @@unique([id, customerId, restaurantId])` is sound. `id` is already the primary key, so the constraint can
  never fail on existing or new data. It exists only to be an FK target, and its cost is one extra 3-column index on
  `orders`. The existing `@@index([customerId])` and `@@index([restaurantId])` at
  [`:441-442`](../../src/prisma/contract.prisma#L441) are not redundant with it, because it leads with `id`. A later
  update of an order's `customerId` or `restaurantId` would be blocked once a review exists, which is the right
  behavior.
- The three composite FKs are indexed on the referencing side. `RestaurantReview` and `RestaurantReviewReply` are
  covered by the leading-column unique on `orderId` and `reviewId`. `MenuItem` has the explicit
  `@@index([categoryId, restaurantId])`.
- The older single-column FKs that remain beside the composite ones are logically implied but not harmful.
  `RestaurantReview.customerId` and `restaurantId` ([`:789-790`](../../src/prisma/contract.prisma#L789)),
  `RestaurantReviewReply.restaurantId` ([`:826`](../../src/prisma/contract.prisma#L826)) and `MenuItem.restaurantId`
  ([`:266`](../../src/prisma/contract.prisma#L266)) each point at a table that the composite chain already proves valid
  (the order's customer and restaurant are themselves FKs). The cost is one extra FK trigger check per insert. They are
  worth keeping: PSL needs the relation fields for `customer.reviews` and `restaurant.reviews` navigation, and their
  plain indexes serve the real list queries ("my reviews", "restaurant reviews"). `MenuItem.restaurantId` in
  particular is not implied by the composite FK, since the composite one only constrains it to equal the category's
  restaurant, not to exist.
- Not enforceable by FK: that the reviewed order is `delivered` (`FR-CUS-024`, `FR-CUS-025`). That stays a service
  check inside the same transaction as the insert.

### CHECK expression review

- `restaurants_rating_cache_valid` and the delivery-time and amount checks are on nullable columns. A NULL makes the
  predicate NULL, and Postgres treats a NULL check result as a pass, so legitimate NULLs are accepted. Correct.
- `restaurant_operating_hours_open_day_has_hours`: `is_closed` is `NOT NULL`, so the OR cannot evaluate to NULL.
  Correct. There is deliberately no `opens_at < closes_at` check, and that is right, because overnight hours
  (18:00 to 02:00) are legitimate.
- `restaurant_promotions_percentage_max_100`: `discount_type` is `NOT NULL` text, so `discount_type <> 'percentage'`
  compares text to a literal that exists in the enum's generated CHECK. Correct. `fixed`, `free_shipping` and
  `buy_one_get_one` rows are not capped, as intended.
- `restaurant_addresses_coordinates_valid`: both columns are `NOT NULL` `Numeric(9, 6)`, which could hold up to 999.999999
  without the check, so the check does real work.
- `menu_item_option_groups_*`: see W1 below. Neither check rejects the column defaults (`0`, `1`, `false`).

### Partial unique indexes

- Every lookup path stays indexed. The partial unique only covers `is_active = true` rows, so the plain
  `@@index([restaurantId])` on `MenuCategory` and `MenuItem` is what serves "list inactive" and the FK
  referenced-side checks. It is not redundant, because the partial index cannot be used for a query that includes
  inactive rows. No plain index in the domain is a leading-column duplicate of a unique constraint.
- Name lookup by `(restaurantId, name)` for active rows uses the partial unique directly.

## Scores

| Dimension | Score | Justification |
| --- | --- | --- |
| Normalization and structure | 8 | Boundaries are clean, and `OrderItem.unitPrice` plus the `OrderItemOption` name snapshots protect past orders from menu edits. Remaining duplication is small and now enforced: `MenuItem.restaurantId` vs the category's restaurant and the reply's `restaurantId` are both pinned by composite FKs. `is_required` duplicates `min_selection >= 1` (W1) and `Restaurant.email` duplicates `User.email` (open question). |
| Data integrity | 9 | Cross-restaurant item/category, review/order and reply/review mismatches are now impossible at the DB layer. Amounts, ratings, hours, coordinates, percentages and selection ranges are all checked. What is left is small (W1, W2, W7) or sits in the Cart/Order models (W8). |
| Indexing | 9 | Every FK is indexed or covered by a unique prefix, and no index is redundant. Browse filters on `Restaurant.status` and `availabilityStatus` are unindexed, which is workload-driven and not a gap at this stage. |
| Naming and consistency | 8 | snake_case maps, `_id` and `_at` suffixes and constraint names are uniform. Minor: `updatedAt` is `NOT NULL` with a default on `MenuItem`, `RestaurantReview` and `RestaurantReviewReply` but nullable on `Restaurant` and the other tables, and one comment is stale (W6). |
| Domain fit | 8 | Matches the Uber Eats and Talabat pattern for reviews (one per order), single owner reply, price snapshotting and active-only unique names. Gaps are one interval per day (W4) and promotions that nothing references yet (W5). |

## Must-fix findings

None. No finding below risks silent corruption of money, order history or approval state on a path the FRs require.

## Worth considering

### W1: `is_required` and `min_selection` can disagree

[`contract.prisma:281`](../../src/prisma/contract.prisma#L281) `minSelection Int @default(0)`,
[`:283`](../../src/prisma/contract.prisma#L283) `isRequired Boolean @default(false)` and
[`:288`](../../src/prisma/contract.prisma#L288) `NOT is_required OR min_selection >= 1`.

The check only goes one way. A row with `is_required = false` and `min_selection = 2` is accepted, so a UI that reads
`is_required` shows an optional group while a validator that reads `min_selection` demands two picks. Also, inserting
`is_required = true` without setting `min_selection` fails the check against the default `0`, which the service must
know. Fix: make the check an equivalence, `is_required = (min_selection >= 1)`, or drop `is_required` and derive it.

### W2: Name uniqueness is case-sensitive, and reactivation can collide

[`:249`](../../src/prisma/contract.prisma#L249) and [`:273`](../../src/prisma/contract.prisma#L273) index
`(restaurantId, name)` as plain text. "Burger" and "burger" can coexist as active rows. Separately, with active-only
uniqueness, reactivating an old item or category whose name has since been reused by an active row raises a unique
violation. The service must turn that into a 409 rather than a 500. `RestaurantCategory` at
[`:598`](../../src/prisma/contract.prisma#L598) has the same case issue. A `lower(name)` expression index would fix it,
but check first whether PSL in Prisma 8 can express a functional index. If it cannot, normalize case in the service.

### W3: Option groups and values cannot be retired once ordered

`MenuItemOptionGroup` and `MenuItemOptionValue` ([`:277-304`](../../src/prisma/contract.prisma#L277)) have no
`is_active` column, and `OrderItemOption` references both with `onDelete: Restrict`
([`:497-498`](../../src/prisma/contract.prisma#L497)). After the first order that used an option, deleting it fails
with an FK error, and there is no soft-state alternative. The order snapshot columns already protect history, so the
restriction only hurts the restaurant's ability to edit its menu. Since options have no FR anchor, this is a product
question about whether option editing is in scope, not a defect.

### W4: One operating interval per day

[`:584`](../../src/prisma/contract.prisma#L584) `@@unique([restaurantId, dayOfWeek])` makes the schedule upsert-safe,
as `FR-RES-006.3` needs, but it cannot represent split shifts (lunch 12:00 to 15:00 and dinner 18:00 to 23:00), which
many restaurants run. If that matters, the key would become `(restaurantId, dayOfWeek, opensAt)` with an overlap rule
in the service. Only worth acting on if split shifts are in scope.

### W5: Promotions are not referenced by anything

`RestaurantPromotion` ([`:614-633`](../../src/prisma/contract.prisma#L614)) is only manageable (`FR-RES-018`). `Order`
carries `discountAmount` ([`:418`](../../src/prisma/contract.prisma#L418)) but no promotion reference, so a discount
cannot be traced to the promotion that caused it. `discount_value >= 0` also admits a 0% or 0.00 promotion. Both
depend on how customers apply promotions, which no FR in scope states. Treat as a product question.

### W6: Stale comment above `Restaurant`

[`:204-206`](../../src/prisma/contract.prisma#L204) still says "created_at has no default", but
[`:223`](../../src/prisma/contract.prisma#L223) now has `@default(now())`. Fix the comment so it does not mislead
the next reader.

### W7: Review publication state is not tied to `published_at`

[`:783`](../../src/prisma/contract.prisma#L783) `status review_status @default(pending)` and
[`:787`](../../src/prisma/contract.prisma#L787) `publishedAt ... ?`. Nothing ties them together, so a `published`
review can have no `published_at`, and a `pending` one can have a timestamp. A check such as
`status <> 'published' OR published_at IS NOT NULL` closes it. Minor, since the moderation path
(`FR-ADM-013`) is a single service function.

### W8: Same cross-restaurant gap exists in Cart and Order (outside this scope)

The pattern fixed in items 1 to 3 is also missing where other domains point into the menu. Nothing forces
`ShoppingCartItem.menuItemId` ([`:398`](../../src/prisma/contract.prisma#L398)) to belong to the cart's restaurant
([`:373`](../../src/prisma/contract.prisma#L373)), `OrderItem.menuItemId`
([`:475`](../../src/prisma/contract.prisma#L475)) to the order's restaurant, or `OrderItemOption.optionValueId`
([`:498`](../../src/prisma/contract.prisma#L498)) to belong to its `optionGroupId` ([`:497`](../../src/prisma/contract.prisma#L497)).
Fixing it would need `@@unique([id, restaurantId])` on `MenuItem` and `@@unique([id, optionGroupId])` on
`MenuItemOptionValue` as FK targets. Flagged for the Customer and Order audits, not acted on here.

## Open product questions

These were raised earlier and are still awaiting a decision. They are not defects.

- A rejection reason column on `Restaurant` for `FR-ADM-006.3`.
- An address label or primary marker on `RestaurantAddress`.
- Whether `Restaurant.email` should exist alongside `User.email`.
- Precedence between manual `availabilityStatus` (`FR-RES-007`) and the weekly schedule (`FR-RES-006`).

## FR cross-check

| FR | Backing | Notes |
| --- | --- | --- |
| `FR-RES-005` profile and logo | `Restaurant` columns including `logoUrl` | Covered |
| `FR-RES-006` operating hours | `RestaurantOperatingHour` | Covered, one interval per day (W4) |
| `FR-RES-007` open/closed | `Restaurant.availabilityStatus` | Covered, precedence over schedule is an open question |
| `FR-RES-008` food categories | `MenuCategory` (not `RestaurantCategory`) | Covered; delete maps to `is_active = false` |
| `FR-RES-009` menu items, price, image, category | `MenuItem`, `MenuItemImage` | Covered; category now restaurant-safe |
| `FR-RES-010` item availability | `MenuItem.isAvailable` | Covered |
| `FR-RES-018` promotions | `RestaurantPromotion` | Covered; no consumer yet (W5) |
| `FR-RES-019` view reviews | `RestaurantReview` and images | Covered |
| `FR-RES-020` respond | `RestaurantReviewReply` | Covered, one reply per review |
| `FR-ADM-006` restaurant accounts | `restaurant_status` and `users.account_status` | Covered; delete is a soft delete of `users` |
| `FR-CUS-024`, `FR-CUS-025` rate and review | `RestaurantReview`, unique `orderId`, rating 1 to 5 | Covered; "completed order" is a service check |

Schema pieces with no FR anchor: `RestaurantCategory`, `MenuItemOptionGroup`, `MenuItemOptionValue`,
`RestaurantAddress` (profile is implied by `FR-RES-005`, not stated).

## Service-layer reminders

These are not schema findings.

- Update `ratingAverage` and `ratingCount` in the same transaction as every review insert, status change or delete.
- Write an `audit_log` row whenever an administrator moderates a review (`FR-ADM-013`), approves or rejects a
  restaurant (`FR-ADM-006.2`, `FR-ADM-006.3`) or deletes an account.
- Derive `RestaurantReview.restaurantId` and `customerId` from the order, never from the request body.
- Check the order is `delivered` before inserting a review.
- Deactivating a `MenuCategory` does not deactivate its items. Decide in the service whether it should cascade.

## Overall rating

**9 / 10.** The seven fixes from the last audit are all in place and correct, and the three composite FKs close the
cross-row consistency gaps that were the main integrity weakness. There are no must-fix findings, every FK path is
indexed, and the new CHECKs handle NULLs and the text-backed enum correctly. What stops this being a 10 is a small set
of soft spots that are individually cheap: an `is_required` flag that can contradict `min_selection`, case-sensitive
active-name uniqueness, an unretirable option catalog, and the matching cross-restaurant gaps in Cart and Order.

Priority list:

1. W8: add `@@unique([id, restaurantId])` on `MenuItem` and composite FKs from `ShoppingCartItem` and `OrderItem`
   when the Cart and Order domains are next touched.
2. W1: make `is_required` and `min_selection` agree by check or by dropping one column.
3. W2: decide on case-insensitive name uniqueness and handle reactivation conflicts as 409.
4. W3 and W5: settle the option-editing and promotion-application questions with the user.
5. W6 and W7: fix the stale comment and add the `published_at` check.
