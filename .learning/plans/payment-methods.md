# Plan: Payment Methods

Notes: `/home/qutuz0x9/MyData/Backend-Developer/CodeBase/04- Projects/Food Delivery Clone/03- Development/Features/04- Payment Methods/`
Branch: `feature/payment-methods`

## 1. Goal and assumptions

A client gets the list of ways a customer can pay, to show the choice at checkout. Each item has the enum value the
API expects as `paymentMethod` (`POST /orders`), a label to show, and whether it is paid online.

- **Public, no login** (decision A, see the Design Review). `CLAUDE.md` lists `/payment-methods` with the public
  browsing routes at the root, and `docs/requirements/APIs-Endpoints.md` lists it with the public endpoints. The spec
  said `bearerAuth`; it is changed to `security: []` in this feature.
- **No table** (decision B). The 6 values come from the contract's `payment_method` enum. The labels and the `online`
  flag live in one constant in the payments module. All 6 are always offered: `CLAUDE.md` ("Gaps in the contract",
  system settings) says there is nowhere to switch a method off.
- The first piece of the `payments` module. `POST /orders/:orderId/payment` and the admin payment routes join it in
  later stages (14 and 19).

Project: TypeScript (ESM), Express 5, Prisma 8 (`@prisma/orm-postgres` rc.11), Zod 4, Vitest 4 + Supertest 7.
Mirrors the `cities` module. New dependencies: none.

## 2. Endpoint contract

- `GET /api/v1/payment-methods`, public.
- Request: no body, no query, no path parameters. Unknown query parameters and a body are **ignored**.
- Success `200`. Order: offline methods first (`cash`), then the online methods by `label`, A to Z:

```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": {
    "paymentMethods": [
      { "method": "cash", "label": "Cash on delivery", "online": false },
      { "method": "apple_pay", "label": "Apple Pay", "online": true },
      { "method": "credit_card", "label": "Credit card", "online": true },
      { "method": "debit_card", "label": "Debit card", "online": true },
      { "method": "google_pay", "label": "Google Pay", "online": true },
      { "method": "wallet", "label": "Wallet", "online": true }
    ]
  }
}
```

| Case                    | Status | Error code / message                                     |
| ----------------------- | ------ | -------------------------------------------------------- |
| A bug throws on the way | 500    | `INTERNAL_SERVER_ERROR` / "An unexpected error occurred" |

No 401 or 403: the route is public. No 404: the list is never empty.

## 3. Request → response flow

1. `src/routes.ts` mounts the payment methods router at `/api/v1/payment-methods`.
2. `routes/public.routes.ts`: `GET /` → `controller.listMethods`. No `validate`: there is no input.
3. `controllers/public.controller.ts`: calls `paymentsService.listMethods()`, answers 200 with the envelope. No logic.
4. `payments.service.ts`: turns `PAYMENT_METHOD_DETAILS` into `PaymentMethodResponse[]` and sorts it (offline first,
   then by label). The service owns the order and the shape.
5. `payments.constants.ts`: `PAYMENT_METHOD_DETAILS`, one entry per enum value, checked by the compiler.
6. No repository, no Prisma call: nothing is read from the database.
7. Errors: nothing is thrown on purpose. If a bug throws in the service, Express 5 passes it to `errorHandler`, which
   answers the 500 envelope and attaches the error to the request log line.

## 4. Files

| File                                                      | Layer      | Who writes                              | Purpose                                                      |
| --------------------------------------------------------- | ---------- | --------------------------------------- | ------------------------------------------------------------ |
| `src/modules/payments/payments.types.ts`                  | types      | Claude                                  | `PaymentMethod` (from the contract), `PaymentMethodResponse` |
| `src/modules/payments/payments.constants.ts`              | constants  | Claude                                  | `PAYMENT_METHOD_DETAILS`: label + online per enum value      |
| `src/modules/payments/payments.mapper.ts`                 | mapper     | Claude                                  | one entry → `PaymentMethodResponse`                          |
| `src/modules/payments/payments.service.ts`                | service    | Claude (class), **You** (`listMethods`) | the list, sorted                                             |
| `src/modules/payments/controllers/public.controller.ts`   | controller | Claude                                  | HTTP in and out                                              |
| `src/modules/payments/routes/public.routes.ts`            | routes     | Claude                                  | `buildPaymentMethodsRouter(controller)`                      |
| `src/modules/payments/payments.module.ts`                 | wiring     | Claude                                  | creates the instances, exports the router                    |
| `src/modules/payments/index.ts`                           | public API | Claude                                  | exports the service and types for other modules              |
| `src/routes.ts`                                           | wiring     | Claude (edit)                           | mounts `/payment-methods`                                    |
| `src/modules/payments/__tests__/payments.service.test.ts` | tests      | Claude + **You** (1 test)               | see §9                                                       |
| `src/modules/payments/__tests__/public.routes.test.ts`    | tests      | Claude + **You** (1 test)               | see §9                                                       |
| `docs/api/paths/payment.yaml`                             | spec       | Claude (edit)                           | `security: []`, no 401/403, example in the new order         |

The module uses `routes/` and `controllers/` folders from the start, because customer and admin routes join it later.
`docs/requirements/APIs-Endpoints.md` already lists the route; no change expected.

## 5. Data model

No change, no migration. The feature reads no table.

- `payment_method` enum in `src/prisma/contract.prisma`: `cash`, `credit_card`, `debit_card`, `apple_pay`,
  `google_pay`, `wallet`. In Postgres it is a `text` column on `payments` with the CHECK
  `payments_payment_method_check_0ec4f984`.
