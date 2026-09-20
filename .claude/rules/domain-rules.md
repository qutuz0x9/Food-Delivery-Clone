---
paths:
  - "src/**"
  - "docs/api/**"
---

# Business Rules from the Requirements

Rules taken from `docs/requirements/Functional-Requirements.md`, with the FR IDs and the schema types they map to.
The FR doc stays the source of truth. If this list and the doc disagree, the doc wins.

- Registration needs a unique email (`FR-CUS-002.3`). Password reset verifies identity first, via
  `password_reset_tokens`.
- Restaurant and driver registrations start as `pending` and need admin approval or rejection
  (`FR-ADM-006.2/.3`, `FR-ADM-007.2/.3`). Restaurants map to `restaurant_status` (`pending` / `approved` / `rejected` /
  `suspended`). Drivers map to `driver_status`, which is `pending` / `active` / `inactive` / `suspended` and has **no
  `rejected` (or `approved`) value**, so rejecting a driver (`FR-ADM-007.3`) has no clean mapping yet. Ask before
  choosing one and don't add an enum value on your own. Admin activate/deactivate maps to `account_status` on `users`.
- Order total = subtotal + delivery fee + tax − discount (`FR-CUS-019.3`), calculated server-side. Each order gets a
  unique `order_number` (`FR-CUS-019.5`).
- Cancellation (`FR-CUS-022.1` to `.4`) is only allowed when the order is eligible under the platform's cancellation
  policy (`.2`). That policy isn't defined anywhere yet, so ask before inventing the rules. A cancel appends
  `cancelled` to `order_status_history` (`.3`). Notifying the restaurant and driver (`.4`) is blocked: there is no
  notifications table (see "Requirements the schema doesn't back yet" in `CLAUDE.md`).
- Ratings and reviews (restaurant and driver) are only for completed orders (`FR-CUS-024` to `026`). Restaurants can
  reply (`FR-RES-020`). Admins moderate through `review_status` (`FR-ADM-013`).
