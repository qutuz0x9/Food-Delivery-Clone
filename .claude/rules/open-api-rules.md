---
paths:
  - "docs/api/**/*.yaml"
---

# OpenAPI Specification Instructions

Conventions for writing and maintaining the OpenAPI documentation under `docs/api/`. These apply to
`openapi.yaml` and every file under `docs/api/paths/`, `docs/api/schemas/`, and `docs/api/responses/`.

## File Layout

```txt
docs/api/
  openapi.yaml        # root document: info, servers, tags, security, and $ref index only
  paths/
    <domain>.yaml      # one file per domain (customer.yaml, restaurant.yaml, order.yaml, ...)
  schemas/
    <domain>.yaml      # one file per domain (customer.yaml, order.yaml, common.yaml, ...)
  responses/
    common.yaml        # shared, reusable response objects (validation error, conflict, 500, ...)
  security/
    common.yaml        # shared security scheme definitions (bearerAuth, ...)
```

- **Never** grow `openapi.yaml` into a monolithic file. `paths` and `components` in the root document must
  contain only `$ref` pointers into `paths/`, `schemas/`, or `responses/`.
- Group path items and schemas by **domain** (matching the `src/modules/<feature>` boundaries: auth,
  customers, restaurants, menu, orders, payments, drivers, admin), not by HTTP method or file size.
- Shared/reusable schemas and responses that don't belong to one domain (e.g. generic error envelopes)
  belong in `schemas/common.yaml` and `responses/common.yaml`.

## `$ref` Conventions

- Each file under `paths/<domain>.yaml` is a map keyed by an internal name (not the URL), whose value is a
  full Path Item Object, e.g.:

  ```yaml
  # paths/customer.yaml
  registerCustomer:
    post:
      ...
  ```

  Reference it from the root document by URL:

  ```yaml
  paths:
    /auth/register/customer:
      $ref: "./paths/customer.yaml#/registerCustomer"
  ```

- When multiple HTTP methods share the same URL (e.g. `GET`/`PATCH`/`DELETE` on `/customers/me/addresses/{addressId}`),
  define **one** Path Item key containing all of them (`get`, `patch`, `delete`, ...) rather than a
  separate key per method — the root document should reference it with a single `$ref` for that path.
  Put any path parameter shared by every method (e.g. `addressId`) at the Path Item level (a `parameters:`
  array as a sibling of `get`/`patch`/`delete`), not duplicated inside each operation.
- Schema/response files are maps keyed by schema/response name. Reference across files with relative paths
  (`../schemas/common.yaml#/ErrorResponse` from inside `paths/`, `./common.yaml#/ErrorResponse` from inside
  `schemas/`).
- Mirror every schema/response used by a path in the root `components.schemas` / `components.responses` map
  via a `$ref`, so tooling (Swagger UI, Redoc) can list all models/responses from the root document:

  ```yaml
  components:
    schemas:
      Customer:
        $ref: "./schemas/customer.yaml#/Customer"
    responses:
      ValidationError:
        $ref: "./responses/common.yaml#/ValidationError"
  ```

## Structure & Style

- Target **OpenAPI 3.0.3**.
- `operationId` is `camelCase` and matches the controller action it documents (e.g. `registerCustomer`).
- Schema names are `PascalCase` (`RegisterCustomerRequest`, `Customer`); schema *property* names are
  `camelCase` to match the JSON wire format (the DB's `snake_case` columns are mapped to camelCase at the
  API boundary — see Prisma `@map`/`@@map` conventions).
- Every path must declare `tags` using one of the tag names defined in the root `tags` list.
- The API is versioned under `/api/v1`. That prefix lives in the root `servers` URL
  (`http://localhost:3000/api/v1`), so path keys in `openapi.yaml` start at the resource (`/auth/login/customer`,
  `/restaurants/{restaurantId}`) and must not repeat `/api/v1`, or Swagger UI would call `/api/v1/api/v1/...`.
- Every operation must include example values in its `requestBody` (when it has one) and in each response's
  `content`.
