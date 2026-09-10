---
applyTo: "docs/api/**/*.yaml"
---

# OpenAPI Specification Instructions

Conventions for writing and maintaining the OpenAPI documentation under `docs/api/`. These apply to
`openapi.yaml` and every file under `docs/api/paths/`, `docs/api/schemas/`, and `docs/api/responses/`.

## File Layout

```
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
- Version all paths under `/api/v1` per the project's API conventions — keep the `servers` entry and every
  path prefix consistent with this.
- Every operation must include example values in both `requestBody` and each response's `content`.

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

## Validating Changes

Lint the spec after any edit using Redocly CLI (bundles and resolves all `$ref`s across files):

```bash
npx @redocly/cli lint docs/api/openapi.yaml
```

Fix any new errors introduced by your change before considering the documentation update complete.

The `no-server-example.com` warning on the `localhost` dev `servers` URL is expected in this project (no
public server exists yet) and can be ignored — do not attempt to "fix" it by changing the server URL.
