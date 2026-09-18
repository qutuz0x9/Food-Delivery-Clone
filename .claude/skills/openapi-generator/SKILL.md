---
name: openapi-generator
description: Read the project's markdown endpoint index and add the missing endpoints to the split OpenAPI 3.0.3 spec under docs/api/. Use when the user wants to generate or extend OpenAPI docs from the API endpoint list.
argument-hint: "[domain-or-section] [markdown-file]"
allowed-tools: Read, Edit, Write, Grep, Glob, Bash(npx @redocly/cli lint:*)
---

# OpenAPI Generator Skill

Turn the endpoint list in `docs/requirements/APIs-Endpoints.md` into the split OpenAPI spec under `docs/api/`. The
spec already exists and is partly written, so this skill **extends and merges**. It never regenerates or overwrites.

The conventions live in `.claude/rules/open-api-rules.md` and `CLAUDE.md` ("OpenAPI Spec Conventions"). Read the rules
file first and follow it exactly. This skill only describes the workflow.

## Usage

```
/openapi-generator
/openapi-generator <domain>                    # e.g. orders, payments, drivers, admin
/openapi-generator <domain> <markdown-file>    # override the default source
```

## Behavior

1. **Locate the source and the current spec**
   - Source: the given markdown file, otherwise `docs/requirements/APIs-Endpoints.md`. If neither exists, ask.
   - Read `docs/api/openapi.yaml`, list `docs/api/paths/`, `schemas/`, `responses/`, and read the shared
     `schemas/common.yaml` and `responses/common.yaml`.
   - Read a finished domain (e.g. `paths/customer.yaml`) and copy its style.

2. **Diff endpoints against the spec**
   - Parse each endpoint row (method, path, purpose) from the markdown. Convert `:param` to `{param}`.
   - Skip endpoints that are already in the root `paths`. Report them as existing and don't touch them.
   - If a domain is given, only process that section of the markdown.
   - Endpoints such as `GET /restaurants?filters...` are query variants of an existing path. Document them as query
     parameters on that operation rather than as a new path.

3. **Cross-check requirements and the DB**
   - Find the matching `FR-*` IDs in `docs/requirements/Functional-Requirements.md`.
   - Read `docs/dbdesign/Food-Delivery-System-sqldiagram.sql` for exact field names, types and constraints.
   - If a field or behaviour is ambiguous, ask the user. Do not invent it. Keep `delivery_addresses` vs.
     `delivery_address` and `restaurant_categories` vs. `menu_categories` separate.

4. **Write the spec files** (the layout is in the rules file)
   - `paths/<domain>.yaml`: one Path Item per URL, keyed by an internal name. All methods on a URL go in one item,
     with shared path parameters at the Path Item level.
   - `schemas/<domain>.yaml`: `PascalCase` schemas with `camelCase` properties (DB `snake_case` maps to `camelCase`).
     Never expose `password_hash`, tokens or other secrets. Use explicit response DTOs.
   - `responses/common.yaml`: add a new shared response only when a new error shape is needed.
   - `openapi.yaml`: add the URL `$ref` under `paths`, and mirror every new schema and response under
     `components`. Add a tag if the domain is new. Keep the root a `$ref` index only.
   - Every operation needs: a `camelCase` `operationId` matching the controller action, a root-defined tag, a
     `summary`, and `examples` in `requestBody` and in each response.
   - Security: protected endpoints inherit the global `bearerAuth`. Public endpoints (browsing, register, login,
     password reset) set `security: []` explicitly.
   - Responses use the envelope schemas from `schemas/common.yaml`. Error statuses reference
     `responses/common.yaml` and are never inlined.
   - List and search endpoints take `page` (default 1) and `limit` (default 20, max 100) and return
     `PaginationMeta` under `data.pagination`.

5. **Validate**
   - Run `npx @redocly/cli lint docs/api/openapi.yaml`.
   - Fix all new errors. Ignore the `no-server-example.com` warning on the localhost server.

6. **Report**
   - Print a table of the endpoints added (method, path, operationId) and the endpoints skipped as already present.
   - List the files changed.
   - List any assumptions or ambiguities, with the `FR-*` IDs they relate to.

## Output Example

A new domain entry (abridged). Note the public `security: []`, `$ref`'d errors and the examples:

```yaml
# docs/api/paths/customer.yaml
loginCustomer:
  post:
    tags: [Auth]
    summary: Authenticate a customer
    operationId: loginCustomer
    security: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "../schemas/customer.yaml#/LoginRequest"
          example:
            email: sara@example.com
            password: Str0ngPass!
    responses:
      "200":
        description: Authenticated
        content:
          application/json:
            schema:
              $ref: "../schemas/customer.yaml#/LoginResponse"
            example:
              success: true
              message: Login successful
              data:
                accessToken: eyJhbGciOi...
                expiresIn: 3600
      "401":
        $ref: "../responses/common.yaml#/Unauthorized"
      "422":
        $ref: "../responses/common.yaml#/ValidationError"
```

```yaml
# docs/api/openapi.yaml (root: $ref index only)
paths:
  /auth/login:
    $ref: "./paths/customer.yaml#/loginCustomer"
```

## Rules & Quality Standards

- Never overwrite or regenerate existing spec files. Merge new content only.
- Only document endpoints that are listed in the markdown. Never invent endpoints.
- Output is valid OpenAPI 3.0.3 with no undefined `$ref` targets. Lint must pass before reporting done.
- `openapi.yaml` never becomes a monolith. Group by domain, not by HTTP method.
- Follow `.claude/rules/open-api-rules.md`. If this skill and the rules file disagree, the rules file wins.
- If the source is ambiguous, ask or make the most reasonable assumption and state it in the report.
