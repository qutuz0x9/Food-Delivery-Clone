---
paths:
  - "src/**"
  - "docs/api/**"
---

# Business Rules

The rules the platform follows, taken from `src/prisma/contract.prisma` (its models, enums and constraints) and from the
design decisions recorded in its comments. The contract is the only source of truth: if this list and the contract
disagree, the contract wins. Where the contract does not decide something, see "Gaps in the contract" in `CLAUDE.md`
and ask before inventing a rule.

## Accounts and approvals

- Every actor logs in through a `User` (`email` and `phone_number`, both unique). `Customer`, `Restaurant`, `Driver`
  and `Admin` only hold the profile. A restaurant has no email or phone of its own.
- A user can log in only while `users.account_status` is `active`. Deactivating, locking or suspending any actor sets
  `account_status`, and leaving `active` revokes the user's refresh tokens. Deleting a customer, restaurant or driver is
  a soft delete of the `users` row (`deleted_at`); orders, payments and reviews are kept.
- Email and phone are verified with a 6-digit code (`emailVerifiedAt`, `phoneVerifiedAt`). The code is stored hashed,
  with its expiry, in `user_tokens` (provider `verification`, name `email` or `phone`); a new code replaces the old one.
  Verification does not block login, and changing the email or phone clears the matching timestamp.
- Administrators are created by another administrator (a `User` with the admin role plus an `Admin` profile). An
  administrator cannot delete or change the status of their own account, and the last active administrator can never be
  deleted or moved out of `active`.
- Refresh tokens rotate on every use; presenting an already-rotated or revoked token revokes the whole chain. Password
  reset verifies the emailed token (`password_reset_tokens`) and revokes the user's refresh tokens.
- A restaurant registers as `pending` and an admin sets `restaurant_status` to `approved` or `rejected`. Only
  `approved` restaurants are visible and can receive orders.
- A driver registers as `pending` and an admin sets `driver_status` to `active` or `inactive`; there is no `rejected`
  value. A pending driver can log in, edit the profile and upload documents, but cannot go available or receive offers.

## Cities and branches

- `cities` is the only definition of a place. Compare city ids, never names. Cities are deactivated (`is_active`), not
  deleted.
- A restaurant is the brand; it trades through `restaurant_branches`. Address, opening hours and open/closed/busy status
  belong to the branch. Menu, prices, delivery fee, minimum order, delivery time and rating are shared by every branch.
- A new branch starts `closed`. Branches are deactivated (`is_active`), not deleted. A restaurant is visible to customers
  only in a city where it has an active branch.
- A driver serves exactly one city (`working_city_id`).

## Cart and orders

- A customer has at most one cart, and all of its items come from one restaurant. A cart line is a menu item with the
  options and note the customer chose; the same item can sit on several lines when the choices differ. A line's unit
  price is the item's base price plus the price adjustment of every chosen option.
- Placing an order turns the cart into an order in one transaction: the order starts `pending` with a unique
  `order_number`, the delivery address and the chosen options are copied into the order (snapshots), the first row goes
  into `order_status_history`, a `payment` is created for the chosen method, and the cart is deleted.
- The fulfilling branch is the nearest active, open branch of the restaurant in the delivery address's city, measured
  from the address coordinates. `orders` references it with a composite key, so it always belongs to the same restaurant.
- Totals are always calculated by the server: `total_amount = subtotal + delivery_fee + tax_amount - discount_amount`
  (a database CHECK enforces it). Prices are read from the menu when the order is placed.
- Status changes always append to `order_status_history` with `changed_by_user_id`, and set the matching timestamp on
  the order. Who may move an order: the restaurant accepts or rejects a `pending` order, then marks it `preparing` and
  `ready_for_pickup`; the driver marks it `picked_up`, `out_for_delivery` and `delivered`; the customer may cancel only
  while it is `pending`; an admin may set any status.
- Cancelling or rejecting an order that was already paid starts a full refund.

## Dispatch and deliveries

- When the restaurant accepts an order, a `delivery_offers` row is created for every available, `active` driver whose
  working city is the branch's city. The first driver to accept wins: the unique index on `driver_assignments` lets only
  one active assignment exist per order, and every other open offer is marked `withdrawn`. Offers expire (`expires_at`).
- An admin can assign a driver by hand, or offer the order to drivers again, while the order is `accepted`, `preparing`
  or `ready_for_pickup`. Assigning replaces any existing assignment (it is cancelled) unless the order is already picked
  up; the chosen driver must be `active`, work in the branch's city and not be `busy`.
- `busy` is set by the system while a driver has a delivery in progress; a driver cannot set it.
- Completing a delivery moves the order to `delivered`, the assignment to `completed`, creates an `earnings` row
  (`pending`), increases the driver's `total_deliveries` and makes the driver `available` again.
- A payout gathers a driver's `pending` earnings for a period; the earnings take the payout's status.

## Payments

- Online methods are paid with a provider token: the payment goes `processing`, then `paid` (with `paid_at` and the
  provider's `transaction_reference`) or `failed` (with `failure_reason`). `cash` is paid to the driver on delivery: the
  driver confirms it while the order is `out_for_delivery`, which makes the payment `paid` (the collecting driver is the
  one assigned to the order), and a cash delivery cannot be completed until then.
- A refund cannot exceed what is still refundable on the payment. When refunds complete, the payment becomes
  `partially_refunded` or `refunded`. Financial records are never deleted or rewritten once processed.

## Reviews

- A restaurant review and a driver review are written only for a `delivered` order, once per order each (`order_id` is
  unique). A new review is `pending`; an admin moderates it through `review_status`, and only `published` reviews are
  public. Editing a review keeps its status; a customer deleting one sets it to `deleted`.
- A restaurant can reply once per review (`restaurant_review_replies.review_id` is unique). Publishing or unpublishing a
  review recalculates the cached `rating_average` / `rating_count` (restaurant) or `rating` (driver).