- A JSON `requestBody` uses named `examples`, not a single `example`: `valid` (summary `Valid request`) plus negative
  examples that each break one schema rule (`emptyBody`, `missing<Field>`, `invalid<Field>`, `<field>TooShort`, ...),
  with a summary ending in the status they get, e.g. ``Missing required `email` (400)``. Apidog imports them as
  selectable request bodies for testing failures. The negative ones are invalid on purpose, so add their
  `no-invalid-media-type-examples` warnings to `.redocly.lint-ignore.yaml` (run
  `npx redocly lint docs/api/openapi.yaml --generate-ignore-file --max-problems 10000` once every other problem is
  fixed). Never ignore a warning on a `valid` example.

## Response Envelope & Errors

- Reuse the shared envelope shapes from `schemas/common.yaml`:
  - Success: `{ success: true, message, data }`
  - Error: `{ success: false, message, error: { code, ... } }`
- Do not inline `400`/`401`/`403`/`404`/`409`/`422`/`500` response bodies in a path file. Reference the
  shared response objects in `responses/common.yaml` (add new reusable entries there as new error shapes
  are needed, rather than duplicating them per-path).
- Every protected endpoint must declare `security` (referencing the `bearerAuth` scheme in
  `components.securitySchemes`) at the operation or root level — do not leave it undefined.
- The root document sets `security: [bearerAuth]` globally. Any endpoint that is intentionally public
  (guest browsing/search, registration, login, password reset, etc.) must explicitly override this with
  `security: []` on the operation — never rely on omission to signal "public".
- For paginated list/search endpoints, use query parameters named `page` (default `1`) and `limit`
  (default `20`, `maximum: 100`), and return pagination info via the shared `PaginationMeta` schema
  (`schemas/common.yaml#/PaginationMeta`) under `data.pagination` in the response body.

## Keeping the Spec in Sync

- When adding or changing an endpoint in code, update the corresponding `paths/`, `schemas/`, and
  `responses/` files in the same change — do not let `docs/api/` drift from the implemented routes.
- New domains get a new `paths/<domain>.yaml` and `schemas/<domain>.yaml` file; don't add unrelated
  endpoints to an existing domain file.
- Check `src/prisma/contract.prisma` (the only source of truth for the database) for exact field names, types, limits
  and enum values before writing a schema, and state in the operation's description the rule that decides its
  behaviour (the status, constraint or field behind it). Do not cite requirement IDs: the requirements document is
  outdated and no longer a source. Expose the `@map` camelCase name, not the `snake_case` column.
- Keep `docs/requirements/APIs-Endpoints.md` in step: add, rename or remove its row in the same change as the route.
  To document a new domain use the `/openapi-generator` skill, which derives the routes from the contract and merges
  into the existing spec without regenerating it.

## Status Codes and Shared Responses

- `400` the request is invalid (body, query or path value); `401` missing, expired or wrong credentials or token; `403`
  the caller's role or account status does not allow it; `404` it does not exist or is not the caller's own (do not
  reveal which); `409` it conflicts with the current state (a duplicate unique value, the wrong status for the action,
  already taken); `422` only for an invalid or expired one-time code (a password-reset token or a verification code);
  `500` always.
- Every protected operation declares `401` and `403`, and every operation with a path parameter declares `404`.
- Shared error responses live in `responses/common.yaml` and carry named `examples`. For a new error case add another
  named example to the closest response before creating a new response.
- Tokens: the access token travels in the response body, and the refresh token only ever in an `HttpOnly`
  `refreshToken` cookie. Document it with a `Set-Cookie` response header, and with a cookie parameter on logout and
  refresh.
- A nullable reference is written `type: object`, `nullable: true`, `allOf: [$ref]`. Validators reject a literal `null`
  example against it, so leave the optional property out of the example instead of showing `null`.
- Operations that upload files use `multipart/form-data` with the fields described in the schema and no `example`.
- A public list that takes no input has nothing to reject, so Redocly's `operation-4xx-response` is ignored for it in
  `.redocly.lint-ignore.yaml` (currently `GET /cities` and `GET /cuisines`).

## Validating Changes

Lint the spec after any edit using Redocly CLI (bundles and resolves all `$ref`s across files):

```bash
npm run lint:api
```

Fix any new errors or warnings introduced by your change before considering the documentation update complete.
The script runs `redocly lint docs/api/openapi.yaml` with the config in `redocly.yaml` (the recommended ruleset). That
config turns off `no-server-example.com` on purpose, because the only server is the `localhost` dev URL (no public
server exists yet) — do not "fix" it by changing the server URL. CI runs the same script.