- `PaymentMethod` is derived from the generated contract type (`Scalars<Models.public_Payment>["paymentMethod"]`), so
  it is the same union as the column.
- `PAYMENT_METHOD_DETAILS` is typed `Record<PaymentMethod, { label; online }>`. A 7th enum value (contract change +
  `npm run contract:emit`) makes `npm run build` fail until it gets a label and an `online` flag. A removed value fails
  the build too (an extra key).

| method        | label            | online  |
| ------------- | ---------------- | ------- |
| `cash`        | Cash on delivery | `false` |
| `credit_card` | Credit card      | `true`  |
| `debit_card`  | Debit card       | `true`  |
| `apple_pay`   | Apple Pay        | `true`  |
| `google_pay`  | Google Pay       | `true`  |
| `wallet`      | Wallet           | `true`  |

## 6. Validation rules

| Field            | Rules                                               | Where                           |
| ---------------- | --------------------------------------------------- | ------------------------------- |
| (none)           | no input; unknown query keys and a body are ignored | no Zod schema                   |
| every enum value | has exactly one `label` and one `online` flag       | compile time: the `Record` type |
| response fields  | only `method`, `label`, `online`                    | mapper, called by the service   |

## 7. Transaction and error design

- No transaction: no writes, no reads.
- No error is caught or translated. Nothing here can fail except a bug, which becomes a 500 in `errorHandler`.

## 8. Edge cases and security

1. Two requests at the same moment: both read the same constant. No shared state changes, so no race, **as long as no
   request changes the constant** (see §11).
2. A step fails halfway: there is only one step and nothing to undo.
3. Attacker: no input, so nothing to inject. The data is public and the same for everyone; no account can be found
   through it. There is no global rate limit (only login has one); answering a constant costs almost
   nothing, so none is added here.
4. Data that changes: a new enum value without a label → the build fails (§5). An old order paid with a method that
   is later removed keeps its value; removing an enum value needs a migration that deals with those rows first,
   because of the CHECK.
5. The list never changes at runtime, so it could be cached (`Cache-Control`). Not added now: no other route sets
   cache headers, so it would be a separate decision.

## 9. Tests

| Test (describe › it)                                                                      | What it checks                                | Covers        | Written by |
| ----------------------------------------------------------------------------------------- | --------------------------------------------- | ------------- | ---------- |
| PAYMENT_METHOD_DETAILS › covers every value of the contract's payment_method enum         | constant and `contract.json` agree at runtime | constant      | Claude     |
| PaymentsService › listMethods › returns one item per method with method, label and online | the shape, all 6 present, no extra fields     | `listMethods` | Claude     |
| PaymentsService › listMethods › puts offline methods first, then online methods by label  | the order in §2                               | `listMethods` | **You**    |
| PaymentsService › listMethods › returns the same order on every call                      | the shared constant is not changed by a call  | `listMethods` | Claude     |
| GET /payment-methods › answers 200 with the payment methods in the envelope               | route, controller, status, shape              | Claude's code | **You**    |
| GET /payment-methods › answers without an Authorization header                            | the route is public                           | Claude's code | Claude     |
| GET /payment-methods › ignores unknown query parameters                                   | the decision in §2                            | Claude's code | Claude     |
| GET /payment-methods › answers 500 without details when the service throws                | `errorHandler` path                           | Claude's code | Claude     |

No repository integration test: there is no repository.

## 10. Your part

| #   | Piece                                                      | Kind                     | Stage        | What it must do                                                    |
| --- | ---------------------------------------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------ |
| 1   | `PaymentsService.listMethods`                              | core: orchestration flow | Guided       | build the 6 items from `PAYMENT_METHOD_DETAILS`, sort, return them |
| 2   | test: puts offline methods first, then online by label     | test: unit test          | Guided       | call `listMethods`, check the order of `method` values             |
| 3   | test: answers 200 with the payment methods in the envelope | test: route test         | Guided       | Supertest `GET`, check status and the full body                    |
| 4   | Error classes + errorHandler                               | foundation               | explain-back | answer the 3 questions below at review                             |

Explain-back (read `src/middlewares/error-handler.ts` and `src/app.ts`). The questions aim at the parts the List Cities
answers missed:

1. `listMethods` is synchronous, and so is the controller. If it throws, how does the error reach `errorHandler`?
   What changes when a handler is `async` and its promise rejects, in Express 5 and in Express 4?
2. `src/app.ts` registers `errorHandler` with the last `app.use`. What would happen to a thrown error if
   `app.use(errorHandler)` came **before** `app.use("/api/v1", apiRouter)`? Why?
3. `errorHandler` never uses its 4th parameter (`_next`). How does Express know that this function is an error
   handler, and what happens if you delete that parameter?

Design rating for this round: **OK** (1 must-fix gap). Design stage: `questions` (Strong rounds: 1).

## 11. Think before you code

- `PAYMENT_METHOD_DETAILS` is one object shared by every request. If your `listMethods` sorts an array, which array
  does it sort, and what would the next request see if it sorted the shared one?
- A TypeScript union type like `"cash" | "credit_card" | ...` disappears when the code is compiled. So where can your
  code get the list of values from at runtime?
- How do you compare two labels so that `"Apple Pay"` comes before `"Credit card"`? What does your compare function
  return when the first one should come first?
- Your rule says "offline first". If a second offline method appears later, how are the two offline ones ordered?
